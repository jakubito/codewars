function first(array) {
  return array[0];
}

function last(array) {
  return array[array.length - 1];
}

function process(buffer) {
  return buffer.length < 3 ? buffer : [`${first(buffer)}-${last(buffer)}`];
}

function solution(numbers) {
  const result = [];
  let buffer = [];

  for (const number of numbers) {
    if (buffer.length && number !== last(buffer) + 1) {
      result.push(...process(buffer));

      buffer = [];
    }

    buffer.push(number);
  }

  result.push(...process(buffer));

  return result.join();
}
