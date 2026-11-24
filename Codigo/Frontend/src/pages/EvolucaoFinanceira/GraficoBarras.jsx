import { useState, useMemo } from "react";

import styles from "./EvolucaoFinanceira.module.css";
import {
  formatarReal,
  retanguloArredondado,
  calcularEscala,
} from "./formatacao";
import { useLarguraGrafico } from "./useLarguraGrafico";

const MARGEM = { topo: 20, direita: 16, base: 28, esquerda: 16 };
const LARGURA_TOOLTIP = 150;

// Gráfico de barras lado a lado: renda (verde) e gastos (vermelho) por mês.
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

  // Teto do eixo Y conforme o maior valor entre renda e gastos do período.
  const { teto, marcas } = useMemo(
    () =>
      calcularEscala(
        Math.max(...dados.map((d) => Math.max(d.renda, d.gastos)), 1),
        0,
        500,
      ),
    [dados],
  );

  const passo = larguraUtil / dados.length;
  // Duas barras por mês, lado a lado, dentro do espaço do mês.
  const larguraBarra = Math.min(passo * 0.28, 32);
  const vao = larguraBarra * 0.25; // folga entre as duas barras

  const posicaoY = (valor) =>
    MARGEM.topo + alturaUtil - (valor / teto) * alturaUtil;
  const alturaValor = (valor) => (valor / teto) * alturaUtil;

  const barras = dados.map((d, i) => {
    const centroX = MARGEM.esquerda + passo * i + passo / 2;

    const hRenda = alturaValor(d.renda);
    const hGastos = alturaValor(d.gastos);
    const base = MARGEM.topo + alturaUtil;

    // Renda à esquerda do centro, gastos à direita.
    const xRenda = centroX - larguraBarra - vao / 2;
    const xGastos = centroX + vao / 2;

    return {
      ...d,
      centroX,
      xRenda,
      xGastos,
      hRenda,
      hGastos,
      yRenda: base - hRenda,
      yGastos: base - hGastos,
    };
  });

  const barra = barraAtiva !== null ? (barras[barraAtiva] ?? null) : null;

  // Meses futuros são prospecção (recorrências projetadas).
  const temPrevisao = dados.some((d) => d.projetado);

  const tooltipEsquerda = barra
    ? Math.min(
        Math.max(barra.centroX - LARGURA_TOOLTIP / 2, 0),
        largura - LARGURA_TOOLTIP,
      )
    : 0;

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
                Previsão
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
                `${d.mesCompleto ?? d.mes}${d.projetado ? " (previsão)" : ""}, renda ${formatarReal(
                  d.renda,
                )}, gastos ${formatarReal(d.gastos)}`,
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

          {/* Barras lado a lado (renda e gastos) */}
          {barras.map((b, i) => (
            <g
              key={b.chave ?? b.mes}
              className={b.projetado ? styles.colunaPrevista : undefined}
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

              {/* Renda (verde) */}
              <path
                className={`${styles.barraRenda} ${
                  barraAtiva === i ? styles.barraAtiva : ""
                }`}
                d={retanguloArredondado(
                  b.xRenda,
                  b.yRenda,
                  larguraBarra,
                  b.hRenda,
                  { topo: 5 },
                )}
              />

              {/* Gastos (vermelho) */}
              <path
                className={`${styles.barraGastos} ${
                  barraAtiva === i ? styles.barraAtiva : ""
                }`}
                d={retanguloArredondado(
                  b.xGastos,
                  b.yGastos,
                  larguraBarra,
                  b.hGastos,
                  { topo: 5 },
                )}
              />

              {/* Mês do eixo X */}
              <text
                className={`${styles.rotuloX} ${
                  barraAtiva === i ? styles.rotuloXAtivo : ""
                }`}
                x={b.centroX}
                y={altura - 6}
                textAnchor="middle"
              >
                {b.mes}
              </text>
            </g>
          ))}
        </svg>

        {/* Tooltip com os valores do mês */}
        {barra && (
          <div
            className={styles.tooltip}
            style={{
              left: tooltipEsquerda,
              top: Math.max(Math.min(barra.yRenda, barra.yGastos) - 70, 0),
              width: LARGURA_TOOLTIP,
            }}
          >
            <span className={styles.tooltipMes}>
              {barra.mesCompleto ?? barra.mes}
              {barra.projetado ? " · previsão" : ""}
            </span>
            <span className={`${styles.tooltipLinha} ${styles.tooltipRenda}`}>
              Renda: {formatarReal(barra.renda)}
            </span>
            <span className={`${styles.tooltipLinha} ${styles.tooltipGastos}`}>
              Gastos: {formatarReal(barra.gastos)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default GraficoBarras;
