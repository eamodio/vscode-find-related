'use strict';
import { IRuleset } from './rulesProvider';

export enum OutputLevel {
    Silent = 'silent',
    Errors = 'errors',
    Verbose = 'verbose',
    Debug = 'debug'
}

export interface IConfig {
    applyRulesets: string[];
    applyWorkspaceRulesets: string[];
    autoOpen: boolean;
    autoPreview: boolean;
    debug: boolean;
    ignoreExcludes: boolean;
    openPreview: boolean;
    outputLevel: OutputLevel;
    rulesets: IRuleset[];
    workspaceRulesets: IRuleset[];
}
