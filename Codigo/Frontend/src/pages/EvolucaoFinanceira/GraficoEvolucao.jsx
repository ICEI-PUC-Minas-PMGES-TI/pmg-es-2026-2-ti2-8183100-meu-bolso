import { useState, useMemo, useRef, useEffect } from "react";

import styles from "./EvolucaoFinanceira.module.css";
import { formatarReal, formatarEixo, calcularEscala } from "./formatacao";
import { useLarguraGrafico } from "./useLarguraGrafico";

// esquerda maior para caber os rótulos do eixo Y (ex.: "R$ 3 mil")
const MARGEM = { topo: 12, direita: 24, base: 28, esquerda: 72 };
const RECUO = 18; // afasta o primeiro e o último ponto das bordas
const LARGURA_TOOLTIP = 120; // igual a .tooltip no CSS Module

// Gráfico de linha: total guardado acumulado ao longo dos meses.
function GraficoEvolucao({
  titulo = "Total guardado",
  subtitulo,
  dados = [],
  altura = 240,
  acoes = null,
}) {
  const { ref, largura } = useLarguraGrafico();
  const [pontoAtivo, setPontoAtivo] = useState(null);

  // Comprimento real da linha (px), para a animação de "desenhar"
  // ficar suave. Medido do próprio path após renderizar.
  const linhaRef = useRef(null);
  const [comprimentoLinha, setComprimentoLinha] = useState(0);

  const larguraUtil = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 10);
  const alturaUtil = altura - MARGEM.topo - MARGEM.base;

  // Eixo Y: marcas de R$ 1.000 em R$ 1.000, com piso para valores
  // negativos (quando os gastos superam as entradas acumuladas).
  const { piso, teto, marcas } = useMemo(() => {
    const valores = dados.map((d) => d.valor);
    return calcularEscala(Math.max(...valores, 1), Math.min(...valores, 0), 1000);
  }, [dados]);

  // Mapeia o valor dentro do range [piso, teto] para a coordenada Y.
  const posicaoY = (valor) =>
    MARGEM.topo + alturaUtil - ((valor - piso) / (teto - piso)) * alturaUtil;

  const posicaoX = (indice) => {
    if (dados.length === 1) return MARGEM.esquerda + larguraUtil / 2;
    const passo = (larguraUtil - RECUO * 2) / (dados.length - 1);
    return MARGEM.esquerda + RECUO + indice * passo;
  };

  // Cada ponto já com a posição calculada na tela
  const pontos = dados.map((d, i) => ({
    ...d,
    x: posicaoX(i),
    y: posicaoY(d.valor),
  }));

  const linha = pontos
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  // Mede o comprimento do path sempre que ele muda (dados/largura).
  useEffect(() => {
    if (linhaRef.current) {
      setComprimentoLinha(linhaRef.current.getTotalLength());
    }
  }, [linha]);

  // Descobre qual ponto está mais perto do mouse
  function handleMouseMove(event) {
    const caixa = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - caixa.left;

    let maisPerto = 0;
    let menorDistancia = Infinity;
    pontos.forEach((p, i) => {
      const distancia = Math.abs(p.x - mouseX);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        maisPerto = i;
      }
    });
    setPontoAtivo(maisPerto);
  }

  const ponto = pontoAtivo !== null ? (pontos[pontoAtivo] ?? null) : null;

  // Centraliza o tooltip no ponto sem deixar sair do card
  const tooltipEsquerda = ponto
    ? Math.min(
        Math.max(ponto.x - LARGURA_TOOLTIP / 2, 0),
        largura - LARGURA_TOOLTIP,
      )
    : 0;

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.topo}>
        <div className={styles.cardTopo}>
          <h3>{titulo}</h3>
          <p className="texto-secundario texto-pequeno">{subtitulo}</p>
        </div>
        {acoes}
      </div>

      <div className={styles.grafico} ref={ref}>
        <svg
          className={styles.svg}
          width={largura}
          height={altura}
          role="img"
          aria-label={`${titulo}: ${dados
            .map((d) => `${d.mes} ${formatarReal(d.valor)}`)
            .join(", ")}`}
          onPointerMove={handleMouseMove}
          onPointerDown={handleMouseMove}
          onPointerLeave={() => setPontoAtivo(null)}
        >
          {/* Linhas de grade e valores do eixo Y.
              A linha do zero fica destacada quando há saldo negativo. */}
          {marcas.map((valor) => (
            <g key={valor}>
              <line
                className={`${styles.grade} ${
                  valor === 0 && piso < 0 ? styles.gradeZero : ""
                }`}
                x1={MARGEM.esquerda}
                x2={largura - MARGEM.direita}
                y1={posicaoY(valor)}
                y2={posicaoY(valor)}
              />
              <text
                className={styles.rotuloY}
                x={MARGEM.esquerda - 14}
                y={posicaoY(valor)}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {formatarEixo(valor)}
              </text>
            </g>
          ))}

          {/* Meses do eixo X */}
          {pontos.map((p) => (
            <text
              className={styles.rotuloX}
              key={p.mes}
              x={p.x}
              y={altura - 6}
              textAnchor="middle"
            >
              {p.mes}
            </text>
          ))}

          {/* Linha vertical que aparece no hover */}
          {ponto && (
            <line
              className={styles.guia}
              x1={ponto.x}
              x2={ponto.x}
              y1={MARGEM.topo}
              y2={MARGEM.topo + alturaUtil}
            />
          )}

          {/* Linha do gráfico. O comprimento real medido (px) alimenta a
              animação de "desenhar", definida em .linha no CSS Module. */}
          <path
            ref={linhaRef}
            className={styles.linha}
            d={linha}
            style={{
              "--comprimento-linha": comprimentoLinha,
              // esconde até medir o comprimento, evitando um flash
              visibility: comprimentoLinha ? "visible" : "hidden",
            }}
          />

          {/* Bolinhas de cada mês */}
          {pontos.map((p, i) => (
            <circle
              key={p.mes}
              className={`${styles.ponto} ${
                pontoAtivo === i ? styles.pontoAtivo : ""
              }`}
              cx={p.x}
              cy={p.y}
              r={pontoAtivo === i ? 6 : 4.5}
            />
          ))}
        </svg>

        {/* Tooltip com o valor exato (só a posição é dinâmica) */}
        {ponto && (
          <div
            className={styles.tooltip}
            style={{ left: tooltipEsquerda, top: Math.max(ponto.y - 58, 0) }}
          >
            <span className={styles.tooltipMes}>{ponto.mes}</span>
            <strong className={styles.tooltipValor}>
              {formatarReal(ponto.valor)}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default GraficoEvolucao;
