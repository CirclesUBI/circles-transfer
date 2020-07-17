const VALID_TYPES = ['string', 'number', 'array', 'object', 'function'];

export function validateDefinition(value, key) {
  if (value === null || typeof value === 'undefined') {
    throw new Error(`"${key}" is missing`);
  }
}

export function validateType(value, type, key) {
  validateDefinition(value, key);
  validateDefinition(type, 'type');
  validateDefinition(key, 'key');

  if (!VALID_TYPES.includes(type)) {
    throw new Error(`"${type}" is invalid type`);
  }

  if (
    (type === 'object' &&
      (typeof value === 'function' || Array.isArray(value))) ||
    (type === 'array' && !Array.isArray(value)) ||
    (type !== 'array' && typeof value !== type)
  ) {
    throw new Error(`"${key}" has to be of type "${type}"`);
  }

  if (typeof value === 'string' && value.length === 0) {
    throw new Error(`"${key}" is empty`);
  }
}

export function validateTypes(obj, types) {
  validateType(obj, 'object', 'obj');
  validateType(types, 'object', 'types');

  Object.keys(types).forEach((key) => {
    validateType(obj[key], types[key], key);
  });
}

export function validateNode(nodes, node) {
  validateType(nodes, 'array', 'nodes');
  validateType(node, 'string', 'node');

  if (!nodes.includes(node)) {
    throw new Error(`Graph does not contain "${node}" node`);
  }
}
