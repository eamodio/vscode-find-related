'use strict';
import { Arrays } from './system';
import { ExtensionContext, QuickPickOptions, TextEditor, TextEditorEdit, window, workspace } from 'vscode';
import { Commands, EditorCommand } from './commands';
import { IConfig, IRuleset, RelativeTo } from './configuration';
import { Logger } from './logger';
import { OpenFileCommandQuickPickItem } from './quickPick';
import * as path from 'path';
import * as glob from 'glob';

export class ShowRelatedCommand extends EditorCommand {

    rulesets: IRuleset[];
    constructor(context: ExtensionContext) {
        super(Commands.Show);
        this.rulesets = require(context.asAbsolutePath('./rulesets.json'));
    }

    async execute(editor: TextEditor, edit: TextEditorEdit) {
        if (!editor || !editor.document || editor.document.isUntitled) {
            return;
        }

        try {
            const fileName = editor.document.fileName;
            const extension = path.extname(fileName).toLowerCase();
            const language = editor.document.languageId;

            const cfg = workspace.getConfiguration('').get<IConfig>('findrelated');

            const applied = Arrays.union(cfg.applyRulesets, cfg.applyWorkspaceRulesets);
            if (!applied.length) {
                Logger.warn('[FindRelated.ShowRelatedCommand]', 'No specified rulesets');
                return undefined;
            }

            const rules = [];
            const userDefinedRulesets = cfg.rulesets || [];
            const workspaceDefinedRulesets = cfg.workspaceRulesets || [];
            for (const name of applied) {
                const ruleset = workspaceDefinedRulesets.find(_ => _.name === name) ||
                    userDefinedRulesets.find(_ => _.name === name) ||
                    this.rulesets.find(_ => _.name === name);
                if (!ruleset) continue;

                rules.push(...ruleset.rules);
            }

            const activeRules = rules.filter(_ => _.extension === extension && (!_.language || _.language === language) ||
                _.language === language && (!_.extension || _.extension === extension));

            if (!activeRules.length) return undefined;

            const pathsMap = new Map() as Map<string, string[]>;
            for (const rule of activeRules) {
                for (const locator of rule.locators) {
                    let directory: string;
                    switch (locator.relativeTo) {
                        case RelativeTo.File:
                            directory = locator.path
                                ? path.resolve(path.dirname(fileName), locator.path)
                                : path.dirname(fileName);
                            break;

                        case RelativeTo.Root:
                            if (!locator.path) continue;
                            directory = path.resolve(workspace.rootPath, locator.path);
                            break;
                    }

                    if (!directory) continue;

                    const patterns = pathsMap.get(directory);
                    if (patterns) {
                        patterns.push(locator.pattern);
                    }
                    else {
                        pathsMap.set(directory, [locator.pattern]);
                    }
                }
            }

            const promises: Promise<{ cwd: string, matches: string[] }>[] = [];
            for (const [fullPath, patterns] of pathsMap) {
                // Turn the patterns into -> ?(pattern|pattern|pattern)
                const file = path.basename(fileName, path.extname(fileName));
                const pattern = `?(${patterns.map(_ => this.replaceTokens(_, file)).join('|')})`;
                promises.push(this.globAsync(pattern, { cwd: fullPath }));
            }

            const files = await Promise.all(promises);
            if (!files.length) return undefined;

            const items = Arrays.flatten(files.map(_ => _.matches.map(m => new OpenFileCommandQuickPickItem(_.cwd, m))));
            if (!items.length) return undefined;

            if (cfg.autoOpen && items.length === 1) {
                return items[0].execute(cfg.openPreview);
            }

            const selection = await window.showQuickPick(items, { matchOnDescription: true } as QuickPickOptions);
            return selection && selection.execute(cfg.openPreview);
        }
        catch (ex) {
            Logger.error('[FindRelated.ShowRelatedCommand]', ex);
            return window.showErrorMessage(`Unable to show related files. See output channel for more details`);
        }
    }

    private replaceTokens(pattern: string, fileName: string): string {
        return pattern.replace('$(file)', fileName);
    }

    private async globAsync(pattern: string, options?: glob.IOptions): Promise<{ cwd: string, matches: string[] }> {
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