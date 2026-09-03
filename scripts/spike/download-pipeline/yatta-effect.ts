/** SPIKE — the `Schema` implementation of ./yatta-contract.ts. */
import { Either, Schema } from 'effect';
import type { DecodeMonsterIcons } from './yatta-contract.js';

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

const decode = Schema.decodeUnknownEither(YattaMonsterIndex, { errors: 'all' });

export const decodeMonsterIcons: DecodeMonsterIcons = (payload) =>
	Either.match(decode(payload), {
		onLeft: (error) => ({ ok: false, error: error.message }),
		onRight: (index) => ({
			ok: true,
			icons: new Map(Object.values(index.data.items).map((item) => [item.id, item.icon] as const))
		})
	});
