'use strict';
import * as path from 'path';
import {
    CancellationTokenSource,
    QuickPickOptions,
    TextDocumentShowOptions,
    TextEditor,
    Uri,
    window,
    workspace
} from 'vscode';
import { Config } from '../configuration';
import { extensionId } from '../constants';
import { Container } from '../container';
import { OpenFileCommandQuickPickItem, QuickPickItem, showQuickPickProgress } from './common';

export class RelatedFileQuickPickItem extends OpenFileCommandQuickPickItem {
    constructor(uri: Uri) {
        const directory = path.dirname(workspace.asRelativePath(uri));

        super(uri, {
            label: `$(file-symlink-file) ${path.basename(uri.fsPath)}`,
            description: directory === '.' ? '' : directory
        });
    }

    async execute(options: TextDocumentShowOptions = {}): Promise<TextEditor | undefined> {
        if (options.preview === undefined) {
            const cfg = workspace.getConfiguration().get<Config>(extensionId);
            options.preview = cfg && cfg.openPreview;
        }
        return super.execute(options);
    }
}

export class RelatedQuickPick {
    static showProgress(placeHolder: string) {
        return showQuickPickProgress(placeHolder, undefined, true);
    }

    static async show(
        uris: Uri[],
        placeHolder: string,
        progressCancellation: CancellationTokenSource
    ): Promise<RelatedFileQuickPickItem | undefined> {
        const items = uris.map(uri => new RelatedFileQuickPickItem(uri));

        const scope = await Container.keyboard.beginScope();

        if (progressCancellation.token.isCancellationRequested) return undefined;

        progressCancellation.cancel();

        const pick = await window.showQuickPick(items, {
            matchOnDescription: true,
            placeHolder: placeHolder,
            onDidSelectItem: (item: QuickPickItem) => {
                void scope.setKeyCommand('right', item);
                if (typeof item.onDidSelect === 'function') {
                    item.onDidSelect();
                }
            }
        } as QuickPickOptions);

        await scope.dispose();

        return pick;
    }
}
