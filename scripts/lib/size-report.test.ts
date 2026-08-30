import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { buildSizeReport, measureDataFile } from './size-report.js';

describe('measureDataFile', () => {
	it('reports the UTF-8 byte length of the contents', () => {
		expect(measureDataFile('characters.json', 'abc').bytes).toBe(3);
	});

	it('counts multi-byte characters by their encoded byte length, not string length', () => {
		// '"雷"' is a single character but 3 bytes in UTF-8.
		expect(measureDataFile('characters.json', '"雷"').bytes).toBe(5);
	});

	it('reports the gzip-compressed byte length', () => {
		const contents = '{"a":1}'.repeat(50);
		expect(measureDataFile('bosses.json', contents).gzipBytes).toBe(
			gzipSync(Buffer.from(contents, 'utf8')).byteLength
		);
	});
});

describe('buildSizeReport', () => {
	it('serializes the measurements as indented JSON, one entry per file', () => {
		const report = buildSizeReport([
			{ file: 'characters.json', bytes: 100, gzipBytes: 40 },
			{ file: 'bosses.json', bytes: 50, gzipBytes: 20 }
		]);
		expect(JSON.parse(report)).toEqual([
			{ file: 'characters.json', bytes: 100, gzipBytes: 40 },
			{ file: 'bosses.json', bytes: 50, gzipBytes: 20 }
		]);
		expect(report.endsWith('\n')).toBe(true);
	});
});
