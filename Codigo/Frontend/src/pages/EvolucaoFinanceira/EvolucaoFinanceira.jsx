import { useState, useRef, useEffect, useMemo } from "react";

import styles from "./EvolucaoFinanceira.module.css";

// ============================================================
// EVOLUÇÃO FINANCEIRA
// ------------------------------------------------------------
// Página que mostra o dinheiro acumulado ao longo dos meses em
// um gráfico de linha. Segue o padrão das demais páginas
// (componente funcional + CSS Module + classes globais do
// global.css).
//
// TODO (back-end): substituir os dados de exemplo por chamadas
// ao serviço de API (src/service/Api.js).
// ============================================================

// Dados de exemplo apenas para visualizar o layout.
// Serão removidos quando a integração com a API for feita.
const DADOS_PADRAO = [
  { mes: "Mai", valor: 380 },
  { mes: "Jun", valor: 905 },
  { mes: "Jul", valor: 1330 },
  { mes: "Ago", valor: 2085 },
  { mes: "Set", valor: 2680 },
];

// Formata em reais: 2085 -> "R$ 2.085,00"
function formatarReal(numero) {
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Rótulo do eixo Y: 0 -> "R$ 0" | 1000 -> "R$ 1 mil"
function formatarEixo(numero) {
  return numero === 0 ? "R$ 0" : `R$ ${numero / 1000} mil`;
}

function GraficoEvolucao({
  titulo = "Evolução financeira",
  subtitulo = "Dinheiro acumulado nos últimos 5 meses",
  dados = DADOS_PADRAO,
  altura = 160,
}) {
  const areaRef = useRef(null);

  // Largura real do gráfico (atualiza quando a tela muda de tamanho)
  const [largura, setLargura] = useState(700);

  // Índice do ponto sob o mouse (null = nenhum)
  const [pontoAtivo, setPontoAtivo] = useState(null);

  useEffect(() => {
    const elemento = areaRef.current;
    if (!elemento) return;

    const observador = new ResizeObserver(([entrada]) => {
      setLargura(entrada.contentRect.width);
    });

    observador.observe(elemento);
    setLargura(elemento.getBoundingClientRect().width);

    return () => observador.disconnect();
  }, []);

  // Espaços internos do gráfico
  const margem = { topo: 12, direita: 24, base: 28, esquerda: 56 };
  const recuo = 18; // afasta o primeiro e o último ponto das bordas
  const larguraUtil = Math.max(largura - margem.esquerda - margem.direita, 10);
  const alturaUtil = altura - margem.topo - margem.base;

  // Eixo Y: marcas de R$ 1.000 em R$ 1.000
  const { teto, marcas } = useMemo(() => {
    const maior = Math.max(...dados.map((d) => d.valor), 1);
    const teto = Math.ceil(maior / 1000) * 1000;
    const marcas = [];

    for (let v = 0; v <= teto; v += 1000) {
      marcas.push(v);
    }

    return { teto, marcas };
  }, [dados]);

  function posicaoX(indice) {
    if (dados.length === 1) {
      return margem.esquerda + larguraUtil / 2;
    }
    const passo = (larguraUtil - recuo * 2) / (dados.length - 1);
    return margem.esquerda + recuo + indice * passo;
  }

  function posicaoY(valor) {
    return margem.topo + alturaUtil - (valor / teto) * alturaUtil;
  }

  // Cada ponto já com a posição calculada na tela
  const pontos = dados.map((d, i) => ({
    ...d,
    x: posicaoX(i),
    y: posicaoY(d.valor),
  }));

  const linha = pontos
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

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

  function handleMouseLeave() {
    setPontoAtivo(null);
  }

  const ponto = pontoAtivo !== null ? pontos[pontoAtivo] : null;

  // Centraliza o tooltip no ponto sem deixar sair do card
  // (a largura de 120px também está em .tooltip no CSS Module)
  const larguraTooltip = 120;
  const tooltipEsquerda = ponto
    ? Math.min(
        Math.max(ponto.x - larguraTooltip / 2, 0),
        largura - larguraTooltip
      )
    : 0;

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.cardTopo}>
        <h3>{titulo}</h3>
        <p className="texto-secundario texto-pequeno">{subtitulo}</p>
      </div>

      <div className={styles.grafico} ref={areaRef}>
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
          onPointerLeave={handleMouseLeave}
        >
          {/* Linhas de grade e valores do eixo Y */}
          {marcas.map((valor) => (
            <g key={valor}>
              <line
                className={styles.grade}
                x1={margem.esquerda}
                x2={largura - margem.direita}
                y1={posicaoY(valor)}
                y2={posicaoY(valor)}
              />
              <text
                className={styles.rotuloY}
                x={margem.esquerda - 14}
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
              y1={margem.topo}
              y2={margem.topo + alturaUtil}
            />
          )}

          {/* Linha do gráfico */}
          <path className={styles.linha} d={linha} />

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

// Página de Evolução Financeira (renderizada dentro do Layout, como as demais)
function EvolucaoFinanceira() {
  return (
    <div className={styles.evolucao}>
      <div className={styles.cabecalho}>
        <h1>Evolução financeira</h1>
        <p className="texto-secundario">
          Acompanhe o crescimento do seu dinheiro ao longo dos meses.
        </p>
      </div>

      <GraficoEvolucao />
    </div>
  );
}

export default EvolucaoFinanceira;
