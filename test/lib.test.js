import '@babel/polyfill';
import findTransitiveTransfer from '../src';

import { expectSuccessfulTransfer } from './utils';

const PATHFINDER_EXECUTABLE = './pathfinder';

const graph1 = './test/graph-1.csv';
const graph2 = './test/graph-2.csv';
const graph3 = './test/graph-3.csv';
const graph4 = './test/graph-4.csv';
const FLAG = '--flowcsv';
const testVectorsSuccess = [
  {
    graph: graph1,
    transaction: {
      from: '0x5534D2ba89ad1C01C186eFAfEe7105DBa071134A',
      to: '0x29003579d2cA6d47C1860C4Ed36656542a28f012',
      value: '11',
    },
    expected: {
      maxFlowValue: '11',
      transferStepsCount: 6,
      transferValue: '11',
    },
  },
  {
    graph: graph1,
    transaction: {
      from: '0x5534D2ba89ad1C01C186eFAfEe7105DBa071134A',
      to: '0x29003579d2cA6d47C1860C4Ed36656542a28f012',
      value: '100',
    },
    expected: {
      maxFlowValue: '11',
      transferStepsCount: 0,
      transferValue: '100',
    },
  },
  {
    graph: graph2,
    transaction: {
      from: '0x12e3DB638ff9Ac639425F24fAd3193CB72b4e7fB',
      to: '0xa559aA8ed21434ebFa23958bC27D201391929219',
      value: '50',
    },
    expected: {
      maxFlowValue: '50',
      transferStepsCount: 5,
      transferValue: '50',
    },
  },
  {
    graph: graph2,
    transaction: {
      from: '0xe4Ec3cCfD5CdB641EC13305b6EF3536915a2688d',
      to: '0xd9E13Bb778B1d4DC87053f3912C597c64306a91E',
      value: '80',
    },
    expected: {
      maxFlowValue: '80',
      transferStepsCount: 13,
      transferValue: '80',
    },
  },
  {
    graph: graph3,
    transaction: {
      from: '0x2F764F3B669093dD24648757971070172Ca2af33',
      to: '0xA0FF2f1b0Ab2414E571bCD134781d746c750916B',
      value: '50',
    },
    expected: {
      maxFlowValue: '50',
      transferStepsCount: 4,
      transferValue: '50',
    },
  },
  {
    graph: graph4,
    transaction: {
      from: '0xd615e7351261d1Bd8558742015AdFFFF15a425D7',
      to: '0x7875dFd647efA680B83e418Fc00B3E38B7442bc6',
      value: '50',
    },
    expected: {
      maxFlowValue: '50',
      transferStepsCount: 2,
      transferValue: '50',
    },
  },
];

const testVectors = [...testVectorsSuccess];

describe('findTransitiveTransfer', () => {
  it('should run test vectors successfully', async () => {
    for await (const vector of testVectors) {
      const test = async () => {
        return await findTransitiveTransfer(vector.transaction, {
          edgesFile: vector.graph,
          pathfinderExecutable: PATHFINDER_EXECUTABLE,
          flag: FLAG,
          timeout: 0,
        });
      };

      if (vector.expected.error) {
        expect.assertions(1);
        return test().catch((e) =>
          expect(e).toMatch(new Error(vector.expected.error)),
        );
      }

      const result = await test();
      const { expected, transaction } = vector;
      expect(result.from).toBe(transaction.from);
      expect(result.to).toBe(transaction.to);
      expect(result.transferValue).toBe(expected.transferValue);
      expect(result.transferSteps.length).toBe(expected.transferStepsCount);
      expect(result.maxFlowValue).toBe(expected.maxFlowValue);

      expectSuccessfulTransfer({
        ...result,
        edges: require(vector.graph.replace('test/', '')),
      });
    }
  });
});
