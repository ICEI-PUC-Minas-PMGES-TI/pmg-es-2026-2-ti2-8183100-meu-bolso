// ============================================================
// RESERVA DE EMERGÊNCIA (RF-03) — regras de exibição
// ------------------------------------------------------------
// O back-end calcula o mínimo, o nível e os meses cobertos
// (ReservaService). Aqui ficam só os textos e utilitários usados
// pelo card, pelo modal, pelo painel e pelo alerta da Visão geral.
// ============================================================

export const TIPO_RESERVA = "reserva";

export const HORIZONTES = [
  { meses: 3, rotulo: "3 meses", dica: "bom primeiro passo" },
  { meses: 6, rotulo: "6 meses", dica: "recomendado para renda fixa" },
  { meses: 12, rotulo: "1 ano", dica: "recomendado para renda variável" },
];
export const HORIZONTE_PADRAO = 6;

export const NOME_PADRAO = "Reserva de emergência";

// Texto do card convite (decidido com o usuário).
export const CONVITE_TITULO = "Reserva de emergência";
export const CONVITE_TEXTO =
  "Comece por aqui: o dinheiro que te protege dos imprevistos, sem precisar de empréstimo.";

// De onde veio a sugestão do mínimo.
export const TEXTO_BASE = {
  historico: "média dos seus gastos dos últimos meses e dos gastos fixos previstos",
  orcamento: "seu orçamento mensal",
  recorrencias: "seus gastos fixos previstos",
  informado: "o custo mensal que você informou",
  sem_dados: "",
};

/**
 * Nível de alerta -> cor (classe CSS) e mensagem.
 * `cor`: "erro" | "alerta" | "sucesso" | "neutro".
 */
export function infoNivel(reserva) {
  const nivel = reserva?.nivel;
  const meses = coberturaDaReserva(reserva);
  const falta = Math.max(Number(reserva?.valorMinimo ?? 0) - Number(reserva?.valorAtual ?? 0), 0);

  switch (nivel) {
    case "vazia":
      return {
        cor: "erro",
        titulo: "Reserva vazia",
        texto: "Qualquer imprevisto vira dívida. Comece com qualquer valor.",
      };
    case "critica":
      return {
        cor: "erro",
        titulo: "Perigo",
        texto: meses
          ? `Sua reserva só cobre ${meses} de gastos, menos da metade do mínimo.`
          : "Menos da metade do mínimo.",
      };
    case "atencao":
      return {
        cor: "alerta",
        titulo: "Abaixo do mínimo",
        texto: `Faltam ${formatarMoeda(falta)} para o mínimo${meses ? `; hoje ela cobre ${meses} de gastos` : ""}.`,
      };
    case "protegida":
      return {
        cor: "sucesso",
        titulo: "Mínimo atingido",
        texto: meses ? `Sua reserva cobre ${meses} dos seus gastos.` : "Sua reserva está protegida.",
      };
    default:
      return {
        cor: "neutro",
        titulo: "Sem valor mínimo",
        texto: "Ainda não há gastos para calcular o mínimo. Defina um valor em Editar.",
      };
  }
}

// Mês comercial usado para converter a cobertura em dias.
const DIAS_NO_MES = 30;

/**
 * Quanto tempo de gastos um valor cobre, em texto:
 *  - 1 mês ou mais: "2,4 meses" / "1 mês" (1 casa, arredondando para baixo);
 *  - menos de 1 mês: em dias ("15 dias", "1 dia", "menos de 1 dia").
 * Retorna "" quando o valor é zero ou não há custo mensal para comparar.
 */
export function textoCobertura(valor, custoMensal) {
  const v = Number(valor ?? 0);
  const custo = Number(custoMensal ?? 0);
  if (!(v > 0) || !(custo > 0)) return "";

  const meses = v / custo;
  if (meses < 1) {
    const dias = Math.floor(meses * DIAS_NO_MES);
    if (dias < 1) return "menos de 1 dia";
    return `${dias} ${dias === 1 ? "dia" : "dias"}`;
  }

  const umaCasa = Math.floor(meses * 10) / 10;
  const texto = umaCasa.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return `${texto} ${umaCasa < 2 ? "mês" : "meses"}`;
}

/** Cobertura do valor guardado na reserva (usa o custo mensal do back-end). */
export function coberturaDaReserva(reserva) {
  return textoCobertura(reserva?.valorAtual, reserva?.custoMensal);
}

/** Rótulo curto do horizonte ("6 meses" / "1 ano"). */
export function rotuloHorizonte(meses) {
  return HORIZONTES.find((h) => h.meses === Number(meses))?.rotulo ?? `${meses} meses`;
}

/** Percentual (0–100) do valor guardado em relação ao mínimo. */
export function progressoReserva(reserva) {
  const minimo = Number(reserva?.valorMinimo ?? 0);
  if (minimo <= 0) return 0;
  const p = (Number(reserva?.valorAtual ?? 0) / minimo) * 100;
  return Math.min(Math.max(p, 0), 100);
}

export function ehReserva(meta) {
  return meta?.tipo === TIPO_RESERVA;
}

export function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(valor ?? 0),
  );
}

/** Converte o texto digitado em número (aceita "1.234,56" ou "1234.56"). */
export function converterValor(texto) {
  if (texto === "" || texto == null) return undefined;
  const limpo = String(texto)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(limpo);
  return Number.isFinite(n) ? n : undefined;
}
