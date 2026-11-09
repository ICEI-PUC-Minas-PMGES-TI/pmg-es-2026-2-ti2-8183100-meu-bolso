/**
 * Funções puras da página de Receitas (datas, moeda, resumo, filtros e
 * ordenação). Espelho de utils/Gastosutils.js, sem a parte de orçamento.
 * Não dependem de React nem de localStorage.
 */

/* ========================================
   DATAS
   Datas viajam como texto "AAAA-MM-DD" e meses como "AAAA-MM".
   ======================================== */

export const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function pad(numero) {
  return String(numero).padStart(2, "0");
}

export function hojeISO(data = new Date()) {
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

export function mesAtualChave() {
  return hojeISO().slice(0, 7);
}

export function formatarMesExtenso(chave) {
  const [ano, mes] = chave.split("-");
  return `${NOMES_MESES[Number(mes) - 1]} de ${ano}`;
}

export function mudarMes(chave, delta) {
  const [ano, mes] = chave.split("-").map(Number);
  const data = new Date(ano, mes - 1 + delta, 1);
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}`;
}

export function diasNoMes(chave) {
  const [ano, mes] = chave.split("-").map(Number);
  return new Date(ano, mes, 0).getDate();
}

/** Data em que uma recorrência cai num mês (dia 31 vira 28/29/30 se preciso). */
export function dataDaOcorrencia(mes, dia) {
  return `${mes}-${pad(Math.min(dia, diasNoMes(mes)))}`;
}

export function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

/* ========================================
   MOEDA
   ======================================== */

export function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte o texto digitado em número.
 *  "38,90" -> 38.9   |   "1.234,56" -> 1234.56
 *  "38.9"  -> 38.9   |   "1.234"    -> 1234
 */
export function converterValor(texto) {
  const limpo = String(texto).trim().replace(/\s/g, "");

  if (limpo.includes(",")) {
    return Number(limpo.replace(/\./g, "").replace(",", "."));
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    return Number(limpo.replace(/\./g, ""));
  }

  return Number(limpo);
}

/** Número -> texto para preencher o campo de valor ("38,90"). */
export function valorParaTexto(valor) {
  return Number(valor).toFixed(2).replace(".", ",");
}

function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

/* ========================================
   RESUMO DO MÊS (cards do topo)
   ======================================== */

export function calcularResumo(receitasDoMes, mesChave, hoje = hojeISO()) {
  const total = arredondar(
    receitasDoMes.reduce((soma, receita) => soma + receita.valor, 0),
  );

  const maior = receitasDoMes.reduce(
    (atual, receita) => (!atual || receita.valor > atual.valor ? receita : atual),
    null,
  );

  // No mês corrente a média usa só os dias que já passaram; nos demais, o mês inteiro.
  const ehMesAtual = mesChave === hoje.slice(0, 7);
  const diasBase = ehMesAtual ? Number(hoje.slice(8, 10)) : diasNoMes(mesChave);

  return {
    total,
    quantidade: receitasDoMes.length,
    maior,
    diasBase,
    ehMesAtual,
    mediaDiaria: arredondar(total / diasBase),
    ticketMedio: receitasDoMes.length ? arredondar(total / receitasDoMes.length) : 0,
  };
}

/* ========================================
   DISTRIBUIÇÃO POR CATEGORIA
   ======================================== */

export function calcularDistribuicao(receitasDoMes) {
  const total = receitasDoMes.reduce((soma, receita) => soma + receita.valor, 0);
  const porCategoria = new Map();

  for (const receita of receitasDoMes) {
    const atual = porCategoria.get(receita.categoria) ?? { total: 0, quantidade: 0 };
    atual.total += receita.valor;
    atual.quantidade += 1;
    porCategoria.set(receita.categoria, atual);
  }

  return [...porCategoria.entries()]
    .map(([categoria, dados]) => ({
      categoria,
      total: arredondar(dados.total),
      quantidade: dados.quantidade,
      percentual: total > 0 ? (dados.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/* ========================================
   BUSCA E FILTROS
   ======================================== */

export const FILTROS_INICIAIS = {
  busca: "",
  categoria: "",
  carteira: "",
  de: "",
  ate: "",
};

export function temFiltroAtivo(filtros) {
  return Object.values(filtros).some((valor) => valor !== "");
}

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function filtrarReceitas(receitas, filtros) {
  const busca = normalizar(filtros.busca);

  return receitas.filter((receita) => {
    if (busca && !normalizar(receita.descricao).includes(busca)) return false;
    if (filtros.categoria && receita.categoria !== filtros.categoria) return false;
    if (filtros.carteira && receita.carteiraId !== filtros.carteira) return false;
    if (filtros.de && receita.data < filtros.de) return false;
    if (filtros.ate && receita.data > filtros.ate) return false;
    return true;
  });
}

/* ========================================
   ORDENAÇÃO
   ======================================== */

export const ORDENACAO_INICIAL = { campo: "data", direcao: "desc" };

// Direção usada quando o usuário clica pela primeira vez numa coluna
export const DIRECAO_PADRAO = {
  data: "desc",
  valor: "desc",
  categoria: "asc",
  carteira: "asc",
};

export const OPCOES_ORDENACAO = [
  { valor: "data:desc", rotulo: "Data (mais recente)" },
  { valor: "data:asc", rotulo: "Data (mais antiga)" },
  { valor: "valor:desc", rotulo: "Valor (maior)" },
  { valor: "valor:asc", rotulo: "Valor (menor)" },
  { valor: "categoria:asc", rotulo: "Categoria (A–Z)" },
  { valor: "categoria:desc", rotulo: "Categoria (Z–A)" },
  { valor: "carteira:asc", rotulo: "Carteira (A–Z)" },
  { valor: "carteira:desc", rotulo: "Carteira (Z–A)" },
];

const COMPARADORES = {
  data: (a, b) => a.data.localeCompare(b.data),
  valor: (a, b) => a.valor - b.valor,
  categoria: (a, b) => a.categoria.localeCompare(b.categoria, "pt-BR"),
  carteira: (a, b) => a.carteira.localeCompare(b.carteira, "pt-BR"),
};

export function ordenarReceitas(receitas, { campo, direcao }) {
  const comparar = COMPARADORES[campo] ?? COMPARADORES.data;
  const fator = direcao === "asc" ? 1 : -1;

  return [...receitas].sort(
    (a, b) =>
      comparar(a, b) * fator ||
      b.data.localeCompare(a.data) ||
      String(b.id).localeCompare(String(a.id)),
  );
}
