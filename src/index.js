import { exec } from 'child_process';
import { validateType, validateTypes } from './validate';

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
      value: 'number',
    },
  );

  if (value <= 0) {
    throw new Error('"value" has to be positive value (>0)');
  }

  // Validate configuration
  validateType(configuration, 'object', 'configuration');
  validateTypes(configuration, {
    pathfinderExecutable: 'string',
    edgesFile: 'string',
  });

  const args = [
    configuration.pathfinderExecutable,
    from,
    to,
    value,
    configuration.edgesFile,
  ].join(' ');

  return new Promise((resolve, reject) => {
    exec(args, (error, stdout, stderr) => {
      if (error || stderr) {
        reject(new Error(`Process failed with ${args}`));
        return;
      }

      const { maxFlowValue, transferSteps } = JSON.parse(stdout);

      resolve({
        from,
        to,
        maxFlowValue,
        transferSteps,
        transferValue: value,
      });
    });
  });
}
