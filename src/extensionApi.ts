'use strict';
import { Disposable } from 'vscode';
import { RuleDefinition } from './configuration';
import { Container } from './container';
import { DynamicRule } from './rulesProvider';

export class FindRelatedApi implements Disposable {
	dispose() {
		// nothing to do
	}

	registerRuleset(name: string, rules: RuleDefinition[]): Disposable;
	registerRuleset(name: string, rules: DynamicRule[]): Disposable;
	registerRuleset(name: string, rules: (DynamicRule | RuleDefinition)[]): Disposable {
		return Container.rules.registerRuleset(name, rules);
	}
}
