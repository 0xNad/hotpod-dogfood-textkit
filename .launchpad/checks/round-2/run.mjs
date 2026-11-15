// Round 2's checks: every command reads its text from a file (--file <path>) or from standard input when no text is
// given, as well as from its argument; --json prints {"command", "input", "output"} instead of the bare output;
// textkit.mjs --help and <command> --help print the usage; the README documents it all. Each command runs as
// `node textkit.mjs …` in a child process (the kit's entry runner); round 1 pins the bare outputs, these checks
// test only what round 2 adds. The kit is vendored in ./lib (Hotpod's /kit/checks/).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { check, harness } from "./lib/harness.mjs";
import { ROOT, entry, input, succeeds } from "./lib/entry.mjs";

const { test, done } = harness();
const cli = entry("node", ["textkit.mjs"]);
const prints = async (args, want) => {
  const r = await succeeds(cli, args);
  const got = r.out.replace(/\n$/, "");
  check(got === want, `node textkit.mjs ${args.map((a) => JSON.stringify(a)).join(" ")} printed ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
};
const printsJson = async (args, want) => {
  const r = await succeeds(cli, args);
  let obj;
  try {
    obj = JSON.parse(r.out);
  } catch {
    throw new Error(`${r.cmd} printed ${JSON.stringify(r.out.slice(0, 160))}, not JSON`);
  }
  for (const key of ["command", "input", "output"]) {
    check(obj[key] === want[key], `${r.cmd}: "${key}" is ${JSON.stringify(obj[key])}, expected ${JSON.stringify(want[key])}`);
  }
};

await test("slugify reads its text from a file", async () => {
  const file = input("Crème Brûlée, à la carte!", "text.txt");
  await prints(["slugify", "--file", file], "creme-brulee-a-la-carte");
});
await test("count reads standard input when no text is given", async () => {
  const r = await cli(["count"], { stdin: "naïve café, Привет мир" });
  check(r.code === 0, `node textkit.mjs count (text on standard input) exited with ${r.code ?? r.signal}`);
  const got = r.out.replace(/\n$/, "");
  check(got === "4", `node textkit.mjs count (text on standard input) printed ${JSON.stringify(got)}, expected "4"`);
});
await test("truncate takes --file with its max", async () => {
  const file = input("The quick brown fox", "fox.txt");
  await prints(["truncate", "12", "--file", file], "The quick…");
});
await test("wrap reads standard input", async () => {
  const r = await cli(["wrap", "10"], { stdin: "The quick brown fox jumps over the lazy dog" });
  check(r.code === 0, `node textkit.mjs wrap 10 (text on standard input) exited with ${r.code ?? r.signal}`);
  const got = r.out.replace(/\n$/, "");
  const want = "The quick\nbrown fox\njumps over\nthe lazy\ndog";
  check(got === want, `node textkit.mjs wrap 10 (text on standard input) printed ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
});
await test("--json prints the command, the input and the output", async () => {
  await printsJson(["slugify", "--json", "Hello, World!"], { command: "slugify", input: "Hello, World!", output: "hello-world" });
});
await test("--json works with a file input", async () => {
  const file = input("one two  three", "words.txt");
  await printsJson(["count", "--json", "--file", file], { command: "count", input: "one two  three", output: "3" });
});
await test("textkit.mjs --help prints the usage", async () => {
  const r = await succeeds(cli, ["--help"], "textkit.mjs --help");
  for (const word of ["slugify", "count", "truncate", "title", "wrap", "--file", "--json"]) {
    check(r.out.includes(word), `the usage does not mention ${word}`);
  }
});
await test("a command's --help prints its usage", async () => {
  const r = await succeeds(cli, ["slugify", "--help"], "textkit.mjs slugify --help");
  for (const word of ["slugify", "--file", "--json"]) {
    check(r.out.includes(word), `the command's usage does not mention ${word}`);
  }
});
await test("the README documents every command and option", async () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  for (const command of ["slugify", "count", "truncate", "title", "wrap"]) {
    check(new RegExp(`textkit\\.mjs\\s+${command}`).test(readme), `the README has no example of textkit.mjs ${command}`);
  }
  for (const option of ["--file", "--json", "--help"]) {
    check(readme.includes(option), `the README does not mention ${option}`);
  }
});

done();
