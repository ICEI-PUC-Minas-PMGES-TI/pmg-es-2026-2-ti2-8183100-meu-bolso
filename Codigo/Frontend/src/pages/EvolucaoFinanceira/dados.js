// ============================================================
// DADOS — Evolução Financeira
// ------------------------------------------------------------
// Fonte única de dados dos gráficos. Os dois gráficos derivam
// destes mesmos registros mensais: cada mês tem o quanto foi
// "gasto" e o quanto foi "guardado". O gráfico de barras mostra
// esses dois valores empilhados; o de linha mostra o ACUMULADO
// do que foi guardado ao longo dos meses.
//
// TODO (back-end): substituir pelos dados vindos da API
// (src/service/Api.js).
// ============================================================

// Dados de exemplo apenas para visualizar o layout.
export const DADOS_MENSAIS = [
  { mes: "Mai", gastos: 1200, guardado: 300 },
  { mes: "Jun", gastos: 1100, guardado: 250 },
  { mes: "Jul", gastos: 1400, guardado: 420 },
  { mes: "Ago", gastos: 1050, guardado: 350 },
  { mes: "Set", gastos: 1300, guardado: 380 },
  { mes: "Out", gastos: 1250, guardado: 450 },
];

// Altura (px) usada pelos dois gráficos, para que fiquem sempre
// do mesmo tamanho ao alternar no seletor.
export const ALTURA_GRAFICO = 240;

// Deriva a série acumulada (gráfico de linha): cada ponto é a
// soma de tudo que foi guardado até o mês.
export function calcularAcumulado(dadosMensais) {
  let total = 0;
  return dadosMensais.map((d) => {
    total += d.guardado;
    return { mes: d.mes, valor: total };
  });
}
