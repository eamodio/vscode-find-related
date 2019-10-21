'use strict';
import { ExtensionContext } from 'vscode';
import { Commands } from './commands';
import { Config, configuration } from './configuration';
import { FindRelatedApi } from './extensionApi';
import { Keyboard } from './keyboard';
import { RulesProvider } from './rulesProvider';

export class Container {
	static initialize(context: ExtensionContext, config: Config) {
		this._context = context;
		this._config = config;

		context.subscriptions.push((this._rulesProvider = new RulesProvider()));
		context.subscriptions.push((this._keyboard = new Keyboard()));
		context.subscriptions.push((this._commands = new Commands()));
		context.subscriptions.push((this._api = new FindRelatedApi()));
	}

	private static _api: FindRelatedApi;
	static get api() {
		return this._api;
	}

	private static _commands: Commands;
	static get commands() {
		return this._commands;
	}

	private static _config: Config | undefined;
	static get config() {
		if (this._config === undefined) {
			this._config = configuration.get<Config>();
		}
		return this._config;
	}

	private static _context: ExtensionContext;
	static get context() {
		return this._context;
	}

	private static _keyboard: Keyboard;
	static get keyboard() {
		return this._keyboard;
	}

	private static _rulesProvider: RulesProvider;
	static get rules() {
		return this._rulesProvider;
	}

	static resetConfig() {
		this._config = undefined;
	}
}
