import {
  NOMES_MESES,
  hojeISO,
  mesAtualChave,
  mudarMes,
} from "../../utils/Gastosutils";

// ============================================================
// DADOS — Evolução Financeira (RF-06)
// ------------------------------------------------------------
// A evolução NÃO é armazenada: é calculada em tempo de consulta
// a partir dos gastos e receitas do usuário.
//
// Fluxo: a página busca os gastos (gastosService) e as receitas
// (receitasService), converte tudo com paraTransacoes() e passa a
// lista para estas funções, que agrupam por mês e derivam as
// séries usadas pelos gráficos.
//
// REALIZADO x PREVISTO (a classificação é por lançamento, não por mês):
//  - realizado: lançamento real com data até hoje;
//  - previsto:  projeção de recorrência (ainda não lançada) ou
//               lançamento com data depois de hoje.
// Assim, no mês atual, uma recorrência que ainda vai cair (ex.: dia 28,
// hoje é dia 23) aparece como previsão, e não somada ao que já aconteceu.
// ============================================================

// Horizontes da prospecção oferecidos no filtro (meses à frente).
export const OPCOES_PREVISAO = [
  { meses: 3, rotulo: "3 meses" },
  { meses: 6, rotulo: "6 meses" },
  { meses: 12, rotulo: "1 ano" },
];
export const PREVISAO_PADRAO = 3;

// Altura (px) usada pelos dois gráficos, para que fiquem sempre
// do mesmo tamanho ao alternar no seletor.
export const ALTURA_GRAFICO = 240;

// Rótulo curto do mês a partir da chave "AAAA-MM" -> "Mai"
function rotuloMes(chave) {
  const mes = Number(chave.slice(5, 7));
  return NOMES_MESES[mes - 1].slice(0, 3);
}

// Rótulo com o ano, para o tooltip ("Mai 2027"): com a prospecção,
// o mesmo mês pode aparecer em dois anos no gráfico.
function rotuloMesAno(chave) {
  return `${rotuloMes(chave)} ${chave.slice(0, 4)}`;
}

// Converte os gastos e as receitas do usuário no formato único de
// transação usado aqui: { data, valor, tipo, projetado }. Gastos viram
// "saida" e receitas viram "entrada"; o valor é sempre positivo.
// `projetado` vem das projeções de recorrência (comProjecoes).
export function paraTransacoes(gastos, receitas) {
  const converter = (lista, tipo) =>
    (lista ?? []).map((item) => ({
      data: item.data,
      valor: Math.abs(Number(item.valor) || 0),
      tipo,
      projetado: Boolean(item.projetado),
    }));

  return [...converter(gastos, "saida"), ...converter(receitas, "entrada")];
}

// Agrupa as transações por mês ("AAAA-MM"), separando renda e gastos
// em REALIZADO e PREVISTO (ver o topo do arquivo). Retorna a lista
// ordenada por mês, com:
//   rendaRealizada, gastosRealizados  -> o que já aconteceu
//   rendaPrevista,  gastosPrevistos   -> o que ainda deve acontecer
//   renda, gastos                     -> total do mês (realizado + previsto)
//   futuro                            -> mês depois do atual
//
// `mesesPrevisao`: quantos meses depois do atual entram na prospecção
// (3, 6 ou 12). Lançamentos além desse horizonte são descartados.
// `hoje`: "AAAA-MM-DD" (parâmetro só para facilitar testes).
export function agruparPorMes(
  transacoes,
  { mesesPrevisao = PREVISAO_PADRAO, hoje = hojeISO() } = {},
) {
  const mesAtual = hoje.slice(0, 7);
  const mesLimite = mudarMes(mesAtual, mesesPrevisao);
  const porMes = new Map();

  for (const t of transacoes ?? []) {
    const data = String(t.data);
    const chave = data.slice(0, 7); // "AAAA-MM"
    if (chave.length !== 7) continue;
    if (chave > mesLimite) continue; // além do horizonte escolhido

    const valor = Number(t.valor) || 0;
    const previsto = t.projetado || data > hoje;
    const atual = porMes.get(chave) ?? {
      rendaRealizada: 0,
      gastosRealizados: 0,
      rendaPrevista: 0,
      gastosPrevistos: 0,
    };

    if (t.tipo === "entrada") {
      if (previsto) atual.rendaPrevista += valor;
      else atual.rendaRealizada += valor;
    } else if (previsto) {
      atual.gastosPrevistos += valor;
    } else {
      atual.gastosRealizados += valor;
    }
    porMes.set(chave, atual);
  }

  return [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, v]) => ({
      chave,
      mes: rotuloMes(chave),
      mesCompleto: rotuloMesAno(chave),
      ...v,
      renda: v.rendaRealizada + v.rendaPrevista,
      gastos: v.gastosRealizados + v.gastosPrevistos,
      futuro: chave > mesAtual,
    }));
}

// Deriva a série do saldo acumulado (gráfico de linha):
//  - até o mês atual, o ponto é o saldo REALIZADO
//    (soma de renda realizada menos gastos realizados);
//  - nos meses futuros, o ponto é a PREVISÃO: realizado + tudo o que
//    está previsto até aquele mês (inclusive o que ainda falta cair
//    no mês atual).
// No mês atual, `valorPrevistoFimMes` traz o saldo esperado no fim do
// mês, quando houver algo previsto nele.
export function calcularAcumulado(dadosMensais) {
  let realizado = 0;
  let comPrevisao = 0;

  return dadosMensais.map((d) => {
    realizado += d.rendaRealizada - d.gastosRealizados;
    comPrevisao += d.renda - d.gastos;

    const temPrevistoNoMes = d.rendaPrevista > 0 || d.gastosPrevistos > 0;
    return {
      chave: d.chave,
      mes: d.mes,
      mesCompleto: d.mesCompleto,
      valor: d.futuro ? comPrevisao : realizado,
      projetado: d.futuro,
      valorPrevistoFimMes:
        !d.futuro && temPrevistoNoMes ? comPrevisao : null,
    };
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
