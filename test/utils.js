function pad(str, len = 6) {
  return str.toString().padStart(len, ' ');
}

export function expectSuccessfulTransfer({
  from,
  nodes,
  to,
  transferSteps,
  value,
}) {
  const transferDebugSteps = [];

  const fromIndex = nodes.indexOf(from);
  const toIndex = nodes.indexOf(to);

  const balances = nodes.map(() => 0);
  balances[fromIndex] = value;

  transferSteps.forEach((transaction) => {
    const stepFromIndex = nodes.indexOf(transaction.from);
    const stepToIndex = nodes.indexOf(transaction.to);

    if (stepFromIndex < 0) {
      throw new Error('from node does not exist');
    }

    if (stepToIndex < 0) {
      throw new Error('to node does not exist');
    }

    if (transaction.value <= 0) {
      throw new Error('transaction value is invalid');
    }

    balances[stepFromIndex] -= transaction.value;
    balances[stepToIndex] += transaction.value;

    transferDebugSteps.push(
      [
        `[Step ${pad(transaction.step, 2)}]`,
        `{${pad(stepFromIndex, 3)} }`,
        `--(${pad(transaction.value)}`,
        `${pad(nodes.indexOf(transaction.token), 3)} T )-->`,
        `{${pad(stepToIndex, 3)} }`,
        `[${balances.map((balance) => pad(balance))}]`,
      ].join(' '),
    );
  });

  if (transferSteps.length > 0) {
    if (balances[fromIndex] !== 0) {
      throw new Error('Error: Source balance is not zero');
    }

    if (balances[toIndex] !== value) {
      throw new Error('Error: Target balance is wrong');
    }
  }

  balances.forEach((balance) => {
    if (balance < 0) {
      throw new Error('Error: Balances can not lower than zero');
    }
  });

  return transferDebugSteps.join('\n');
}
