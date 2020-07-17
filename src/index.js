import { FlowNetwork, FlowEdge, findMaxFlow } from './flow';
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

function getFlowNetwork({ nodes, edges }) {
  const network = new FlowNetwork(nodes.length);

  edges.forEach((edge) => {
    const indexFrom = nodes.indexOf(edge.from);
    const indexTo = nodes.indexOf(edge.to);

    const flowEdge = new FlowEdge({
      indexFrom,
      indexTo,
      capacity: edge.capacity,
    });

    if (edge.originalTo) {
      // We need this meta information kept here for later clean up and removal
      // of the extra token edges.
      flowEdge._originalTo = edge.originalTo;
      flowEdge._originalFrom = edge.originalFrom;
      flowEdge._token = edge.token;
    }

    network.addEdge(flowEdge);
  });

  return network;
}

function removeTokenEdges({ network }) {
  const markedEdges = [];
  const nodesCleaned = [];

  const edgesCleaned = network
    .getAllEdges()
    .reduce((acc, { _originalFrom, _originalTo, _token, flow, capacity }) => {
      if (!_originalFrom) {
        return acc;
      }

      const edgeKey = [_originalFrom, _originalTo, _token].join('');

      if (flow > 0 && !markedEdges.includes(edgeKey)) {
        if (!nodesCleaned.includes(_originalTo)) {
          nodesCleaned.push(_originalTo);
        }

        if (!nodesCleaned.includes(_originalFrom)) {
          nodesCleaned.push(_originalFrom);
        }

        if (!nodesCleaned.includes(_token)) {
          nodesCleaned.push(_token);
        }

        markedEdges.push(edgeKey);

        acc.push({
          capacity,
          flow,
          from: _originalFrom,
          to: _originalTo,
          token: _token,
        });
      }

      return acc;
    }, []);

  return {
    nodes: nodesCleaned,
    edges: edgesCleaned,
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
    validateType(node, 'string', 'node');
  });

  edges.forEach((edge) => {
    validateType(edge, 'object', 'edge');

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

  // 1.
  const extendedGraph = addTokenEdges({ nodes, edges });

  // 2.
  const network = getFlowNetwork({
    nodes: extendedGraph.nodes,
    edges: extendedGraph.edges,
  });

  // 3.
  const indexSource = extendedGraph.nodes.indexOf(from);
  const indexSink = extendedGraph.nodes.indexOf(to);
  const maxFlowValue = findMaxFlow({ network, indexSource, indexSink });

  // 4.
  const cleanedGraph = removeTokenEdges({ network });

  // 5.
  const isTransferPossible = maxFlowValue >= value;
  const transferValue = isTransferPossible ? value : 0;
  const transferSteps = isTransferPossible
    ? calculateTransferSteps({
        edges: cleanedGraph.edges,
        to,
        value,
      })
    : [];

  return {
    from,
    to,
    transferValue,
    transferSteps,
    maxFlowValue,
  };
}
