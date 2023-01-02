<div align="center">
	<img width="80" src="https://raw.githubusercontent.com/CirclesUBI/.github/main/assets/logo.svg" />
</div>

<h1 align="center">circles-transfer</h1>

<div align="center">
 <strong>
   Find maximum flow and transitive transfer steps in a trust graph 
 </strong>
</div>

<br />

<div align="center">
  <!-- npm -->
  <a href="https://www.npmjs.com/package/@circles/transfer">
    <img src="https://img.shields.io/npm/v/@circles/transfer?style=flat-square&color=%23f14d48" height="18">
  </a>
  <!-- Licence -->
  <a href="https://github.com/CirclesUBI/circles-transfer/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/CirclesUBI/circles-transfer?style=flat-square&color=%23cc1e66" alt="License" height="18">
  </a>
  <!-- CI status -->
  <a href="https://github.com/CirclesUBI/circles-transfer/actions/workflows/run-tests.yml">
    <img src="https://img.shields.io/github/workflow/status/CirclesUBI/circles-transfer/Node.js%20CI?label=tests&style=flat-square&color=%2347cccb" alt="CI Status" height="18">
  </a>
  <!-- Discourse -->
  <a href="https://aboutcircles.com/">
    <img src="https://img.shields.io/discourse/topics?server=https%3A%2F%2Faboutcircles.com%2F&style=flat-square&color=%23faad26" alt="chat" height="18"/>
  </a>
  <!-- Twitter -->
  <a href="https://twitter.com/CirclesUBI">
    <img src="https://img.shields.io/twitter/follow/circlesubi.svg?label=twitter&style=flat-square&color=%23f14d48" alt="Follow Circles" height="18">
  </a>
</div>

<div align="center">
  <h3>
    <a href="https://handbook.joincircles.net">
      Handbook
    </a>
    <span> | </span>
    <a href="https://github.com/CirclesUBI/circles-transfer/releases">
      Releases
    </a>
    <span> | </span>
    <a href="https://github.com/CirclesUBI/.github/blob/main/CONTRIBUTING.md">
      Contributing
    </a>
  </h3>
</div>

<br/>

Utility module for [Circles](https://joincircles.net) to find the [Maximum flow](https://en.wikipedia.org/wiki/Maximum_flow_problem) and necessary transitive transfer steps in a trust graph with multiple tokens.

For performance reasons this module uses the native [pathfinder](https://github.com/chriseth/pathfinder2/) process by [chriseth](https://github.com/chriseth) to find the transfer steps.

## Requirements

- Node.js (tested v14)

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
// The csv file has de format `from,to,token,capacity`. Store it somewhere (for example ./graph.csv):
//
// 0x5534d2ba89ad1c01c186efafee7105dba071134a,0x83d878a6123efd548341b468f017af31d96b09b6,0x5534d2ba89ad1c01c186efafee7105dba071134a,10
// 0x83d878a6123efd548341b468f017af31d96b09b6,0xe08fe38204075884b5dbdcb0ddca0e033f9481a7,0x83d878a6123efd548341b468f017af31d96b09b6,7
// 0x83d878a6123efd548341b468f017af31d96b09b6,0xe08fe38204075884b5dbdcb0ddca0e033f9481a7,0xe08fe38204075884b5dbdcb0ddca0e033f9481a7,5
// ...

// Find required transfer steps to send tokens transitively between two nodes:
const { transferSteps, maxFlowValue } = await findTransitiveTransfer(
  {
    from: '0x5534d2ba89ad1c01c186efafee7105dba071134a',
    to: '0x29003579d2ca6d47c1860c4ed36656542a28f012',
    value: '5',
    hops: '4'
  },
  {
    edgesFile: './graph.csv', // Path to graph file
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
# Install dependencies
npm install

# Run test suite
npm run test
npm run test:watch

# Check code formatting
npm run lint

# Build it!
npm run build
```

## Pathfinder

`pathfinder` is a rust program by [chriseth](https://github.com/chriseth/pathfinder2) compiled for Linux arm64 in this repository. To update the pathfinder in the api, build a native binary according to the README instructions from `chriseth` and move the target into your project.

The version we are using corresponds with this commit: https://github.com/chriseth/pathfinder2/commit/a677c3a9a0ea692abc69ef7095927af7e10da636

## License

GNU Affero General Public License v3.0 `AGPL-3.0`
