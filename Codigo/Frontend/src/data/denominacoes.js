// Denominações de dinheiro em espécie (notas e moedas).
// Os cálculos usam centavos inteiros para evitar erro de ponto flutuante.

// Da maior para a menor. `chave` é a usada no objeto de contagem.
export const DENOMINACOES = [
  { chave: "200", centavos: 20000, tipo: "nota" },
  { chave: "100", centavos: 10000, tipo: "nota" },
  { chave: "50", centavos: 5000, tipo: "nota" },
  { chave: "20", centavos: 2000, tipo: "nota" },
  { chave: "10", centavos: 1000, tipo: "nota" },
  { chave: "5", centavos: 500, tipo: "nota" },
  { chave: "2", centavos: 200, tipo: "nota" },
  { chave: "1", centavos: 100, tipo: "moeda" },
  { chave: "0.5", centavos: 50, tipo: "moeda" },
  { chave: "0.25", centavos: 25, tipo: "moeda" },
  { chave: "0.1", centavos: 10, tipo: "moeda" },
  { chave: "0.05", centavos: 5, tipo: "moeda" },
];

/** Contagem zerada { "200": 0, ... }. */
export function contagemZerada() {
  return DENOMINACOES.reduce((acc, d) => ({ ...acc, [d.chave]: 0 }), {});
}

/** Soma da contagem em centavos inteiros. */
export function totalCentavos(contagem = {}) {
  return DENOMINACOES.reduce(
    (acc, d) => acc + (Number(contagem[d.chave]) || 0) * d.centavos,
    0
  );
}

/** Saldo em reais (número) a partir da contagem. */
export function saldoDaContagem(contagem = {}) {
  return totalCentavos(contagem) / 100;
}

/**
 * Converte um saldo em reais numa contagem pelo método guloso
 * (maior denominação para a menor). Usado na migração de dados antigos.
 */
export function contagemDoSaldo(saldo = 0) {
  let restante = Math.round((Number(saldo) || 0) * 100);
  const contagem = contagemZerada();
  for (const d of DENOMINACOES) {
    if (restante <= 0) break;
    const qtd = Math.floor(restante / d.centavos);
    if (qtd > 0) {
      contagem[d.chave] = qtd;
      restante -= qtd * d.centavos;
    }
  }
  return contagem;
}

/** Garante que o item de dinheiro tenha `contagem` e `saldo` coerentes. */
export function normalizarDinheiro(item) {
  if (item?.contagem) {
    return { ...item, saldo: saldoDaContagem(item.contagem) };
  }
  const contagem = contagemDoSaldo(item?.saldo ?? 0);
  return { ...item, contagem, saldo: saldoDaContagem(contagem) };
}

/** { notas, moedas } somando as quantidades por tipo. */
export function resumoContagem(contagem = {}) {
  let notas = 0;
  let moedas = 0;
  for (const d of DENOMINACOES) {
    const qtd = Number(contagem[d.chave]) || 0;
    if (d.tipo === "nota") notas += qtd;
    else moedas += qtd;
  }
  return { notas, moedas };
}

/** "4 notas · 2 moedas" com singular/plural; "" se vazio. */
export function textoResumo(contagem = {}) {
  const { notas, moedas } = resumoContagem(contagem);
  const partes = [];
  if (notas > 0) partes.push(`${notas} ${notas === 1 ? "nota" : "notas"}`);
  if (moedas > 0) partes.push(`${moedas} ${moedas === 1 ? "moeda" : "moedas"}`);
  return partes.join(" · ");
}

/** Rótulo "R$100" ou "R$0,50" a partir da chave. */
export function rotuloDenominacao(chave) {
  const n = Number(chave);
  const texto = Number.isInteger(n)
    ? String(n)
    : n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  return `R$${texto}`;
}

/** Lista de chips { chave, rotulo, qtd } com qtd > 0, da maior para a menor. */
export function chipsDaContagem(contagem = {}) {
  return DENOMINACOES.filter((d) => (Number(contagem[d.chave]) || 0) > 0).map(
    (d) => ({
      chave: d.chave,
      rotulo: rotuloDenominacao(d.chave),
      qtd: Number(contagem[d.chave]) || 0,
    })
  );
}
