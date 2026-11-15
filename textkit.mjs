#!/usr/bin/env node
// textkit: small text utilities on the command line, with no dependency.
//
//   node textkit.mjs <command> [--file <path>] [--json] [arguments…]
//   node textkit.mjs --help | <command> --help
//
// Each command is a module of its own, src/<command>.mjs, whose `run(args)` takes the command's arguments (strings) and
// returns what to print. A command that is not there yet answers "unknown command", with exit code 2.
//
// The text a command works on is the last of its positionals. It comes from the text argument when there is one, else
// from the file named by --file (read as UTF-8), else from standard input (read to end-of-file; a closed standard input
// is the empty text). Text read from a file or standard input loses at most one trailing newline ("\n" or "\r\n"), so
// that `echo hello | node textkit.mjs title` works on "hello". The flags may appear anywhere after the command; "--"
// ends them, so that a text starting with "--" can still be given as an argument.
import { readFileSync } from "node:fs";

/** The known commands: their usage, and how many positionals come before the text (`truncate <max> <text>`: 1). */
const COMMANDS = {
  slugify: { lead: 0, args: "<text>", about: "turn the text into a URL slug" },
  count: { lead: 0, args: "<text>", about: "count the words in the text" },
  title: { lead: 0, args: "<text>", about: "the text in Title Case" },
  truncate: { lead: 1, args: "<max> <text>", about: "cut the text to at most <max> characters, the ellipsis included" },
  wrap: { lead: 1, args: "<width> <text>", about: "wrap the words on lines of at most <width> characters" },
};

const OPTIONS = `options:
  --file <path>  read the text from a file (UTF-8) instead of the text argument
  --json         print {"command", "input", "output"} as JSON instead of the bare output
  --help         print the usage and exit

With no text argument and no --file, the text is read from standard input.
A text argument wins over --file, and --file over standard input.`;

const usage = () =>
  `usage: node textkit.mjs <command> [--file <path>] [--json] [arguments…]

commands:
${Object.entries(COMMANDS)
  .map(([name, c]) => `  ${`${name} ${c.args}`.padEnd(22)} ${c.about}`)
  .join("\n")}

${OPTIONS}
`;

const commandUsage = (name) => {
  const c = COMMANDS[name] ?? { args: "[arguments…]", about: "" };
  return `usage: node textkit.mjs ${name} [--file <path>] [--json] ${c.args}${c.about ? `\n\n${name}: ${c.about}` : ""}

${OPTIONS}
`;
};

const fail = (message, code) => {
  console.error(message);
  process.exit(code);
};

const [command, ...argv] = process.argv.slice(2);
if (command === "--help" || command === "-h") {
  process.stdout.write(usage());
  process.exit(0);
}
if (!command || !/^[a-z][a-z-]*$/.test(command)) fail("usage: node textkit.mjs <command> [arguments…] (or --help)", 2);

let mod;
try {
  mod = await import(`./src/${command}.mjs`);
} catch {
  fail(`unknown command: ${command}`, 2);
}

// Split the flags from the positionals.
let file;
let json = false;
let help = false;
const positionals = [];
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--") {
    positionals.push(...argv.slice(i + 1));
    break;
  }
  if (arg === "--help" || arg === "-h") help = true;
  else if (arg === "--json") json = true;
  else if (arg === "--file") {
    if (i + 1 >= argv.length) fail(`${command}: --file needs a path`, 2);
    file = argv[++i];
  } else if (arg.startsWith("--file=")) file = arg.slice("--file=".length);
  else positionals.push(arg);
}

if (help) {
  process.stdout.write(commandUsage(command));
  process.exit(0);
}

/** Drops at most one trailing newline from text read from a file or standard input. */
const chomp = (text) => text.replace(/\r?\n$/, "");

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
};

// Resolve the input: a text argument wins over --file, --file over standard input.
const lead = COMMANDS[command]?.lead ?? 0;
if (positionals.length < lead) fail(`${command}: missing argument\n${commandUsage(command).trimEnd()}`, 2);
const args = [...positionals];
let input;
if (positionals.length > lead) input = positionals[positionals.length - 1];
else {
  if (file !== undefined) {
    try {
      input = chomp(readFileSync(file, "utf8"));
    } catch (e) {
      fail(`${command}: cannot read ${file}: ${e instanceof Error ? e.message : String(e)}`, 1);
    }
  } else {
    input = chomp(await readStdin());
  }
  args.push(input);
}

try {
  const out = mod.run(args);
  const bare = out === undefined || out === null ? "" : String(out);
  if (json) process.stdout.write(`${JSON.stringify({ command, input, output: bare })}\n`);
  else if (out !== undefined && out !== null) process.stdout.write(`${bare}\n`);
} catch (e) {
  fail(`${command}: ${e instanceof Error ? e.message : String(e)}`, 1);
}
