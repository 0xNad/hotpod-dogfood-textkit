#!/usr/bin/env node
// textkit: small text utilities on the command line, with no dependency.
//
//   node textkit.mjs <command> [arguments…]
//
// Each command is a module of its own, src/<command>.mjs, whose `run(args)` takes the command's arguments (strings) and
// returns what to print. A command that is not there yet answers "unknown command", with exit code 2.
const [command, ...args] = process.argv.slice(2);
if (!command || !/^[a-z][a-z-]*$/.test(command)) {
  console.error("usage: node textkit.mjs <command> [arguments…]");
  process.exit(2);
}
let mod;
try {
  mod = await import(`./src/${command}.mjs`);
} catch {
  console.error(`unknown command: ${command}`);
  process.exit(2);
}
try {
  const out = mod.run(args);
  if (out !== undefined && out !== null) process.stdout.write(`${out}\n`);
} catch (e) {
  console.error(`${command}: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}
