'use strict';
import { ExtensionContext } from 'vscode';
import { Commands } from './commands';
import { FindRelatedApi } from './extensionApi';
import { Keyboard } from './keyboard';
import { Logger } from './logger';
import { RulesProvider } from './rulesProvider';

export async function activate(context: ExtensionContext) {
    Logger.configure(context);

    const rulesProvider = new RulesProvider(context);
    context.subscriptions.push(rulesProvider);

    context.subscriptions.push(new Keyboard());
    context.subscriptions.push(new Commands(rulesProvider));

    const api = new FindRelatedApi(context, rulesProvider);
    context.subscriptions.push(api);
    return api;
}

export function deactivate() { }
