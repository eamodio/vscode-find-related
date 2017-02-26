'use strict';
import { ExtensionContext } from 'vscode';
import { FindRelatedApi } from './extensionApi';
import { RulesProvider } from './rulesProvider';
import { ShowRelatedCommand } from './showRelatedCommand';

// this method is called when your extension is activated
export async function activate(context: ExtensionContext) {
    const rulesProvider = new RulesProvider(context);
    context.subscriptions.push(rulesProvider);

    context.subscriptions.push(new ShowRelatedCommand(context, rulesProvider));

    const api = new FindRelatedApi(context, rulesProvider);
    context.subscriptions.push(api);
    return api;
}

// this method is called when your extension is deactivated
export function deactivate() { }