'use strict';
import { commands, Disposable, TextDocumentShowOptions, TextEditor, TextEditorEdit, Uri, window, workspace } from 'vscode';
import { Logger } from '../logger';

export enum Commands {
    Show = 'findrelated.show'
}

export abstract class EditorCommand extends Disposable {

    private _disposable: Disposable;

    constructor(command: Commands) {
        super(() => this.dispose());
        this._disposable = commands.registerTextEditorCommand(command, this.execute, this);
    }

    dispose() {
        this._disposable && this._disposable.dispose();
    }

    abstract execute(editor: TextEditor, edit: TextEditorEdit, ...args: any[]): any;
}

export async function openEditor(uri: Uri, options?: TextDocumentShowOptions): Promise<TextEditor | undefined> {
    try {
        const defaults: TextDocumentShowOptions = {
            preserveFocus: false,
            preview: true,
            viewColumn: (window.activeTextEditor && window.activeTextEditor.viewColumn) || 1
        };

        const document = await workspace.openTextDocument(uri);
        return window.showTextDocument(document, { ...defaults, ...(options || {}) });
    }
    catch (ex) {
        Logger.error(ex, 'openEditor');
        return undefined;
    }
}