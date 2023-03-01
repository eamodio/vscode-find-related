import { hrtime } from '@env/hrtime';

export function getDurationMilliseconds(start: [number, number]) {
	const [secs, nanosecs] = hrtime(start);
	return secs * 1000 + Math.floor(nanosecs / 1000000);
}
