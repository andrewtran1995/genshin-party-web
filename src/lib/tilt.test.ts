import { describe, expect, it } from 'vitest';
import { motionTilt, pointerTilt, type Orientation } from './tilt';

const held: Orientation = { beta: 45, gamma: 0 };

describe('pointerTilt', () => {
	it('is flat and centred at the middle of the card', () => {
		expect(pointerTilt(0.5, 0.5)).toEqual({ rx: 0, ry: 0, mx: 50, my: 50 });
	});

	it('leans away from the pointer and puts the shine under it', () => {
		const topRight = pointerTilt(1, 0);
		expect(topRight.rx).toBeGreaterThan(0);
		expect(topRight.ry).toBeGreaterThan(0);
		expect(topRight.mx).toBe(100);
		expect(topRight.my).toBe(0);
	});
});

describe('motionTilt', () => {
	it('is flat and centred when the device is held at the baseline angle', () => {
		expect(motionTilt(held.beta, held.gamma, held)).toEqual({ rx: 0, ry: 0, mx: 50, my: 50 });
	});

	it('tilts with the device and moves the shine the same way', () => {
		const away = motionTilt(held.beta + 12, held.gamma + 12, held);
		expect(away.rx).toBeGreaterThan(0);
		expect(away.ry).toBeGreaterThan(0);
		expect(away.mx).toBeGreaterThan(50);
		expect(away.my).toBeGreaterThan(50);

		const toward = motionTilt(held.beta - 12, held.gamma - 12, held);
		expect(toward.rx).toBe(-away.rx);
		expect(toward.ry).toBe(-away.ry);
	});

	it('stays gentler than the pointer tilt at its peak, even when the device is upended', () => {
		const extreme = motionTilt(held.beta + 180, held.gamma + 90, held);
		const corner = pointerTilt(1, 0);
		expect(Math.abs(extreme.rx)).toBeLessThan(Math.abs(corner.rx));
		expect(Math.abs(extreme.ry)).toBeLessThan(Math.abs(corner.ry));
	});

	it('clamps rotation past its range instead of spinning the card', () => {
		const far = motionTilt(held.beta + 60, held.gamma - 60, held);
		const further = motionTilt(held.beta + 120, held.gamma - 120, held);
		expect(further).toEqual(far);
	});
});
