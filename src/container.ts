import type { ConfigurationChangeEvent, ExtensionContext } from 'vscode';
import { Commands } from './commands';
import { configuration } from './configuration';
import { FindRelatedApi } from './extensionApi';
import { Keyboard } from './keyboard';
import { Logger } from './logger';
import { RulesProvider } from './rulesProvider';

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

		context.subscriptions.push((this._rulesProvider = new RulesProvider(this)));
		context.subscriptions.push((this._keyboard = new Keyboard()));
		context.subscriptions.push((this._api = new FindRelatedApi(this)));

		context.subscriptions.push(new Commands(this));
		context.subscriptions.push(configuration.onWillChange(this.onConfigurationChanging, this));
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
			Logger.logLevel = configuration.get('outputLevel');
		}
	}
}
