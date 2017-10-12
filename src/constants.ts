'use strict';
import { commands } from 'vscode';

export const ExtensionId = 'find-related';
export const ExtensionKey = 'findrelated';
export const ExtensionOutputChannelName = 'FindRelated';
export const QualifiedExtensionId = `eamodio.${ExtensionId}`;

export enum BuiltInCommands {
    Open = 'vscode.open',
    SetContext = 'setContext'
}

export enum CommandContext {
    Key = 'findrelated:key'
}

export function setCommandContext(key: CommandContext | string, value: any) {
    return commands.executeCommand(BuiltInCommands.SetContext, key, value);
}
