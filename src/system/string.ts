export function getDurationMilliseconds(start: [number, number]) {
	// eslint-disable-next-line no-restricted-globals
	const [secs, nanosecs] = process.hrtime(start);
	return secs * 1000 + Math.floor(nanosecs / 1000000);
}
