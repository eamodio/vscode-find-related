'use strict';
import { CancellationToken, ConfigurationChangeEvent, Disposable, TextDocument, Uri, workspace } from 'vscode';
import { Config, configuration, RuleDefinition, Ruleset } from './configuration';
import { Container } from './container';
import { Logger } from './logger';
import { DynamicRule, IRule, Rule } from './rule';
import { Arrays } from './system';
import { FileSystem } from './system/fs';

export { DynamicRule, IRule, Rule };

interface RegisteredRuleset {
    name: string;
    rules: (DynamicRule | RuleDefinition)[];
}

export class RulesProvider implements Disposable {
    private static _excludes: null | undefined;

    rules!: IRule[];
    rulesets: Ruleset[];

    private readonly _disposable: Disposable;
    private _registeredRulesets: RegisteredRuleset[] | undefined;

    constructor() {
        this.rulesets = FileSystem.loadJsonFromFileSync<Ruleset[]>(
            Container.context.asAbsolutePath('./rulesets.json')
        )!;

        this._disposable = Disposable.from(configuration.onDidChange(this.onConfigurationChanged, this));
        this.onConfigurationChanged(configuration.initializingChangeEvent);
    }

    dispose() {
        this._disposable && this._disposable.dispose();
    }

    private onConfigurationChanged(e: ConfigurationChangeEvent): void {
        const initializing = configuration.initializing(e);

        if (
            initializing ||
            configuration.changed(e, configuration.name('applyRulesets').value) ||
            configuration.changed(e, configuration.name('applyWorkspaceRulesets').value) ||
            configuration.changed(e, configuration.name('rulesets').value) ||
            configuration.changed(e, configuration.name('workspaceRulesets').value)
        ) {
            this.compileRules();
        }

        if (initializing || configuration.changed(e, configuration.name('ignoreExcludes').value)) {
            RulesProvider._excludes = configuration.get<boolean>(configuration.name('ignoreExcludes').value)
                ? null
                : undefined;
        }
    }

    provideRules(fileName: string): IRule[] {
        return this.rules.filter(r => r.match(fileName));
    }

    *resolveRules(
        rules: IRule[],
        fileName: string,
        document: TextDocument,
        rootPath: string
    ): Iterable<Promise<Uri[]>> {
        for (const rule of rules) {
            yield* rule.provideRelated(fileName, document, rootPath);
        }
    }

    registerRuleset(name: string, rules: (DynamicRule | RuleDefinition)[]): Disposable {
        if (this._registeredRulesets === undefined) {
            this._registeredRulesets = [];
        }

        const ruleset = {
            name: name,
            rules: rules
        } as RegisteredRuleset;
        this._registeredRulesets.push(ruleset);

        this.compileRules();

        return {
            dispose: () => {
                if (this._registeredRulesets !== undefined) {
                    const index = this._registeredRulesets.indexOf(ruleset);
                    this._registeredRulesets.splice(index, 1);
                }
                this.compileRules();
            }
        };
    }

    private compileRules(): void {
        const rules: IRule[] = [];

        const cfg = configuration.get<Config>();
        if (cfg !== undefined) {
            const applied = Arrays.union(cfg.applyRulesets, cfg.applyWorkspaceRulesets);

            if (applied.length) {
                const userDefinedRulesets = cfg.rulesets || [];
                const workspaceDefinedRulesets = cfg.workspaceRulesets || [];
                for (const name of applied) {
                    const ruleset =
                        workspaceDefinedRulesets.find(_ => _.name === name) ||
                        userDefinedRulesets.find(_ => _.name === name) ||
                        this.rulesets.find(_ => _.name === name);
                    if (!ruleset) continue;

                    rules.push(...ruleset.rules.map(r => new Rule(r, ruleset.name)));
                }
            }
        }

        if (this._registeredRulesets && this._registeredRulesets.length) {
            for (const ruleset of this._registeredRulesets) {
                rules.push(
                    ...ruleset.rules.map<IRule>(rule => {
                        if (Rule.isDynamic(rule)) {
                            return {
                                match: rule.match,
                                provideRelated: (fileName: string, document: TextDocument, rootPath: string) =>
                                    [rule.provideRelated(fileName, document, rootPath)] as Iterable<Promise<Uri[]>>
                            };
                        }

                        return new Rule(rule, ruleset.name);
                    })
                );
            }
        }

        if (!rules || !rules.length) {
            Logger.warn('No active rulesets found');
        }

        this.rules = rules;
    }

    static findFiles(pattern: string, maxResults?: number, token?: CancellationToken): Promise<Uri[]> {
        Logger.log(`RulesProvider.findFiles(${pattern}, ${maxResults})`);

        return workspace.findFiles(pattern, this._excludes, maxResults, token) as Promise<Uri[]>;
    }

    // private static getFindFilesExcludes(): string| undefined {
    //     if (RulesProvider._excludes === undefined) {
    //         const fileExclude = workspace.getConfiguration('files').get<{ [key: string]: boolean } | undefined>('exclude', undefined);
    //         const searchExclude = workspace.getConfiguration('search').get<{ [key: string]: boolean } | undefined>('exclude', undefined);

    //         if (fileExclude !== undefined || searchExclude !== undefined) {
    //             const excludes: { [key: string]: boolean } = Object.create(null);
    //             if (fileExclude !== undefined) {
    //                 for (const [key, value] of Objects.entries(fileExclude)) {
    //                     if (!value) continue;

    //                     excludes[key] = true;
    //                 }
    //             }

    //             if (searchExclude !== undefined) {
    //                 for (const [key, value] of Objects.entries(searchExclude)) {
    //                     if (!value) continue;

    //                     excludes[key] = true;
    //                 }
    //             }

    //             const patterns = Object.keys(excludes);
    //             RulesProvider._excludes = (patterns.length > 0)
    //                 ? `{${patterns.join(',')}}`
    //                 : null;
    //         }
    //         else {
    //             RulesProvider._excludes = null;
    //         }

    //         Logger.log(`excludes=${RulesProvider._excludes}`);
    //     }

    //     return RulesProvider._excludes !== null
    //         ? RulesProvider._excludes
    //         : undefined;
    // }
}
