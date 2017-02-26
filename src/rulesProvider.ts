'use strict';
import { Arrays } from './system';
import { Disposable, ExtensionContext, TextDocument, Uri, workspace } from 'vscode';
import { IConfig } from './configuration';
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

    rules: IRule[];
    rulesets: IRuleset[];

    private disposable: Disposable;

    private registeredRulesets: IRegisteredRuleset[];

    constructor(context: ExtensionContext) {
        super(() => this.dispose());

        this.rulesets = require(context.asAbsolutePath('./rulesets.json'));

        this.onConfigurationChanged();
        this.disposable = workspace.onDidChangeConfiguration(this.onConfigurationChanged, this);
    }

    dispose() {
        this.disposable && this.disposable.dispose();
    }

    private onConfigurationChanged(): void {
        this.compileRules();
    }

    provideRules(fileName: string): IRule[] {
        return this.rules.filter(_ => _.match(fileName));
    }

    *resolveRules(rules: IRule[], fileName: string, document: TextDocument, rootPath: string): Iterable<Promise<Uri[]>> {
        for (const rule of rules) {
            yield *rule.provideRelated(fileName, document, rootPath);
        }
    }

    registerRuleset(name: string, rules: (IDynamicRule | IRuleDefinition)[]): Disposable {
        if (!this.registeredRulesets) {
            this.registeredRulesets = [];
        }

        const ruleset = {
            name: name,
            rules: rules
        } as IRegisteredRuleset;
        this.registeredRulesets.push(ruleset);

        this.compileRules();

        return {
            dispose: () => {
                const index = this.registeredRulesets.indexOf(ruleset);
                this.registeredRulesets.splice(index, 1);
                this.compileRules();
            }
        } as Disposable;
    }

    private compileRules(): void {
        const cfg = workspace.getConfiguration('').get<IConfig>('findrelated');
        const applied = Arrays.union(cfg.applyRulesets, cfg.applyWorkspaceRulesets);

        const rules: IRule[] = [];
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

        if (this.registeredRulesets && this.registeredRulesets.length) {
            for (const ruleset of this.registeredRulesets) {
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
}