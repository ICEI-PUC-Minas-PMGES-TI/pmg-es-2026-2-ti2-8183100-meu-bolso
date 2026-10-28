import { NOMES_MESES } from "../../utils/Gastosutils";
import { movimentacoesPorItem } from "../Carteiras/carteirasMock";

// ============================================================
// DADOS — Evolução Financeira (RF-06)
// ------------------------------------------------------------
// A evolução NÃO é armazenada: é calculada em tempo de consulta
// a partir das transações do usuário. Hoje o modelo de dados do
// projeto só tem "gastos" (saídas); quando houver entradas, basta
// somá-las no agrupamento (ver agruparPorMes).
//
// Fluxo: a página busca os gastos via gastosService.carregarTudo()
// e passa a lista para estas funções, que agrupam por mês e
// derivam as duas séries usadas pelos gráficos.
// ============================================================

// Altura (px) usada pelos dois gráficos, para que fiquem sempre
// do mesmo tamanho ao alternar no seletor.
export const ALTURA_GRAFICO = 240;

// Rótulo curto do mês a partir da chave "AAAA-MM" -> "Mai"
function rotuloMes(chave) {
  const mes = Number(chave.slice(5, 7));
  return NOMES_MESES[mes - 1].slice(0, 3);
}

// Abreviações de mês usadas nas datas das carteiras ("17 out").
const ABREV_MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

// Converte a data curta das carteiras ("17 out") em "AAAA-MM-DD",
// usando o ano atual (o dado da carteira não traz o ano). Retorna
// null se o formato não for reconhecido.
function dataCurtaParaISO(dataCurta) {
  const partes = String(dataCurta).trim().toLowerCase().split(/\s+/);
  if (partes.length < 2) return null;

  const dia = Number(partes[0]);
  const mes = ABREV_MESES.indexOf(partes[1].slice(0, 3));
  if (!dia || mes < 0) return null;

  const ano = new Date().getFullYear();
  const pad = (n) => String(n).padStart(2, "0");
  return `${ano}-${pad(mes + 1)}-${pad(dia)}`;
}

// Lê as movimentações das carteiras (sem alterar aquele módulo) e as
// devolve no formato de transação usado aqui: { data, valor, tipo }.
// O valor é sempre positivo; o sinal fica no `tipo`.
export function movimentacoesDasCarteiras() {
  const resultado = [];

  for (const lista of Object.values(movimentacoesPorItem)) {
    for (const mov of lista) {
      const data = dataCurtaParaISO(mov.data);
      if (!data) continue;
      resultado.push({
        data,
        valor: Math.abs(Number(mov.valor) || 0),
        tipo: mov.entrada ? "entrada" : "saida",
      });
    }
  }

  return resultado;
}

// Agrupa as transações por mês ("AAAA-MM"), somando gastos e
// entradas de cada mês. Retorna a lista ordenada por mês.
//
// `transacoes`: itens com { data: "AAAA-MM-DD", valor, tipo? }.
// Sem o campo `tipo`, o item é tratado como gasto (modelo atual).
export function agruparPorMes(transacoes) {
  const porMes = new Map();

  for (const t of transacoes) {
    const chave = String(t.data).slice(0, 7); // "AAAA-MM"
    if (chave.length !== 7) continue;

    const atual = porMes.get(chave) ?? { gastos: 0, guardado: 0 };
    if (t.tipo === "entrada") {
      atual.guardado += Number(t.valor) || 0;
    } else {
      atual.gastos += Number(t.valor) || 0;
    }
    porMes.set(chave, atual);
  }

  return [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, valores]) => ({
      chave,
      mes: rotuloMes(chave),
      gastos: valores.gastos,
      guardado: valores.guardado,
    }));
}

// Deriva a série acumulada (gráfico de linha): o saldo vai somando
// as entradas e subtraindo os gastos de cada mês. O resultado é o
// dinheiro acumulado ao longo do tempo.
export function calcularAcumulado(dadosMensais) {
  let total = 0;
  return dadosMensais.map((d) => {
    total += d.guardado - d.gastos;
    return { mes: d.mes, valor: total };
  });
}
