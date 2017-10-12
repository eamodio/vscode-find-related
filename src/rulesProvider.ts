'use strict';
import { Arrays, Objects } from './system';
import { CancellationToken, Disposable, ExtensionContext, TextDocument, Uri, workspace } from 'vscode';
import { ExtensionKey, IConfig } from './configuration';
import { Logger } from './logger';
import { IRule, IRuleDefinition, Rule } from './rule';

export { IRule, IRuleDefinition, Rule };

export interface IRuleset {
    name: string;
    rules: IRuleDefinition[];
}

export interface IDynamicRule {
    match(fileName: string): boolean;
    provideRelated(fileName: string, document: TextDocument, rootPath: string): Promise<Uri[]>;
}

interface IRegisteredRuleset {
    name: string;
    rules: (IDynamicRule | IRuleDefinition)[];
}

export class RulesProvider extends Disposable {

    private static _excludes: string | null | undefined;

    rules: IRule[];
    rulesets: IRuleset[];

    private _disposable: Disposable;
    private _registeredRulesets: IRegisteredRuleset[];

    constructor(context: ExtensionContext) {
        super(() => this.dispose());

        this.rulesets = require(context.asAbsolutePath('./rulesets.json'));

        this.onConfigurationChanged();
        this._disposable = workspace.onDidChangeConfiguration(this.onConfigurationChanged, this);
    }

    dispose() {
        this._disposable && this._disposable.dispose();
    }

    private onConfigurationChanged(): void {
        this.compileRules();
        RulesProvider._excludes = undefined;
    }

    provideRules(fileName: string): IRule[] {
        return this.rules.filter(_ => _.match(fileName));
    }

    *resolveRules(rules: IRule[], fileName: string, document: TextDocument, rootPath: string | undefined): Iterable<Promise<Uri[]>> {
        for (const rule of rules) {
            yield *rule.provideRelated(fileName, document, rootPath);
        }
    }

    registerRuleset(name: string, rules: (IDynamicRule | IRuleDefinition)[]): Disposable {
        if (!this._registeredRulesets) {
            this._registeredRulesets = [];
        }

        const ruleset = {
            name: name,
            rules: rules
        } as IRegisteredRuleset;
        this._registeredRulesets.push(ruleset);

        this.compileRules();

        return {
            dispose: () => {
                const index = this._registeredRulesets.indexOf(ruleset);
                this._registeredRulesets.splice(index, 1);
                this.compileRules();
            }
        } as Disposable;
    }

    private compileRules(): void {
        const rules: IRule[] = [];

        const cfg = workspace.getConfiguration('').get<IConfig>(ExtensionKey);
        if (cfg !== undefined) {
            const applied = Arrays.union(cfg.applyRulesets, cfg.applyWorkspaceRulesets);

            if (applied.length) {
                const userDefinedRulesets = cfg.rulesets || [];
                const workspaceDefinedRulesets = cfg.workspaceRulesets || [];
                for (const name of applied) {
                    const ruleset = workspaceDefinedRulesets.find(_ => _.name === name) ||
                        userDefinedRulesets.find(_ => _.name === name) ||
                        this.rulesets.find(_ => _.name === name);
                    if (!ruleset) continue;

                    rules.push(...ruleset.rules.map(_ => new Rule(_, ruleset.name)));
                }
            }
        }

        if (this._registeredRulesets && this._registeredRulesets.length) {
            for (const ruleset of this._registeredRulesets) {
                rules.push(...ruleset.rules.map(rule => {
                    if (typeof (rule as IDynamicRule).match === 'function' &&
                        typeof (rule as IDynamicRule).provideRelated === 'function') {
                        return {
                            match: (rule as IDynamicRule).match,
                            provideRelated: (fileName: string, document: TextDocument, rootPath: string) => [(rule as IDynamicRule).provideRelated(fileName, document, rootPath)] as any
                        } as IRule;
                    }

                    return new Rule(rule as IRuleDefinition, ruleset.name);
                }));
            }
        }

        if (!rules || !rules.length) {
            Logger.warn('No active rulesets found');
        }

        this.rules = rules;
    }

    static findFiles(pattern: string, maxResults?: number, token?: CancellationToken): Promise<Uri[]> {
        return workspace.findFiles(pattern, RulesProvider._excludes || this.getFindFilesExcludes(), maxResults, token) as Promise<Uri[]>;
    }

    private static getFindFilesExcludes(): string| undefined {
        if (RulesProvider._excludes === undefined) {
            const fileExclude = workspace.getConfiguration('files').get<{ [key: string]: boolean } | undefined>('exclude', undefined);
            const searchExclude = workspace.getConfiguration('search').get<{ [key: string]: boolean } | undefined>('exclude', undefined);

            if (fileExclude !== undefined || searchExclude !== undefined) {
                const excludes: { [key: string]: boolean } = Object.create(null);
                if (fileExclude !== undefined) {
                    for (const [key, value] of Objects.entries(fileExclude)) {
                        if (!value) continue;

                        excludes[key] = true;
                    }
                }

                if (searchExclude !== undefined) {
                    for (const [key, value] of Objects.entries(searchExclude)) {
                        if (!value) continue;

                        excludes[key] = true;
                    }
                }

                const patterns = Object.keys(excludes);
                RulesProvider._excludes = (patterns.length > 0) ?
                    `{${patterns.join(',')}}`
                    : null;
            }
            else {
                RulesProvider._excludes = null;
            }

            Logger.log(`excludes=${RulesProvider._excludes}`);
        }

        return RulesProvider._excludes !== null
            ? RulesProvider._excludes
            : undefined;
    }
}