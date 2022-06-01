'use strict';
import * as path from 'path';
import {
	commands,
	Disposable,
	TextDocument,
	TextDocumentShowOptions,
	TextEditor,
	Uri,
	ViewColumn,
	window,
	workspace
} from 'vscode';
import { Container } from './container';
import { Logger } from './logger';
import { RelatedQuickPick } from './quickPicks';
import { IRule } from './rule';
import { Arrays, Command, createCommandDecorator, Strings } from './system';

const commandRegistry: Command[] = [];
const command = createCommandDecorator(commandRegistry);

export class Commands implements Disposable {
	private readonly _disposable: Disposable;

	constructor() {
		this._disposable = Disposable.from(
			...commandRegistry.map(({ name, key, method }) =>
				commands.registerCommand(name, (...args: any[]) => method.apply(this, args))
			)
		);
	}

	dispose() {
		this._disposable && this._disposable.dispose();
	}

	@command('show', { showErrorMessage: 'Unable to show related files. See output channel for more details' })
	async show() {
		const editor = window.activeTextEditor;
		if (editor === undefined || editor.document === undefined || editor.document.isUntitled) return undefined;

		const fileName = Strings.normalizePath(workspace.asRelativePath(editor.document.fileName, false));

		const placeHolder = `files related to ${path.basename(fileName)} \u00a0\u2022\u00a0 ${path.dirname(fileName)}`;
		const progressCancellation = RelatedQuickPick.showProgress(placeHolder);
		try {
			const activeRules = Container.rules.provideRules(fileName);
			if (activeRules.length === 0) return undefined;

			if (progressCancellation.token.isCancellationRequested) return undefined;

			const uris = await this.getRelatedFiles(activeRules, fileName, editor.document);
			if (uris === undefined || uris.length === 0) return undefined;

			if (progressCancellation.token.isCancellationRequested) return undefined;

			const cfg = Container.config;
			if (cfg.autoOpen && uris.length === 1) {
				return await openEditor(uris[0], {
					preview: cfg.openPreview,
					openSideBySide: cfg.openSideBySide
				});
			}

			const pick = await RelatedQuickPick.show(uris, placeHolder, progressCancellation);
			if (pick === undefined) return undefined;

			return await pick.execute({ preview: cfg.openPreview });
		} finally {
			progressCancellation && progressCancellation.cancel();
		}
	}

	private async getRelatedFiles(
		rules: IRule[],
		fileName: string,
		document: TextDocument
	): Promise<Uri[] | undefined> {
		const folder = workspace.getWorkspaceFolder(document.uri);
		if (folder === undefined) return undefined;

		const filesets = await Promise.all(Container.rules.resolveRules(rules, fileName, document, folder.uri.fsPath));
		if (filesets === undefined || filesets.length === 0) return undefined;

		return Arrays.union(...filesets).filter(uri => uri.fsPath !== fileName);
	}
}

function findAlreadyOpenInOtherColumn(uri: Uri) {
	const uriString = uri.toString();
	const activeViewColumn = window.activeTextEditor && window.activeTextEditor.viewColumn;
	const tabGroup = window.tabGroups.all.find(
		(tg) =>
			tg.viewColumn !== activeViewColumn &&
			tg.tabs.some(
				(tab) => {
					const tabInput = tab.input;
					const uri = typeof tabInput === 'object' && tabInput && (tabInput as { uri?: unknown }).uri;
					return uri instanceof Uri && uri.toString() === uriString;
				}
			)
	);
	return tabGroup && tabGroup.viewColumn;
}

export async function openEditor(
	uri: Uri,
	options?: TextDocumentShowOptions & { openSideBySide?: boolean }
): Promise<TextEditor | undefined> {
	const { openSideBySide = false, ...opts } = options || {};

	try {
		const defaults: TextDocumentShowOptions = {
			preserveFocus: false,
			preview: true,
			viewColumn: openSideBySide
				? findAlreadyOpenInOtherColumn(uri) || ViewColumn.Beside
				: (window.activeTextEditor && window.activeTextEditor.viewColumn) || ViewColumn.One
		};

		const document = await workspace.openTextDocument(uri);
		return window.showTextDocument(document, { ...defaults, ...opts });
	} catch (ex) {
		Logger.error(ex, 'openEditor');
		return undefined;
	}
}
