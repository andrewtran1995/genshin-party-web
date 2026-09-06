/**
 * The Yatta monster index, which is where boss icon filenames come from when
 * `genshin-db`'s own `filename_icon` is missing or stale.
 *
 * This used to be an inline `as` cast in `gen-data.ts`. The cast was
 * load-bearing and unchecked: if Yatta renamed `icon` or moved `items`, the
 * cast still succeeded, the map came back empty or full of `undefined`, and the
 * build quietly shipped a dataset with the wrong icons. Decoding it instead
 * turns that into a named, loud warning.
 */
import { Data, Effect, Schema } from 'effect';
import {
	defaultRequestOptions,
	fetchAndRead,
	type HttpPorts,
	type RequestOptions
} from './http.js';

export const YATTA_MONSTER_URL = 'https://gi.yatta.moe/api/v2/en/monster';

const YattaMonster = Schema.Struct({
	id: Schema.Number,
	name: Schema.String,
	icon: Schema.String
});

const YattaMonsterIndex = Schema.Struct({
	response: Schema.Number,
	data: Schema.Struct({
		items: Schema.Record({ key: Schema.String, value: YattaMonster })
	})
});

/**
 * Yatta being unreachable is not a build failure — `gen-data.ts` falls back to
 * `genshin-db`'s icon filenames. A response we cannot read is the same kind of
 * problem, so it arrives the same way, with a message saying which it was.
 */
export class YattaUnavailable extends Data.TaggedError('YattaUnavailable')<{
	readonly message: string;
}> {}

const readJson = (response: Response): Promise<unknown> => response.json();

export const decodeMonsterIcons = (
	payload: unknown
): Effect.Effect<ReadonlyMap<number, string>, YattaUnavailable> =>
	Schema.decodeUnknown(YattaMonsterIndex, { errors: 'all' })(payload).pipe(
		Effect.mapError(
			(error) => new YattaUnavailable({ message: `unexpected response shape: ${error.message}` })
		),
		Effect.map(
			(index) =>
				new Map(Object.values(index.data.items).map((item) => [item.id, item.icon] as const))
		)
	);

/** Boss id → icon filename, or a `YattaUnavailable` the caller can fall back on. */
export const fetchMonsterIcons = (
	ports: HttpPorts,
	options: RequestOptions = defaultRequestOptions
): Effect.Effect<ReadonlyMap<number, string>, YattaUnavailable> =>
	fetchAndRead(YATTA_MONSTER_URL, readJson, ports, options).pipe(
		Effect.mapError((failure) => new YattaUnavailable({ message: failure.message })),
		Effect.flatMap(decodeMonsterIcons)
	);
