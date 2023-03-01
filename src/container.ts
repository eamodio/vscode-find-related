import type { ConfigurationChangeEvent, ExtensionContext } from 'vscode';
import { Commands } from './commands';
import { fromOutputLevel } from './config';
import { FindRelatedApi } from './extensionApi';
import { RulesProvider } from './rulesProvider';
import { configuration } from './system/configuration';
import { Keyboard } from './system/keyboard';
import { Logger } from './system/logger';

export class Container {
	static #instance: Container | undefined;
	static #proxy = new Proxy<Container>({} as Container, {
		get: function (target, prop) {
			// In case anyone has cached this instance
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			if (Container.#instance != null) return (Container.#instance as any)[prop];

			// Allow access to config before we are initialized
			if (prop === 'config') return configuration.getAll();

			// debugger;
			throw new Error('Container is not initialized');
		},
	});

	static create(context: ExtensionContext) {
		if (Container.#instance != null) throw new Error('Container is already initialized');

		Container.#instance = new Container(context);
		return Container.#instance;
	}

	static get instance(): Container {
		return Container.#instance ?? Container.#proxy;
	}

	private constructor(context: ExtensionContext) {
		this._context = context;

		context.subscriptions.splice(0, 0, (this._rulesProvider = new RulesProvider(this)));
		context.subscriptions.splice(0, 0, (this._keyboard = new Keyboard()));
		context.subscriptions.splice(0, 0, (this._api = new FindRelatedApi(this)));

		context.subscriptions.splice(0, 0, new Commands(this));
		context.subscriptions.splice(0, 0, configuration.onWillChange(this.onConfigurationChanging, this));
	}

	private _api: FindRelatedApi;
	get api() {
		return this._api;
	}

	private _context: ExtensionContext;
	get context() {
		return this._context;
	}

	private _keyboard: Keyboard;
	get keyboard() {
		return this._keyboard;
	}

	private _rulesProvider: RulesProvider;
	get rules() {
		return this._rulesProvider;
	}

	private onConfigurationChanging(e: ConfigurationChangeEvent) {
		if (configuration.changed(e, 'outputLevel')) {
			Logger.logLevel = fromOutputLevel(configuration.get('outputLevel'));
		}
	}
}
