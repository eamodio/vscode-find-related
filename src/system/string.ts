'use strict';

const emptyStr = '';

export namespace Strings {
    export const enum CharCode {
        /**
         * The `/` character.
         */
        Slash = 47,
        /**
         * The `\` character.
         */
        Backslash = 92
    }

    export function getDurationMilliseconds(start: [number, number]) {
        const [secs, nanosecs] = process.hrtime(start);
        return secs * 1000 + Math.floor(nanosecs / 1000000);
    }

    const pathNormalizeRegex = /\\/g;
    const pathStripTrailingSlashRegex = /\/$/g;

    export function normalizePath(
        fileName: string,
        options: { addLeadingSlash?: boolean; stripTrailingSlash?: boolean } = { stripTrailingSlash: true }
    ) {
        if (fileName == null || fileName.length === 0) return fileName;

        let normalized = fileName.replace(pathNormalizeRegex, '/');

        const { addLeadingSlash, stripTrailingSlash } = { stripTrailingSlash: true, ...options };

        if (stripTrailingSlash) {
            normalized = normalized.replace(pathStripTrailingSlashRegex, emptyStr);
        }

        if (addLeadingSlash && normalized.charCodeAt(0) !== CharCode.Slash) {
            normalized = `/${normalized}`;
        }

        return normalized;
    }
}
