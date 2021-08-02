[![](https://vsmarketplacebadges.dev/version-short/amodio.find-related.svg)](https://marketplace.visualstudio.com/items?itemName=amodio.find-related)
[![](https://vsmarketplacebadges.dev/downloads-short/amodio.find-related.svg)](https://marketplace.visualstudio.com/items?itemName=amodio.find-related)
[![](https://vsmarketplacebadges.dev/rating-short/amodio.find-related.svg)](https://marketplace.visualstudio.com/items?itemName=amodio.find-related)
[![](https://img.shields.io/badge/vscode--dev--community-find--related--files-blue.svg?logo=slack&labelColor=555555)](https://vscode-slack.amod.io)

# Find Related Files

Finds files related to the current file based on user-defined configuration rules.

- Adds a `Show Related Files` command (`findrelated.show`) with a shortcut of `alt+r` to show a quick pick menu of files related to the active file

Basic support for the following languages/frameworks is [built-in](#built-in-rulesets):

- minified CSS/JS files
- C, C++, C#
- ASP.NET
- ASP.NET MVC
- Aurelia
- Delphi
- Elixir
- Phoenix framework
- XAML

Please open new [Github issues](https://github.com/eamodio/vscode-find-related/issues) with any rules you'd like included in the built-in ruleset.

## Screenshot

![FindRelated screenshot](https://raw.githubusercontent.com/eamodio/vscode-find-related/master/images/screenshot.png)

---

## Example ruleset

```
[
	{
		"name": "minified",
		"rules": [
			{
				"pattern": "(.*?)(\\.min)?\\.(js|css)(?:\\.map)?$",
				"locators": ["{$1.$3,$1.min.$3,$1.$3.map,$1.min.$3.map}"]
			}
		]
	}
]
```

`pattern` - specifies a regex pattern to which this rule applies; Capture groups can be used as replacements in the `locators`
`locators` - specifies the list of glob pattern locators that will be used to search for related files; `$[0-9]` can be use as replacement tokens from the capture groups in the `pattern`

---

## Extension Settings

| Name                              | Description                                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `findrelated.rulesets`            | Defines rulesets that can be used find related files; Will be merged with `findrelated.workspaceRulesets` and built-in rulesets           |
| `findrelated.workspaceRulesets`   | Defines workspace-specific rulesets that can be used find related files; Will be merged with `findrelated.rulesets` and built-in rulesets |
| `findrelated.applyRulesets`       | Specifies the rulesets to use to find related files                                                                                       |
| `findrelated.applyWorkspaceRules` | Specifies the workspace-specific rulesets to use to find related files                                                                    |
| `findrelated.autoOpen`            | Specifies whether to automatically open the related file if there is only 1 result                                                        |
| `findrelated.autoPreview`         | Specifies whether to automatically preview related files upon selection                                                                   |
| `findrelated.ignoreExcludes`      | Specifies whether to ignore file excludes when searching for related files                                                                |
| `findrelated.openPreview`         | Specifies whether or not to open the related file in a preview tab                                                                        |
| `findrelated.openSideBySide`      | Specifies whether to open the related file to the side                                                                                    |
| `findrelated.outputLevel`         | Specifies how much (if any) output will be sent to the FindRelated output channel                                                         |

---

## Extension API

Find Related Files exports an API that can be used to expand its capabilities.

#### Example

```
let findRelated = extensions.getExtension('amodio.find-related');
let api = findRelated.exports;

let subscription1 = api.registerRuleset('static-rule', [
	{
		pattern: /* string -- regex pattern here */,
		locators: [/* string -- glob patterns here */]
	}
]);

let subscription2 = api.registerRuleset('dynamic-rule', [
	{
		match: (fileName: string) => /* matching logic here -- return a boolean */,
		provideRelated: (fileName: string, document: TextDocument, rootPath: string) => {
			return Promise.resolve([/* related uris here */]);
		}
	}
]);

// To remove a registered ruleset, just dispose its subscription
subscription1.dispose();
subscription2.dispose();
```

---

## Contributors &#x1F64F;&#x2764;

A big thanks to the people that have contributed to this project:

- Alessandro Fragnani ([@alefragnani](https://github.com/alefragnani)) &mdash; [contributions](https://github.com/eamodio/vscode-find-related/commits?author=alefragnani)
