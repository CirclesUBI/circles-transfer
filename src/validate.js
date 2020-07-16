export function validateType(obj, type, key) {
  if (
    obj === null ||
    typeof obj === 'undefined' ||
    (typeof obj === 'string' && obj.length === 0)
  ) {
    throw new Error(`"${key}" is missing`);
  }

  if (type === 'array') {
    if (!Array.isArray(obj)) {
      throw new Error(`"${key}" has to be of type "array"`);
    }
  } else {
    if (typeof obj !== type) {
      throw new Error(`"${key}" has to be of type "${type}"`);
    }
  }
}

export function validateTypes(obj, types) {
  Object.keys(types).forEach((key) => {
    validateType(obj[key], types[key], key);
  });
}

export function validateNode(nodes, node) {
  if (!nodes.includes(node)) {
    throw new Error(`Graph does not contain "${node}" node`);
  }
}
