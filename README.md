# Circles Transfer

<p>
  <a href="https://badge.fury.io/js/%40circles%2Ftransfer">
    <img src="https://badge.fury.io/js/%40circles%2Ftransfer.svg" alt="npm Version" height="18">
  </a>
  <a href="https://github.com/CirclesUBI/circles-transfer/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-APGLv3-orange.svg" alt="License" height="18">
  </a>
  <a href="https://travis-ci.com/CirclesUBI/circles-transfer">
    <img src="https://api.travis-ci.com/CirclesUBI/circles-transfer.svg?branch=main" alt="Build Status" height="18">
  </a>
  <a href="https://twitter.com/CirclesUBI">
    <img src="https://img.shields.io/twitter/follow/circlesubi.svg?label=follow+circles" alt="Follow Circles" height="18">
  </a>
</p>

Utility module for [Circles](https://joincircles.net) to find the [Maximum flow](https://en.wikipedia.org/wiki/Maximum_flow_problem) and necessary transitive transfer steps in a trust graph with multiple tokens.

For performance reasons this module uses the native [pathfinder](https://github.com/chriseth/pathfinder/) process by [chriseth](https://github.com/chriseth) to find the transfer steps.

## Requirements

- Node.js (tested with v12 and v14)

## Installation

```
# Make it a dependency
npm i @circles/transfer

# Copy the native pathfinder process into your project folder
cp ./node_modules/@circles/transfer/pathfinder ./pathfinder
```

## Usage

```js
import findTransitiveTransfer from '@circles/transfer';

// Define a weighted trust graph between trusted tokens. Each edge describes
// how much ("capacity") of what token ("token") can be sent from which node
// ("from") to which ("to").
//
// Store this json file somewhere (for example ./graph.json):
//
// [
//  {
//    from: '0x5534d2ba89ad1c01c186efafee7105dba071134a',
//    to: '0x83d878a6123efd548341b468f017af31d96b09b6',
//    token: '0x5534d2ba89ad1c01c186efafee7105dba071134a',
//    capacity: '10'
//  },
//  {
//    from: '0x83d878a6123efd548341b468f017af31d96b09b6',
//    to: '0xe08fe38204075884b5dbdcb0ddca0e033f9481a7',
//    token: '0x83d878a6123efd548341b468f017af31d96b09b6',
//    capacity: '7'
//  },
//  {
//    from: '0x83d878a6123efd548341b468f017af31d96b09b6',
//    to: '0xe08fe38204075884b5dbdcb0ddca0e033f9481a7',
//    token: '0xe08fe38204075884b5dbdcb0ddca0e033f9481a7',
//    capacity: '5'
//  },
//  ...
// ];

// Find required transfer steps to send tokens transitively between two nodes:
const { transferSteps, maxFlowValue } = await findTransitiveTransfer(
  {
    from: '0x5534d2ba89ad1c01c186efafee7105dba071134a',
    to: '0x29003579d2ca6d47c1860c4ed36656542a28f012',
    value: '5',
  },
  {
    edgesFile: './graph.json', // Path to graph file
    pathfinderExecutable: './pathfinder', // Path to `pathfinder` program
    timeout: 1000 * 5, // Stop process when it takes longer than x milliseconds
  },
);

// ... we get the maximum possible value. If transfer value is smaller it will
// be the same:
console.log(`Can send max. ${maxFlowValue}`);

// ... and finally the transfer steps:
transferSteps.forEach(({ step, from, to, value, token }) => {
  console.log(`${step}.: Send ${value} of ${token} from ${from} to ${to}`);
});
```

## Development

`circles-transfer` is a JavaScript module, tested with [Jest](https://jestjs.io/), transpiled with [Babel](https://babeljs.io/) and bundled with [Rollup](https://rollupjs.org).

```
// Install dependencies
npm install

// Run test suite
npm run test
npm run test:watch

// Check code formatting
npm run lint

// Build it!
npm run build
```

`pathfinder` is a C++ program by [chriseth](https://github.com/chriseth/pathfinder) compiled for Linux arm64 in this repository. Compile it for your own platform with the following steps and move the target into your project:

```
cmake .
make
```

## License

GNU Affero General Public License v3.0 `AGPL-3.0`
