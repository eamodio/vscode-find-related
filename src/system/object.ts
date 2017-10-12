'use strict';

export namespace Objects {
    export function entries<T>(o: { [key: string]: T }): IterableIterator<[string, T]>;
    export function entries<T>(o: { [key: number]: T }): IterableIterator<[string, T]>;
    export function* entries<T>(o: any): IterableIterator<[string, T]> {
        for (const key in o) {
            yield [key, o[key]];
        }
    }

    export function values<T>(o: { [key: string]: T }): IterableIterator<T>;
    export function values<T>(o: { [key: number]: T }): IterableIterator<T>;
    export function* values<T>(o: any): IterableIterator<T> {
        for (const key in o) {
            yield o[key];
        }
    }
}