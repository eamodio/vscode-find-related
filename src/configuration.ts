'use strict';
import { IRuleset } from './rules';

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