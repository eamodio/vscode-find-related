import type { ExtensionContext } from 'vscode';
import { ExtensionMode, Uri, window } from 'vscode';
import { fromOutputLevel } from './config';
import { Container } from './container';
import { Configuration, configuration } from './system/configuration';
import { Logger } from './system/logger';

export function activate(context: ExtensionContext) {
	Logger.configure(
		{
			name: 'Find Related',
			createChannel: function (name: string) {
				return window.createOutputChannel(name);
			},
			toLoggable: function (o: any) {
				if (o instanceof Uri) return `Uri(${o.toString(true)})`;
				return undefined;
			},
		},
		fromOutputLevel(configuration.get('outputLevel')),
		context.extensionMode === ExtensionMode.Development,
	);

	Configuration.configure(context);
	const container = Container.create(context);
	return container.api;
}

export function deactivate() {
	// nothing to do
}
