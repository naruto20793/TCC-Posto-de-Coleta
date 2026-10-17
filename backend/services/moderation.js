const { fail } = require("../utils/http");
// Lista local e ampliável. A comparação ignora acentos, caixa, separadores e substituições comuns.
const terms = [
  "idiota",
  "idiotas",
  "imbecil",
  "imbecis",
  "babaca",
  "babacas",
  "otario",
  "otaria",
  "otarios",
  "otarias",
  "desgracado",
  "desgracada",
  "arrombados",
  "arrombadas",
  "filho da puta",
  "filha da puta",
  "vai tomar no cu",
  "vai se foder",
  "caralho",
  "caralhos",
  "porra",
  "porras",
  "puta",
  "putas",
  "puto",
  "putos",
  "merda",
  "merdas",
  "foder",
  "foda",
  "fodase",
  "fodido",
  "fodida",
  "cacete",
  "cacetes",
  "buceta",
  "bucetas",
  "boceta",
  "bocetas",
  "cu",
  "cus",
  "cuzao",
  "cuzona",
  "arrombado",
  "arrombada",
  "piranha",
  "vagabunda",
  "vagabundo",
  "fdp",
  "pqp",
  "vsf",
  "vtmnc",
];
const substitutions = {
  0: "o",
  1: "i",
  3: "e",
  4: "a",
  5: "s",
  7: "t",
  "@": "a",
  $: "s",
};
const patterns = terms.map(
  (term) =>
    new RegExp(
      "(?<![a-z0-9])" +
        term
          .replace(/ /g, "")
          .split("")
          .map((c) => c + "+")
          .join("[^a-z0-9]*") +
        "(?![a-z0-9])",
      "g",
    ),
);
function censor(input) {
  let normalized = "",
    map = [];
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
      .normalize("NFD")
      .replace(/[\u0300-\u036f\u200b-\u200d\ufeff]/g, "")
      .toLowerCase();
    for (const c of char) {
      normalized += substitutions[c] || c;
      map.push(i);
    }
  }
  const masked = input.split("");
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of normalized.matchAll(pattern)) {
      const start = map[match.index],
        end = map[match.index + match[0].length - 1];
      for (let i = start; i <= end; i++)
        if (!/\s/.test(masked[i])) masked[i] = "*";
    }
  }
  return masked.join("");
}
function comment(value = "") {
  if (typeof value !== "string" || value.length > 1000)
    fail(400, "O comentário deve ter até 1000 caracteres.");
  return censor(value.trim());
}
module.exports = { censor, comment };
