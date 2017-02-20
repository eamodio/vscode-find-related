'use strict';
import { commands, Disposable, TextEditor, TextEditorEdit } from 'vscode';

export type Commands = 'openrelated.show';
export const Commands = {
    Show: 'openrelated.show' as Commands
};

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