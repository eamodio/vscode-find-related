'use strict';
import { Disposable, ExtensionContext } from 'vscode';
import { IDynamicRule, IRuleDefinition, RulesProvider } from './rulesProvider';

export class FindRelatedApi extends Disposable {

    constructor(context: ExtensionContext, private rulesProvider: RulesProvider) {
        super(() => this.dispose());
    }

    dispose() { }

    registerRuleset(name: string, rules: IRuleDefinition[]): Disposable;
    registerRuleset(name: string, rules: IDynamicRule[]): Disposable;
    registerRuleset(name: string, rules: (IDynamicRule | IRuleDefinition)[]): Disposable {
        return this.rulesProvider.registerRuleset(name, rules);
    }
}