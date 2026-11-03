/**
 * Dados auxiliares da página Carteira.
 *  - movimentacoesPorItem: ainda consumido por EvolucaoFinanceira/dados.js
 *  - formatarBRL: utilitário de formatação monetária
 */

/** Movimentações fictícias indexadas por item selecionado. */
export const movimentacoesPorItem = {
  "conta-nubank": [
    { id: 1, descricao: "Salário do estágio", categoria: "Receita", data: "17 out", valor: 1800.0, entrada: true },
    { id: 2, descricao: "Mercado", categoria: "Alimentação", data: "16 out", valor: -142.9, entrada: false },
    { id: 3, descricao: "Conta de luz", categoria: "Casa", data: "14 out", valor: -98.0, entrada: false },
  ],
  "conta-inter": [
    { id: 1, descricao: "Transferência recebida", categoria: "Receita", data: "15 out", valor: 300.0, entrada: true },
    { id: 2, descricao: "Farmácia", categoria: "Saúde", data: "12 out", valor: -56.4, entrada: false },
  ],
  "cartao-nubank": [
    { id: 1, descricao: "Assinatura de streaming", categoria: "Assinaturas", data: "14 out", valor: -27.9, entrada: false },
    { id: 2, descricao: "Jantar", categoria: "Alimentação", data: "13 out", valor: -88.0, entrada: false },
    { id: 3, descricao: "Livraria", categoria: "Educação", data: "10 out", valor: -64.5, entrada: false },
  ],
  "cartao-inter-debito": [
    { id: 1, descricao: "Recarga de ônibus", categoria: "Transporte", data: "15 out", valor: -50.0, entrada: false },
  ],
  "dinheiro-especie": [
    { id: 1, descricao: "Troco do almoço", categoria: "Alimentação", data: "17 out", valor: -12.0, entrada: false },
  ],
  "reserva-emergencia": [
    { id: 1, descricao: "Aporte mensal", categoria: "Reserva", data: "05 out", valor: 150.0, entrada: true },
  ],
};

/** Formata número para BRL. */
export function formatarBRL(valor) {
  if (typeof valor !== "number") return valor ?? "";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
