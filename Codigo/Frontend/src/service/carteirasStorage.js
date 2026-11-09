/**
 * Acesso compartilhado às carteiras persistidas no back-end (por usuário).
 *
 * A página Metas usa estas funções para refletir o saldo das carteiras
 * quando há uma movimentação (depósito/retirada) vinculada a uma meta.
 * Os dados vêm da API em { cartoes, contas, dinheiroEReservas, movsDinheiro }.
 */

import { obterCarteiras } from "./Api";

/**
 * Retorna as contas bancárias que possuem saldo, no formato
 * { id, nome, saldo, origem }. São as únicas que podem ceder ou receber
 * dinheiro numa movimentação de meta — cartões, dinheiro físico e reservas
 * ficam de fora.
 *
 * `origem` indica a lista de origem para saber onde gravar de volta.
 */
export async function listarCarteirasComSaldo() {
  let dados;
  try {
    dados = await obterCarteiras();
  } catch {
    return [];
  }
  if (!dados) return [];

  const contas = (dados.contas ?? [])
    .filter((c) => typeof c.saldo === "number")
    .map((c) => ({ id: c.id, nome: c.apelido, saldo: c.saldo, origem: "contas" }));

  return contas;
}

/**
 * Lista apenas as contas cadastradas na carteira, no formato { id, nome, tipo },
 * para seleção ao registrar um gasto ou uma receita.
 *
 * Gastos e receitas só podem ser lançados em uma conta: sem conta cadastrada,
 * a lista vem vazia e a tela mostra o aviso para cadastrar uma na Carteira.
 */
export async function listarContas() {
  let dados;
  try { dados = await obterCarteiras(); } catch { return []; }
  if (!dados) return [];

  return (dados.contas ?? []).map((c) => ({ id: c.id, nome: c.apelido, tipo: "conta" }));
}

/**
 * Lista as formas de pagamento disponíveis (contas, cartões e dinheiro) no
 * formato { id, nome, tipo }, para seleção ao registrar um gasto.
 */
export async function listarFormasDePagamento() {
  let dados;
  try { dados = await obterCarteiras(); } catch { return []; }
  if (!dados) return [];

  const contas = (dados.contas ?? []).map((c) => ({ id: c.id, nome: c.apelido, tipo: "conta" }));
  const cartoes = (dados.cartoes ?? []).map((c) => ({
    id: c.id,
    nome: `${c.apelido} (${c.subtipo === "credito" ? "Crédito" : "Débito"})`,
    tipo: "cartao",
  }));
  const dinheiro = (dados.dinheiroEReservas ?? [])
    .filter((d) => d.tipo === "dinheiro")
    .map((d) => ({ id: d.id, nome: d.apelido, tipo: "dinheiro" }));

  return [...contas, ...cartoes, ...dinheiro];
}
