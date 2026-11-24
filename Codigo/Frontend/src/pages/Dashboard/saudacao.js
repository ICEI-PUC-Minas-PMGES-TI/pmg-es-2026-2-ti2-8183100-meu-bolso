// Saudação da Visão geral conforme a hora local do usuário (navegador):
//   05:00 às 11:59 -> "Bom dia"
//   12:00 às 17:59 -> "Boa tarde"
//   18:00 às 04:59 -> "Boa noite"
export function saudacaoPorHora(hora) {
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function saudacaoAgora(agora = new Date()) {
  return saudacaoPorHora(agora.getHours());
}
