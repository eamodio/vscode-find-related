import type { CancellationToken, ConfigurationChangeEvent, GlobPattern, TextDocument } from 'vscode';
import { Disposable, RelativePattern, Uri, workspace } from 'vscode';
import type { RuleDefinition, Ruleset } from './config';
import type { Container } from './container';
import type { DynamicRule, IRule } from './rule';
import { isDynamicRule, Rule } from './rule';
import { union } from './system/array';
import { configuration } from './system/configuration';
import { Logger } from './system/logger';

const textDecoder = new TextDecoder('utf8');

interface RegisteredRuleset {
	name: string;
	rules: (DynamicRule | RuleDefinition)[];
}

export class RulesProvider implements Disposable {
	private readonly _disposable: Disposable;
	private readonly _builtinRulesets: Thenable<Ruleset[]>;
	private _registeredRulesets: RegisteredRuleset[] | undefined;
	private _rules: Promise<IRule[]>;

	constructor(private readonly container: Container) {
		this._builtinRulesets = workspace.fs
			.readFile(Uri.joinPath(this.container.context.extensionUri, './rulesets.json'))
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			.then(bytes => JSON.parse(textDecoder.decode(bytes)));

		this._disposable = Disposable.from(configuration.onDidChange(this.onConfigurationChanged, this));

		this._rules = this.compileRules();
	}

	dispose() {
		this._disposable?.dispose();
	}

	private onConfigurationChanged(e: ConfigurationChangeEvent): void {
		if (
			configuration.changed(e, 'applyRulesets') ||
			configuration.changed(e, 'applyWorkspaceRulesets') ||
			configuration.changed(e, 'rulesets') ||
			configuration.changed(e, 'workspaceRulesets')
		) {
			this._rules = this.compileRules();
		}
	}

	async provideRules(fileName: string): Promise<IRule[]> {
		return (await this._rules).filter(r => r.match(fileName));
	}

	*resolveRules(
		rules: IRule[],
		fileName: string,
		document: TextDocument,
		rootPath: string,
	): Iterable<Promise<Uri[]>> {
		for (const rule of rules) {
			yield* rule.provideRelated(fileName, document, rootPath);
		}
	}

	registerRuleset(name: string, rules: (DynamicRule | RuleDefinition)[]): Disposable {
		if (this._registeredRulesets == null) {
			this._registeredRulesets = [];
		}

		const ruleset: RegisteredRuleset = {
			name: name,
			rules: rules,
		};
		this._registeredRulesets.push(ruleset);

		this._rules = this.compileRules();

		return {
			dispose: () => {
				if (this._registeredRulesets != null) {
					const index = this._registeredRulesets.indexOf(ruleset);
					this._registeredRulesets.splice(index, 1);
				}
				this._rules = this.compileRules();
			},
		};
	}

	private async compileRules(): Promise<IRule[]> {
		const rulesets = await this._builtinRulesets;

		const rules: IRule[] = [];

		const cfg = configuration.getAll();
		if (cfg != null) {
			const applied = union(cfg.applyRulesets, cfg.applyWorkspaceRulesets);

			if (applied.length) {
				const userDefinedRulesets = cfg.rulesets ?? [];
				const workspaceDefinedRulesets = cfg.workspaceRulesets ?? [];
				for (const name of applied) {
					const ruleset =
						workspaceDefinedRulesets.find(_ => _.name === name) ??
						userDefinedRulesets.find(_ => _.name === name) ??
						rulesets.find(_ => _.name === name);
					if (!ruleset) continue;

					rules.push(...ruleset.rules.map(r => new Rule(r, ruleset.name)));
				}
			}
		}

		if (this._registeredRulesets?.length) {
			for (const ruleset of this._registeredRulesets) {
				rules.push(
					...ruleset.rules.map<IRule>(rule => {
						if (isDynamicRule(rule)) {
							return {
								match: rule.match,
								provideRelated: (fileName: string, document: TextDocument, rootPath: string) =>
									[rule.provideRelated(fileName, document, rootPath)] as Iterable<Promise<Uri[]>>,
							};
						}

						return new Rule(rule, ruleset.name);
					}),
				);
			}
		}

		if (!rules?.length) {
			Logger.warn('No active rulesets found');
		}

		return rules;
	}
}

export async function findFiles(
	pattern: string,
	rootPath: string,
	exclude?: GlobPattern | null | undefined,
	maxResults?: number,
	token?: CancellationToken,
): Promise<Uri[]> {
	Logger.log(`RulesProvider.findFiles(${pattern}, ${maxResults})`);

	const files = await workspace.findFiles(new RelativePattern(rootPath, pattern), exclude, maxResults, token);
	return files;
}

// private static getFindFilesExcludes(): string| undefined {
//     if (RulesProvider._excludes === undefined) {
//         const fileExclude = workspace.getConfiguration('files').get<{ [key: string]: boolean } | undefined>('exclude', undefined);
//         const searchExclude = workspace.getConfiguration('search').get<{ [key: string]: boolean } | undefined>('exclude', undefined);

//         if (fileExclude !== undefined || searchExclude !== undefined) {
//             const excludes: { [key: string]: boolean } = Object.create(null);
//             if (fileExclude !== undefined) {
//                 for (const [key, value] of Objects.entries(fileExclude)) {
//                     if (!value) continue;

//                     excludes[key] = true;
//                 }
//             }

//             if (searchExclude !== undefined) {
//                 for (const [key, value] of Objects.entries(searchExclude)) {
//                     if (!value) continue;

//                     excludes[key] = true;
//                 }
//             }

//             const patterns = Object.keys(excludes);
//             RulesProvider._excludes = (patterns.length > 0)
//                 ? `{${patterns.join(',')}}`
//                 : null;
//         }
//         else {
//             RulesProvider._excludes = null;
//         }

//         Logger.log(`excludes=${RulesProvider._excludes}`);
//     }

//     return RulesProvider._excludes !== null
//         ? RulesProvider._excludes
//         : undefined;
// }
