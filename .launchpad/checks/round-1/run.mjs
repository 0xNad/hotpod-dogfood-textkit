// Round 1's checks: each command run as `node textkit.mjs <command> …`, in a child process (the kit's entry runner), its
// output compared byte for byte, trailing newline aside. The kit is vendored in ./lib (Hotpod's /kit/checks/).
import { check, harness } from "./lib/harness.mjs";
import { entry, refuses, succeeds } from "./lib/entry.mjs";

const { test, done } = harness();
const cli = entry("node", ["textkit.mjs"]);
const prints = async (args, want) => {
  const r = await succeeds(cli, args);
  const got = r.out.replace(/\n$/, "");
  check(got === want, `node textkit.mjs ${args.map((a) => JSON.stringify(a)).join(" ")} printed ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
};

await test("slugify makes a lowercase slug", async () => {
  await prints(["slugify", "Hello, World!"], "hello-world");
  await prints(["slugify", "Agents build PODS 2"], "agents-build-pods-2");
});
await test("slugify drops accents and collapses separators", async () => {
  await prints(["slugify", "Crème Brûlée, à la carte!"], "creme-brulee-a-la-carte");
  await prints(["slugify", "  --A -- b__C--  "], "a-b-c");
});
await test("count counts words in any script", async () => {
  await prints(["count", "one two  three"], "3");
  await prints(["count", "naïve café, Привет мир"], "4");
  await prints(["count", "it's 2026-11-05"], "5");
});
await test("count of an empty text is 0", async () => {
  await prints(["count", ""], "0");
  await prints(["count", " ... "], "0");
});
await test("truncate cuts at a word and adds an ellipsis", async () => {
  await prints(["truncate", "12", "The quick brown fox"], "The quick…");
  await prints(["truncate", "16", "The quick brown fox"], "The quick brown…");
});
await test("truncate leaves a text that fits", async () => {
  await prints(["truncate", "19", "The quick brown fox"], "The quick brown fox");
  await prints(["truncate", "50", "short"], "short");
});
await test("truncate cuts a long word hard", async () => {
  await prints(["truncate", "6", "Supercalifragilistic"], "Super…");
});
await test("title capitalizes all but the small words", async () => {
  await prints(["title", "the lord of the rings"], "The Lord of the Rings");
  await prints(["title", "a tale OF two cities"], "A Tale of Two Cities");
});
await test("title capitalizes a small word first or last", async () => {
  await prints(["title", "of mice and men"], "Of Mice and Men");
  await prints(["title", "what it is for"], "What It Is For");
});
await test("wrap keeps every line within the width", async () => {
  await prints(["wrap", "10", "The quick brown fox jumps over the lazy dog"], "The quick\nbrown fox\njumps over\nthe lazy\ndog");
});
await test("wrap puts a long word on its own line", async () => {
  await prints(["wrap", "8", "a extraordinarily long word"], "a\nextraordinarily\nlong\nword");
});
await test("an unknown command is refused", async () => {
  await refuses(cli, ["shout", "x"], "unknown command");
});

done();
