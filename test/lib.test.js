import findTransitiveTransfer from '../src';

import graph1 from './graph-1.json';
import graph2 from './graph-2.json';
import graph3 from './graph-3.json';
import graph4 from './graph-4.json';

import { expectSuccessfulTransfer } from './utils';

const testVectorsSuccess = [
  {
    graph: graph1,
    transaction: {
      from: 'A',
      to: 'D',
      value: 10,
    },
    expected: {
      maxFlowValue: 11.8,
      transferStepsCount: 5,
      transferValue: 10,
    },
  },
  {
    graph: {
      ...graph1,
      edges: [],
    },
    transaction: {
      from: 'A',
      to: 'D',
      value: 10,
    },
    expected: {
      maxFlowValue: 0,
      transferStepsCount: 0,
      transferValue: 0,
    },
  },
  {
    graph: graph1,
    transaction: {
      from: 'A',
      to: 'D',
      value: 100,
    },
    expected: {
      maxFlowValue: 11.8,
      transferStepsCount: 0,
      transferValue: 0,
    },
  },
  {
    graph: graph2,
    transaction: {
      from: '1',
      to: '13',
      value: 50,
    },
    expected: {
      maxFlowValue: 467,
      transferStepsCount: 6,
      transferValue: 50,
    },
  },
  {
    graph: graph2,
    transaction: {
      from: '99',
      to: '44',
      value: 80,
    },
    expected: {
      maxFlowValue: 182,
      transferStepsCount: 15,
      transferValue: 80,
    },
  },
  {
    graph: graph3,
    transaction: {
      from: 'A',
      to: 'B',
      value: 50,
    },
    expected: {
      maxFlowValue: 52,
      transferStepsCount: 3,
      transferValue: 50,
    },
  },
  {
    graph: graph4,
    transaction: {
      from: '11',
      to: '50',
      value: 50,
    },
    expected: {
      maxFlowValue: 481,
      transferStepsCount: 5,
      transferValue: 50,
    },
  },
];

const testVectorsFail = [
  {
    graph: graph1,
    transaction: {
      from: 'A',
      to: 'E',
      value: 10,
    },
    expected: {
      error: 'Graph does not contain "E" node',
    },
  },
  {
    graph: graph1,
    transaction: {
      from: 'Z',
      to: 'D',
      value: 10,
    },
    expected: {
      error: 'Graph does not contain "Z" node',
    },
  },
  {
    graph: graph1,
    transaction: {
      from: 'A',
      to: 'D',
      value: -1,
    },
    expected: {
      error: '"value" has to be positive value (>0)',
    },
  },
  {
    graph: graph1,
    transaction: {
      to: 'A',
      value: 5,
    },
    expected: {
      error: '"from" is missing',
    },
  },
  {
    graph: {
      nodes: [],
      edges: [],
    },
    transaction: {
      from: 'A',
      to: 'B',
      value: 1,
    },
    expected: {
      error: 'Graph is empty',
    },
  },
  {
    graph: {
      nodes: ['A', 'B'],
      edges: [
        {
          from: 'C',
          to: 'C',
          token: 'A',
          capacity: 5,
        },
      ],
    },
    transaction: {
      from: 'A',
      to: 'B',
      value: 1,
    },
    expected: {
      error: 'Graph does not contain "C" node',
    },
  },
  {
    graph: {
      nodes: ['A', 'B'],
      edges: [
        {
          from: 'A',
          to: 'B',
          token: 'A',
          capacity: -2,
        },
      ],
    },
    transaction: {
      from: 'A',
      to: 'B',
      value: 1,
    },
    expected: {
      error: '"capacity" has to be positive value or zero (>=0)',
    },
  },
];

const testVectors = [...testVectorsSuccess, ...testVectorsFail];

describe('findTransitiveTransfer', () => {
  it('should run test vectors successfully', () => {
    testVectors.forEach((vector) => {
      let result;

      const test = () => {
        result = findTransitiveTransfer({
          ...vector.graph,
          ...vector.transaction,
        });
      };

      if (vector.expected.error) {
        expect(test).toThrow(new Error(vector.expected.error));
      } else {
        expect(test).not.toThrow();

        const { expected, transaction } = vector;
        expect(result.from).toBe(transaction.from);
        expect(result.to).toBe(transaction.to);
        expect(result.transferValue).toBe(expected.transferValue);
        expect(result.transferSteps.length).toBe(expected.transferStepsCount);
        expect(result.maxFlowValue).toBe(expected.maxFlowValue);

        expectSuccessfulTransfer({
          ...result,
          ...vector.graph,
        });
      }
    });
  });
});
