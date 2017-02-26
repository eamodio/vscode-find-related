# Find Related Files

Finds files related to the current file based on user-defined configuration rules.

Please open new [Github issues](https://github.com/eamodio/vscode-find-related/issues) with any rules you'd like included in the built-in ruleset.

## Screenshot

![FindRelated screenshot](https://raw.githubusercontent.com/eamodio/vscode-find-related/master/images/screenshot.png)

### Built-in rulesets
```
[
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
                "pattern": "(.*)\/views\/(.*?)(?:\/.*)?\\.cshtml$",
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
    }
]
```

`pattern` - specifies a regex pattern to which this rule applies; Capture groups can be used as replacements in the `locators`
`locators` - specifies the list of glob pattern locators that will be used to search for related files; `$[0-9]` can be use as replacement tokens from the capture groups in the `pattern`

## Features

- Provides command to show related files

## Extension Settings

|Name | Description
|-----|------------
|`findrelated.rulesets`|Defines rulesets that can be used find related files; Will be merged with `findrelated.workspaceRulesets` and built-in rulesets
|`findrelated.workspaceRulesets`|Defines workspace-specific rulesets that can be used find related files; Will be merged with `findrelated.rulesets` and built-in rulesets
|`findrelated.applyRulesets`|Specifies the rulesets to use to find related files
|`findrelated.applyWorkspaceRules`|Specifies the workspace-specific rulesets to use to find related files
|`findrelated.autoOpen`|Specifies whether to automatically open the related file if there is only 1 result
|`findrelated.openPreview`|Specifies whether or not to open the related file in a preview tab

## Known Issues

None
