export const extensionPrefix = 'findrelated';
type StripPrefix<T extends string, S extends '.' | ':'> = T extends `${typeof extensionPrefix}${S}${infer U}`
	? U
	: never;

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

export type Commands = `${typeof extensionPrefix}.key.${Keys}` | `${typeof extensionPrefix}.show`;
export type CommandsUnqualified = StripPrefix<Commands, '.'>;

export type ContextKeys = `${typeof extensionPrefix}:key:${Keys}`;

export type CoreCommands = 'vscode.open' | 'setContext';

export const keys = [
	'left',
	'alt+left',
	'ctrl+left',
	'right',
	'alt+right',
	'ctrl+right',
	'alt+enter',
	'ctrl+enter',
	'escape',
] as const;
export type Keys = (typeof keys)[number];
