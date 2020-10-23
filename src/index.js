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
        transferSteps: maxFlowValue !== value ? [] : transferSteps,
        transferValue: value,
      });
    });
  });
}
