'use strict';

export type RelativeTo = 'file' | 'root';
export const RelativeTo = {
    File: 'file' as RelativeTo,
    Root: 'root' as RelativeTo
};

export interface IRuleLocator {
    pattern: string;
    relativeTo: RelativeTo;
    path?: string;
}

export interface IRule {
    extension?: string;
    language?: string;
    locators: IRuleLocator[];
}

export interface IRuleset {
    name: string;
    rules: IRule[];
}

export type OutputLevel = 'silent' | 'errors' | 'verbose';
export const OutputLevel = {
    Silent: 'silent' as OutputLevel,
    Errors: 'errors' as OutputLevel,
    Verbose: 'verbose' as OutputLevel
};

export interface IAdvancedConfig {
    debug: boolean;
    output: {
        level: OutputLevel;
    };
}

export interface IConfig {
    rulesets: IRuleset[];
    workspaceRulesets: IRuleset[];
    applyRulesets: string[];
    applyWorkspaceRulesets: string[];
    autoOpen: boolean;
    openPreview: boolean;
    advanced: IAdvancedConfig;
}