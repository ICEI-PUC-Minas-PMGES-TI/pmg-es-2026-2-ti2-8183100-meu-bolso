// Mapa central de bancos (nome + cor) e helpers de apresentação.
// Logos servidas da raiz pública: "/bancos/<chave>.png".

export const BANCOS = {
  nubank: ["Nubank", "#8A05BE"],
  inter: ["Banco Inter", "#FF7A00"],
  itau: ["Itaú", "#EC7000"],
  bradesco: ["Bradesco", "#CC092F"],
  santander: ["Santander", "#EC0000"],
  bb: ["Banco do Brasil", "#0038A8"],
  caixa: ["Caixa", "#005CA9"],
  c6: ["C6 Bank", "#242424"],
  sicoob: ["Sicoob", "#003641"],
  btg: ["BTG Pactual", "#0A2540"],
  picpay: ["PicPay", "#11C76F"],
  mercadopago: ["Mercado Pago", "#009EE3"],
  xp: ["XP Investimentos", "#000000"],
};

/** Normaliza: minúsculas e sem acentos. */
function normalizar(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Descobre a chave do banco a partir de um texto livre
 * ("Inter Débito", "Banco Inter", "Nubank Mastercard"...).
 * Retorna a chave de BANCOS contida no texto (ou cujo nome esteja contido),
 * ou null quando nada combina.
 */
export function chaveDoBanco(texto) {
  const t = normalizar(texto);
  if (!t) return null;

  // 1) chave de BANCOS contida no texto (ex.: "inter", "nubank")
  for (const chave of Object.keys(BANCOS)) {
    if (t.includes(chave)) return chave;
  }
  // 2) nome do banco normalizado contido no texto (ex.: "mercado pago")
  for (const [chave, [nome]] of Object.entries(BANCOS)) {
    if (t.includes(normalizar(nome))) return chave;
  }
  return null;
}

/** Retorna { nome, cor, logo } para a chave. Fallback: "Outro banco". */
export function bancoDe(chave) {
  const banco = BANCOS[chave];
  if (banco) {
    const [nome, cor] = banco;
    return { nome, cor, logo: `/bancos/${chave}.png` };
  }
  return { nome: "Outro banco", cor: "#334155", logo: "/bancos/padrao.png" };
}

/** Cor de texto legível sobre o hex informado (escuro ou branco). */
export function corTexto(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminancia = (r * 299 + g * 587 + b * 114) / 1000;
  return luminancia > 150 ? "#0F172A" : "#FFFFFF";
}

/** Gradiente de fundo do cartão a partir do hex. */
export function fundoCartao(hex) {
  return `linear-gradient(135deg, ${hex}, color-mix(in srgb, ${hex} 85%, black))`;
}

// Bancos cujo PNG é um ícone opaco (quadrado colorido): não aplicar filtro.
export const LOGO_ICONE = new Set(["itau", "bradesco", "mercadopago", "picpay", "xp"]);

// Fundo do círculo da logo nos cards de conta, só para exceções de contraste.
export const FUNDO_LOGO = {
  btg: { fundo: "#0A2540" },
  caixa: { fundo: "#FFFFFF", anel: "#005CA9" },
};

/** Filtro da logo conforme o fundo: branca em fundo escuro, preta em fundo claro. */
export function filtroLogo(hex) {
  return corTexto(hex) === "#FFFFFF"
    ? "brightness(0) invert(1)"
    : "brightness(0)";
}
