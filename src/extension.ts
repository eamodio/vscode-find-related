'use strict';
import { ExtensionContext } from 'vscode';
import { Configuration, configuration } from './configuration';
import { Container } from './container';
import { Logger } from './logger';

export function activate(context: ExtensionContext) {
	Logger.configure(context, configuration.get('outputLevel'));
	Configuration.configure(context);
	Container.initialize(context, configuration.get());

	return Container.api;
}

export function deactivate() {
	// nothing to do
}
