function pad(str, len = 6) {
  return str.toString().padStart(len, ' ');
}

export function expectSuccessfulTransfer({
  from,
  edges,
  to,
  transferSteps,
  transferValue,
}) {
  const nodes = edges.reduce((acc, edge) => {
    if (!acc.includes(edge.from)) {
      acc.push(edge.from);
    }

    if (!acc.includes(edge.to)) {
      acc.push(edge.to);
    }

    return acc;
  }, []);
  const transferDebugSteps = [];

  const fromIndex = nodes.indexOf(from);
  const toIndex = nodes.indexOf(to);
  const balances = nodes.map(() => 0);
  balances[fromIndex] = parseFloat(transferValue);

  transferSteps.forEach((transaction) => {
    const stepFromIndex = nodes.indexOf(transaction.from);
    const stepToIndex = nodes.indexOf(transaction.to);

    if (stepFromIndex < 0) {
      throw new Error('"from" node does not exist');
    }

    if (stepToIndex < 0) {
      throw new Error('"to" node does not exist');
    }

    if (transaction.value <= 0) {
      throw new Error('Transaction value is invalid');
    }

    balances[stepFromIndex] -= parseFloat(transaction.value);
    balances[stepToIndex] += parseFloat(transaction.value);

    const { capacity } = edges.find((edge) => {
      return (
        edge.from === transaction.from &&
        edge.to === transaction.to &&
        edge.token === transaction.token
      );
    });

    if (Number(capacity) < Number(transaction.value)) {
      throw new Error('Transaction value is larger than edge capacity');
    }

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
      throw new Error('Source balance is not zero');
    }

    if (balances[toIndex] !== parseFloat(transferValue)) {
      throw new Error('Target balance is wrong');
    }
  }

  balances.forEach((balance) => {
    if (balance < 0) {
      throw new Error('Balances can not lower than zero');
    }
  });

  return transferDebugSteps.join('\n');
}

export function csvToArray(str, delimiter = ',') {
  const headers = ['from', 'to', 'token', 'capacity'];
  const rows = str.split('\n').filter((row) => row.length > 0);
  const arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[header] = values[index];
      return object;
    }, {});
    return el;
  });
  return arr;
}
