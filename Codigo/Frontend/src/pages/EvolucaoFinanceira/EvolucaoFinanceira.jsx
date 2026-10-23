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

// ------------------------------------------------------------
// FONTE ÚNICA DE DADOS
// ------------------------------------------------------------
// Os dois gráficos derivam destes mesmos registros mensais, para
// que contem a mesma história: cada mês tem o quanto foi "gasto"
// e o quanto foi "guardado". O gráfico de barras mostra esses
// dois valores empilhados; o gráfico de linha mostra o ACUMULADO
// do que foi guardado ao longo dos meses.
//
// Dados de exemplo apenas para visualizar o layout. Serão
// substituídos pela chamada à API (src/service/Api.js).
const DADOS_MENSAIS = [
  { mes: "Mai", gastos: 1200, guardado: 300 },
  { mes: "Jun", gastos: 1100, guardado: 250 },
  { mes: "Jul", gastos: 1400, guardado: 420 },
  { mes: "Ago", gastos: 1050, guardado: 350 },
  { mes: "Set", gastos: 1300, guardado: 380 },
  { mes: "Out", gastos: 1250, guardado: 450 },
];

// Deriva a série acumulada (gráfico de linha) a partir dos dados
// mensais: cada ponto é a soma de tudo que foi guardado até o mês.
function calcularAcumulado(dadosMensais) {
  let total = 0;
  return dadosMensais.map((d) => {
    total += d.guardado;
    return { mes: d.mes, valor: total };
  });
}

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

// Gera um "d" de <path> para um retângulo com cantos arredondados só
// em algumas pontas. Usado para empilhar barras sem "cortar" a junção:
// o segmento de cima arredonda só o topo, o de baixo só a base.
function retanguloArredondado(x, y, largura, altura, { topo = 0, base = 0 }) {
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

function GraficoEvolucao({
  titulo = "Total guardado",
  subtitulo,
  dados = [],
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

  // Descobre qual ponto está mais perto do mouse e avisa a página
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

  const ponto = pontoAtivo !== null ? (pontos[pontoAtivo] ?? null) : null;

  // Centraliza o tooltip no ponto sem deixar sair do card
  // (a largura de 120px também está em .tooltip no CSS Module)
  const larguraTooltip = 120;
  const tooltipEsquerda = ponto
    ? Math.min(
        Math.max(ponto.x - larguraTooltip / 2, 0),
        largura - larguraTooltip,
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

// Gráfico de barras empilhadas: gastos (topo) e guardado (base) por mês.
function GraficoBarras({
  titulo = "Gastos e guardado por mês",
  dados = [],
  altura = 240,
}) {
  const areaRef = useRef(null);

  // Largura real do gráfico (atualiza quando a tela muda de tamanho)
  const [largura, setLargura] = useState(700);

  // Índice da barra sob o mouse (null = nenhuma)
  const [barraAtiva, setBarraAtiva] = useState(null);

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

  // Espaços internos do gráfico (topo maior para caber o rótulo de valor)
  const margem = { topo: 28, direita: 16, base: 28, esquerda: 16 };
  const larguraUtil = Math.max(largura - margem.esquerda - margem.direita, 10);
  const alturaUtil = altura - margem.topo - margem.base;

  // Teto do eixo Y arredondado para a próxima marca de R$ 500
  const { teto, marcas } = useMemo(() => {
    const maior = Math.max(...dados.map((d) => d.gastos + d.guardado), 1);
    const teto = Math.ceil(maior / 500) * 500;
    const marcas = [];

    for (let v = 0; v <= teto; v += 500) {
      marcas.push(v);
    }

    return { teto, marcas };
  }, [dados]);

  // Largura e espaçamento das colunas
  const passo = larguraUtil / dados.length;
  const larguraBarra = Math.min(passo * 0.5, 44);

  function posicaoY(valor) {
    return margem.topo + alturaUtil - (valor / teto) * alturaUtil;
  }

  function alturaValor(valor) {
    return (valor / teto) * alturaUtil;
  }

  // Cada barra com as posições já calculadas na tela.
  // "acumulado" é a soma do guardado até o mês — o MESMO número
  // que o gráfico de linha mostra naquele ponto. Calculado sem
  // variável mutável para não reatribuir durante o render.
  const barras = dados.map((d, i) => {
    const acumulado = dados
      .slice(0, i + 1)
      .reduce((soma, item) => soma + item.guardado, 0);

    const centroX = margem.esquerda + passo * i + passo / 2;
    const x = centroX - larguraBarra / 2;

    const hGuardado = alturaValor(d.guardado);
    const hGastos = alturaValor(d.gastos);

    const yGuardado = margem.topo + alturaUtil - hGuardado;
    const yGastos = yGuardado - hGastos;

    return {
      ...d,
      acumulado,
      centroX,
      x,
      hGuardado,
      hGastos,
      yGuardado,
      yGastos,
    };
  });

  const barra = barraAtiva !== null ? (barras[barraAtiva] ?? null) : null;

  // Centraliza o tooltip na barra sem deixar sair do card
  const larguraTooltip = 150;
  const tooltipEsquerda = barra
    ? Math.min(
        Math.max(barra.centroX - larguraTooltip / 2, 0),
        largura - larguraTooltip,
      )
    : 0;

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.barrasTopo}>
        <h3>{titulo}</h3>
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
      </div>

      <div className={styles.grafico} ref={areaRef}>
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
              x1={margem.esquerda}
              x2={largura - margem.direita}
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
                x={margem.esquerda + passo * i}
                y={margem.topo}
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
              width: larguraTooltip,
            }}
          >
            <span className={styles.tooltipMes}>{barra.mes}</span>
            <span className={`${styles.tooltipLinha} ${styles.tooltipGastos}`}>
              Gastos: {formatarReal(barra.gastos)}
            </span>
            <span
              className={`${styles.tooltipLinha} ${styles.tooltipGuardado}`}
            >
              Guardado: {formatarReal(barra.guardado)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Página de Evolução Financeira (renderizada dentro do Layout, como as demais)
function EvolucaoFinanceira() {
  // Fonte única de dados; os dois gráficos derivam daqui.
  const dadosMensais = DADOS_MENSAIS;

  // Série acumulada do que foi guardado (para o gráfico de linha).
  const dadosAcumulado = useMemo(
    () => calcularAcumulado(dadosMensais),
    [dadosMensais],
  );

  const totalMeses = dadosMensais.length;

  return (
    <div className={styles.evolucao}>
      <div className={styles.cabecalho}>
        <h1>Evolução financeira</h1>
        <p className="texto-secundario">
          Acompanhe o crescimento do seu dinheiro ao longo dos meses.
        </p>
      </div>

      <GraficoEvolucao
        dados={dadosAcumulado}
        subtitulo={`Dinheiro acumulado nos últimos ${totalMeses} meses`}
      />
      <GraficoBarras dados={dadosMensais} />
    </div>
  );
}

export default EvolucaoFinanceira;
