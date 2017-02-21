'use strict';
import { ExtensionContext } from 'vscode';
import { ShowRelatedCommand } from './showRelatedCommand';

// this method is called when your extension is activated
export async function activate(context: ExtensionContext) {
    context.subscriptions.push(new ShowRelatedCommand(context));
}

// this method is called when your extension is deactivated
export function deactivate() { }