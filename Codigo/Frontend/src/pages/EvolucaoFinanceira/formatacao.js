// ============================================================
// FORMATAÇÃO E HELPERS DE SVG — Evolução Financeira
// Funções puras, reutilizadas pelos dois gráficos.
// ============================================================

// Formata em reais: 2085 -> "R$ 2.085,00"
export function formatarReal(numero) {
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Rótulo do eixo Y: 0 -> "R$ 0" | 1000 -> "R$ 1 mil"
export function formatarEixo(numero) {
  return numero === 0 ? "R$ 0" : `R$ ${numero / 1000} mil`;
}

// Gera um "d" de <path> para um retângulo com cantos arredondados só
// em algumas pontas. Usado para empilhar barras sem "cortar" a junção:
// o segmento de cima arredonda só o topo, o de baixo só a base.
export function retanguloArredondado(x, y, largura, altura, { topo = 0, base = 0 }) {
  if (altura <= 0) return "";

  const rTopo = Math.min(topo, largura / 2, altura);
  const rBase = Math.min(base, largura / 2, altura);
  const direita = x + largura;
  const baixo = y + altura;

  return [
    `M${x},${y + rTopo}`,
    rTopo ? `Q${x},${y} ${x + rTopo},${y}` : `L${x},${y}`,
    `L${direita - rTopo},${y}`,
    rTopo ? `Q${direita},${y} ${direita},${y + rTopo}` : "",
    `L${direita},${baixo - rBase}`,
    rBase
      ? `Q${direita},${baixo} ${direita - rBase},${baixo}`
      : `L${direita},${baixo}`,
    `L${x + rBase},${baixo}`,
    rBase ? `Q${x},${baixo} ${x},${baixo - rBase}` : "",
    "Z",
  ]
    .filter(Boolean)
    .join(" ");
}

// Calcula o piso e o teto do eixo Y e as marcas de grade, de
// "degrau" em "degrau". O teto é arredondado para cima; o piso,
// para baixo (fica negativo quando há valores abaixo de zero).
// Quando não há negativos, o piso é 0 (comportamento usual).
//
// Ex.: maior=2680, menor=0,   degrau=1000 -> piso 0,     teto 3000
//      maior=1200, menor=-800, degrau=1000 -> piso -1000, teto 2000
export function calcularEscala(maiorValor, menorValor, degrau) {
  const teto = Math.ceil(Math.max(maiorValor, 1) / degrau) * degrau;
  const piso = Math.min(Math.floor(Math.min(menorValor, 0) / degrau) * degrau, 0);

  const marcas = [];
  for (let v = piso; v <= teto; v += degrau) {
    marcas.push(v);
  }
  return { piso, teto, marcas };
}
