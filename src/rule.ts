import type { TextDocument, Uri } from 'vscode';
import type { RuleDefinition } from './config';
import { findFiles } from './rulesProvider';
import { configuration } from './system/configuration';
import { Logger } from './system/logger';
// import * as glob from 'glob';

const tokenReplacer = /(\$([0-9]))/g;

export interface DynamicRule {
	match(fileName: string): boolean;
	provideRelated(fileName: string, document: TextDocument, rootPath: string): Promise<Uri[]>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IRule {
	match(fileName: string): boolean;
	provideRelated(fileName: string, document: TextDocument, rootPath: string): Iterable<Promise<Uri[]>>;
}

export class Rule implements IRule, RuleDefinition {
	readonly pattern!: string;
	readonly locators!: string[];
	readonly matcher: RegExp;

	private _match: RegExpExecArray | null | undefined;

	constructor(rule: RuleDefinition, private rulesetName: string) {
		Object.assign(this, rule);
		try {
			this.matcher = new RegExp(rule.pattern, 'i');
		} catch (ex) {
			Logger.error(ex, `Rule(${this.rulesetName}).ctor`, ex, rule.pattern);

			throw ex;
		}
	}

	match(fileName: string): boolean {
		if (this.matcher === undefined) return false;

		try {
			this._match = this.matcher.exec(fileName);
			const matches = this._match != null && this._match.length > 0;
			Logger.log(`Rule(${this.rulesetName}).match(${fileName})=${matches}`, this.pattern);
			return matches;
		} catch (ex) {
			Logger.error(ex, 'Rule.match');
			return false;
		}
	}

	*provideRelated(fileName: string, document: TextDocument, rootPath: string): Iterable<Promise<Uri[]>> {
		const excludes = configuration.get('ignoreExcludes') ? null : undefined;

		for (const locator of this.locators) {
			if (this._match == null) continue;

			const globPattern = this.replaceTokens(locator, this._match);
			Logger.log(
				`Rule(${this.rulesetName}).provideRelated(${fileName}, ${rootPath})`,
				`globPattern=${globPattern}`,
			);
			// yield Rule.globAsync(globPattern, { cwd: rootPath, nocase: true });
			yield findFiles(globPattern, rootPath, excludes);
		}
	}

	private replaceTokens(pattern: string, ruleMatch: RegExpExecArray): string {
		return pattern.replace(tokenReplacer, (_match: string, _p1: string, p2: string) => ruleMatch[Number(p2)]);
	}

	// private static async globAsync(pattern: string, options?: glob.IOptions): Promise<Uri[]> {
	//     return new Promise<Uri[]>((resolve, reject) => {
	//         glob(pattern, options, (err: Error, matches: string[]) => {
	//             if (err) {
	//                 reject(err);
	//                 return;
	//             }
	//             resolve(matches.map(_ => Uri.file(_)));
	//         });
	//     });
	// }
}

export function isDynamicRule(rule: DynamicRule | RuleDefinition): rule is DynamicRule {
	return (
		typeof (rule as DynamicRule).match === 'function' && typeof (rule as DynamicRule).provideRelated === 'function'
	);
}
