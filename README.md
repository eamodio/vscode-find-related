[![](https://vsmarketplacebadge.apphb.com/version-short/eamodio.find-related.svg)](https://marketplace.visualstudio.com/items?itemName=eamodio.find-related)
[![](https://vsmarketplacebadge.apphb.com/downloads-short/eamodio.find-related.svg)](https://marketplace.visualstudio.com/items?itemName=eamodio.find-related)
[![](https://vsmarketplacebadge.apphb.com/rating-short/eamodio.find-related.svg)](https://marketplace.visualstudio.com/items?itemName=eamodio.find-related)
[![](https://img.shields.io/badge/vscode--dev--community-find--related--files-blue.svg?logo=slack&labelColor=555555)](https://vscode-slack.amod.io)

# Find Related Files

Finds files related to the current file based on user-defined configuration rules.

- Adds a `Show Related Files` command (`findrelated.show`) with a shortcut of `alt+r` to show a quick pick menu of files related to the active file

Basic support for the following languages/frameworks is [built-in](#built-in-rulesets):

- minified files
- c, c++, c#
- asp.net
- asp.net mvc
- aurelia
- xaml
- delphi

Please open new [Github issues](https://github.com/eamodio/vscode-find-related/issues) with any rules you'd like included in the built-in ruleset.

## Screenshot

![FindRelated screenshot](https://raw.githubusercontent.com/eamodio/vscode-find-related/master/images/screenshot.png)

---

## Built-in rulesets

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
    },
    {
        "name": "c/c++",
        "rules": [
            {
                "pattern": "(.*)\\.(?:c|cpp)$",
                "locators": ["$1.h"]
            },
            {
                "pattern": "(.*)\\.h$",
                "locators": ["{$1.c,$1.cpp}"]
            }
        ]
    },
    {
        "name": "csharp",
        "rules": [
            {
                "pattern": "(.*)\\.(?:cs|resx|settings)$",
                "locators": ["$1.designer.cs"]
            },
            {
                "pattern": "(.*)\\.designer\\.cs$",
                "locators": ["{$1.cs,$1.resx,$1.settings}"]
            }
        ]
    },
    {
        "name": "aspnet",
        "rules": [
            {
                "pattern": "(.*)\\.(?:aspx|ascx|asax|ashx|asmx)$",
                "locators": ["{$0.cs,$0.designer.cs}"]
            },
            {
                "pattern": "(.*)\\.(aspx|ascx|asax|ashx|asmx)(\\.designer)?(\\.cs)$",
                "locators": ["{$1.$2,$1$3$4}"]
            }
        ]
    },
    {
        "name": "aspnet-mvc",
        "rules": [
            {
                "pattern": "(.*)/views/(.*?)(?:/.*)?\\.cshtml$",
                "locators": ["$1/**/Controllers/**/$2Controller.cs"]
            },
            {
                "pattern": "(.*)/controllers/(.*)/?(.*)controller\\.cs$",
                "locators": ["$1/**/Views/**/$2/**/*.cshtml"]
            }
        ]
    },
    {
        "name": "aurelia",
        "rules": [
            {
                "pattern": "(.*)\\.html$",
                "locators": ["{$1.ts,$1.js}"]
            },
            {
                "pattern": "(.*)\\.(?:ts|js)$",
                "locators": ["$1.html"]
            }
        ]
    },
    {
        "name": "xaml",
        "rules": [
            {
                "pattern": "(.*)\\.xaml$",
                "locators": ["$1.xaml.cs"]
            },
            {
                "pattern": "(.*)\\.xaml\\.cs$",
                "locators": ["$1.xaml"]
            }
        ]
    },
    {
        "name": "delphi",
        "rules": [
            {
                "pattern": "(.*)\\.(?:dfm)$",
                "locators": [ "$1.pas" ]
            },
            {
                "pattern": "(.*)\\.pas$",
                "locators": [ "{$1.dfm}" ]
            },
            {
                "pattern": "(.*)\\.dproj$",
                "locators": [ "{$1.dpk,$1.dpr}" ]
            },
            {
                "pattern": "(.*)\\.(?:dpk|dpr)$",
                "locators": [ "$1.dproj" ]
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
let findRelated = extensions.getExtension('eamodio.find-related');
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
