const factorials = [1];

function factorial(n) {
  if (!factorials[n]) {
    factorials[n] = n * factorial(n - 1);
  }

  return factorials[n];
}

function mapFactorials(countMap, charInUse) {
  return [...countMap.entries()].reduce(
    (total, [char, count]) => total * factorial(char === charInUse ? count - 1 : count),
    1
  );
}

function listPosition(word) {
  const chars = word.split('');
  const countMap = [...chars]
    .sort()
    .reduce((map, char) => map.set(char, (map.get(char) || 0) + 1), new Map());

  let position = 1;

  for (const [index, char] of chars.entries()) {
    const charsLeft = chars.length - 1 - index;

    for (const keyChar of countMap.keys()) {
      if (keyChar === char) {
        break;
      }

      position += factorial(charsLeft) / mapFactorials(countMap, keyChar);
    }

    if (countMap.get(char) === 1) {
      countMap.delete(char);
    } else {
      countMap.set(char, countMap.get(char) - 1);
    }
  }

  return position;
}
