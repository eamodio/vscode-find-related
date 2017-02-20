# Open Related Files

Opens files related to the current file based on configuration rules.

### Default rules
```
[
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
            "relativeTo": "file"ø
        }]
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
|`openrelated.rules`|Specifies the rules to find related files
|`openrelated.autoOpen`|Specifies whether to automatically open the related file if there is only 1 result
|`openrelated.openPreview`|Specifies whether or not to open the related file in a preview tab

## Known Issues

None
