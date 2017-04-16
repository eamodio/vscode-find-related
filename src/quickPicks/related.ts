'use strict';
import { CancellationTokenSource, QuickPickItem, QuickPickOptions, Uri, window } from 'vscode';
import { Keyboard } from '../commands';
import { OpenFileCommandQuickPickItem, showQuickPickProgress } from './common';

export class RelatedQuickPick {

    static showProgress(placeHolder: string) {
        return showQuickPickProgress(placeHolder, undefined, true);
    }

    static async show(uris: Uri[], placeHolder: string, progressCancellation: CancellationTokenSource): Promise<OpenFileCommandQuickPickItem | undefined> {
        const items = uris.map(uri => new OpenFileCommandQuickPickItem(uri));

        const scope = await Keyboard.instance.beginScope();

        if (progressCancellation.token.isCancellationRequested) return undefined;

        progressCancellation.cancel();

        const pick = await window.showQuickPick(items, {
                matchOnDescription: true,
                placeHolder: placeHolder,
                onDidSelectItem: (item: QuickPickItem) => {
                    scope.setKeyCommand('right', item);
                }
            } as QuickPickOptions);

        await scope.dispose();

        return pick;
    }
}