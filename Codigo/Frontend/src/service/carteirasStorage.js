/**
 * Acesso compartilhado às carteiras persistidas no localStorage.
 *
 * A página Carteiras guarda três listas (cartoes, contas, dinheiroEReservas)
 * sob a chave "meubolso:carteira". Enquanto não há back-end, a página de
 * Metas lê e atualiza esses mesmos dados para refletir o saldo das carteiras
 * quando há uma movimentação (depósito/retirada) vinculada a uma meta.
 *
 * Quando o back-end existir, estas funções serão substituídas por chamadas
 * à API (src/service/Api.js).
 */

const CHAVE_STORAGE = "meubolso:carteira";

/** Lê o objeto bruto salvo { cartoes, contas, dinheiroEReservas } ou null. */
function lerBruto() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    if (
      Array.isArray(dados?.cartoes) &&
      Array.isArray(dados?.contas) &&
      Array.isArray(dados?.dinheiroEReservas)
    ) {
      return dados;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Retorna as carteiras que possuem saldo movimentável (contas e dinheiro
 * físico), no formato { id, nome, saldo, origem }. São as únicas que podem
 * ceder ou receber dinheiro numa movimentação de meta — cartões (fatura/
 * limite) e reservas ficam de fora.
 *
 * `origem` indica a lista de origem para saber onde gravar de volta.
 */
export function listarCarteirasComSaldo() {
  const dados = lerBruto();
  if (!dados) return [];

  const contas = dados.contas
    .filter((c) => typeof c.saldo === "number")
    .map((c) => ({ id: c.id, nome: c.apelido, saldo: c.saldo, origem: "contas" }));

  const dinheiro = dados.dinheiroEReservas
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
 * Aplica uma variação de saldo a uma carteira e persiste no localStorage.
 * `delta` positivo entra na carteira; negativo sai.
 * Retorna true se conseguiu gravar.
 */
export function ajustarSaldoCarteira(carteiraId, delta) {
  const dados = lerBruto();
  if (!dados) return false;

  const aplicar = (lista) =>
    lista.map((item) =>
      item.id === carteiraId && typeof item.saldo === "number"
        ? { ...item, saldo: item.saldo + delta }
        : item
    );

  const atualizado = {
    ...dados,
    contas: aplicar(dados.contas),
    dinheiroEReservas: aplicar(dados.dinheiroEReservas),
  };

  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(atualizado));
    return true;
  } catch {
    return false;
  }
}
