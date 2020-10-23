import '@babel/polyfill';
import findTransitiveTransfer from '../src';

import { expectSuccessfulTransfer } from './utils';

const PATHFINDER_EXECUTABLE = './pathfinder';

const graph1 = './test/graph-1.json';
const graph2 = './test/graph-2.json';
const graph3 = './test/graph-3.json';
const graph4 = './test/graph-4.json';

const testVectorsSuccess = [
  {
    graph: graph1,
    transaction: {
      from: '0x5534d2ba89ad1c01c186efafee7105dba071134a',
      to: '0x29003579d2ca6d47c1860c4ed36656542a28f012',
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
      from: '0x5534d2ba89ad1c01c186efafee7105dba071134a',
      to: '0x29003579d2ca6d47c1860c4ed36656542a28f012',
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
      from: '0x12e3db638ff9ac639425f24fad3193cb72b4e7fb',
      to: '0xa559aa8ed21434ebfa23958bc27d201391929219',
      value: '50',
    },
    expected: {
      maxFlowValue: '50',
      transferStepsCount: 6,
      transferValue: '50',
    },
  },
  {
    graph: graph2,
    transaction: {
      from: '0xe4ec3ccfd5cdb641ec13305b6ef3536915a2688d',
      to: '0xd9e13bb778b1d4dc87053f3912c597c64306a91e',
      value: '80',
    },
    expected: {
      maxFlowValue: '80',
      transferStepsCount: 16,
      transferValue: '80',
    },
  },
  {
    graph: graph3,
    transaction: {
      from: '0x2f764f3b669093dd24648757971070172ca2af33',
      to: '0xa0ff2f1b0ab2414e571bcd134781d746c750916b',
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
      from: '0xd615e7351261d1bd8558742015adffff15a425d7',
      to: '0x7875dfd647efa680b83e418fc00b3e38b7442bc6',
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
