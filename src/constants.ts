'use strict';
import { commands } from 'vscode';

export const extensionId = 'findrelated';
export const extensionOutputChannelName = 'FindRelated';
export const extensionQualifiedId = 'eamodio.find-related';

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
