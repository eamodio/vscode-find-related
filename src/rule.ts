'use strict';
import { TextDocument, Uri } from 'vscode';
import { Logger } from './logger';
import { IDynamicRule, RulesProvider } from './rulesProvider';
// import * as glob from 'glob';

const tokenReplacer = /(\$([0-9]))/g;

export interface IRule {
    match(fileName: string): boolean;
    provideRelated(fileName: string, document: TextDocument, rootPath: string | undefined): Iterable<Promise<Uri[]>>;
}

export interface IRuleDefinition {
    pattern: string;
    locators: string[];
}

export class Rule implements IRule, IRuleDefinition {

    readonly pattern!: string;
    readonly locators!: string[];
    readonly matcher: RegExp;

    private _match: RegExpExecArray | null | undefined;

    constructor(
        rule: IRuleDefinition,
        private rulesetName: string
    ) {
        Object.assign(this, rule);
        try {
            this.matcher = new RegExp(rule.pattern, 'i');
        }
        catch (ex) {
            Logger.error(ex, `Rule(${this.rulesetName}).ctor`, ex, rule.pattern);

            throw ex;
        }
    }

    match(fileName: string): boolean {
        if (this.matcher === undefined) return false;

        try {
            this._match = this.matcher.exec(fileName);
            const matches = this._match != null && this._match.length > 0;
            Logger.log(`Rule(${this.rulesetName}).match(${fileName})=${matches}`, this.pattern);
            return matches;
        }
        catch (ex) {
            Logger.error(ex, 'Rule.match');
            return false;
        }
    }

    *provideRelated(fileName: string, document: TextDocument, rootPath: string): Iterable<Promise<Uri[]>> {
        for (const locator of this.locators) {
            if (this._match == null) continue;

            const globPattern = Rule.replaceTokens(locator, this._match);
            Logger.log(`Rule(${this.rulesetName}).provideRelated(${fileName}, ${rootPath})`, `globPattern=${globPattern}`);
            // yield Rule.globAsync(globPattern, { cwd: rootPath, nocase: true });
            yield RulesProvider.findFiles(globPattern);
        }
    }

    private static replaceTokens(pattern: string, ruleMatch: RegExpExecArray): string {
        return pattern.replace(tokenReplacer, (match: string, p1: string, p2: string) => ruleMatch[+p2]);
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

    static isDynamic(rule: IDynamicRule | IRuleDefinition): rule is IDynamicRule {
        return (typeof (rule as IDynamicRule).match === 'function') &&
            (typeof (rule as IDynamicRule).provideRelated === 'function');
    }
}