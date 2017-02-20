'use strict';
import { Arrays } from './system';
import { QuickPickOptions, TextEditor, TextEditorEdit, window, workspace } from 'vscode';
import { Commands, EditorCommand } from './commands';
import { IConfig, RelativeTo } from './configuration';
import { Logger } from './logger';
import { OpenFileCommandQuickPickItem } from './quickPick';
import * as path from 'path';
import * as glob from 'glob';

export class ShowRelatedCommand extends EditorCommand {

    constructor() {
        super(Commands.Show);
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
            const rules = cfg.rules.filter(_ => _.extension === extension && (!_.language || _.language === language) ||
                _.language === language && (!_.extension || _.extension === extension));

            if (!rules.length) return undefined;

            const pathsMap = new Map() as Map<string, string[]>;
            for (const rule of rules) {
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