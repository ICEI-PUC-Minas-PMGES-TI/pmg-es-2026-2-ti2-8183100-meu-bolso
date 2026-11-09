import { useEffect, useRef } from "react";

import styles from "./OrbeJarvis.module.css";

// ============================================================
// ORBE JARVIS
// ------------------------------------------------------------
// Disco de partículas em canvas 2D, distribuídas pela espiral de
// Fibonacci sobre uma esfera e projetadas com perspectiva simples.
// A prop `estado` ("parado" | "pensando" | "falando") só atualiza um
// ref: a animação roda em requestAnimationFrame, sem re-render por
// quadro. Pausa com a aba oculta ou fora da tela. Em prefers-reduced-
// motion desenha um único quadro estático.
// ============================================================

const INCLINACAO_X = 0.25;
const PERSPECTIVA = 2.6;
const DOIS_PI = Math.PI * 2;
const ANGULO_OURO = Math.PI * (3 - Math.sqrt(5));

function menosMovimento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

// Lê um token de cor do CSS (sem hex no código).
function lerCor(nome) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(nome)
    .trim();
}

// Pontos da esfera pela espiral de Fibonacci.
function gerarPontos(n) {
  const pts = new Array(n);
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * i) / (n - 1);
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * ANGULO_OURO;
    pts[i] = { x: r * Math.cos(theta), y, z: r * Math.sin(theta) };
  }
  return pts;
}

function OrbeJarvis({ estado = "parado" }) {
  const recipienteRef = useRef(null);
  const canvasRef = useRef(null);
  // Estado mutável da animação (sem causar re-render).
  const refs = useRef({
    estado,
    giro: 0,
    tempo: 0,
    raf: 0,
    visivelAba: true,
    visivelTela: true,
    css: null,
    cor: { escuro: "", principal: "", claro: "" },
  });

  // A prop só alimenta o ref.
  useEffect(() => {
    refs.current.estado = estado;
  }, [estado]);

  useEffect(() => {
    const recipiente = recipienteRef.current;
    const canvas = canvasRef.current;
    if (!recipiente || !canvas) return;
    const ctx = canvas.getContext("2d");
    const dados = refs.current;

    const reduzido = menosMovimento();
    const n = window.innerWidth < 480 ? 500 : 900;
    const pontos = gerarPontos(n);

    dados.cor = {
      escuro: lerCor("--verde-escuro"),
      principal: lerCor("--verde-principal"),
      claro: lerCor("--verde-claro"),
    };

    let largura = 0;
    let altura = 0;

    function dimensionar() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      largura = recipiente.clientWidth;
      altura = recipiente.clientHeight;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function desenhar() {
      const lado = Math.min(largura, altura);
      const cx = largura / 2;
      const cy = altura / 2;
      const raioBase = 0.4 * lado;
      const t = dados.tempo;
      const est = dados.estado;

      let respiracao = 1;
      let tremor = 0;
      let onda = 0;
      if (est === "pensando") {
        respiracao = 1 + 0.05 * Math.sin((t / 800) * DOIS_PI);
      } else if (est === "falando") {
        onda = 1;
      } else {
        respiracao = 1 + 0.02 * Math.sin((t / 5600) * DOIS_PI);
        tremor = 1;
      }

      ctx.clearRect(0, 0, largura, altura);

      // Disco de fundo.
      ctx.fillStyle = dados.cor.escuro;
      ctx.beginPath();
      ctx.arc(cx, cy, raioBase * respiracao, 0, DOIS_PI);
      ctx.fill();

      const cos = Math.cos(dados.giro);
      const sen = Math.sin(dados.giro);
      const cosX = Math.cos(INCLINACAO_X);
      const senX = Math.sin(INCLINACAO_X);

      ctx.fillStyle = dados.cor.principal;
      for (let i = 0; i < n; i++) {
        const p = pontos[i];
        // Giro em torno de Y.
        const x1 = p.x * cos - p.z * sen;
        const z1 = p.x * sen + p.z * cos;
        // Inclinação fixa em X.
        const y2 = p.y * cosX - z1 * senX;
        const z2 = p.y * senX + z1 * cosX;

        const f = PERSPECTIVA / (PERSPECTIVA - z2);
        const prof = (z2 + 1) / 2;

        let raio = raioBase * respiracao;
        if (tremor) {
          raio *= 1 + 0.012 * Math.sin(t / 300 + i);
        }
        if (onda) {
          raio += raioBase * 0.05 * Math.sin(t / 110 + p.y * 7);
        }

        const px = cx + x1 * raio * f;
        const py = cy + y2 * raio * f;
        const tamanho = (0.6 + 1.1 * prof) * f;

        ctx.globalAlpha = 0.18 + 0.82 * prof;
        ctx.beginPath();
        ctx.arc(px, py, tamanho, 0, DOIS_PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function avancar(est) {
      if (est === "pensando") dados.giro += 0.022;
      else if (est === "falando") dados.giro += 0.009;
      else dados.giro += 0.004;
    }

    let anterior = 0;
    function quadro(agora) {
      if (!anterior) anterior = agora;
      dados.tempo += agora - anterior;
      anterior = agora;
      avancar(dados.estado);
      desenhar();
      dados.raf = requestAnimationFrame(quadro);
    }

    function rodando() {
      return dados.visivelAba && dados.visivelTela;
    }

    function iniciar() {
      if (reduzido || dados.raf || !rodando()) return;
      anterior = 0;
      dados.raf = requestAnimationFrame(quadro);
    }

    function parar() {
      if (dados.raf) {
        cancelAnimationFrame(dados.raf);
        dados.raf = 0;
      }
    }

    function aoRedimensionar() {
      dimensionar();
      if (reduzido || !dados.raf) desenhar();
    }

    dimensionar();
    desenhar();

    const ro = new ResizeObserver(aoRedimensionar);
    ro.observe(recipiente);

    function aoVisibilidade() {
      dados.visivelAba = !document.hidden;
      if (rodando()) iniciar();
      else parar();
    }
    document.addEventListener("visibilitychange", aoVisibilidade);

    const io = new IntersectionObserver(
      (entradas) => {
        dados.visivelTela = entradas[0]?.isIntersecting ?? true;
        if (rodando()) iniciar();
        else parar();
      },
      { threshold: 0 },
    );
    io.observe(recipiente);

    iniciar();

    return () => {
      parar();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", aoVisibilidade);
    };
  }, []);

  return (
    <div ref={recipienteRef} className={styles.orbe}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <span className={styles.rotulo} aria-hidden="true">
        Jarvis
      </span>
    </div>
  );
}

export default OrbeJarvis;
