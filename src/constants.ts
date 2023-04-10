export const extensionPrefix = 'findrelated';
type StripPrefix<Key extends string, Prefix extends string> = Key extends `${Prefix}${infer Rest}` ? Rest : never;

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

export type PaletteCommands = {
	'findrelated.show': [];
};

export type Commands = PaletteCommands & { [Key in `${typeof extensionPrefix}.key.${Keys}`]: [] };

export type UnqualifiedPaletteCommands = StripPrefix<keyof PaletteCommands, 'findrelated.'>;

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
