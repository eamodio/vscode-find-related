'use strict';
import { Arrays, Strings } from './system';
import { commands, Disposable, TextDocument, TextDocumentShowOptions, TextEditor, Uri, ViewColumn, window, workspace } from 'vscode';
import { configuration, ExtensionKey, IConfig } from './configuration';
import { Logger } from './logger';
import { RelatedQuickPick } from './quickPicks';
import { IRule, RulesProvider } from './rulesProvider';
import * as path from 'path';

interface CommandOptions {
    customErrorHandling?: boolean;
    showErrorMessage?: string;
}

interface Command {
    name: string;
    key: string;
    method: Function;
    options: CommandOptions;
}

const registry: Command[] = [];

function command(command: string, options: CommandOptions = {}): Function {
    return (target: any, key: string, descriptor: any) => {
        if (!(typeof descriptor.value === 'function')) throw new Error('not supported');

        let method;
        if (!options.customErrorHandling) {
            method = async function(this: any, ...args: any[]) {
                try {
                    return await descriptor.value.apply(this, args);
                }
                catch (ex) {
                    Logger.error(ex);

                    if (options.showErrorMessage) {
                        window.showErrorMessage(`${options.showErrorMessage} \u00a0\u2014\u00a0 ${ex.toString()}`);
                    }
                }
            };
        }
        else {
            method = descriptor.value;
        }

        registry.push({
            name: `${ExtensionKey}.${command}`,
            key: key,
            method: method,
            options: options
        });
    };
}

function defaultViewColumn(activeTextEditor: TextEditor | undefined): ViewColumn {
    let column: ViewColumn = (activeTextEditor && activeTextEditor.viewColumn) || ViewColumn.One;
    const cfg = configuration.get<IConfig>();
    if (cfg.openSideBySide) {
        column = column === ViewColumn.Three ? ViewColumn.One : column + 1;
    }
    return column;
}

export class Commands extends Disposable {

    private readonly _disposable: Disposable;

    constructor(
        private readonly rulesProvider: RulesProvider
    ) {
        super(() => this.dispose);

        this._disposable = Disposable.from(
            ...registry.map(({ name, key, method }) => commands.registerCommand(name, (...args: any[]) => method.apply(this, args)))
        );
    }

    dispose() {
        this._disposable && this._disposable.dispose();
    }

    @command('show', { showErrorMessage: 'Unable to show related files. See output channel for more details' })
    async show() {
        const editor = window.activeTextEditor;
        if (editor === undefined || editor.document === undefined || editor.document.isUntitled) return undefined;

        const fileName = Strings.normalizePath(workspace.asRelativePath(editor.document.fileName));

        const placeHolder = `files related to ${path.basename(fileName)} \u00a0\u2022\u00a0 ${path.dirname(fileName)}`;
        const progressCancellation = RelatedQuickPick.showProgress(placeHolder);
        try {
            const activeRules = this.rulesProvider.provideRules(fileName);
            if (activeRules.length === 0) return undefined;

            if (progressCancellation.token.isCancellationRequested) return undefined;

            const uris = await this.getRelatedFiles(activeRules, fileName, editor.document);
            if (uris === undefined || uris.length === 0) return undefined;

            if (progressCancellation.token.isCancellationRequested) return undefined;

            const cfg = configuration.get<IConfig>();
            if (uris.length === 1 && cfg.autoOpen) return await openEditor(uris[0], { preview: cfg.openPreview });

            const pick = await RelatedQuickPick.show(uris, placeHolder, progressCancellation);
            if (pick === undefined) return undefined;

            return await pick.execute({ preview: cfg.openPreview });
        }
        finally {
            progressCancellation && progressCancellation.cancel();
        }
    }

    private async getRelatedFiles(rules: IRule[], fileName: string, document: TextDocument): Promise<Uri[] | undefined> {
        const filesets = await Promise.all(this.rulesProvider.resolveRules(rules, fileName, document, workspace.rootPath));
        if (filesets === undefined || filesets.length === 0) return undefined;

        return Arrays.union(...filesets).filter(uri => uri.fsPath !== fileName);
    }
}

export async function openEditor(uri: Uri, options?: TextDocumentShowOptions): Promise<TextEditor | undefined> {
    try {
        const defaults: TextDocumentShowOptions = {
            preserveFocus: false,
            preview: true,
            viewColumn: defaultViewColumn(window.activeTextEditor)
        };

        const document = await workspace.openTextDocument(uri);
        return window.showTextDocument(document, { ...defaults, ...(options || {}) });
    }
    catch (ex) {
        Logger.error(ex, 'openEditor');
        return undefined;
    }
}
