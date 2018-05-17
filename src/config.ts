import { TextDocument, Uri } from 'vscode';

'use strict';

export enum LogLevel {
    Silent = 'silent',
    Errors = 'errors',
    Verbose = 'verbose',
    Debug = 'debug'
}

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
    debug: boolean;
    ignoreExcludes: boolean;
    openPreview: boolean;
    openSideBySide: boolean;
    outputLevel: LogLevel;
    rulesets: Ruleset[];
    workspaceRulesets: Ruleset[];
}
