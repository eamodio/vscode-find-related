'use strict';
import { ExtensionContext } from 'vscode';
import { ShowRelatedCommand } from './commands';
import { FindRelatedApi } from './extensionApi';
import { Keyboard } from './keyboard';
import { Logger } from './logger';
import { RulesProvider } from './rulesProvider';

// this method is called when your extension is activated
export async function activate(context: ExtensionContext) {
    Logger.configure(context);

    const rulesProvider = new RulesProvider(context);
    context.subscriptions.push(rulesProvider);

    context.subscriptions.push(new Keyboard());
    context.subscriptions.push(new ShowRelatedCommand(context, rulesProvider));

    const api = new FindRelatedApi(context, rulesProvider);
    context.subscriptions.push(api);
    return api;
}

// this method is called when your extension is deactivated
export function deactivate() { }