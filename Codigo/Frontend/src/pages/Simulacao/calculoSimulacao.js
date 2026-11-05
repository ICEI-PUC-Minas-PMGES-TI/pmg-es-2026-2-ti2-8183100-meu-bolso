// ============================================================
// SIMULAÇÃO (RF-08) — cálculo em memória
// ------------------------------------------------------------
// A simulação NÃO é persistida: apenas lê o saldo e as metas
// atuais do usuário e projeta o impacto de uma compra (à vista
// ou parcelada). Nada é escrito em gastos/carteiras.
// ============================================================

export const CATEGORIAS = [
  "Eletrônicos",
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Vestuário",
  "Assinaturas",
  "Outros",
];

// Formata em reais no padrão brasileiro: 2450 -> "R$ 2.450,00"
export function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

// Converte o texto digitado em número ("1.234,56" -> 1234.56).
export function converterValor(texto) {
  const limpo = String(texto ?? "")
    .trim()
    .replace(/\s/g, "");
  if (!limpo) return NaN;
  if (limpo.includes(",")) {
    return Number(limpo.replace(/\./g, "").replace(",", "."));
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    return Number(limpo.replace(/\./g, ""));
  }
  return Number(limpo);
}

// Valida os campos do formulário. Retorna um objeto de erros por campo
// (vazio quando tudo válido).
export function validar({ valor, forma, parcelas }) {
  const erros = {};

  const valorNum = converterValor(valor);
  if (valor === "" || valor === undefined) {
    erros.valor = "Informe o valor da compra.";
  } else if (!Number.isFinite(valorNum) || valorNum <= 0) {
    erros.valor = "O valor deve ser maior que zero.";
  }

  if (forma === "parcelado") {
    const n = Number(parcelas);
    if (!Number.isInteger(n) || n < 2) {
      erros.parcelas = "Informe o número de parcelas (mínimo 2).";
    }
  }

  return erros;
}

// Calcula o impacto da compra no saldo e nas metas, sem persistir nada.
//
// `entrada`: { valor (number), forma ("avista"|"parcelado"), parcelas (number),
//              saldoAtual (number), metas (array) }
//
// Regra do saldo:
//  - à vista: desconta o valor cheio do saldo.
//  - parcelado: desconta apenas o valor de UMA parcela (impacto imediato),
//    pois as demais caem nos meses seguintes.
export function simular({ valor, forma, parcelas, saldoAtual, metas }) {
  const parcelado = forma === "parcelado";
  const nParcelas = parcelado ? Math.max(Number(parcelas) || 1, 1) : 1;
  const valorParcela = parcelado ? valor / nParcelas : valor;

  const impactoImediato = valorParcela; // sai do saldo agora
  const saldoDepois = saldoAtual - impactoImediato;

  // Reflexo nas metas: o quanto do saldo que sobra ainda cobre o que
  // falta guardar em cada meta. Mostra se a compra compromete a meta.
  const reflexoMetas = (metas ?? []).map((meta) => {
    const alvo = Number(meta.valorAlvo ?? 0);
    const atual = Number(meta.valorAtual ?? 0);
    const faltava = Math.max(alvo - atual, 0);

    return {
      id: meta._id ?? meta.id,
      nome: meta.nome,
      faltava,
      // Com o saldo reduzido, quanto do que falta ainda é coberto.
      cobreDepois: Math.max(Math.min(saldoDepois, faltava), 0),
      compromete: saldoDepois < faltava,
    };
  });

  return {
    parcelado,
    nParcelas,
    valorParcela,
    valorTotal: valor,
    saldoAntes: saldoAtual,
    saldoDepois,
    saldoNegativo: saldoDepois < 0,
    reflexoMetas,
  };
}
