/**
 * Dados FICTÍCIOS da página Carteira (apenas para estruturar a UI).
 * Nenhum dado real; nenhum número completo de cartão, CVV ou senha.
 *
 * Modelagem pensada para evoluir sem reconstruir a página:
 *  - cada item tem um "tipo": cartao | conta | dinheiro | reserva
 *  - cartão pode referenciar a conta associada (contaId)
 *  - reserva pode referenciar a conta de origem (contaId) -> é parte do
 *    saldo da conta, não dinheiro adicional
 *  - cartão de crédito tem fatura/limite (não entra como saldo em conta)
 *  - movimentações ficam indexadas por item (itemId)
 */

export const contas = [
  {
    id: "conta-nubank",
    tipo: "conta",
    apelido: "Nubank",
    instituicao: "Nu Pagamentos",
    tipoConta: "Conta corrente",
    saldo: 1240.0,
  },
  {
    id: "conta-inter",
    tipo: "conta",
    apelido: "Banco Inter",
    instituicao: "Banco Inter",
    tipoConta: "Conta corrente",
    saldo: 760.0,
  },
];

export const cartoes = [
  {
    id: "cartao-nubank",
    tipo: "cartao",
    subtipo: "credito", // credito | debito
    apelido: "Nubank",
    bandeira: "mastercard",
    tema: "roxo",
    ultimosDigitos: "4821",
    validade: "08/29",
    contaId: "conta-nubank", // conta associada
    faturaAtual: 320.0,
    limite: 2500.0,
  },
  {
    id: "cartao-inter-debito",
    tipo: "cartao",
    subtipo: "debito",
    apelido: "Inter Débito",
    bandeira: "visa",
    tema: "verde",
    ultimosDigitos: "1096",
    validade: "03/28",
    contaId: "conta-inter", // débito usa o saldo da conta associada
  },
];

export const dinheiroEReservas = [
  {
    id: "dinheiro-especie",
    tipo: "dinheiro",
    apelido: "Dinheiro na carteira",
    saldo: 180.0,
  },
  {
    id: "reserva-emergencia",
    tipo: "reserva",
    apelido: "Reserva de emergência",
    contaId: "conta-nubank", // parte do saldo da conta, não valor extra
    valorReservado: 900.0,
    objetivo: 3000.0,
  },
];

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

/**
 * Resumo do topo (fictício, sem cálculo complexo):
 *  - saldoContas: soma dos saldos de contas + dinheiro físico
 *    (reservas NÃO somam de novo, pois são parte do saldo da conta)
 *  - faturasCartoes: soma das faturas em aberto dos cartões de crédito
 */
export function calcularResumo() {
  const saldoContas =
    contas.reduce((acc, c) => acc + (c.saldo || 0), 0) +
    dinheiroEReservas
      .filter((i) => i.tipo === "dinheiro")
      .reduce((acc, d) => acc + (d.saldo || 0), 0);

  const faturasCartoes = cartoes
    .filter((c) => c.subtipo === "credito")
    .reduce((acc, c) => acc + (c.faturaAtual || 0), 0);

  return { saldoContas, faturasCartoes };
}
