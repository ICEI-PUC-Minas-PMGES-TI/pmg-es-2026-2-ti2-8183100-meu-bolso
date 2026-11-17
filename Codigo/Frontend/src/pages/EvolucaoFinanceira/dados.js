import { NOMES_MESES, mesAtualChave } from "../../utils/Gastosutils";
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

// Agrupa as transações por mês ("AAAA-MM"), separando a RENDA
// (entradas) dos GASTOS (saídas) de cada mês. Retorna a lista
// ordenada por mês.
//
// `transacoes`: itens com { data: "AAAA-MM-DD", valor, tipo? }.
// Sem o campo `tipo`, o item é tratado como gasto (modelo atual).
// Entradas das carteiras são contadas como renda até existir a
// futura página de Renda.
//
// Gastos recorrentes já lançam ocorrências nos meses seguintes; o
// gráfico mostra só o mês atual e os anteriores, então os meses
// futuros são ignorados aqui.
export function agruparPorMes(transacoes) {
  const porMes = new Map();
  const mesLimite = mesAtualChave(); // "AAAA-MM" do mês corrente

  for (const t of transacoes) {
    const chave = String(t.data).slice(0, 7); // "AAAA-MM"
    if (chave.length !== 7) continue;
    if (chave > mesLimite) continue; // ignora meses futuros

    const atual = porMes.get(chave) ?? { gastos: 0, renda: 0 };
    if (t.tipo === "entrada") {
      atual.renda += Number(t.valor) || 0;
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
      renda: valores.renda,
    }));
}

// Deriva a série acumulada (gráfico de linha): o saldo vai somando
// a renda e subtraindo os gastos de cada mês. O resultado é o
// dinheiro acumulado ao longo do tempo.
export function calcularAcumulado(dadosMensais) {
  let total = 0;
  return dadosMensais.map((d) => {
    total += d.renda - d.gastos;
    return { mes: d.mes, valor: total };
  });
}

// ------------------------------------------------------------
// INVESTIMENTOS
// ------------------------------------------------------------
// Metas não têm um campo "tipo", então identificamos as metas de
// investimento pelo NOME (palavras-chave). Os aportes saem do
// histórico unificado de movimentações (uma única requisição):
// linhas com origem "meta" cuja descrição cita uma meta de
// investimento. Assim evitamos buscar o histórico meta a meta.

// Palavras que marcam uma meta como de investimento (sem acento,
// minúsculas). Ajuste aqui se o time adotar outros termos.
const PALAVRAS_INVESTIMENTO = [
  "investi", // investimento, investir, investido
  "aplicacao",
  "acoes",
  "tesouro",
  "renda fixa",
  "cdb",
  "fundo",
  "cripto",
  "bitcoin",
  "poupanca",
];

// Normaliza texto para comparação: minúsculas e sem acentos.
function normalizar(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Diz se o nome de uma meta a caracteriza como investimento.
export function ehMetaInvestimento(nome) {
  const n = normalizar(nome);
  return PALAVRAS_INVESTIMENTO.some((p) => n.includes(p));
}

// A partir das metas e do histórico unificado de movimentações,
// extrai os aportes das metas de investimento no formato
// { data, valor } — valor positivo em depósito, negativo em retirada.
//
// `metas`: lista de listarMetas() (cada uma com nome).
// `movimentacoes`: lista de obterMovimentacoes() (origem, descricao,
//   data, valor com sinal de carteira).
export function extrairAportesInvestimento(metas, movimentacoes) {
  // Nomes (normalizados) das metas de investimento do usuário.
  const nomesInvestimento = (metas ?? [])
    .filter((m) => ehMetaInvestimento(m.nome))
    .map((m) => normalizar(m.nome));

  if (nomesInvestimento.length === 0) return [];

  const aportes = [];
  for (const mov of movimentacoes ?? []) {
    if (mov.origem !== "meta") continue;

    const descricao = normalizar(mov.descricao);
    const ehInvestimento = nomesInvestimento.some((nome) =>
      descricao.includes(nome),
    );
    if (!ehInvestimento) continue;

    // Na carteira: depósito é negativo, retirada é positivo. Para o
    // "investido", invertemos: depósito soma, retirada subtrai.
    aportes.push({ data: mov.data, valor: -(Number(mov.valor) || 0) });
  }

  return aportes;
}

// Agrupa os aportes de investimento por mês ("AAAA-MM"), também
// ignorando meses futuros (só mês atual e anteriores).
export function agruparInvestimentosPorMes(aportes) {
  const porMes = new Map();
  const mesLimite = mesAtualChave();

  for (const a of aportes ?? []) {
    const chave = String(a.data).slice(0, 7);
    if (chave.length !== 7) continue;
    if (chave > mesLimite) continue; // ignora meses futuros
    porMes.set(chave, (porMes.get(chave) ?? 0) + (Number(a.valor) || 0));
  }

  return [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, aporte]) => ({
      chave,
      mes: rotuloMes(chave),
      aporte,
    }));
}

// Série acumulada do total investido ao longo dos meses.
export function calcularAcumuladoInvestido(investimentosMensais) {
  let total = 0;
  return investimentosMensais.map((d) => {
    total += d.aporte;
    return { mes: d.mes, valor: total };
  });
}
