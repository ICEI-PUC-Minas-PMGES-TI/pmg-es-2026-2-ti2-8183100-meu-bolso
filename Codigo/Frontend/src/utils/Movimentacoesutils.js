/**
 * Funções puras da página de Movimentações (gastos + receitas na mesma lista).
 * Reaproveitam a busca, os filtros e a ordenação de Gastosutils, que só olham
 * para campos comuns aos dois tipos (descricao, categoria, carteiraId, data, valor).
 */

import { filtrarGastos, hojeISO, ordenarGastos } from "./Gastosutils";

export const TIPO_GASTO = "gasto";
export const TIPO_RECEITA = "receita";

// Chips do topo da lista
export const VISOES = {
  tudo: "tudo",
  entradas: "entradas",
  saidas: "saidas",
};

/**
 * Junta gastos e receitas numa lista só. Cada item ganha "tipo" e uma "chave"
 * única (os ids de gastos e receitas vêm de coleções diferentes).
 */
export function unificar(gastos = [], receitas = []) {
  return [
    ...gastos.map((gasto) => ({ ...gasto, tipo: TIPO_GASTO, chave: `gasto:${gasto.id}` })),
    ...receitas.map((receita) => ({
      ...receita,
      tipo: TIPO_RECEITA,
      chave: `receita:${receita.id}`,
    })),
  ];
}

export function filtrarPorVisao(lista, visao) {
  if (visao === VISOES.entradas) return lista.filter((item) => item.tipo === TIPO_RECEITA);
  if (visao === VISOES.saidas) return lista.filter((item) => item.tipo === TIPO_GASTO);
  return lista;
}

export function filtrarMovimentacoes(lista, filtros, visao) {
  return filtrarGastos(filtrarPorVisao(lista, visao), filtros);
}

export function ordenarMovimentacoes(lista, ordenacao) {
  return ordenarGastos(lista, ordenacao);
}

/** Receita soma, gasto subtrai. */
export function valorComSinal(item) {
  return item.tipo === TIPO_RECEITA ? item.valor : -item.valor;
}

export function somarComSinal(lista) {
  return Math.round(lista.reduce((soma, item) => soma + valorComSinal(item), 0) * 100) / 100;
}

/** Soma separada de entradas e saídas de uma lista. */
export function totaisPorTipo(lista) {
  let entradas = 0;
  let saidas = 0;
  for (const item of lista) {
    if (item.tipo === TIPO_RECEITA) entradas += item.valor;
    else saidas += item.valor;
  }
  return {
    entradas: Math.round(entradas * 100) / 100,
    saidas: Math.round(saidas * 100) / 100,
  };
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function dataLocal(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/** "Hoje", "Ontem" ou "Sex, 21 de nov". */
export function rotuloDoDia(dataISO, hoje = hojeISO()) {
  if (dataISO === hoje) return "Hoje";

  const ontem = dataLocal(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (dataISO === hojeISO(ontem)) return "Ontem";

  const data = dataLocal(dataISO);
  return `${DIAS_SEMANA[data.getDay()]}, ${data.getDate()} de ${MESES_CURTOS[data.getMonth()]}`;
}

/**
 * Agrupa a lista (já ordenada por data) em blocos por dia, com o total do dia.
 * Os lançamentos previstos (projetados) ficam num bloco próprio, "Previstos",
 * no início (data mais recente primeiro) ou no fim (mais antiga primeiro).
 */
export function agruparPorDia(lista, direcao = "desc", hoje = hojeISO()) {
  const previstos = lista.filter((item) => item.projetado);
  const realizados = lista.filter((item) => !item.projetado);

  const grupos = [];
  let atual = null;
  for (const item of realizados) {
    if (!atual || atual.chave !== item.data) {
      atual = { chave: item.data, rotulo: rotuloDoDia(item.data, hoje), itens: [] };
      grupos.push(atual);
    }
    atual.itens.push(item);
  }

  if (previstos.length > 0) {
    const grupoPrevistos = { chave: "previstos", rotulo: "Previstos", itens: previstos, previsto: true };
    if (direcao === "asc") grupos.push(grupoPrevistos);
    else grupos.unshift(grupoPrevistos);
  }

  return grupos.map((grupo) => ({ ...grupo, total: somarComSinal(grupo.itens) }));
}
