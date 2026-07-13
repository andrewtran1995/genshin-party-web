/**
 * Card tilt + foil shine.
 *
 * Fine pointers drive it from the cursor. Touch devices have no cursor to
 * track, so they drive a gentler version from the device's own orientation
 * instead. Both are enhancement only — the card is fully legible without them,
 * and both stay off under `prefers-reduced-motion`.
 */

/** Rotation across the full width/height of the card, in degrees (so ±3.5° at the edges). */
const POINTER_SWING_DEG = 7;

/**
 * Motion tilt peaks at half of the pointer's ±3.5°. A phone is never held
 * perfectly still, so a full-strength effect reads as a wobble rather than a
 * flourish: the card is meant to catch the light, not swing around.
 */
const MOTION_MAX_DEG = 1.75;
/** Device rotation that maps to a full-strength tilt, in degrees. */
const MOTION_RANGE_DEG = 24;
/** Scales the foil and glow, which key off `--active`. */
const MOTION_INTENSITY = 0.55;
/** Easing applied per sensor reading, to take the jitter off raw values. */
const MOTION_SMOOTHING = 0.18;
/**
 * The neutral angle creeps toward however the device is currently held, so the
 * card settles back to flat instead of pinning at full tilt for a user who
 * reads lying down. Slow enough (~5s at 60Hz) not to eat the effect itself.
 */
const BASELINE_DRIFT = 0.003;

export interface TiltValues {
	/** rotateX, degrees. */
	rx: number;
	/** rotateY, degrees. */
	ry: number;
	/** Foil highlight position, percent. */
	mx: number;
	my: number;
}

export interface Orientation {
	beta: number;
	gamma: number;
}

const NEUTRAL: TiltValues = { rx: 0, ry: 0, mx: 50, my: 50 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** `px`/`py` are the pointer position within the card, 0–1. */
export function pointerTilt(px: number, py: number): TiltValues {
	return {
		rx: (0.5 - py) * POINTER_SWING_DEG,
		ry: (px - 0.5) * POINTER_SWING_DEG,
		mx: px * 100,
		my: py * 100
	};
}

/**
 * `beta` (front-to-back) and `gamma` (left-to-right) come straight from
 * `deviceorientation`; `baseline` is the angle the device is being held at, so
 * only the change from it tilts the card.
 */
export function motionTilt(beta: number, gamma: number, baseline: Orientation): TiltValues {
	const dy = clamp((beta - baseline.beta) / MOTION_RANGE_DEG, -1, 1);
	const dx = clamp((gamma - baseline.gamma) / MOTION_RANGE_DEG, -1, 1);
	return {
		rx: dy * MOTION_MAX_DEG,
		ry: dx * MOTION_MAX_DEG,
		mx: 50 + dx * 35,
		my: 50 + dy * 35
	};
}

const ease = (from: TiltValues, to: TiltValues, amount: number): TiltValues => ({
	rx: from.rx + (to.rx - from.rx) * amount,
	ry: from.ry + (to.ry - from.ry) * amount,
	mx: from.mx + (to.mx - from.mx) * amount,
	my: from.my + (to.my - from.my) * amount
});

type MotionListener = (values: TiltValues) => void;

/**
 * One sensor subscription and one baseline shared by every card on the page —
 * the device only has the one orientation, and cards should agree on it.
 */
const listeners = new Set<MotionListener>();
let baseline: Orientation | undefined;
let smoothed: TiltValues = NEUTRAL;

function onOrientation(event: DeviceOrientationEvent) {
	const { beta, gamma } = event;
	if (beta === null || gamma === null) return;

	if (!baseline) {
		baseline = { beta, gamma };
	} else {
		baseline.beta += (beta - baseline.beta) * BASELINE_DRIFT;
		baseline.gamma += (gamma - baseline.gamma) * BASELINE_DRIFT;
	}

	smoothed = ease(smoothed, motionTilt(beta, gamma, baseline), MOTION_SMOOTHING);
	for (const listener of listeners) listener(smoothed);
}

interface IosDeviceOrientationEvent {
	requestPermission?: () => Promise<PermissionState | 'granted' | 'denied'>;
}

/**
 * iOS gates the sensor behind a permission call that only works inside a user
 * gesture, so the ask rides along with the first tap anywhere on the page.
 * Anything other than a grant just leaves the cards pointer-only.
 */
function ensurePermission(): Promise<boolean> {
	const ctor = window.DeviceOrientationEvent as unknown as IosDeviceOrientationEvent | undefined;
	const request = ctor?.requestPermission;
	if (!ctor) return Promise.resolve(false);
	if (typeof request !== 'function') return Promise.resolve(true);

	return new Promise((resolve) => {
		window.addEventListener(
			'pointerdown',
			() => {
				request.call(ctor).then(
					(state) => {
						resolve(state === 'granted');
					},
					() => {
						resolve(false);
					}
				);
			},
			{ once: true }
		);
	});
}

function subscribeMotion(listener: MotionListener): () => void {
	listeners.add(listener);

	if (listeners.size === 1) {
		void ensurePermission().then((granted) => {
			// The card may have been torn down while the permission prompt was up.
			if (granted && listeners.size > 0) {
				window.addEventListener('deviceorientation', onOrientation);
			}
		});
	}

	return () => {
		listeners.delete(listener);
		if (listeners.size === 0) {
			window.removeEventListener('deviceorientation', onOrientation);
			baseline = undefined;
			smoothed = NEUTRAL;
		}
	};
}

/** Svelte action: tilts and shines the card it is applied to. */
export function tilt(node: HTMLElement) {
	const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
	let frame = 0;

	function paint(values: TiltValues, active: number) {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			node.style.setProperty('--rx', `${values.rx}deg`);
			node.style.setProperty('--ry', `${values.ry}deg`);
			node.style.setProperty('--mx', `${values.mx}%`);
			node.style.setProperty('--my', `${values.my}%`);
			node.style.setProperty('--active', `${active}`);
		});
	}

	function onMove(event: PointerEvent) {
		if (!canHover.matches || reduce.matches) return;
		const rect = node.getBoundingClientRect();
		const px = (event.clientX - rect.left) / rect.width;
		const py = (event.clientY - rect.top) / rect.height;
		paint(pointerTilt(px, py), 1);
	}

	function reset() {
		cancelAnimationFrame(frame);
		node.style.setProperty('--rx', '0deg');
		node.style.setProperty('--ry', '0deg');
		node.style.setProperty('--active', '0');
	}

	function onMotion(values: TiltValues) {
		if (reduce.matches) {
			reset();
			return;
		}
		paint(values, MOTION_INTENSITY);
	}

	node.addEventListener('pointermove', onMove);
	node.addEventListener('pointerleave', reset);

	const usesMotion = !canHover.matches && 'DeviceOrientationEvent' in window;
	const unsubscribe = usesMotion ? subscribeMotion(onMotion) : undefined;

	return {
		destroy() {
			cancelAnimationFrame(frame);
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerleave', reset);
			unsubscribe?.();
		}
	};
}
