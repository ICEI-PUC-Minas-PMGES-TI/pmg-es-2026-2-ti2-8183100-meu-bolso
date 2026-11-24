import { useState, useMemo } from "react";

import styles from "./EvolucaoFinanceira.module.css";
import {
  formatarReal,
  retanguloArredondado,
  calcularEscala,
} from "./formatacao";
import { useLarguraGrafico } from "./useLarguraGrafico";

const MARGEM = { topo: 20, direita: 16, base: 28, esquerda: 16 };
const LARGURA_TOOLTIP = 170;

// Gráfico de barras lado a lado: renda (verde) e gastos (vermelho) por mês.
// Cada barra é empilhada: embaixo, cor cheia = REALIZADO; em cima, cor
// clara = PREVISTO (recorrências que ainda vão cair). Meses futuros só
// têm a parte prevista.
function GraficoBarras({
  titulo = "Gastos e renda por mês",
  dados = [],
  altura = 240,
  acoes = null,
}) {
  const { ref, largura } = useLarguraGrafico();
  const [barraAtiva, setBarraAtiva] = useState(null);

  const larguraUtil = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 10);
  const alturaUtil = altura - MARGEM.topo - MARGEM.base;

  // Teto do eixo Y conforme o maior total (realizado + previsto) do período.
  const { teto, marcas } = useMemo(
    () =>
      calcularEscala(
        Math.max(...dados.map((d) => Math.max(d.renda, d.gastos)), 1),
        0,
        500,
      ),
    [dados],
  );

  const passo = larguraUtil / Math.max(dados.length, 1);
  // Duas barras por mês, lado a lado, dentro do espaço do mês.
  const larguraBarra = Math.min(passo * 0.28, 32);
  const vao = larguraBarra * 0.25; // folga entre as duas barras

  const base = MARGEM.topo + alturaUtil;
  const posicaoY = (valor) => base - (valor / teto) * alturaUtil;
  const alturaValor = (valor) => (valor / teto) * alturaUtil;

  // Segmentos de uma barra empilhada. O topo arredondado vai sempre no
  // segmento de cima (o previsto, se existir; senão o realizado).
  function segmentos(x, realizado, previsto) {
    const hReal = alturaValor(realizado);
    const hPrev = alturaValor(previsto);
    return {
      real: { x, y: base - hReal, h: hReal, arredonda: hPrev <= 0 },
      prev: { x, y: base - hReal - hPrev, h: hPrev, arredonda: true },
      topo: base - hReal - hPrev,
    };
  }

  const barras = dados.map((d, i) => {
    const centroX = MARGEM.esquerda + passo * i + passo / 2;
    // Renda à esquerda do centro, gastos à direita.
    const xRenda = centroX - larguraBarra - vao / 2;
    const xGastos = centroX + vao / 2;

    return {
      ...d,
      centroX,
      renda_: segmentos(xRenda, d.rendaRealizada, d.rendaPrevista),
      gastos_: segmentos(xGastos, d.gastosRealizados, d.gastosPrevistos),
    };
  });

  const barra = barraAtiva !== null ? (barras[barraAtiva] ?? null) : null;

  const temPrevisao = dados.some(
    (d) => d.rendaPrevista > 0 || d.gastosPrevistos > 0,
  );

  const tooltipEsquerda = barra
    ? Math.min(
        Math.max(barra.centroX - LARGURA_TOOLTIP / 2, 0),
        largura - LARGURA_TOOLTIP,
      )
    : 0;

  // Texto de um valor no tooltip/aria: separa realizado e previsto.
  function descrever(realizado, previsto, futuro) {
    if (futuro) return `${formatarReal(previsto)} previsto`;
    if (previsto > 0) {
      return `${formatarReal(realizado)} + ${formatarReal(previsto)} previsto`;
    }
    return formatarReal(realizado);
  }

  function desenhar(seg, classe, ativa) {
    if (seg.h <= 0) return null;
    return (
      <path
        className={`${classe} ${ativa ? styles.barraAtiva : ""}`}
        d={retanguloArredondado(seg.x, seg.y, larguraBarra, seg.h, {
          topo: seg.arredonda ? 5 : 0,
        })}
      />
    );
  }

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.barrasTopo}>
        <h3>{titulo}</h3>
        <div className={styles.barrasTopoDireita}>
          <div className={styles.legenda}>
            <span className={styles.legendaItem}>
              <span className={`${styles.legendaCor} ${styles.corRenda}`} />
              Renda
            </span>
            <span className={styles.legendaItem}>
              <span className={`${styles.legendaCor} ${styles.corGastos}`} />
              Gastos
            </span>
            {temPrevisao && (
              <span className={styles.legendaItem}>
                <span className={`${styles.legendaCor} ${styles.corPrevisao}`} />
                Previsto
              </span>
            )}
          </div>
          {acoes}
        </div>
      </div>

      <div className={styles.grafico} ref={ref}>
        <svg
          className={styles.svg}
          width={largura}
          height={altura}
          role="img"
          aria-label={`${titulo}: ${dados
            .map(
              (d) =>
                `${d.mesCompleto}, renda ${descrever(
                  d.rendaRealizada,
                  d.rendaPrevista,
                  d.futuro,
                )}, gastos ${descrever(
                  d.gastosRealizados,
                  d.gastosPrevistos,
                  d.futuro,
                )}`,
            )
            .join("; ")}`}
        >
          {/* Linhas de grade do eixo Y */}
          {marcas.map((valor) => (
            <line
              key={valor}
              className={styles.grade}
              x1={MARGEM.esquerda}
              x2={largura - MARGEM.direita}
              y1={posicaoY(valor)}
              y2={posicaoY(valor)}
            />
          ))}

          {/* Barras lado a lado (renda e gastos), empilhadas */}
          {barras.map((b, i) => {
            const ativa = barraAtiva === i;
            return (
              <g
                key={b.chave}
                onPointerEnter={() => setBarraAtiva(i)}
                onPointerLeave={() => setBarraAtiva(null)}
              >
                {/* Área de hover invisível sobre toda a coluna */}
                <rect
                  x={MARGEM.esquerda + passo * i}
                  y={MARGEM.topo}
                  width={passo}
                  height={alturaUtil}
                  fill="transparent"
                />

                {desenhar(b.renda_.real, styles.barraRenda, ativa)}
                {desenhar(b.renda_.prev, styles.barraRendaPrevista, ativa)}
                {desenhar(b.gastos_.real, styles.barraGastos, ativa)}
                {desenhar(b.gastos_.prev, styles.barraGastosPrevista, ativa)}

                {/* Mês do eixo X (futuros em tom mais claro) */}
                <text
                  className={`${styles.rotuloX} ${
                    b.futuro ? styles.rotuloXFuturo : ""
                  } ${ativa ? styles.rotuloXAtivo : ""}`}
                  x={b.centroX}
                  y={altura - 6}
                  textAnchor="middle"
                >
                  {b.mes}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip com os valores do mês */}
        {barra && (
          <div
            className={styles.tooltip}
            style={{
              left: tooltipEsquerda,
              top: Math.max(Math.min(barra.renda_.topo, barra.gastos_.topo) - 74, 0),
              width: LARGURA_TOOLTIP,
            }}
          >
            <span className={styles.tooltipMes}>
              {barra.mesCompleto}
              {barra.futuro ? " · previsão" : ""}
            </span>
            <span className={`${styles.tooltipLinha} ${styles.tooltipRenda}`}>
              Renda:{" "}
              {descrever(barra.rendaRealizada, barra.rendaPrevista, barra.futuro)}
            </span>
            <span className={`${styles.tooltipLinha} ${styles.tooltipGastos}`}>
              Gastos:{" "}
              {descrever(
                barra.gastosRealizados,
                barra.gastosPrevistos,
                barra.futuro,
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default GraficoBarras;
