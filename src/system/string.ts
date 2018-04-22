'use strict';

const pathNormalizer = /\\/g;

export namespace Strings {

    export function normalizePath(fileName: string) {
        const normalized = fileName && fileName.replace(pathNormalizer, '/');
        return normalized;
    }
}