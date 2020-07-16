import getTransitiveTransfer from '../src';

import graph1 from './graph-1.json';
import graph2 from './graph-2.json';

import { expectSuccessfulTransfer } from './utils';

const testVectorsSuccess = [
  {
    graph: graph1,
    transaction: {
      from: 'A',
      to: 'D',
      value: 10,
    },
    results: {
      maxFlowValue: 10.8,
      stepsCount: 5,
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
    results: {
      maxFlowValue: 0,
      stepsCount: 0,
    },
  },
  {
    graph: graph1,
    transaction: {
      from: 'A',
      to: 'D',
      value: 100,
    },
    results: {
      maxFlowValue: 10.8,
      stepsCount: 0,
    },
  },
  {
    graph: graph2,
    transaction: {
      from: '1',
      to: '13',
      value: 50,
    },
    results: {
      maxFlowValue: 75,
      stepsCount: 6,
    },
  },
  {
    graph: graph2,
    transaction: {
      from: '99',
      to: '44',
      value: 80,
    },
    results: {
      maxFlowValue: 100,
      stepsCount: 14,
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
    results: {
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
    results: {
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
    results: {
      error: '"value" has to be positive value (>0)',
    },
  },
  {
    graph: graph1,
    transaction: {
      to: 'A',
      value: 5,
    },
    results: {
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
    results: {
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
    results: {
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
    results: {
      error: '"capacity" has to be positive value or zero (>=0)',
    },
  },
];

const testVectors = [...testVectorsSuccess, ...testVectorsFail];

describe('getTransitiveTransfer', () => {
  it('should return valid transfer steps', () => {
    testVectors.forEach((vector) => {
      const { nodes, edges } = vector.graph;
      let result;

      const test = expect(() => {
        result = getTransitiveTransfer({
          nodes,
          edges,
          ...vector.transaction,
        });
      });

      if (vector.results.error) {
        test.toThrow(new Error(vector.results.error));
      } else {
        test.not.toThrow();

        expect(result.from).toBe(vector.transaction.from);
        expect(result.to).toBe(vector.transaction.to);
        expect(result.value).toBe(vector.transaction.value);
        expect(result.transferSteps.length).toBe(vector.results.stepsCount);
        expect(result.maxFlowValue).toBe(vector.results.maxFlowValue);

        expectSuccessfulTransfer({
          ...result,
          nodes,
        });
      }
    });
  });
});
