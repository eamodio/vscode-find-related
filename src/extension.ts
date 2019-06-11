'use strict';
import { ExtensionContext } from 'vscode';
import { Config, Configuration, configuration } from './configuration';
import { Container } from './container';
import { Logger, TraceLevel } from './logger';

export function activate(context: ExtensionContext) {
    Logger.configure(context, configuration.get<TraceLevel>(configuration.name('outputLevel').value));
    Configuration.configure(context);
    Container.initialize(context, configuration.get<Config>());

    return Container.api;
}

export function deactivate() {
    // nothing to do
}
