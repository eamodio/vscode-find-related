'use strict';
import { CancellationTokenSource, commands, Disposable, QuickPickItem, QuickPickOptions, Uri, window, workspace } from 'vscode';
import { Commands, Keyboard, KeyboardScope, KeyMapping, openEditor } from '../commands';
import * as path from 'path';

export function showQuickPickProgress(message: string, mapping?: KeyMapping, delay: boolean = false): CancellationTokenSource {
    const cancellation = new CancellationTokenSource();

    if (delay) {
        let disposable: Disposable;
        const timer = setTimeout(() => {
            disposable && disposable.dispose();
            _showQuickPickProgress(message, cancellation, mapping);
        }, 250);
        disposable = cancellation.token.onCancellationRequested(() => clearTimeout(timer));
    }
    else {
        _showQuickPickProgress(message, cancellation, mapping);
    }

    return cancellation;
}

async function _showQuickPickProgress(message: string, cancellation: CancellationTokenSource, mapping?: KeyMapping) {
        // Logger.log(`showQuickPickProgress`, `show`, message);

        const scope: KeyboardScope = mapping && await Keyboard.instance.beginScope(mapping);

        try {
            await window.showQuickPick(_getInfiniteCancellablePromise(cancellation), {
                placeHolder: message
            } as QuickPickOptions, cancellation.token);
        }
        catch (ex) {
            // Not sure why this throws
        }
        finally {
            // Logger.log(`showQuickPickProgress`, `cancel`, message);

            cancellation.cancel();
            scope && scope.dispose();
        }
}

function _getInfiniteCancellablePromise(cancellation: CancellationTokenSource) {
    return new Promise((resolve, reject) => {
        const disposable = cancellation.token.onCancellationRequested(() => {
            disposable.dispose();
            resolve([]);
        });
    });
}

export class CommandQuickPickItem implements QuickPickItem {

    label: string;
    description: string;
    detail: string;

    constructor(item: QuickPickItem, protected command: Commands, protected args?: any[]) {
        Object.assign(this, item);
    }

    execute(): Thenable<{}> {
        return commands.executeCommand(this.command, ...(this.args || []));
    }
}

export class OpenFileCommandQuickPickItem extends CommandQuickPickItem {

    label: string;
    description: string;
    detail: string;

    constructor(private uri: Uri) {
        super({
            label: `$(file-symlink-file) ${path.basename(uri.fsPath)}`,
            description: workspace.asRelativePath(path.dirname(uri.fsPath))
        }, undefined, undefined);
    }

    async execute(pinned: boolean = true): Promise<{}> {
        return await openEditor(this.uri, pinned);
    }
}
