/**
 * Acesso compartilhado às carteiras persistidas no back-end (por usuário).
 *
 * A página Metas usa estas funções para refletir o saldo das carteiras
 * quando há uma movimentação (depósito/retirada) vinculada a uma meta.
 * Os dados vêm da API em { cartoes, contas, dinheiroEReservas, movsDinheiro }.
 */

import { obterCarteiras, salvarCarteiras } from "./Api";

/**
 * Retorna as carteiras que possuem saldo movimentável (contas e dinheiro
 * físico), no formato { id, nome, saldo, origem }. São as únicas que podem
 * ceder ou receber dinheiro numa movimentação de meta — cartões (fatura/
 * limite) e reservas ficam de fora.
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

  const dinheiro = (dados.dinheiroEReservas ?? [])
    .filter((d) => d.tipo === "dinheiro" && typeof d.saldo === "number")
    .map((d) => ({
      id: d.id,
      nome: d.apelido,
      saldo: d.saldo,
      origem: "dinheiroEReservas",
    }));

  return [...contas, ...dinheiro];
}

/**
 * Aplica uma variação de saldo a uma carteira e persiste via API.
 * `delta` positivo entra na carteira; negativo sai.
 * Retorna true se conseguiu gravar.
 */
export async function ajustarSaldoCarteira(carteiraId, delta) {
  try {
    const dados = await obterCarteiras();
    if (!dados) return false;

    const aplicar = (lista) =>
      (lista ?? []).map((item) =>
        item.id === carteiraId && typeof item.saldo === "number"
          ? { ...item, saldo: item.saldo + delta }
          : item
      );

    await salvarCarteiras({
      cartoes: dados.cartoes ?? [],
      contas: aplicar(dados.contas),
      dinheiroEReservas: aplicar(dados.dinheiroEReservas),
      movsDinheiro: dados.movsDinheiro ?? [],
    });
    return true;
  } catch {
    return false;
  }
}
