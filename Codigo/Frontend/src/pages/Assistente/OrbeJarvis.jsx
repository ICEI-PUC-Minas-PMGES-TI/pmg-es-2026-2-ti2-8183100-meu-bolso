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

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

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

function OrbeJarvis({ estado = "parado", observarRef = null }) {
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
    // Interatividade (mouse/foco/clique). Suavizados no quadro.
    alvoX: INCLINACAO_X,
    alvoY: 0,
    inclinacaoX: INCLINACAO_X,
    inclinacaoY: 0,
    atento: 0,
    excitacao: 0,
    pulso: 0,
  });

  // A prop só alimenta o ref.
  useEffect(() => {
    refs.current.estado = estado;
  }, [estado]);

  // Interatividade: ponteiro, foco e clique no contêiner observado.
  // Tudo escreve só em refs; sem setState e sem re-render.
  useEffect(() => {
    const alvo = observarRef?.current;
    const orbe = recipienteRef.current;
    if (!alvo || !orbe || menosMovimento()) return;
    const dados = refs.current;

    // Aponta o alvo de inclinação para um ponto da tela.
    function mirar(clientX, clientY) {
      const r = orbe.getBoundingClientRect();
      const dx = (clientX - (r.left + r.width / 2)) / 400;
      const dy = (clientY - (r.top + r.height / 2)) / 400;
      dados.alvoY = clamp(dx, -0.6, 0.6);
      dados.alvoX = 0.25 + clamp(dy, -0.5, 0.5);
    }

    function aoMover(e) {
      if (e.pointerType === "touch") return;
      mirar(e.clientX, e.clientY);
    }

    function aoSair() {
      dados.alvoY = 0;
      dados.alvoX = 0.25;
      dados.atento = 0;
    }

    function aoFocusOut(e) {
      if (!alvo.contains(e.relatedTarget)) aoSair();
      if (e.target.closest?.('[data-orbe="atento"]')) dados.atento = 0;
    }

    function aoPointerOver(e) {
      if (e.target.closest?.('[data-orbe="atento"]')) dados.atento = 1;
    }

    function aoPointerOut(e) {
      if (e.target.closest?.('[data-orbe="atento"]')) dados.atento = 0;
    }

    function aoFocusIn(e) {
      const cartao = e.target.closest?.('[data-orbe="atento"]');
      if (!cartao) return;
      dados.atento = 1;
      const r = cartao.getBoundingClientRect();
      mirar(r.left + r.width / 2, r.top + r.height / 2);
    }

    function aoClicar(e) {
      if (e.target.closest?.('[data-orbe="atento"]')) dados.pulso = 1;
    }

    const op = { passive: true };
    alvo.addEventListener("pointermove", aoMover, op);
    alvo.addEventListener("pointerleave", aoSair, op);
    alvo.addEventListener("pointerover", aoPointerOver, op);
    alvo.addEventListener("pointerout", aoPointerOut, op);
    alvo.addEventListener("focusin", aoFocusIn, op);
    alvo.addEventListener("focusout", aoFocusOut, op);
    alvo.addEventListener("click", aoClicar, op);

    return () => {
      alvo.removeEventListener("pointermove", aoMover, op);
      alvo.removeEventListener("pointerleave", aoSair, op);
      alvo.removeEventListener("pointerover", aoPointerOver, op);
      alvo.removeEventListener("pointerout", aoPointerOut, op);
      alvo.removeEventListener("focusin", aoFocusIn, op);
      alvo.removeEventListener("focusout", aoFocusOut, op);
      alvo.removeEventListener("click", aoClicar, op);
    };
  }, [observarRef]);

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

      // Interatividade suavizada (sem efeito em prefers-reduced-motion).
      if (!reduzido) {
        dados.inclinacaoY += (dados.alvoY - dados.inclinacaoY) * 0.06;
        dados.inclinacaoX += (dados.alvoX - dados.inclinacaoX) * 0.06;
        dados.excitacao += (dados.atento - dados.excitacao) * 0.08;
        dados.pulso *= 0.94;
      }
      const incX = reduzido ? INCLINACAO_X : dados.inclinacaoX;
      const incY = reduzido ? 0 : dados.inclinacaoY;
      const exc = reduzido ? 0 : dados.excitacao;
      const pulso = reduzido ? 0 : dados.pulso;

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

      const escala = 1 + exc * 0.03 + pulso * 0.08;
      respiracao *= escala;

      ctx.clearRect(0, 0, largura, altura);

      // Disco de fundo.
      ctx.fillStyle = dados.cor.escuro;
      ctx.beginPath();
      ctx.arc(cx, cy, raioBase * respiracao, 0, DOIS_PI);
      ctx.fill();

      const giro = dados.giro + exc * 0.006;
      const cos = Math.cos(giro + incY);
      const sen = Math.sin(giro + incY);
      const cosX = Math.cos(incX);
      const senX = Math.sin(incX);

      const alfaExtra = exc * 0.1 + pulso * 0.25;

      ctx.fillStyle = dados.cor.principal;
      for (let i = 0; i < n; i++) {
        const p = pontos[i];
        // Giro em torno de Y (+ inclinação Y interativa).
        const x1 = p.x * cos - p.z * sen;
        const z1 = p.x * sen + p.z * cos;
        // Inclinação em X (base + interativa).
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

        ctx.globalAlpha = Math.min(1, 0.18 + 0.82 * prof + alfaExtra);
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
