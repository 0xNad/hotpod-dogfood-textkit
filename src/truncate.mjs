// truncate <max> <text>: cut the text to at most `max` characters (Unicode code points), the ellipsis included.
//
//   node textkit.mjs truncate 12 "The quick brown fox"  ->  The quick…
const ELLIPSIS = "…";

/** Number of Unicode code points in a string. */
const length = (s) => [...s].length;

export function run(args) {
  const max = Number(args[0]);
  const text = args[1] ?? "";
  if (length(text) <= max) return text;

  // Keep the longest prefix of whole words whose length, with the ellipsis, stays within `max`.
  const words = text.split(" ");
  let kept = "";
  let keptCount = 0;
  for (let i = 0; i < words.length; i++) {
    const candidate = i === 0 ? words[0] : `${kept} ${words[i]}`;
    if (length(candidate) + 1 > max) break;
    kept = candidate;
    keptCount = i + 1;
  }

  // Not even the first word fits: cut hard at `max - 1` characters, then the ellipsis.
  if (keptCount === 0) return [...text].slice(0, Math.max(0, max - 1)).join("") + ELLIPSIS;

  return kept + ELLIPSIS;
}
