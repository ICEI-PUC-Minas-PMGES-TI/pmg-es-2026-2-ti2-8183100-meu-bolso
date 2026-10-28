import { useState, useMemo } from "react";

import styles from "./EvolucaoFinanceira.module.css";
import {
  formatarReal,
  retanguloArredondado,
  calcularEscala,
} from "./formatacao";
import { useLarguraGrafico } from "./useLarguraGrafico";

// topo maior para caber o rótulo de valor acima das barras
const MARGEM = { topo: 28, direita: 16, base: 28, esquerda: 16 };
const LARGURA_TOOLTIP = 150;

// Gráfico de barras empilhadas: gastos (topo) e guardado (base) por mês.
function GraficoBarras({
  titulo = "Gastos e guardado por mês",
  dados = [],
  altura = 240,
  acoes = null,
}) {
  const { ref, largura } = useLarguraGrafico();
  const [barraAtiva, setBarraAtiva] = useState(null);

  const larguraUtil = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 10);
  const alturaUtil = altura - MARGEM.topo - MARGEM.base;

  // Teto do eixo Y arredondado para a próxima marca de R$ 500
  const { teto, marcas } = useMemo(
    () =>
      calcularEscala(
        Math.max(...dados.map((d) => d.gastos + d.guardado), 1),
        500,
      ),
    [dados],
  );

  const passo = larguraUtil / dados.length;
  const larguraBarra = Math.min(passo * 0.5, 44);

  const posicaoY = (valor) =>
    MARGEM.topo + alturaUtil - (valor / teto) * alturaUtil;
  const alturaValor = (valor) => (valor / teto) * alturaUtil;

  // Cada barra com as posições já calculadas na tela.
  // "acumulado" é o saldo até o mês (entradas - gastos) — o MESMO
  // número que o gráfico de linha mostra naquele ponto.
  const barras = dados.map((d, i) => {
    const acumulado = dados
      .slice(0, i + 1)
      .reduce((soma, item) => soma + item.guardado - item.gastos, 0);

    const centroX = MARGEM.esquerda + passo * i + passo / 2;
    const x = centroX - larguraBarra / 2;

    const hGuardado = alturaValor(d.guardado);
    const hGastos = alturaValor(d.gastos);
    const yGuardado = MARGEM.topo + alturaUtil - hGuardado;
    const yGastos = yGuardado - hGastos;

    return { ...d, acumulado, centroX, x, hGuardado, hGastos, yGuardado, yGastos };
  });

  const barra = barraAtiva !== null ? (barras[barraAtiva] ?? null) : null;

  // Centraliza o tooltip na barra sem deixar sair do card
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
              <span className={`${styles.legendaCor} ${styles.corGastos}`} />
              Gastos
            </span>
            <span className={styles.legendaItem}>
              <span className={`${styles.legendaCor} ${styles.corGuardado}`} />
              Guardado
            </span>
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
                `${d.mes}, gastos ${formatarReal(
                  d.gastos,
                )}, guardado ${formatarReal(d.guardado)}`,
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

          {/* Barras empilhadas */}
          {barras.map((b, i) => (
            <g
              key={b.mes}
              onPointerEnter={() => setBarraAtiva(i)}
              onPointerLeave={() => setBarraAtiva(null)}
            >
              {/* Área clicável/hover invisível sobre toda a coluna */}
              <rect
                x={MARGEM.esquerda + passo * i}
                y={MARGEM.topo}
                width={passo}
                height={alturaUtil}
                fill="transparent"
              />

              {/* Guardado (base) — arredonda só a base */}
              <path
                className={`${styles.barraGuardado} ${
                  barraAtiva === i ? styles.barraAtiva : ""
                }`}
                d={retanguloArredondado(
                  b.x,
                  b.yGuardado,
                  larguraBarra,
                  b.hGuardado,
                  { base: 6 },
                )}
              />

              {/* Gastos (topo) — arredonda só o topo */}
              <path
                className={`${styles.barraGastos} ${
                  barraAtiva === i ? styles.barraAtiva : ""
                }`}
                d={retanguloArredondado(
                  b.x,
                  b.yGastos,
                  larguraBarra,
                  b.hGastos,
                  { topo: 6 },
                )}
              />

              {/* Rótulo do total acumulado acima da barra
                  (mesmo número que a linha mostra neste mês) */}
              <text
                className={styles.rotuloValor}
                x={b.centroX}
                y={b.yGastos - 8}
                textAnchor="middle"
              >
                {formatarReal(b.acumulado)}
              </text>

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
              top: Math.max(barra.yGastos - 70, 0),
              width: LARGURA_TOOLTIP,
            }}
          >
            <span className={styles.tooltipMes}>{barra.mes}</span>
            <span className={`${styles.tooltipLinha} ${styles.tooltipGastos}`}>
              Gastos: {formatarReal(barra.gastos)}
            </span>
            <span className={`${styles.tooltipLinha} ${styles.tooltipGuardado}`}>
              Guardado: {formatarReal(barra.guardado)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default GraficoBarras;
