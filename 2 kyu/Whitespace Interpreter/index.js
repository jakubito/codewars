const STACK_PUSH = Symbol('STACK_PUSH'),
  STACK_DUPLICATE = Symbol('STACK_DUPLICATE'),
  STACK_DUPLICATE_TOP = Symbol('STACK_DUPLICATE_TOP'),
  STACK_SWAP = Symbol('STACK_SWAP'),
  STACK_DISCARD = Symbol('STACK_DISCARD'),
  STACK_DISCARD_TOP = Symbol('STACK_DISCARD_TOP'),
  MATH_ADD = Symbol('MATH_ADD'),
  MATH_SUBTRACT = Symbol('MATH_SUBTRACT'),
  MATH_MULTIPLY = Symbol('MATH_MULTIPLY'),
  MATH_DIVIDE = Symbol('MATH_DIVIDE'),
  MATH_MODULO = Symbol('MATH_MODULO'),
  HEAP_SET = Symbol('HEAP_SET'),
  HEAP_GET = Symbol('HEAP_GET'),
  IO_WRITE_CHAR = Symbol('IO_WRITE_CHAR'),
  IO_WRITE_NUMBER = Symbol('IO_WRITE_NUMBER'),
  IO_READ_CHAR = Symbol('IO_READ_CHAR'),
  IO_READ_NUMBER = Symbol('IO_READ_NUMBER'),
  FLOW_SET_LABEL = Symbol('FLOW_SET_LABEL'),
  FLOW_JUMP = Symbol('FLOW_JUMP'),
  FLOW_JUMP_ZERO = Symbol('FLOW_JUMP_ZERO'),
  FLOW_JUMP_NEGATIVE = Symbol('FLOW_JUMP_NEGATIVE'),
  FLOW_START_SUBROUTINE = Symbol('FLOW_START_SUBROUTINE'),
  FLOW_END_SUBROUTINE = Symbol('FLOW_END_SUBROUTINE'),
  FLOW_TERMINATE = Symbol('FLOW_TERMINATE');

const label = '((?:\t| )*)\n',
  number = `(\t| )?${label}`;

const rules = [
  [STACK_PUSH, new RegExp(`^ {2}${number}`), parseNumber],
  [STACK_DUPLICATE, new RegExp(`^ \t ${number}`), parseNumber],
  [STACK_DISCARD, new RegExp(`^ \t\n${number}`), parseNumber],
  [STACK_DUPLICATE_TOP, new RegExp('^ \n ')],
  [STACK_SWAP, new RegExp('^ \n\t')],
  [STACK_DISCARD_TOP, new RegExp('^ \n\n')],
  [MATH_ADD, new RegExp('^\t {3}')],
  [MATH_SUBTRACT, new RegExp('^\t {2}\t')],
  [MATH_MULTIPLY, new RegExp('^\t {2}\n')],
  [MATH_DIVIDE, new RegExp('^\t \t ')],
  [MATH_MODULO, new RegExp('^\t \t\t')],
  [HEAP_SET, new RegExp('^\t\t ')],
  [HEAP_GET, new RegExp('^\t\t\t')],
  [FLOW_SET_LABEL, new RegExp(`^\n {2}${label}`)],
  [FLOW_JUMP, new RegExp(`^\n \n${label}`)],
  [FLOW_JUMP_ZERO, new RegExp(`^\n\t ${label}`)],
  [FLOW_JUMP_NEGATIVE, new RegExp(`^\n\t\t${label}`)],
  [FLOW_START_SUBROUTINE, new RegExp(`^\n \t${label}`)],
  [FLOW_END_SUBROUTINE, new RegExp('^\n\t\n')],
  [FLOW_TERMINATE, new RegExp('^\n\n\n')],
  [IO_WRITE_CHAR, new RegExp('^\t\n {2}')],
  [IO_WRITE_NUMBER, new RegExp('^\t\n \t')],
  [IO_READ_CHAR, new RegExp('^\t\n\t ')],
  [IO_READ_NUMBER, new RegExp('^\t\n\t\t')],
];

const operations = {
  [STACK_PUSH]: ({ stack }, number) => {
    stack.push(number);
  },
  [STACK_DUPLICATE]: ({ stack }, number) => {
    stack.push(stack[stack.length - 1 - number]);
  },
  [STACK_DISCARD]: ({ stack }, number) => {
    if (number < 0 || number >= stack.length) {
      stack.splice(0, stack.length - 1);
    } else {
      stack.splice(-number - 1, number);
    }
  },
  [STACK_DUPLICATE_TOP]: ({ stack }) => {
    stack.push(stack[stack.length - 1]);
  },
  [STACK_SWAP]: ({ stack }) => {
    const last = stack[stack.length - 1];

    stack[stack.length - 1] = stack[stack.length - 2];
    stack[stack.length - 2] = last;
  },
  [STACK_DISCARD_TOP]: ({ stack }) => {
    stack.splice(-1);
  },
  [MATH_ADD]: ({ stack }) => {
    const a = stack.pop();
    const b = stack.pop();

    stack.push(b + a);
  },
  [MATH_SUBTRACT]: ({ stack }) => {
    const a = stack.pop();
    const b = stack.pop();

    stack.push(b - a);
  },
  [MATH_MULTIPLY]: ({ stack }) => {
    const a = stack.pop();
    const b = stack.pop();

    stack.push(b * a);
  },
  [MATH_DIVIDE]: ({ stack }) => {
    const a = stack.pop();
    const b = stack.pop();

    if (a === 0) {
      throw new Error('Division by zero');
    }

    stack.push(Math.floor(b / a));
  },
  [MATH_MODULO]: ({ stack }) => {
    const a = stack.pop();
    const b = stack.pop();

    if (a === 0) {
      throw new Error('Division by zero');
    }

    stack.push(b - a * Math.floor(b / a));
  },
  [HEAP_SET]: ({ stack, heap }) => {
    const value = stack.pop();
    const address = stack.pop();

    heap[address] = value;
  },
  [HEAP_GET]: ({ stack, heap }) => {
    const address = stack.pop();

    if (heap[address] === undefined) {
      throw new Error(`Invalid heap address: ${address}`);
    }

    stack.push(heap[address]);
  },
  [FLOW_SET_LABEL]: () => {},
  [FLOW_JUMP]: ({ labels }, label) => labels[label],
  [FLOW_JUMP_ZERO]: ({ stack, labels }, label) => {
    if (stack.pop() === 0) {
      return labels[label];
    }
  },
  [FLOW_JUMP_NEGATIVE]: ({ stack, labels }, label) => {
    if (stack.pop() < 0) {
      return labels[label];
    }
  },
  [FLOW_START_SUBROUTINE]: ({ labels, history, position }, label) => {
    history.push(position + 1);

    return labels[label];
  },
  [FLOW_END_SUBROUTINE]: ({ history }) => history.pop(),
  [FLOW_TERMINATE]: ({ tokens }) => tokens.length,
  [IO_WRITE_CHAR]: ({ stack, io }) => {
    const value = stack.pop();

    io.output += Number.isInteger(value) ? String.fromCharCode(value) : value;
  },
  [IO_WRITE_NUMBER]: ({ stack, io }) => {
    io.output += stack.pop();
  },
  [IO_READ_CHAR]: ({ stack, heap, io }) => {
    const char = io.input.charAt(0);
    const address = stack.pop();

    heap[address] = char;
    io.input = io.input.substring(1);
  },
  [IO_READ_NUMBER]: ({ stack, heap, io }) => {
    const [fullMatch, match] = io.input.match(/^(0x[0-9a-fA-F]+|[0-9]+)\n/);
    const address = stack.pop();

    if (!match) {
      throw new Error('Invalid input number');
    }

    heap[address] = parseInt(match);
    io.input = io.input.substring(fullMatch.length);
  },
};

function whitespace(code, input) {
  const tokens = analyze(code);
  const output = interpret(tokens, input);

  return output;
}

function analyze(code) {
  const tokens = [];
  let input = code.replace(/[^\s]/gm, '');

  while (input.length > 0) {
    let match;

    for (const [operation, rule, parser = identity] of rules) {
      match = input.match(rule);

      if (match) {
        const [fullMatch, ...groups] = match;

        tokens.push([operation, parser(...groups)]);
        input = input.slice(fullMatch.length);

        break;
      }
    }

    if (!match) {
      throw new Error(`No rule matching input: ${debug(input)}`);
    }
  }

  if (!tokens.find(([operation]) => operation === FLOW_TERMINATE)) {
    throw new Error('Invalid termination');
  }

  return tokens;
}

function interpret(tokens, input) {
  let position = 0;

  const stack = [],
    heap = {},
    labels = {},
    history = [],
    io = { input, output: '' };

  for (const [index, [operation, param]] of tokens.entries()) {
    if (operation === FLOW_SET_LABEL) {
      if (labels[param] !== undefined) {
        throw new Error('Label already exists');
      }

      labels[param] = index;
    }
  }

  while (position < tokens.length) {
    const [operation, param] = tokens[position];
    const state = { tokens, position, stack, heap, labels, history, io };
    const newPosition = execute(operation, param, state);

    if (Number.isInteger(newPosition)) {
      position = newPosition;
    } else {
      position += 1;
    }
  }

  return io.output;
}

function execute(operation, param, state) {
  const { stack, labels, history, io } = state;

  switch (operation) {
    case STACK_DUPLICATE:
      if (stack[stack.length - 1 - param] === undefined) {
        throw new Error(`Undefined stack value at position: ${stack.length - 1 - param}`);
      }
      break;
    case STACK_SWAP:
    case MATH_ADD:
    case MATH_SUBTRACT:
    case MATH_MULTIPLY:
    case MATH_DIVIDE:
    case MATH_MODULO:
    case HEAP_SET:
      if (stack.length < 2) {
        throw new Error(`Invalid stack size: ${stack.length}`);
      }
      break;
    case FLOW_END_SUBROUTINE:
      if (history.length === 0) {
        throw new Error('No previous position found');
      }
      break;
    case FLOW_JUMP_ZERO:
    case FLOW_JUMP_NEGATIVE:
      if (stack.length === 0) {
        throw new Error('Stack empty');
      }
    case FLOW_JUMP:
    case FLOW_START_SUBROUTINE:
      if (labels[param] === undefined) {
        throw new Error(`Label does not exist: ${param}`);
      }
      break;
    case IO_READ_CHAR:
    case IO_READ_NUMBER:
      if (io.input.length === 0) {
        throw new Error('Input empty');
      }
    case STACK_DUPLICATE_TOP:
    case STACK_DISCARD_TOP:
    case HEAP_GET:
    case IO_WRITE_CHAR:
    case IO_WRITE_NUMBER:
      if (stack.length === 0) {
        throw new Error('Stack empty');
      }
  }

  return operations[operation](state, param);
}

function parseNumber(sign, value) {
  if (!sign) {
    throw new Error('Invalid number');
  }

  if (!value) {
    return 0;
  }

  const binary = value.replace(/ /g, '0').replace(/\t/g, '1');

  return parseInt(binary, 2) * (sign === '\t' ? -1 : 1);
}

function identity(value) {
  return value;
}

function debug(code) {
  return code.replace(/ /g, 'S').replace(/\t/g, 'T').replace(/\n/g, 'N');
}
