'use strict';

export type RelativeTo = 'file' | 'root';
export const RelativeTo = {
    File: 'file' as RelativeTo,
    Root: 'root' as RelativeTo
};

export interface IRelatedLocator {
    pattern: string;
    relativeTo: RelativeTo;
    path?: string;
}

export interface IRelatedRule {
    extension?: string;
    language?: string;
    locators: IRelatedLocator[];
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
    rules: IRelatedRule[];
    autoOpen: boolean;
    openPreview: boolean;
    advanced: IAdvancedConfig;
}