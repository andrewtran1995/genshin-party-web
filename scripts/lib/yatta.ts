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

export const fetchMonsterIcons = (
	ports: HttpPorts,
	options: RequestOptions = defaultRequestOptions
): Effect.Effect<ReadonlyMap<number, string>, YattaUnavailable> =>
	fetchAndRead(YATTA_MONSTER_URL, readJson, ports, options).pipe(
		Effect.mapError((failure) => new YattaUnavailable({ message: failure.message })),
		Effect.flatMap(decodeMonsterIcons)
	);
