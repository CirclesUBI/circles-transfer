# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 15-03-2023

### Added
- Included the number of steps needed for a transaction or the maximum transfers amount (even when the steps themselves are not included) [#17](https://github.com/CirclesUBI/circles-transfer/pull/17)

## [3.0.0] - 02-01-2023

### Added

- Replace the binary of the [pathfinder](https://github.com/chriseth/pathfinder) with the new version in [pathfinder2](https://github.com/chriseth/pathfinder2), which is written in rust and has new configuration parameters such as `hops`. [#14](https://github.com/CirclesUBI/circles-transfer/pull/14)

### Changed

- Update GH Actions [#14](https://github.com/CirclesUBI/circles-transfer/pull/14)

### Fixed

- Update dependencies [#14](https://github.com/CirclesUBI/circles-transfer/pull/4)

## [2.0.0] - 21-07-2022

### Added

- Create CHANGELOG.md file [#3](https://github.com/CirclesUBI/circles-transfer/pull/3)
- Create CODEOWNERS
- Create RELEASE.md

### Changed

- Move CI from travis to github actions [#4](https://github.com/CirclesUBI/circles-transfer/pull/4)
- Use node v14 in .nvmrc for GH Actions [#5](https://github.com/CirclesUBI/circles-transfer/pull/5)
- Update README.md [#7](https://github.com/CirclesUBI/circles-transfer/pull/7)
- Update pathfinder and import edges from csv [#9](https://github.com/CirclesUBI/circles-transfer/pull/9)

### Fixed

- Update dependencies [#9](https://github.com/CirclesUBI/circles-transfer/pull/9)

