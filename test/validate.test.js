import {
  validateDefinition,
  validateNode,
  validateType,
  validateTypes,
} from '../src/validate';

describe('validateDefinition', () => {
  it('should throw if value is not defined', () => {
    expect(() => validateDefinition(null, 'test')).toThrow();
    expect(() => validateDefinition(undefined, 'test')).toThrow();
  });

  it('should not throw if value is defined', () => {
    expect(() => validateDefinition('', 'test')).not.toThrow();
    expect(() => validateDefinition(123, 'test')).not.toThrow();
  });
});

describe('validateType', () => {
  it('should throw if value is not defined', () => {
    expect(() => validateType(null, 'string', 'test')).toThrow();
    expect(() => validateType(undefined, 'array', 'test')).toThrow();
  });

  it('should throw if string is empty', () => {
    expect(() => validateType('', 'string', 'test')).toThrow();
  });

  it('should throw if type is wrong', () => {
    expect(() => validateType('Hello, World!', 'number', 'test')).toThrow();
    expect(() => validateType([], 'string', 'test')).toThrow();
    expect(() => validateType(123, 'array', 'test')).toThrow();
    expect(() => validateType(() => {}, 'object', 'test')).toThrow();
    expect(() => validateType([], 'object', 'test')).toThrow();
  });

  it('should throw if type is invalid', () => {
    expect(() => validateType('Hello, World!', 'lala', 'test')).toThrow();
  });

  it('should not throw if type is correct', () => {
    expect(() => validateType('Hello, World!', 'string', 'test')).not.toThrow();
    expect(() => validateType([], 'array', 'test')).not.toThrow();
    expect(() => validateType(123.3, 'number', 'test')).not.toThrow();
    expect(() => validateType(123, 'number', 'test')).not.toThrow();
    expect(() => validateType({}, 'object', 'test')).not.toThrow();
    expect(() => validateType(() => {}, 'function', 'test')).not.toThrow();
  });
});

describe('validateTypes', () => {
  it('should throw if arguments are not defined', () => {
    expect(() => validateTypes()).toThrow();
    expect(() => validateTypes({ test: 42 })).toThrow();
  });

  it('should throw if types are invalid', () => {
    expect(() =>
      validateTypes(
        { test: 42, testString: 'lala' },
        {
          test: 'array',
          testString: 'string',
        },
      ),
    ).toThrow();

    expect(() =>
      validateTypes(
        { test: 42, testString: 'lala' },
        {
          test: 'number',
          testString: 'array',
        },
      ),
    ).toThrow();

    expect(() =>
      validateTypes(
        { test: 42, testString: '' },
        {
          test: 'number',
          testString: 'string',
        },
      ),
    ).toThrow();
  });

  it('should not throw if types valid', () => {
    expect(() =>
      validateTypes(
        { test: 42, testString: 'lala' },
        {
          test: 'number',
          testString: 'string',
        },
      ),
    ).not.toThrow();

    expect(() =>
      validateTypes(
        { test: 42, testString: 'lala', testArray: [], testObject: {} },
        {
          test: 'number',
          testString: 'string',
          testArray: 'array',
          testObject: 'object',
        },
      ),
    ).not.toThrow();
  });
});

describe('validateNode', () => {
  it('should throw if arguments are invalid', () => {
    expect(() => validateNode()).toThrow();
    expect(() => validateNode([])).toThrow();
    expect(() => validateNode([], 123)).toThrow();
  });

  it('should throw if node is missing', () => {
    expect(() => validateNode(['A', 'B', 'C'], 'D')).toThrow();
  });

  it('should not throw if node exists', () => {
    expect(() => validateNode(['A', 'B', 'C'], 'A')).not.toThrow();
  });
});
