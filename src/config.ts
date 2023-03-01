import { LogLevel } from './system/logger.constants';

export interface RuleDefinition {
	pattern: string;
	locators: string[];
}

export interface Ruleset {
	name: string;
	rules: RuleDefinition[];
}

export enum OutputLevel {
	Silent = 'silent',
	Errors = 'errors',
	Verbose = 'verbose',
	Debug = 'debug',
}

export interface Config {
	applyRulesets: string[];
	applyWorkspaceRulesets: string[];
	autoOpen: boolean;
	autoPreview: boolean;
	ignoreExcludes: boolean;
	openPreview: boolean;
	openSideBySide: boolean;
	outputLevel: OutputLevel;
	rulesets: Ruleset[];
	workspaceRulesets: Ruleset[];
}

export function fromOutputLevel(level: LogLevel | OutputLevel): LogLevel {
	switch (level) {
		case OutputLevel.Silent:
			return LogLevel.Off;
		case OutputLevel.Errors:
			return LogLevel.Error;
		case OutputLevel.Verbose:
			return LogLevel.Info;
		case OutputLevel.Debug:
			return LogLevel.Debug;
		default:
			return level;
	}
}
