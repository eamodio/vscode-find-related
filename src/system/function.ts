'use strict';

interface IPropOfValue {
    (): any;
    value: string | undefined;
}

export namespace Functions {
    export function getParameters(fn: Function): string[] {
        if (typeof fn !== 'function') throw new Error('Not supported');

        if (fn.length === 0) return [];

        const stripCommentsRegex = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/gm;
        let fnBody: string = Function.prototype.toString.call(fn);
        fnBody = fnBody.replace(stripCommentsRegex, '') || fnBody;
        fnBody = fnBody.slice(0, fnBody.indexOf('{'));

        let open = fnBody.indexOf('(');
        let close = fnBody.indexOf(')');

        open = open >= 0 ? open + 1 : 0;
        close = close > 0 ? close : fnBody.indexOf('=');

        fnBody = fnBody.slice(open, close);
        fnBody = `(${fnBody})`;

        const match = fnBody.match(/\(([\s\S]*)\)/);
        return match != null ? match[1].split(',').map(param => param.trim()) : [];
    }

    export function isPromise(o: any): o is Promise<any> {
        return (typeof o === 'object' || typeof o === 'function') && typeof o.then === 'function';
    }

    export function propOf<T, K extends Extract<keyof T, string>>(o: T, key: K) {
        const propOfCore = <T, K extends Extract<keyof T, string>>(o: T, key: K) => {
            const value: string =
                (propOfCore as IPropOfValue).value === undefined ? key : `${(propOfCore as IPropOfValue).value}.${key}`;
            (propOfCore as IPropOfValue).value = value;
            const fn = <Y extends Extract<keyof T[K], string>>(k: Y) => propOfCore(o[key], k);
            return Object.assign(fn, { value: value });
        };
        return propOfCore(o, key);
    }
}
