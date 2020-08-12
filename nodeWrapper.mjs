import { interpret } from './bef93js.mjs';

import { readFileSync } from 'fs';
import * as readline from "readline";

let getInputChar = async () => {
  inputBuffer = '';

  while (inputBuffer.length < 1) { await new Promise(res => setTimeout(res, 1)); }

  return inputBuffer[inputBuffer.length - 1];
};

let inputBuffer = '';

process.stdin.resume();
process.stdin.setEncoding('utf-8');

process.stdin.on('data', (c) => {
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
    });
  });
}

rl.on('close', function() {
  process.exit(0);
});

async function wrapper(code) {
  await interpret(code, {getInputChar, getInputInt, sendOutput: (s) => process.stdout.write(s)});

  rl.close();
}

let file = process.argv[2];

if (file === undefined) {
  console.error('Give a Befunge93 file as input.');
  process.exit(1);
}

console.log(`${file}\n`);
wrapper(readFileSync(file, 'utf8'));