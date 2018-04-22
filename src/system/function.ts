'use strict';

interface IPropOfValue {
    (): any;
    value: string | undefined;
}

export namespace Functions {
    export function propOf<T, K extends keyof T>(o: T, key: K) {
        const propOfCore = <T, K extends keyof T>(o: T, key: K) => {
            const value: string = (propOfCore as IPropOfValue).value === undefined
                ? key
                : `${(propOfCore as IPropOfValue).value}.${key}`;
            (propOfCore as IPropOfValue).value = value;
            const fn = <Y extends keyof T[K]>(k: Y) => propOfCore(o[key], k);
            return Object.assign(fn, { value: value });
        };
        return propOfCore(o, key);
    }
}