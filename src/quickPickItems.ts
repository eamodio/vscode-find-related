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

    constructor(private cwd: string, private fileName: string) {
        super({
            label: `$(file-symlink-file) ${path.basename(fileName)}`,
            description: path.dirname(fileName)
        }, undefined, undefined);
    }

    async execute(preview: boolean = true): Promise<{}> {
        try {
            const uri = Uri.file(path.resolve(this.cwd, this.fileName));
            if (preview) {
                return commands.executeCommand(BuiltInCommands.Open, uri);
            }
            else {
                const document = await workspace.openTextDocument(uri);
                return await window.showTextDocument(document, 1);
            }
        }
        catch (ex) {
            Logger.error('OpenFileCommandQuickPickItem.execute', ex);
            return undefined;
        }
    }
}
