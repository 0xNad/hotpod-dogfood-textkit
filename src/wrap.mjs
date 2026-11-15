// wrap <width> <text>: lay the words out greedily on lines of at most `width` characters (Unicode code points).
//
//   node textkit.mjs wrap 10 "The quick brown fox"  ->  The quick\nbrown fox
/** Number of Unicode code points in a string. */
const length = (s) => [...s].length;

export function run(args) {
  const width = Number(args[0]);
  const words = (args[1] ?? "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const lines = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    // Append to the current line when it, one space and the word fit; otherwise start a new line.
    if (length(line) + 1 + length(word) <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines.join("\n");
}
