'use strict';
import { ExtensionContext } from 'vscode';
import { Config, Configuration, configuration } from './configuration';
import { Container } from './container';
import { Logger } from './logger';

export async function activate(context: ExtensionContext) {
    Logger.configure(context);
    Configuration.configure(context);
    Container.initialize(context, configuration.get<Config>());

    return Container.api;
}

export function deactivate() {}
