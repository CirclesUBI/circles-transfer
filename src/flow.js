import { validateType } from './validate';

export class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

export class FlowEdge {
  constructor({ capacity, indexFrom, indexTo }) {
    validateType(capacity, 'number', 'capacity');
    validateType(indexFrom, 'number', 'indexFrom');
    validateType(indexTo, 'number', 'indexTo');

    if (indexFrom === indexTo) {
      throw new Error(`Invalid loop`);
    }

    if (capacity < 0) {
      throw new Error('"capacity" has to be positive value or zero (>=0)');
    }

    this.indexFrom = indexFrom;
    this.indexTo = indexTo;

    // The edges in the residual graph store the remaining capacities of those
    // edges that can be used by future flow(s). At the beginning, these
    // remaining capacities equal to the original capacities as specified in
    // the input flow graph:
    this.capacity = capacity;

    // A Max Flow algorithm will send flows to use some (or all) of these
    // available capacities, iteratively. Once the remaining capacity of an
    // edge reaches 0, that edge can no longer admit any more flow. Prepare the
    // residual graph by setting the flow to zero:
    this.flow = 0;

    // Have an internal flag if the flow value of this edge has been updated.
    // This helps us to tell if the Max Flow algorithm has already been
    // running.
    this.isDirty = false;
  }

  getResidualCapacityTo(node) {
    if (node === this.indexFrom) {
      return this.flow;
    } else if (node === this.indexTo) {
      return this.capacity - this.flow;
    } else {
      throw new Error('Invalid node');
    }
  }

  addResidualFlowTo(node, deltaFlow) {
    this.isDirty = true;

    if (node === this.indexFrom) {
      this.flow -= deltaFlow;
    } else if (node === this.indexTo) {
      this.flow += deltaFlow;
    } else {
      throw new Error('Invalid node');
    }
  }

  getFromNode() {
    return this.indexFrom;
  }

  getToNode() {
    return this.indexTo;
  }

  getOtherNode(node) {
    return node == this.indexFrom ? this.indexTo : this.indexFrom;
  }
}

export class FlowNetwork {
  constructor(nodesCount) {
    validateType(nodesCount, 'number', 'nodesCount');

    this.nodesCount = nodesCount;
    this.edges = [];
  }

  getEdge(indexFrom, indexTo) {
    return this.getAdjacentEdgesFrom(indexFrom).find((adjacentEdge) => {
      return adjacentEdge.getOtherNode(indexFrom) === indexTo;
    });
  }

  getAllEdges() {
    return this.edges;
  }

  addEdge(edge) {
    if (!(edge instanceof FlowEdge)) {
      throw new Error('"edge" has to be FlowEdge instance');
    }

    this.edges.push(edge);
  }

  getAdjacentEdgesFrom(indexFrom) {
    // Return all edges which connect that node
    return this.edges.filter((edge) => {
      return edge.getFromNode() === indexFrom || edge.getToNode() === indexFrom;
    });
  }

  isDirty() {
    // Returns true if Max Flow algorithm manipulated the flow network weights
    return !!this.getAllEdges().find((edge) => edge.isDirty);
  }
}

export function findMaxFlow({ network, indexSource, indexSink }) {
  validateType(network, 'object', 'network');
  validateType(indexSource, 'number', 'indexSource');
  validateType(indexSink, 'number', 'indexSink');

  if (!(network instanceof FlowNetwork)) {
    throw new Error('"edge" has to be FlowEdge instance');
  }

  if (network.isDirty()) {
    throw new Error('FlowNetwork was already used by Max Flow algorithm');
  }

  let augmentedPath;
  let maxFlowValue = 0;

  // Find an augmenting path using depth-first search (non-recursive) between
  // the source and the sink. A path is augmented when all of its edges have a
  // capacity > 0.
  const hasAugmentedPath = () => {
    const isVisited = {};
    augmentedPath = {};

    const queue = new Queue();
    queue.enqueue(indexSource);
    isVisited[indexSource] = true;

    let isCompletePath = false;

    while (!queue.isEmpty()) {
      const node = queue.dequeue();
      const adjacentEdges = network.getAdjacentEdgesFrom(node);

      adjacentEdges.forEach((adjacentEdge) => {
        const adjacentNode = adjacentEdge.getOtherNode(node);

        if (
          !isVisited[adjacentNode] &&
          adjacentEdge.getResidualCapacityTo(adjacentNode) > 0
        ) {
          augmentedPath[adjacentNode] = adjacentEdge;
          isVisited[adjacentNode] = true;

          // We reached the sink
          if (adjacentNode === indexSink) {
            isCompletePath = true;
          }

          if (!isCompletePath) {
            queue.enqueue(adjacentNode);
          }
        }
      });
    }

    return isCompletePath;
  };

  // A network is at maximum flow if and only if there is no augmenting path in
  // the residual network.
  while (hasAugmentedPath()) {
    // For each found augmented path:
    //
    // 1. Find the bottleneck in the path.
    let bottleneck = Number.MAX_SAFE_INTEGER;
    for (
      let node = indexSink;
      node !== indexSource;
      node = augmentedPath[node].getOtherNode(node)
    ) {
      bottleneck = Math.min(
        bottleneck,
        augmentedPath[node].getResidualCapacityTo(node),
      );
    }

    // 2. Increase / Decrease the capacity for each edge on that path by the
    // bottleneck.
    for (
      let node = indexSink;
      node !== indexSource;
      node = augmentedPath[node].getOtherNode(node)
    ) {
      augmentedPath[node].addResidualFlowTo(node, bottleneck);
    }

    // 3. Increase maxFlowValue by bottleneck.
    maxFlowValue += bottleneck;
  }

  return maxFlowValue;
}
