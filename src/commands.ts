import type { TextDocument, TextDocumentShowOptions, TextEditor, Uri } from 'vscode';
import { commands, Disposable, ViewColumn, window, workspace } from 'vscode';
import { configuration } from './system/configuration';
import type { Container } from './container';
import { showRelatedPicker } from './quickPicks/relatedPicker';
import type { IRule } from './rule';
import type { Command } from './system/decorators/command';
import { createCommandDecorator } from './system/decorators/command';
import { Logger } from './system/logger';
import { basename, dirname, normalizePath } from './system/path';

const registrableCommands: Command[] = [];
const command = createCommandDecorator(registrableCommands);

export class Commands implements Disposable {
	private readonly _disposable: Disposable;

	constructor(private readonly container: Container) {
		this._disposable = Disposable.from(
			...registrableCommands.map(({ name, method }) =>
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				commands.registerCommand(name, (...args: any[]) => method.apply(this, args)),
			),
		);
	}

	dispose() {
		this._disposable?.dispose();
	}

	@command('show', { showErrorMessage: 'Unable to show related files. See output channel for more details' })
	async show() {
		const editor = window.activeTextEditor;
		if (editor?.document == null || editor.document.isUntitled) return undefined;

		const fileName = normalizePath(workspace.asRelativePath(editor.document.uri, false));

		const pick = await showRelatedPicker(
			this.container,
			async () => {
				const activeRules = await this.container.rules.provideRules(fileName);
				if (!activeRules.length) return [];

				const uris = await this.getRelatedFiles(activeRules, fileName, editor.document);
				return uris ?? [];
			},
			`Finding Related Files \u2022 ${basename(fileName)} \u00a0\u2022\u00a0 ${dirname(fileName)}`,
			`Select a related file to open`,
		);
		if (pick == null) return undefined;

		return pick.execute({ preview: configuration.get('openPreview') });
	}

	private async getRelatedFiles(
		rules: IRule[],
		fileName: string,
		document: TextDocument,
	): Promise<Uri[] | undefined> {
		const folder = workspace.getWorkspaceFolder(document.uri);
		if (folder == null) return undefined;

		const filesets = await Promise.allSettled(
			this.container.rules.resolveRules(rules, fileName, document, folder.uri.fsPath),
		);
		if (!filesets?.length) return undefined;

		const uris = new Set<Uri>();

		const current = document.uri.toString();

		for (const fileset of filesets) {
			if (fileset.status !== 'fulfilled') continue;

			for (const uri of fileset.value) {
				if (uri.toString() === current) continue;
				uris.add(uri);
			}
		}

		return uris.size !== 0 ? [...uris] : undefined;
	}
}

export async function openEditor(uri: Uri, options?: TextDocumentShowOptions): Promise<TextEditor | undefined> {
	try {
		const document = await workspace.openTextDocument(uri);
		return window.showTextDocument(document, {
			preserveFocus: false,
			preview: configuration.get('openPreview'),
			viewColumn: configuration.get('openSideBySide') ? ViewColumn.Beside : ViewColumn.Active,
			...options,
		});
	} catch (ex) {
		Logger.error(ex, 'openEditor');
		return undefined;
	}
}
