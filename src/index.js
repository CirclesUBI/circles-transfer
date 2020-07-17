import { FlowNetwork, FlowEdge, findMaxFlow } from './flow';
import { validateType, validateTypes, validateNode } from './validate';

const MAX_CAPACITY = Number.MAX_SAFE_INTEGER;

function addTokenEdges({ nodes, edges }) {
  return nodes.reduce(
    (acc, node) => {
      acc.nodes.push(node);

      // Extend edges per node to add knowledge about multiple tokens to graph
      edges.forEach(({ from, to, token, capacity }) => {
        const newNode = `${node}*${token}`;
        const newNodeExt = `${newNode}'`;

        if (from === node) {
          if (!acc.nodes.includes(newNode)) {
            acc.nodes.push(newNode);
            acc.nodes.push(newNodeExt);

            // [N] --Infinite--> [N*Token]
            acc.edges.push({
              from: node,
              to: newNode,
              capacity: MAX_CAPACITY,
              token,
            });

            // [N*Token] --Value--> [N*Token']
            // This "middle" node holds the actual token value this node holds
            acc.edges.push({
              from: newNode,
              to: newNodeExt,
              capacity,
              token,
            });
          }

          // [N*Token'] --Infinite--> ... (to)
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
  const nodesCleaned = [];

  const edgesCleaned = network
    .getAllEdges()
    .reduce((acc, { _originalFrom, _originalTo, _token, flow, capacity }) => {
      // We can skip all other edges which did not contain the original data
      if (!_originalFrom) {
        return acc;
      }

      // Ignore all edges with zero flow
      if (flow > 0) {
        if (!nodesCleaned.includes(_originalTo)) {
          nodesCleaned.push(_originalTo);
        }

        if (!nodesCleaned.includes(_originalFrom)) {
          nodesCleaned.push(_originalFrom);
        }

        if (!nodesCleaned.includes(_token)) {
          nodesCleaned.push(_token);
        }

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

function findTransferSteps({ edges, to, value }) {
  function nextSteps(startNode, value) {
    // Do a recursive depth-first search to find all required transfer steps
    const nextStepsInner = (node, flowRequired, path = []) => {
      // Find all adjacent edges to this node
      const filteredEdges = edges
        .filter((edge) => {
          return edge.to === node;
        })
        .sort((edgeA, edgeB) => {
          return edgeB.flow - edgeA.flow;
        });

      // Set the required flow for this step (we usually don't need the maximum
      // flow)
      let flowRequiredLeft = flowRequired;

      // We recursively look for adjacent edges until there are none
      filteredEdges.forEach((edge) => {
        // Calculate how much flow this adjacent edge can give, we've sorted
        // them above by flow capacity to prioritize larger ones. There are
        // potentially better / more optimal ways to prioritize transfers (less
        // transfer steps, etc.) but they are also more complex :-)
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
      // It can happen that we transact the same token between the same nodes
      // within multiple steps. To optimize these multiple transfers we
      // summarize them to only one single transaction.
      const key = `${transaction.from}${transaction.to}${transaction.token}`;

      if (!(key in steps)) {
        steps[key] = {
          from: transaction.from,
          to: transaction.to,
          token: transaction.token,
          value: 0,
          step, // keep the order internally so we can sort them correctly
        };
      }

      steps[key].value += transaction.value;
    });

    return Object.keys(steps)
      .map((key) => {
        // Transform the summarized transactions into single ones
        return steps[key];
      })
      .sort((itemA, itemB) => {
        // ... sort them by required transfer order
        return itemA.step - itemB.step;
      })
      .map((item, index) => {
        // ... and give them the correct step numbers again
        item.step = index + 1;
        return item;
      });
  }

  // Start recursively looking from the receiver node ("to")
  return nextSteps(to, value);
}

export default function findTransitiveTransfer({
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

  // 1. EXTEND GRAPH WITH ADDITIONAL TOKEN EDGES
  //
  // Add intermediate edges for each node of the graph as we need to solve the
  // Maximum flow problem with multiple tokens: Every node can have multiple
  // ways to transact with another, depending on if the sender holds any token
  // the receiver trusts. This requirement can only be solved by Maximum flow
  // if we add intermediate edges which represent the different trusted tokens
  // a sender owns.
  //
  // Think about the following trust graph (an arrow indicates the trust
  // direction, for example "[A] <-- [B]" stands for "B trusts A"):
  //
  //                        [A] <-- [B] <-- [D]
  //                         ^               |
  //                         |               |
  //                        [C] <------------|
  //
  // In this example [A] holds 5 AToken and 7 CToken. The above graph does not
  // containing that information yet as there is only one path between [C] and
  // [A] but clearly [C] would accept both AToken and CToken from [A]!
  //
  // To include the tokens, [A] will be extended with [A*AToken], [A*AToken'],
  // [A*CToken] and [A*CToken'] where the edge weight holds the number of the
  // owned tokens, all other edges get an "infinite" weight. We do the same for
  // all the other nodes as well but leave this out in this example:
  //
  //              /--> [A*AToken] 5 --> [A*AToken'] --> [B] ...
  //             /                                 \
  //            [A]                                 \
  //             \                                   \
  //              \--> [A*CToken] 7 --> [A*CToken'] --> [C] ...
  //                                               \
  //                                                \--> [D] ...
  //
  // With this extended Graph we can see now that [A] owns 5 AToken which could
  // potentially be transferred to [B] and [C] as both of them trust [A]. Also
  // we can see that [A] could send 7 CToken to [C] or [D] as [C] is the owner
  // of this token and [D] trusts [C].
  const extendedGraph = addTokenEdges({ nodes, edges });

  // 2. TRANSFORM GRAPH INTO FLOW-NETWORK WITH RESIDUAL EDGES
  //
  // To solve the Maximum Flow problem we need to convert the trust graph into
  // a flow network, which is a directed graph with residual edges holding a
  // "flow" and a "capacity" value where the "capacity" represents the token
  // values a node holds.
  //
  // Read more about it here: https://en.wikipedia.org/wiki/Flow_network
  const network = getFlowNetwork({
    nodes: extendedGraph.nodes,
    edges: extendedGraph.edges,
  });

  // 3. FIND MAXIMUM FLOW IN NETWORK
  //
  // We calculate the maximum value we can transfer from a "source" node to a
  // "sink" node in the network. Through this we receive all needed information
  // to find potential transfer steps to finally transact through the network.
  //
  // For finding the maximum flow we make use of the Ford–Fulkerson algorithm.
  //
  // Read more about it here:
  // https://en.wikipedia.org/wiki/Ford%E2%80%93Fulkerson_algorithm
  const indexSource = extendedGraph.nodes.indexOf(from);
  const indexSink = extendedGraph.nodes.indexOf(to);
  const maxFlowValue = findMaxFlow({ network, indexSource, indexSink });

  // 4. BRING BACK THE GRAPH TO ITS ORIGINAL FORM
  //
  // We can remove the extended edges now and additionally clean up unneeded
  // nodes and edges as we're not interested in edges which have zero flow.
  const cleanedGraph = removeTokenEdges({ network });

  // 5. FIND TRANSFER STEPS IN GRAPH
  //
  // Finally we run a search algorithm in the graph, starting from the receiver
  // node, to find all transfer steps to successfully and transitively transact
  // the required value via multiple tokens. Each returned step will contain a)
  // how many tokens b) which token c) from which node to which we will send.
  const isTransferPossible = maxFlowValue >= value;
  const transferValue = isTransferPossible ? value : 0;
  const transferSteps = isTransferPossible
    ? findTransferSteps({
        edges: cleanedGraph.edges,
        to,
        value,
      })
    : [];

  return {
    from,
    to,
    maxFlowValue,
    transferSteps,
    transferValue,
  };
}
