/**
 * Monta as opções do SeletorOpcoes para os formulários de gasto e receita:
 * categorias (com o ícone da categoria) e contas (com a logo do banco e o saldo).
 */

import LogoBanco from "./LogoBanco";

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** categorias: lista de nomes; Icone: componente IconeCategoria do tipo. */
export function opcoesDeCategoria(categorias, Icone) {
  return categorias.map((nome) => ({
    valor: nome,
    rotulo: nome,
    icone: <Icone categoria={nome} tamanho={16} />,
  }));
}

/** contas: [{ id, nome, banco?, instituicao?, saldo? }] */
export function opcoesDeConta(contas) {
  return contas.map((conta) => ({
    valor: conta.id,
    rotulo: conta.nome,
    descricao: typeof conta.saldo === "number" ? `Saldo ${formatarMoeda(conta.saldo)}` : undefined,
    icone: <LogoBanco conta={conta} />,
  }));
}
