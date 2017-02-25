'use strict';
import { commands, QuickPickItem, Uri, window, workspace } from 'vscode';
import { Commands } from './commands';
import { BuiltInCommands } from './constants';
import { Logger } from './logger';
import * as path from 'path';

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

    constructor(private uri: Uri, workspace: string) {
        super({
            label: `$(file-symlink-file) ${path.basename(uri.fsPath)}`,
            description: path.relative(workspace, path.dirname(uri.fsPath))
        }, undefined, undefined);
    }

    async execute(preview: boolean = true): Promise<{}> {
        try {
            if (preview) {
                return commands.executeCommand(BuiltInCommands.Open, this.uri);
            }
            else {
                const document = await workspace.openTextDocument(this.uri);
                return await window.showTextDocument(document, 1);
            }
        }
        catch (ex) {
            Logger.error('OpenFileCommandQuickPickItem.execute', ex);
            return undefined;
        }
    }
}
