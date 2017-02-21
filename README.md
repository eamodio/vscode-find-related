# Find Related Files

Finds files related to the current file based on user-defined configuration rules.

### Built-in rulesets
```
[
    {
        "name": "aurelia",
        "rules": [
            {
                "language": "html",
                "extension": ".html",
                "locators": [{
                    "pattern": "$(file).ts",
                    "relativeTo": "file"
                },
                {
                    "pattern": "$(file).js",
                    "relativeTo": "file"
                }]
            },
            {
                "language": "typescript",
                "extension": ".ts",
                "locators": [{
                    "pattern": "$(file).html",
                    "relativeTo": "file"
                }]
            },
            {
                "language": "javascript",
                "extension": ".js",
                "locators": [{
                    "pattern": "$(file).html",
                    "relativeTo": "file"
                }]
            }
        ]
    }
]
```

`pattern` is a glob pattern
`$(file)` is a token replacement for the active file without its extension

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
