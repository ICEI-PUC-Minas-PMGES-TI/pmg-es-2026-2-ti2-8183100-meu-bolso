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
  return `linear-gradient(135deg, ${hex}, color-mix(in srgb, ${hex} 70%, black))`;
}
