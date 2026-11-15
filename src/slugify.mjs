// slugify <text>: turn text into a URL slug.
//
// Lower case, accents dropped to their base ASCII letter, every run of other
// characters collapsed to a single "-", with no "-" at either end.
export function run(args) {
  return (args[0] ?? "")
    .normalize("NFD") // split accented letters into base + combining mark(s)
    .replace(/\p{Diacritic}/gu, "") // drop the combining marks, leaving the base letter
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // every run of non-alphanumerics becomes one "-"
    .replace(/^-+|-+$/g, ""); // trim leading and trailing "-"
}
