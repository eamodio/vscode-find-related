'use strict';

export const ExtensionId = 'find-related';
export const ExtensionKey = 'findrelated';
export const ExtensionOutputChannelName = 'FindRelated';
export const QualifiedExtensionId = `eamodio.${ExtensionId}`;

export type BuiltInCommands = 'vscode.open' | 'setContext';
export const BuiltInCommands = {
    Open: 'vscode.open' as BuiltInCommands,
    SetContext: 'setContext' as BuiltInCommands
};