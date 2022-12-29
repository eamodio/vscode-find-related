import type { QuickPickItem } from 'vscode';
import { commands } from 'vscode';
import type { Keys } from '../keyboard';

declare module 'vscode' {
	interface QuickPickItem {
		onDidSelect?(): void;
		onDidPressKey?(key: Keys): Promise<void>;
	}
}

// export function showQuickPickProgress(
// 	message: string,
// 	mapping?: KeyMapping,
// 	delay: boolean = false,
// ): CancellationTokenSource {
// 	const cancellation = new CancellationTokenSource();

// 	if (delay) {
// 		// eslint-disable-next-line prefer-const
// 		let disposable: Disposable;
// 		const timer = setTimeout(() => {
// 			disposable?.dispose();
// 			void _showQuickPickProgress(message, cancellation, mapping);
// 		}, 250);
// 		disposable = cancellation.token.onCancellationRequested(() => clearTimeout(timer));
// 	} else {
// 		void _showQuickPickProgress(message, cancellation, mapping);
// 	}

// 	return cancellation;
// }

// async function _showQuickPickProgress(message: string, cancellation: CancellationTokenSource, mapping?: KeyMapping) {
// 	const scope = mapping && (await Container.keyboard.beginScope(mapping));

// 	try {
// 		await window.showQuickPick(
// 			_getInfiniteCancellablePromise(cancellation),
// 			{
// 				placeHolder: message,
// 			},
// 			cancellation.token,
// 		);
// 	} catch (ex) {
// 		// Not sure why this throws
// 	} finally {
// 		cancellation.cancel();
// 		scope?.dispose();
// 	}
// }

// function _getInfiniteCancellablePromise(cancellation: CancellationTokenSource) {
// 	return new Promise<QuickPickItem[]>((resolve, reject) => {
// 		const disposable = cancellation.token.onCancellationRequested(() => {
// 			disposable.dispose();
// 			resolve([]);
// 		});
// 	});
// }

export class CommandQuickPickItem<Arguments extends any[] = any[]> implements QuickPickItem {
	static fromCommand<T>(label: string, command: string, args?: T): CommandQuickPickItem;
	static fromCommand<T>(item: QuickPickItem, command: string, args?: T): CommandQuickPickItem;
	static fromCommand<T>(labelOrItem: string | QuickPickItem, command: string, args?: T): CommandQuickPickItem {
		return new CommandQuickPickItem(
			typeof labelOrItem === 'string' ? { label: labelOrItem } : labelOrItem,
			command,
			args == null ? [] : [args],
		);
	}

	static is(item: QuickPickItem): item is CommandQuickPickItem {
		return item instanceof CommandQuickPickItem;
	}

	label!: string;
	description?: string;
	detail?: string | undefined;

	constructor(
		label: string,
		command?: string,
		args?: Arguments,
		options?: {
			onDidPressKey?: (key: Keys, result: Thenable<unknown>) => void;
			suppressKeyPress?: boolean;
		},
	);
	constructor(
		item: QuickPickItem,
		command?: string,
		args?: Arguments,
		options?: {
			onDidPressKey?: (key: Keys, result: Thenable<unknown>) => void;
			suppressKeyPress?: boolean;
		},
	);
	constructor(
		labelOrItem: string | QuickPickItem,
		command?: string,
		args?: Arguments,
		options?: {
			onDidPressKey?: (key: Keys, result: Thenable<unknown>) => void;
			suppressKeyPress?: boolean;
		},
	);
	constructor(
		labelOrItem: string | QuickPickItem,
		protected readonly command?: string,
		protected readonly args?: Arguments,
		protected readonly options?: {
			// onDidExecute?: (
			// 	options: { preserveFocus?: boolean; preview?: boolean } | undefined,
			// 	result: Thenable<unknown>,
			// ) => void;
			onDidPressKey?: (key: Keys, result: Thenable<unknown>) => void;
			suppressKeyPress?: boolean;
		},
	) {
		this.command = command;
		this.args = args;

		if (typeof labelOrItem === 'string') {
			this.label = labelOrItem;
		} else {
			Object.assign(this, labelOrItem);
		}
	}

	execute(_options?: { preserveFocus?: boolean; preview?: boolean }): Promise<unknown | undefined> {
		if (this.command === undefined) return Promise.resolve(undefined);

		const result = commands.executeCommand(this.command, ...(this.args ?? [])) as Promise<unknown | undefined>;
		// this.options?.onDidExecute?.(options, result);
		return result;
	}

	async onDidPressKey(key: Keys): Promise<void> {
		if (this.options?.suppressKeyPress) return;

		const result = this.execute({ preserveFocus: true, preview: false });
		this.options?.onDidPressKey?.(key, result);
		void (await result);
	}
}
