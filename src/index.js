import { FlowNetwork, FlowEdge, MaxFlow } from './maxFlow';
import { validateType, validateTypes, validateNode } from './validate';

const MAX_CAPACITY = Number.MAX_SAFE_INTEGER;

function addTokenEdges({ nodes, edges }) {
  return nodes.reduce(
    (acc, node) => {
      acc.nodes.push(node);

      edges.forEach(({ from, to, token, capacity }) => {
        const newNode = `${node}-${token}`;
        const newNodeExt = `${newNode}*`;

        if (from === node) {
          if (!acc.nodes.includes(newNode)) {
            acc.nodes.push(newNode);
            acc.nodes.push(newNodeExt);

            acc.edges.push({
              from: node,
              to: newNode,
              capacity: MAX_CAPACITY,
              token,
            });

            acc.edges.push({
              from: newNode,
              to: newNodeExt,
              capacity,
              token,
            });
          }

          acc.edges.push({
            originalFrom: from,
            originalTo: to,
            from: newNodeExt,
            to,
            capacity: MAX_CAPACITY,
            token,
          });
        }
      });

      return acc;
    },
    {
      nodes: [],
      edges: [],
    },
  );
}

function removeTokenEdges({ graph }) {
  const markedEdges = [];
  const nodesCleaned = [];

  const edgesCleaned = graph.adjList.reduce((acc, adj) => {
    adj.forEach((edge) => {
      if (!edge.originalFrom) {
        return;
      }

      const edgeKey = `${edge.originalFrom}${edge.originalTo}${edge.token}`;

      if (edge.flow > 0 && !markedEdges.includes(edgeKey)) {
        if (!nodesCleaned.includes(edge.originalTo)) {
          nodesCleaned.push(edge.originalTo);
        }

        if (!nodesCleaned.includes(edge.originalFrom)) {
          nodesCleaned.push(edge.originalFrom);
        }

        if (!nodesCleaned.includes(edge.token)) {
          nodesCleaned.push(edge.token);
        }

        markedEdges.push(edgeKey);

        acc.push({
          capacity: edge.capacity,
          flow: edge.flow,
          from: edge.originalFrom,
          to: edge.originalTo,
          token: edge.token,
        });
      }
    });

    return acc;
  }, []);

  return {
    nodes: nodesCleaned,
    edges: edgesCleaned,
  };
}

function calculateMaxFlow({ nodes, edges, source, sink }) {
  const graph = new FlowNetwork(nodes.length);

  edges.forEach((edge) => {
    const indexFrom = nodes.indexOf(edge.from);
    const indexTo = nodes.indexOf(edge.to);

    const flowEdge = new FlowEdge(indexFrom, indexTo, edge.capacity);

    // Keep meta informations
    flowEdge.token = edge.token;
    flowEdge.originalFrom = edge.originalFrom;
    flowEdge.originalTo = edge.originalTo;

    graph.addEdge(flowEdge);
  });

  const sourceIndex = nodes.indexOf(source);
  const targetIndex = nodes.indexOf(sink);

  const { value } = new MaxFlow(graph, sourceIndex, targetIndex);

  return {
    graph,
    maxFlowValue: value,
  };
}

function calculateTransferSteps({ edges, to, value }) {
  function nextSteps(startNode, value) {
    const nextStepsInner = (node, flowRequired, path = []) => {
      // Filter out unneeded edges and sort them by flow
      const filteredEdges = edges
        .filter((edge) => {
          return edge.to === node && edge.flow > 0;
        })
        .sort((edgeA, edgeB) => {
          return edgeB.flow - edgeA.flow;
        });

      // Set the required flow for this node (we usually don't need the
      // maximum)
      let flowRequiredLeft = flowRequired;

      // We recursively look for adjacent nodes until there are none
      filteredEdges.forEach((edge) => {
        // Calculate how much flow this adjacent node can give, we've sorted
        // them above by flow capacity to prioritize larger ones
        const edgeFlow = edge.flow - Math.max(0, edge.flow - flowRequiredLeft);
        flowRequiredLeft = flowRequiredLeft - edgeFlow;

        const innerPath = nextStepsInner(edge.from, edgeFlow, path);
        path.concat(innerPath);

        if (edgeFlow > 0) {
          path.push({
            from: edge.from,
            to: edge.to,
            token: edge.token,
            value: edgeFlow,
          });
        }
      });

      return path;
    };

    const steps = {};

    nextStepsInner(startNode, value).forEach((transaction, step) => {
      const key = `${transaction.from}${transaction.to}${transaction.token}`;

      if (!(key in steps)) {
        steps[key] = {
          from: transaction.from,
          to: transaction.to,
          token: transaction.token,
          value: 0,
          step,
        };
      }

      steps[key].value += transaction.value;
    });

    return Object.keys(steps)
      .map((key) => {
        return steps[key];
      })
      .sort((itemA, itemB) => {
        return itemA.step - itemB.step;
      })
      .map((item, index) => {
        item.step = index + 1;
        return item;
      });
  }

  return nextSteps(to, value);
}

export default function getTransitiveTransfer({
  nodes,
  edges,
  from,
  to,
  value,
}) {
  validateTypes(
    {
      nodes,
      edges,
      from,
      to,
      value,
    },
    {
      nodes: 'array',
      edges: 'array',
      from: 'string',
      to: 'string',
      value: 'number',
    },
  );

  if (nodes.length === 0) {
    throw new Error('Graph is empty');
  }

  nodes.forEach((node) => {
    validateType(node, 'string');
  });

  edges.forEach((edge) => {
    validateType(edge, 'object');

    validateTypes(edge, {
      capacity: 'number',
      from: 'string',
      to: 'string',
      token: 'string',
    });

    validateNode(nodes, edge.from);
    validateNode(nodes, edge.to);
    validateNode(nodes, edge.token);

    if (edge.capacity < 0) {
      throw new Error('"capacity" has to be positive value or zero (>=0)');
    }
  });

  validateNode(nodes, from);
  validateNode(nodes, to);

  if (value <= 0) {
    throw new Error('"value" has to be positive value (>0)');
  }

  const extended = addTokenEdges({ nodes, edges });

  const { graph, maxFlowValue } = calculateMaxFlow({
    nodes: extended.nodes,
    edges: extended.edges,
    source: from,
    sink: to,
  });

  const cleaned = removeTokenEdges({ graph });

  const transferSteps =
    maxFlowValue >= value
      ? calculateTransferSteps({
          edges: cleaned.edges,
          to,
          value,
        })
      : [];

  return {
    from,
    to,
    value,
    transferSteps,
    maxFlowValue,
  };
}
