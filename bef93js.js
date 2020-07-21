const { performance } = require('perf_hooks');
const { readFileSync } = require('fs');
const readline = require('readline');

let getInputChar = () => {
  let l = inputBuffer.length;
  let r = inputBuffer.charCodeAt(l);
  inputBuffer = inputBuffer.substr(0, l - 1);
  return r;
};

let inputBuffer = '';

process.stdin.resume();
process.stdin.setEncoding('ascii');

let charInputEnabled = true;

process.stdin.on('data', (c) => {
  if (!charInputEnabled) return;

  inputBuffer += c;
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let getInputInt = () => {
  return new Promise((res, rej) => {
    charInputEnabled = false;
    rl.question('', (int) => {
      charInputEnabled = true;
      return res(parseInt(int));
    })
  });
}

function bold(text) {
  return `\x1b[1m${text}\x1b[0m`;
}

function rgb(r, g, b, text) {
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

function showCode(input, pnt) {
  let pos = pntToPos(pnt, input);

  let final = input.substr(0, pos);
  final += rgb(0, 200, 0, bold(input[pos]));
  final += input.substr(pos + 1);

  return final;
}

function popStack(stack) {
  let v = stack.pop();
  return v === undefined ? 0 : v;
}

function writeToTerminal(s) {
  process.stdout.write(s);
  return s;
}

async function interpret(input) {
  let pnt = [0, 0];
  let dir = 'right';
  let stack = [];

  let stringMode = false;
  let skip = false;

  let outputBuffer = '';

  while (input[pntToPos(pnt, input)] !== '@') {
    let cur = input[pntToPos(pnt, input)];
    let ab;

    //console.log(showCode(input, pnt), dir, stack);
    //await new Promise(resolve => setTimeout(resolve, 300));

    if (skip !== true && !stringMode) switch (cur) {
      case '+':
        ab = getABFromStack(stack);
        stack.push(ab[0] + ab[1]);
        break;
      case '-':
        ab = getABFromStack(stack);
        stack.push(ab[1] - ab[0]);
        break;
      case '*':
        ab = getABFromStack(stack);
        stack.push(ab[0] * ab[1]);
        break;
      case '/':
        ab = getABFromStack(stack);
        stack.push(ab[0] === 0 ? 0 : Math.floor(ab[1] / ab[0]));
        break;
      case '%':
        ab = getABFromStack(stack);
        stack.push(ab[1] % ab[0]);
        break;
      case '!':
        stack.push(popStack(stack) === 0 ? 1 : 0)
        break;
      case '`':
        ab = getABFromStack(stack);
        stack.push(ab[1] > ab[0] ? 1 : 0);
        break;

      case '>':
        dir = 'right';
        break;
      case '<':
        dir = 'left';
        break;
      case '^':
        dir = 'up';
        break;
      case 'v':
        dir = 'down';
        break;
      case '?':
        dir = ['right', 'left', 'up', 'down'][Math.floor(Math.random() * 4)];
        break;
    
      case '_':
        dir = popStack(stack) === 0 ? 'right' : 'left';
        break;
      case '|':
        dir = popStack(stack) === 0 ? 'down' : 'up';
        break;
      
      case '"':
        break;
      
      case ':':
        let dup = stack[stack.length - 1];
        if (dup !== undefined) stack.push(dup);
        break;
      case '\\':
        let top = popStack(stack);
        let bottom = popStack(stack);
        stack.push(top);
        stack.push(bottom);
        break;
      case '$':
        popStack(stack);
        break;
      
      case '.':
        outputBuffer += writeToTerminal(popStack(stack).toString());
        //process.stdout.write(popStack(stack).toString());
        break;
      case ',':
        outputBuffer += writeToTerminal(String.fromCharCode(popStack(stack)));
        //process.stdout.write(String.fromCharCode(popStack(stack)));
        break;
      
      case '#':
        skip = true;
        break;
      
      case 'g':
        break;
      case 'p':
        break;
      
      case '&':
        stack.push(await getInputInt());
        break;
      case '~':
        stack.push(getInputChar());
        break;
      
      default:
        if (/[0-9]/.test(cur)) stack.push(parseInt(cur));
        break;
    }

    if (stringMode) {
      if (cur === '"') {
        stringMode = false;
      } else {
        stack.push(cur.charCodeAt(0));
      }
    } else if (cur === '"') stringMode = true;

    if (cur !== '#') skip = false;

    switch (dir) {
      case 'right':
        pnt[0]++;
        break;
      case 'left':
        pnt[0]--;
        break;
      case 'up':
        pnt[1]--;
        break;
      case 'down':
        pnt[1]++;
        break;
    }
  }

  //console.log(`final output\n${outputBuffer}`);

  return outputBuffer;
}

function getABFromStack(stack) {
  return [popStack(stack), popStack(stack)];
}

function pntToPos(pnt, input) { // pnt: [x, y]
  return pnt[0] + (pnt[1] * (input.split('\n')[0].length + 1));
}

async function wrapper(code) {
  let start = performance.now();

  await interpret(code);

  console.log('\n\nexecution took', `${(performance.now() - start).toPrecision(4)}ms`);

  rl.close();
}

rl.on('close', function() {
  process.exit(0);
});

let file = process.argv[2];

if (file === undefined) {
  console.log('Give a Befunge93 file as input.');
  return;
}

console.log(`${file}\n`);
wrapper(readFileSync(file, 'utf8'));

/*rl.question('Befunge code:\n', async (code) => {
  let start = performance.now();

  await interpret(code);

  console.log('\n\nexecution took', `${(performance.now() - start).toPrecision(4)}ms`);

  rl.close();
});*/