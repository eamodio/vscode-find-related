'use strict';
import { Arrays } from './system';
import { CancellationTokenSource, ExtensionContext, QuickPickOptions, TextEditor, TextEditorEdit, window, workspace } from 'vscode';
import { Commands, EditorCommand } from './commands';
import { IConfig } from './configuration';
import { Logger } from './logger';
import { OpenFileCommandQuickPickItem } from './quickPickItems';
import { CompiledRule, compileRules, IRuleset, findRelatedFiles, normalizePath } from './rules';
import * as path from 'path';

export class ShowRelatedCommand extends EditorCommand {

    config: IConfig;
    rules: CompiledRule[];
    rulesets: IRuleset[];

    constructor(context: ExtensionContext) {
        super(Commands.Show);
        this.rulesets = require(context.asAbsolutePath('./rulesets.json'));

        this.onConfigurationChanged();
        context.subscriptions.push(workspace.onDidChangeConfiguration(this.onConfigurationChanged, this));
    }

    private onConfigurationChanged(): void {
        const cfg = workspace.getConfiguration('').get<IConfig>('findrelated');

        this.rules = compileRules(this.rulesets, cfg);
        if (!this.rules || !this.rules.length) {
            Logger.warn('No active rulesets found');
        }

        this.config = cfg;
    }

    async execute(editor: TextEditor, edit: TextEditorEdit) {
        if (!editor || !editor.document || editor.document.isUntitled) return;

        try {
            const fileName = normalizePath(path.relative(workspace.rootPath, editor.document.fileName));

            const activeRules = this.rules.filter(_ => _.match(fileName));
            if (!activeRules.length) return undefined;

            const cancellation = new CancellationTokenSource();
            const itemsPromise = ShowRelatedCommand.getRelatedFileItems(activeRules, fileName, cancellation);

            // Show a quick pick while we are waiting -- gives decent feedback but we will cancel it to update the placeholder text
            let selection = await window.showQuickPick(itemsPromise, {
                matchOnDescription: true,
                placeHolder: `Searching for files related to ${path.basename(fileName)}...`
            } as QuickPickOptions, cancellation.token);

            cancellation.dispose();

            const items = await itemsPromise;
            if (!items || !items.length) return undefined;

            if (this.config.autoOpen && items.length === 1) {
                return items[0].execute(this.config.openPreview);
            }

            // Show the real quick pick
            selection = await window.showQuickPick(items, {
                matchOnDescription: true,
                placeHolder: `Showing for files related to ${path.basename(fileName)}`
            } as QuickPickOptions);

            return selection && selection.execute(this.config.openPreview);
        }
        catch (ex) {
            Logger.error('[FindRelated.ShowRelatedCommand]', ex);
            return window.showErrorMessage(`Unable to show related files. See output channel for more details`);
        }
    }

    private static async getRelatedFileItems(rules: CompiledRule[], fileName: string, cancellation?: CancellationTokenSource): Promise<OpenFileCommandQuickPickItem[]> {
        const rootPath = workspace.rootPath;
        const files = await Promise.all(findRelatedFiles(rules, rootPath));
        if (!files.length) {
            cancellation && cancellation.cancel();
            return undefined;
        }

        const items = Arrays.flatten(files.map(_ => _.filter(uri => uri.fsPath !== fileName).map(uri => new OpenFileCommandQuickPickItem(uri, rootPath))));

        cancellation && cancellation.cancel();
        return items;
    }
}