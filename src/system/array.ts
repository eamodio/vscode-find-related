'use strict';
import { union as _union, xor as _xor } from 'lodash-es';

export namespace Arrays {
	export function areEquivalent<T>(value: T[], other: T[]) {
		return _xor(value, other).length === 0;
	}

	export function flatten<T>(array: (T | T[])[]): T[] {
		return array.reduce((acc: T[], val: T | T[]) => acc.concat(Array.isArray(val) ? flatten(val) : val), []);
	}

	export function union<T>(...arrays: T[][]): T[] {
		return _union<T>(...arrays);
	}
}
