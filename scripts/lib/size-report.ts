import { gzipSync } from 'node:zlib';

export interface DataFileSize {
	file: string;
	bytes: number;
	gzipBytes: number;
}

/** Raw and gzip byte size of one generated data file's contents. */
export const measureDataFile = (file: string, contents: string): DataFileSize => {
	const buffer = Buffer.from(contents, 'utf8');
	return { file, bytes: buffer.byteLength, gzipBytes: gzipSync(buffer).byteLength };
};

export const buildSizeReport = (files: readonly DataFileSize[]): string =>
	`${JSON.stringify(files, undefined, '\t')}\n`;
