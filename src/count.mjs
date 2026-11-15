// count <text>: count the words in the text.
//
// A word is a run of Unicode letters or digits, in any script; every other
// character separates words. Empty or missing text counts 0.
export function run(args) {
  const words = (args[0] ?? "").match(/[\p{L}\p{N}]+/gu);
  return String(words ? words.length : 0);
}
