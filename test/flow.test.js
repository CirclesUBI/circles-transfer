import { FlowEdge, FlowNetwork, Queue, findMaxFlow } from '../src/flow';

const buildNetwork = () => {
  const network = new FlowNetwork(5);

  network.addEdge(
    new FlowEdge({
      indexFrom: 0,
      indexTo: 1,
      capacity: 10,
    }),
  );

  network.addEdge(
    new FlowEdge({
      indexFrom: 1,
      indexTo: 2,
      capacity: 5,
    }),
  );

  network.addEdge(
    new FlowEdge({
      indexFrom: 2,
      indexTo: 4,
      capacity: 5,
    }),
  );

  network.addEdge(
    new FlowEdge({
      indexFrom: 1,
      indexTo: 3,
      capacity: 7,
    }),
  );

  network.addEdge(
    new FlowEdge({
      indexFrom: 3,
      indexTo: 4,
      capacity: 3,
    }),
  );
  return network;
};

describe('Queue', () => {
  let queue;
  let testItems;

  beforeEach(() => {
    queue = new Queue();
    testItems = [1, 2, 3, 4];
  });

  it('should work in FIFO order', () => {
    queue.enqueue(testItems[0]);
    queue.enqueue(testItems[1]);
    queue.enqueue(testItems[2]);

    expect(queue.dequeue()).toBe(testItems[0]);
    expect(queue.dequeue()).toBe(testItems[1]);
    expect(queue.dequeue()).toBe(testItems[2]);
    expect(queue.dequeue()).toBe(undefined);
  });

  it('should tell us if its empty', () => {
    queue.enqueue(testItems[0]);
    expect(queue.isEmpty()).toBe(false);

    queue.dequeue();
    expect(queue.isEmpty()).toBe(true);
  });
});

describe('FlowEdge', () => {
  let edge;

  beforeEach(() => {
    edge = new FlowEdge({
      indexFrom: 1,
      indexTo: 2,
      capacity: 10,
    });
  });

  it('should return the nodes it connects', () => {
    expect(edge.getFromNode()).toBe(1);
    expect(edge.getToNode()).toBe(2);
    expect(edge.getOtherNode(1)).toBe(2);
    expect(edge.getOtherNode(2)).toBe(1);
  });

  it('should increase / decrease the residual edge capacity based on the flow', () => {
    const bottleneck = 3;

    // Decrease capacity u->v by bottleneck
    edge.addResidualFlowTo(2, bottleneck);
    expect(edge.getResidualCapacityTo(2)).toBe(7);

    // Increase capacity v->u by bottleneck
    edge.addResidualFlowTo(1, bottleneck);
    expect(edge.getResidualCapacityTo(2)).toBe(10);
  });
});

describe('FlowNetwork', () => {
  let network;

  beforeEach(() => {
    network = new FlowNetwork(4);

    network.addEdge(
      new FlowEdge({
        indexFrom: 0,
        indexTo: 1,
        capacity: 10,
      }),
    );

    network.addEdge(
      new FlowEdge({
        indexFrom: 1,
        indexTo: 2,
        capacity: 5,
      }),
    );

    network.addEdge(
      new FlowEdge({
        indexFrom: 1,
        indexTo: 3,
        capacity: 7,
      }),
    );
  });

  it('should return the right edge or null', () => {
    expect(network.getEdge(0, 1).capacity).toBe(10);
    expect(network.getEdge(1, 0).capacity).toBe(10);
    expect(network.getEdge(1, 2).capacity).toBe(5);
    expect(network.getEdge(5, 10)).toBe(undefined);
  });

  it('should return all edges which connect from a node', () => {
    expect(network.getAdjacentEdgesFrom(0).length).toBe(1);
    expect(network.getAdjacentEdgesFrom(1).length).toBe(3);
    expect(network.getAdjacentEdgesFrom(2).length).toBe(1);
    expect(network.getAdjacentEdgesFrom(3).length).toBe(1);

    network.getAdjacentEdgesFrom(1).forEach((edge) => {
      expect(edge.getFromNode() === 1 || edge.getToNode() === 1).toBe(true);
    });
  });

  it('should return all edges', () => {
    expect(network.getAllEdges().length).toBe(3);
  });
});

describe('findMaxFlow', () => {
  it('should return the correct maximum flow of the flow network', () => {
    expect(
      findMaxFlow({
        network: buildNetwork(),
        indexSource: 0,
        indexSink: 2,
      }),
    ).toBe(5);

    expect(
      findMaxFlow({
        network: buildNetwork(),
        indexSource: 3,
        indexSink: 4,
      }),
    ).toBe(3);

    expect(
      findMaxFlow({
        network: buildNetwork(),
        indexSource: 0,
        indexSink: 4,
      }),
    ).toBe(8);
  });

  it('should throw an error if we try to run it twice on the same network', () => {
    const network = buildNetwork();

    expect(() =>
      findMaxFlow({
        network,
        indexSource: 0,
        indexSink: 4,
      }),
    ).not.toThrow();

    expect(() =>
      findMaxFlow({
        network,
        indexSource: 0,
        indexSink: 4,
      }),
    ).toThrow();
  });
});
