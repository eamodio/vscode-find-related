'use strict';
import { Arrays } from './system';
import { CancellationTokenSource, ExtensionContext, QuickPickOptions, TextDocument, TextEditor, TextEditorEdit, window, workspace } from 'vscode';
import { Commands, EditorCommand } from './commands';
import { IConfig } from './configuration';
import { Logger } from './logger';
import { OpenFileCommandQuickPickItem } from './quickPickItems';
import { IRule, RulesProvider } from './rulesProvider';
import * as path from 'path';

const pathNormalizer = /\\/g;
function normalizePath(fileName: string) {
    return fileName.replace(pathNormalizer, '/');
}

export class ShowRelatedCommand extends EditorCommand {

    constructor(context: ExtensionContext, private rulesProvider: RulesProvider) {
        super(Commands.Show);
    }

    async execute(editor: TextEditor, edit: TextEditorEdit) {
        if (!editor || !editor.document || editor.document.isUntitled) return;

        try {
            const fileName = normalizePath(path.relative(workspace.rootPath, editor.document.fileName));

            const activeRules = this.rulesProvider.provideRules(fileName);
            if (!activeRules.length) return undefined;

            const cancellation = new CancellationTokenSource();
            const itemsPromise = this.getRelatedFileItems(activeRules, fileName, editor.document, cancellation);

            // Show a quick pick while we are waiting -- gives decent feedback but we will cancel it to update the placeholder text
            let selection = await window.showQuickPick(itemsPromise, {
                matchOnDescription: true,
                placeHolder: `Searching for files related to ${path.basename(fileName)}...`
            } as QuickPickOptions, cancellation.token);

            cancellation.dispose();

            const items = await itemsPromise;
            if (!items || !items.length) return undefined;

            const cfg = workspace.getConfiguration('').get<IConfig>('findrelated');

            if (cfg.autoOpen && items.length === 1) {
                return items[0].execute(cfg.openPreview);
            }

            // Show the real quick pick
            selection = await window.showQuickPick(items, {
                matchOnDescription: true,
                placeHolder: `Showing for files related to ${path.basename(fileName)}`
            } as QuickPickOptions);

            return selection && selection.execute(cfg.openPreview);
        }
        catch (ex) {
            Logger.error('[FindRelated.ShowRelatedCommand]', ex);
            return window.showErrorMessage(`Unable to show related files. See output channel for more details`);
        }
    }

    private async getRelatedFileItems(rules: IRule[], fileName: string, document: TextDocument, cancellation?: CancellationTokenSource): Promise<OpenFileCommandQuickPickItem[]> {
        const rootPath = workspace.rootPath;
        const files = await Promise.all(this.rulesProvider.resolveRules(rules, fileName, document, rootPath));
        if (!files.length) {
            cancellation && cancellation.cancel();
            return undefined;
        }

        const items = Arrays.flatten(files.map(_ => _.filter(uri => uri.fsPath !== fileName).map(uri => new OpenFileCommandQuickPickItem(uri, rootPath))));

        cancellation && cancellation.cancel();
        return items;
    }
}