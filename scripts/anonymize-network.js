#!/usr/bin/env node

const fs = require('fs');

if (process.argv.length < 4) {
  throw new Error('Please enter paths');
}

const { edges, nodes } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const dict = {};

const newNodes = nodes.map((node, index) => {
  dict[node] = index.toString();
  return index.toString();
});

Object.keys(dict)
  .sort()
  .map((node) => {
    // eslint-disable-next-line no-console
    console.log(`Node "${node}" will be ${dict[node]}`);
  });

const newEdges = edges.map((edge) => {
  return {
    from: nodes.indexOf(edge.from).toString(),
    to: nodes.indexOf(edge.to).toString(),
    token: nodes.indexOf(edge.token).toString(),
    capacity: edge.capacity,
  };
});

fs.writeFileSync(
  process.argv[3],
  JSON.stringify({
    nodes: newNodes,
    edges: newEdges,
  }),
);
