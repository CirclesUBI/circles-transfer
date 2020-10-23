#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');

function generateRandomAddress() {
  const buf = Buffer.alloc(20);
  return `0x${crypto.randomFillSync(buf).toString('hex')}`;
}

if (process.argv.length < 4) {
  throw new Error('Please enter paths');
}

const { edges, nodes } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const dict = {};

const newNodes = nodes.map((node) => {
  dict[node] = generateRandomAddress();
  return dict[node];
});

Object.keys(dict)
  .sort()
  .map((node) => {
    // eslint-disable-next-line no-console
    console.log(`Node "${node}" will be ${dict[node]}`);
  });

const newEdges = edges.map((edge) => {
  return {
    from: newNodes[nodes.indexOf(edge.from)],
    to: newNodes[nodes.indexOf(edge.to)],
    token: newNodes[nodes.indexOf(edge.token)],
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
