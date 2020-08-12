export let version = '1.0.0';

let internalHaltChecks = {};

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
  const v = stack.pop();
  return v === undefined ? 0 : v;
}

export async function interpret(input, {getInputChar, getInputInt, sendOutput}, id, stack = []) {
  let pnt = [0, 0];
  let dir = 'right';

  let stringMode = false;
  let skip = false;

  if (id !== undefined) internalHaltChecks[id] = false;

  let commandNumber = 0;

  while (input[pntToPos(pnt, input)] !== '@') {
    let cur = input[pntToPos(pnt, input)];
    let ab;

    //console.log(showCode(input, pnt), dir, stack);
    //await new Promise(resolve => setTimeout(resolve, 30));

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
        sendOutput(popStack(stack).toString());
        break;
      case ',':
        sendOutput(String.fromCharCode(popStack(stack)));
        break;
      
      case '#':
        skip = true;
        break;
      
      case 'g':
        let y1 = popStack(stack);
        let x1 = popStack(stack);

        stack.push(input.charCodeAt(pntToPos([x1, y1], input)));
        break;
      case 'p':
        let y2 = popStack(stack);
        let x2 = popStack(stack);

        let v = String.fromCharCode(popStack() % 256);

        let index = pntToPos([x2, y2], input);

        input = input.substr(0, index) + v + input.substr(index + 1);
        break;
      
      case '&':
        stack.push(await getInputInt());
        break;
      case '~':
        stack.push(await getInputChar());
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

    // if (commandNumber % 10 === 0) await new Promise(res => setTimeout(res, 0)); // Allows halting / cancelling via Ctrl+C
    if (id !== undefined && internalHaltChecks[id] === true) break;
  }

  if (id !== undefined) delete internalHaltChecks[id];

  return {stack};
}

export function haltInterpret(id) {
  if (internalHaltChecks[id] === undefined) return false;
  internalHaltChecks[id] = true;

  return true;
}

function getABFromStack(stack) {
  return [popStack(stack), popStack(stack)];
}

function pntToPos(pnt, input) { // pnt: [x, y]
  return pnt[0] + (pnt[1] * (input.split('\n')[0].length + 1));
}