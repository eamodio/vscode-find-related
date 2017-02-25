'use strict';
import { Arrays } from './system';
import { CancellationToken, Uri, workspace } from 'vscode';
import { IConfig } from './configuration';
import { Logger } from './logger';
//import * as glob from 'glob';

const pathNormalizer = /\\/g;
const tokenReplacer = /(\$([0-9]))/g;

export interface IRule {
    pattern: string;
    locators: string[];
}

export interface IRuleset {
    name: string;
    rules: IRule[];
}

export class CompiledRule implements IRule {
    pattern: string;
    locators: string[];
    matcher: RegExp;

    private _match: RegExpExecArray;

    constructor(rule: IRule, private rulesetName: string) {
        Object.assign(this, rule);
        try {
            this.matcher = new RegExp(rule.pattern, 'i');
        }
        catch (ex) {
            Logger.error(`CompiledRule(${this.rulesetName}).ctor`, ex, rule.pattern);
        }
    }

    match(fileName: string): boolean {
        if (!this.matcher) return false;
        try {
            this._match = this.matcher.exec(fileName);
            const matches = !!(this._match && this._match.length);
            Logger.log(`CompiledRule(${this.rulesetName}).match(${fileName})=${matches}`, this.pattern);
            return matches;
        }
        catch (ex) {
            Logger.error('CompiledRule.match', ex);
            return false;
        }
    }

    *find(workspace: string): Iterable<Promise<Uri[]>> {
        for (const locator of this.locators) {
            const globPattern = CompiledRule.replaceTokens(locator, this._match);
            Logger.log(`CompiledRule(${this.rulesetName}).find(${workspace})`, `globPattern=${globPattern}`);
            //yield CompiledRule.globAsync(globPattern, { cwd: workspace, nocase: true });
            yield CompiledRule.findFilesAsync(globPattern);
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

export function compileRules(rulesets: IRuleset[], cfg: IConfig): CompiledRule[] {
    const applied = Arrays.union(cfg.applyRulesets, cfg.applyWorkspaceRulesets);
    if (!applied.length) return undefined;

    const rules: CompiledRule[] = [];
    const userDefinedRulesets = cfg.rulesets || [];
    const workspaceDefinedRulesets = cfg.workspaceRulesets || [];
    for (const name of applied) {
        const ruleset = workspaceDefinedRulesets.find(_ => _.name === name) ||
            userDefinedRulesets.find(_ => _.name === name) ||
            rulesets.find(_ => _.name === name);
        if (!ruleset) continue;

        rules.push(...ruleset.rules.map(_ => new CompiledRule(_, ruleset.name)));
    }

    return rules;
}

export function* findRelatedFiles(rules: CompiledRule[], workspace: string): Iterable<Promise<Uri[]>> {
    for (const rule of rules) {
        yield *rule.find(workspace);
    }
}

export function normalizePath(fileName: string) {
    return fileName.replace(pathNormalizer, '/');
}