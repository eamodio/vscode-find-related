'use strict';
import { TraceLevel } from './logger';

export interface RuleDefinition {
	pattern: string;
	locators: string[];
}

export interface Ruleset {
	name: string;
	rules: RuleDefinition[];
}

export interface Config {
	applyRulesets: string[];
	applyWorkspaceRulesets: string[];
	autoOpen: boolean;
	autoPreview: boolean;
	ignoreExcludes: boolean;
	openPreview: boolean;
	openSideBySide: boolean;
	outputLevel: TraceLevel;
	rulesets: Ruleset[];
	workspaceRulesets: Ruleset[];
}
