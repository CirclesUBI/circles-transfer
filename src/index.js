import { exec } from 'child_process';
import { validateType, validateTypes } from './validate';

// "100000000" > "200" returns false when comparing number strings but with
// this workaround we're able to compare long numbers as strings:
export function isPathGiven(a, b) {
  // Which one is shorter?
  if (a.length < b.length) {
    return true;
  } else if (b.length < a.length) {
    return false;
  }

  // It does not matter, its the same string:
  if (a === b) {
    return true;
  }

  // If they have the same length, we can actually do this:
  return a < b;
}

export default function findTransitiveTransfer(
  { from, to, value },
  configuration,
) {
  // Validate arguments
  validateTypes(
    {
      from,
      to,
      value,
    },
    {
      from: 'string',
      to: 'string',
      value: 'string',
    },
  );

  if (value === '0' || value.includes('-')) {
    throw new Error('"value" has to be positive value (>0)');
  }

  // Validate configuration
  validateType(configuration, 'object', 'configuration');
  validateTypes(configuration, {
    edgesFile: 'string',
    pathfinderExecutable: 'string',
    timeout: 'number',
  });

  const args = [
    configuration.pathfinderExecutable,
    from,
    to,
    value,
    configuration.edgesFile,
  ].join(' ');

  return new Promise((resolve, reject) => {
    exec(args, { timeout: configuration.timeout }, (error, stdout, stderr) => {
      if (error || stderr) {
        reject(new Error(`Process failed with ${args}`));
        return;
      }

      const { maxFlowValue, transferSteps } = JSON.parse(stdout);

      resolve({
        from,
        to,
        maxFlowValue,
        transferSteps: isPathGiven(value, maxFlowValue) ? transferSteps : [],
        transferValue: value,
      });
    });
  });
}
