'use strict';
import { Objects } from './system';
import { OutputChannel, window, workspace } from 'vscode';
import { IAdvancedConfig, OutputLevel } from './configuration';

let config: IAdvancedConfig;
let output: OutputChannel;

workspace.onDidChangeConfiguration(onConfigurationChange);
onConfigurationChange();

function onConfigurationChange() {
    const cfg = workspace.getConfiguration('openrelated').get<IAdvancedConfig>('advanced');

    if (!Objects.areEquivalent(cfg.output, config && config.output)) {
        if (cfg.output.level === OutputLevel.Silent) {
            output && output.dispose();
        }
        else if (!output) {
            output = window.createOutputChannel('OpenRelated');
        }
    }

    config = cfg;
}

export class Logger {

    static log(message?: any, ...params: any[]): void {
        if (config.debug) {
            console.log('[OpenRelated]', message, ...params);
        }

        if (config.output.level === OutputLevel.Verbose) {
            output.appendLine([message, ...params].join(' '));
        }
    }

    static error(message?: any, ...params: any[]): void {
        if (config.debug) {
            console.error('[OpenRelated]', message, ...params);
        }

        if (config.output.level !== OutputLevel.Silent) {
            output.appendLine([message, ...params].join(' '));
        }
    }

    static warn(message?: any, ...params: any[]): void {
        if (config.debug) {
            console.warn('[OpenRelated]', message, ...params);
        }

        if (config.output.level !== OutputLevel.Silent) {
            output.appendLine([message, ...params].join(' '));
        }
    }
}
