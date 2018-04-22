# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.7.0] - 2018-04-22
### Added
- Adds `findrelated.autoPreview` setting to specify whether to automatically preview related files upon selection &mdash; closes [#6](https://github.com/eamodio/vscode-find-related/issues/6)
- Adds `findrelated.ignoreExcludes` setting to specify whether to ignore file excludes when searching for related files &mdash; closes [#9](https://github.com/eamodio/vscode-find-related/issues/9)

## [0.6.0] - 2017-10-12
### Added
- Adds exclude patterns (using `files.exclude` & `search.exclude` settings) to the file search to improve performance -- Attempts to address [#2](https://github.com/eamodio/vscode-find-related/issues/2)
- Adds slack chat badge

## [0.5.0] - 2017-05-07
### Added
- Adds preview of editors when selecting (highlighting) an item in the quick pick menu

### Changed
- Changes to use the supported vscode api for opening editors

## [0.4.2] - 2017-04-23
### Fixed
- Fixes marketplace badge layout

## [0.4.1] - 2017-04-22
### Changed
- Renames `findrelated.advanced.debug` setting to `findrelated.debug`
- Renames `findrelated.output.level` setting to `findrelated.outputLevel`

## [0.4.0] - 2017-04-16
### Added
- Adds `alt+right arrow` shortcut to open related files in the quick pick menu without closing the quick pick menu

### Removed
- Removes Marketplace `Preview` label

## [0.3.5] - 2017-03-05
### Fixed
- Fixes issue with output channel logging

## [0.3.4] - 2017-02-28
### Changed
- Opens related files in the same editor group as the current editor

## [0.3.3] - 2017-02-26
### Removed
- Removes unused dependencies and code

### Fixed
- Fixes logging to clean up on extension deactivate

## [0.3.2] - 2017-02-26
### Added
- Adds an extension API that can be used to expand Find Related File's capabilities
- Adds c/c++ ruleset

## [0.2.0] - 2017-02-25
### Changed
- Dramatic performance improvement with file searches

## [0.1.2] - 2017-02-22
### Added
- Adds a screenshot to the marketplace description

### Changed
- Updates the minified files ruleset

## [0.1.1] - 2017-02-22
### Added
- Adds minified files ruleset

### Removed
- Removes the current file from the result set if found

### Fixed
- Fixes issues on Windows

## [0.1.0] - 2017-02-22
### Added
- Adds new rulesets for csharp, aspnet, and aspnet mvc

### Changed
- Complete rework around regex and regex replacement, rather than extensions

## [0.0.3] - 2017-02-20
### Added
- Initial release