// title <text>: the text in Title Case.
//
// Words are the space-separated parts (runs of spaces collapse, leading and trailing ones are dropped) and are joined
// back with single spaces. Each word gets an upper-case first letter and a lower-case rest, except the small words
// below, written all lower case unless they open or close the text. A missing text gives an empty line.
const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to"]);

// Split by code point, so a first letter outside the BMP is not cut in half.
const capitalize = (word) => {
  const [first, ...rest] = word;
  return first.toUpperCase() + rest.join("").toLowerCase();
};

export function run(args) {
  const words = (args[0] ?? "").split(" ").filter(Boolean);
  const last = words.length - 1;
  return words
    .map((word, i) => {
      const lower = word.toLowerCase();
      return SMALL_WORDS.has(lower) && i !== 0 && i !== last ? lower : capitalize(word);
    })
    .join(" ");
}
