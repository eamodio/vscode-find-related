'use strict';
import { Arrays } from './system';
import { IConfig } from './configuration';
import { Logger } from './logger';
import * as glob from 'glob';

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

    constructor(rule: IRule) {
        Object.assign(this, rule);
        try {
            this.matcher = new RegExp(rule.pattern, 'i');
        }
        catch (ex) {
            Logger.error('CompiledRule.ctor', ex);
        }
    }

    match(fileName: string): boolean {
        if (!this.matcher) return false;
        try {
            this._match = this.matcher.exec(fileName);
            if (!this._match || !this._match.length) return false;
            return true;
        }
        catch (ex) {
            Logger.error('CompiledRule.match', ex);
            return false;
        }
    }

    *find(workspace: string): Iterable<Promise<{ cwd: string, matches: string[] }>> {
        for (const locator of this.locators) {
            const globPattern = CompiledRule.replaceTokens(locator, this._match);
            Logger.log('CompiledRule.find', `globPattern=${globPattern}`);
            yield CompiledRule.globAsync(globPattern, { cwd: workspace, nocase: true });
        }
    }

    private static replaceTokens(pattern: string, ruleMatch: RegExpExecArray): string {
        return pattern.replace(tokenReplacer, (match: string, p1: string, p2: string) => ruleMatch[+p2]);
    }

    private static async globAsync(pattern: string, options?: glob.IOptions): Promise<{ cwd: string, matches: string[] }> {
        return new Promise<{ cwd: string, matches: string[] }>((resolve, reject) => {
            glob(pattern, options, (err: Error, matches: string[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({
                    cwd: options.cwd,
                    matches: matches
                });
            });
        });
    }
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

        rules.push(...ruleset.rules.map(_ => new CompiledRule(_)));
    }

    return rules;
}

export function* findRelatedFiles(rules: CompiledRule[], workspace: string): Iterable<Promise<{ cwd: string, matches: string[] }>> {
    for (const rule of rules) {
        yield *rule.find(workspace);
    }
}

export function normalizePath(fileName: string) {
    return fileName.replace(pathNormalizer, '/');
}