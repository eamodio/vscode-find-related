'use strict';
import { OutputLevel } from './logger';
import { IRuleset } from './rulesProvider';

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