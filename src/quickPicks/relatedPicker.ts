import type { Disposable, QuickPickItem, TextDocumentShowOptions, TextEditor, Uri } from 'vscode';
import { window, workspace } from 'vscode';
import { openEditor } from '../commands';
import type { Container } from '../container';
import { configuration } from '../system/configuration';
import { basename, dirname } from '../system/path';
import { CommandQuickPickItem } from './common';

export class RelatedFileQuickPickItem extends CommandQuickPickItem {
	readonly uri: Uri;

	constructor(uri: Uri) {
		const directory = dirname(workspace.asRelativePath(uri));

		super(
			{
				label: `$(file-symlink-file) ${basename(uri.fsPath)}`,
				description: directory === '.' ? '' : directory,
			},
			undefined,
			undefined,
		);

		this.uri = uri;
	}

	onDidSelect(): Promise<object | undefined> {
		if (!configuration.get('autoPreview')) return Promise.resolve(undefined);

		return this.execute({
			preserveFocus: true,
			preview: true,
		});
	}

	override execute(options: TextDocumentShowOptions = {}): Promise<TextEditor | undefined> {
		return openEditor(this.uri, options);
	}
}

export async function showRelatedPicker(
	container: Container,
	uris: () => Promise<Uri[]>,
	title: string,
	placeholder: string,
): Promise<RelatedFileQuickPickItem | undefined> {
	const quickpick = window.createQuickPick<RelatedFileQuickPickItem | QuickPickItem>();

	quickpick.ignoreFocusOut = true;
	quickpick.title = title;
	quickpick.placeholder = placeholder;
	quickpick.matchOnDescription = true;
	quickpick.busy = true;
	quickpick.show();

	const scope = await container.keyboard.beginScope({
		right: {
			onDidPressKey: key => {
				if (quickpick.activeItems.length !== 0) {
					const item = quickpick.activeItems[0];
					if (item instanceof RelatedFileQuickPickItem) {
						void item.onDidPressKey(key);
					}
				}
			},
		},
	});

	const disposables: Disposable[] = [];

	try {
		// eslint-disable-next-line no-async-promise-executor
		const pick = await new Promise<RelatedFileQuickPickItem | QuickPickItem | undefined>(async resolve => {
			disposables.push(
				scope,
				quickpick.onDidHide(() => resolve(undefined)),
				quickpick.onDidAccept(() => {
					if (quickpick.activeItems.length !== 0) {
						resolve(quickpick.activeItems[0]);
					}
				}),
				quickpick,
			);

			const items: (RelatedFileQuickPickItem | QuickPickItem)[] = (await uris()).map(
				uri => new RelatedFileQuickPickItem(uri),
			);

			if (items.length === 0) {
				quickpick.items = [{ label: 'No related files found' }];
				quickpick.busy = false;
			} else if (items.length === 1 && configuration.get('autoOpen')) {
				resolve(items[0]);
			} else {
				quickpick.items = items;
				quickpick.busy = false;
			}
		});
		return pick instanceof RelatedFileQuickPickItem ? pick : undefined;
	} finally {
		disposables.forEach(d => void d.dispose());
	}
}
