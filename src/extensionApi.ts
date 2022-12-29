import type { Disposable } from 'vscode';
import type { RuleDefinition } from './configuration';
import type { Container } from './container';
import type { DynamicRule } from './rule';

export class FindRelatedApi implements Disposable {
	dispose() {
		// nothing to do
	}

	constructor(private readonly container: Container) {}

	registerRuleset(name: string, rules: RuleDefinition[]): Disposable;
	registerRuleset(name: string, rules: DynamicRule[]): Disposable;
	registerRuleset(name: string, rules: (DynamicRule | RuleDefinition)[]): Disposable {
		return this.container.rules.registerRuleset(name, rules);
	}
}
