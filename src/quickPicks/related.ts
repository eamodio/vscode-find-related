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
import { openEditor } from '../commands';
import { Container } from '../container';
import { Keys } from '../keyboard';
import { CommandQuickPickItem, QuickPickItem, showQuickPickProgress } from './common';

export class RelatedFileQuickPickItem extends CommandQuickPickItem {
    readonly uri: Uri;

    constructor(uri: Uri) {
        const directory = path.dirname(workspace.asRelativePath(uri));

        super(
            {
                label: `$(file-symlink-file) ${path.basename(uri.fsPath)}`,
                description: directory === '.' ? '' : directory
            },
            undefined,
            undefined
        );

        this.uri = uri;
    }

    onDidSelect(): Promise<{} | undefined> {
        if (!Container.config.autoPreview) return Promise.resolve(undefined);

        return this.execute({
            preserveFocus: true,
            preview: true
        });
    }

    onDidPressKey(key: Keys): Promise<{} | undefined> {
        return this.execute({
            preserveFocus: true,
            preview: false
        });
    }
    async execute(
        options: TextDocumentShowOptions & { openSideBySide?: boolean } = {}
    ): Promise<TextEditor | undefined> {
        if (options.openSideBySide === undefined) {
            options.openSideBySide = Container.config.openSideBySide;
        }
        if (options.preview === undefined) {
            options.preview = Container.config.openPreview;
        }

        return openEditor(this.uri, options);
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
