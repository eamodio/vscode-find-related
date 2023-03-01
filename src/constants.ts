export const commandPrefix = 'findrelated';

export const enum CharCode {
	/**
	 * The `/` character.
	 */
	Slash = 47,
	/**
	 * The `\` character.
	 */
	Backslash = 92,
}

export const enum ContextKeys {
	KeyPrefix = 'findrelated:key',
}

export const enum CoreCommands {
	Open = 'vscode.open',
	SetContext = 'setContext',
}
