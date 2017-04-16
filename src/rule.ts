'use strict';
import { CancellationToken, TextDocument, Uri, workspace } from 'vscode';
import { Logger } from './logger';
//import * as glob from 'glob';

const tokenReplacer = /(\$([0-9]))/g;

export interface IRule {
    match(fileName: string): boolean;
    provideRelated(fileName: string, document: TextDocument, rootPath: string): IterableIterator<Promise<Uri[]>>;
}

export interface IRuleDefinition {
    pattern: string;
    locators: string[];
}

export class Rule implements IRule, IRuleDefinition {

    pattern: string;
    locators: string[];
    matcher: RegExp;

    private _match: RegExpExecArray;

    constructor(rule: IRuleDefinition, private rulesetName: string) {
        Object.assign(this, rule);
        try {
            this.matcher = new RegExp(rule.pattern, 'i');
        }
        catch (ex) {
            Logger.error(ex, `Rule(${this.rulesetName}).ctor`, ex, rule.pattern);
        }
    }

    match(fileName: string): boolean {
        if (!this.matcher) return false;
        try {
            this._match = this.matcher.exec(fileName);
            const matches = !!(this._match && this._match.length);
            Logger.log(`Rule(${this.rulesetName}).match(${fileName})=${matches}`, this.pattern);
            return matches;
        }
        catch (ex) {
            Logger.error(ex, 'Rule.match');
            return false;
        }
    }

    *provideRelated(fileName: string, document: TextDocument, rootPath: string): IterableIterator<Promise<Uri[]>> {
        for (const locator of this.locators) {
            const globPattern = Rule.replaceTokens(locator, this._match);
            Logger.log(`Rule(${this.rulesetName}).provideRelated(${fileName}, ${rootPath})`, `globPattern=${globPattern}`);
            //yield Rule.globAsync(globPattern, { cwd: rootPath, nocase: true });
            yield Rule.findFilesAsync(globPattern);
        }
    }

    private static replaceTokens(pattern: string, ruleMatch: RegExpExecArray): string {
        return pattern.replace(tokenReplacer, (match: string, p1: string, p2: string) => ruleMatch[+p2]);
    }

    private static async findFilesAsync(pattern: string, maxResults?: number, token?: CancellationToken): Promise<Uri[]> {
        return await workspace.findFiles(pattern, undefined, maxResults, token);
    }

    // private static async globAsync(pattern: string, options?: glob.IOptions): Promise<Uri[]> {
    //     return new Promise<Uri[]>((resolve, reject) => {
    //         glob(pattern, options, (err: Error, matches: string[]) => {
    //             if (err) {
    //                 reject(err);
    //                 return;
    //             }
    //             resolve(matches.map(_ => Uri.file(_)));
    //         });
    //     });
    // }
}