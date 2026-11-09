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

// Visual de esfera oca: anel aceso na borda, miolo vazio.
const ANEL_EXPOENTE = 2.5;
const MIOLO_FRACAO = 0.35;
const MIOLO_BRILHO = 0.2;
const ANEL_LINHA = 0.25;

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

// Converte uma cor do CSS em rgba(...) com o alfa pedido, usando o
// próprio canvas para ler a cor (sem hex fixo no código).
function comAlfa(ctx, cor, alfa) {
  ctx.fillStyle = cor;
  const lido = ctx.fillStyle; // normalizado para "#rrggbb" pelo canvas
  const r = parseInt(lido.slice(1, 3), 16);
  const g = parseInt(lido.slice(3, 5), 16);
  const b = parseInt(lido.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
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
    pts[i] = {
      x: r * Math.cos(theta),
      y,
      z: r * Math.sin(theta),
      ph: Math.random() * DOIS_PI, // fase aleatória fixa (miolo esparso)
    };
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
    const n = window.innerWidth < 480 ? 700 : 1400;
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
      const t = dados.tempo;
      const est = dados.estado;

      // Interatividade suavizada (sem efeito em prefers-reduced-motion).
      if (!reduzido) {
        dados.inclinacaoY += (dados.alvoY - dados.inclinacaoY) * 0.06;
        dados.inclinacaoX += (dados.alvoX - dados.inclinacaoX) * 0.06;
        dados.excitacao += (dados.atento - dados.excitacao) * 0.08;
        dados.pulso *= 0.94;
      }
      // Cintilação lenta do anel ao longo do tempo (inclinação base em X).
      const cintila = reduzido ? 0 : 0.12 * Math.sin(t / 6000);
      const incX = (reduzido ? INCLINACAO_X : dados.inclinacaoX) + cintila;
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

      const raioEsfera = 0.43 * lado * respiracao;

      ctx.clearRect(0, 0, largura, altura);

      // Disco de fundo.
      ctx.fillStyle = dados.cor.escuro;
      ctx.beginPath();
      ctx.arc(cx, cy, raioEsfera, 0, DOIS_PI);
      ctx.fill();

      // Clip circular: nada vaza do disco mesmo com pulso/escala.
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, lado / 2 - 1, 0, DOIS_PI);
      ctx.clip();

      // Halo suave do centro vazio até a borda.
      const halo = ctx.createRadialGradient(
        cx,
        cy,
        0.34 * lado,
        cx,
        cy,
        lado / 2,
      );
      halo.addColorStop(0, comAlfa(ctx, dados.cor.principal, 0));
      halo.addColorStop(1, comAlfa(ctx, dados.cor.principal, 0.16));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, lado / 2, 0, DOIS_PI);
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
        // Inclinação em X (base + cintilação + interativa).
        const y2 = p.y * cosX - z1 * senX;
        const z2 = p.y * senX + z1 * cosX;

        // Brilho por proximidade da borda (limbo da esfera).
        const limb = Math.pow(1 - Math.abs(z2), ANEL_EXPOENTE);
        // Miolo esparso: quase no centro, descarta parte dos pontos.
        if (limb < 0.15 && p.ph / DOIS_PI > MIOLO_FRACAO) continue;

        const f = PERSPECTIVA / (PERSPECTIVA - z2);

        let raio = raioEsfera;
        if (tremor) {
          raio *= 1 + 0.012 * Math.sin(t / 300 + i);
        }
        if (onda) {
          raio += raioEsfera * 0.025 * Math.sin(t / 110 + p.y * 7);
        }

        const px = cx + x1 * raio * f;
        const py = cy + y2 * raio * f;
        const tamanho = (0.6 + 1.1 * limb) * (lado / 132);

        let alfa =
          (MIOLO_BRILHO + (1 - MIOLO_BRILHO) * limb) * (z2 >= 0 ? 1 : 0.6);
        alfa += alfaExtra;
        if (onda) {
          alfa *= 1 + 0.3 * Math.sin(t / 110 + p.y * 7);
        }

        ctx.globalAlpha = Math.min(1, alfa);
        ctx.beginPath();
        ctx.arc(px, py, tamanho, 0, DOIS_PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Borda fina acesa.
      ctx.lineWidth = 1;
      ctx.strokeStyle = comAlfa(
        ctx,
        dados.cor.principal,
        Math.min(1, ANEL_LINHA + pulso * 0.25),
      );
      ctx.beginPath();
      ctx.arc(cx, cy, raioEsfera, 0, DOIS_PI);
      ctx.stroke();

      ctx.restore();
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
        J.A.R.V.I.S
      </span>
    </div>
  );
}

export default OrbeJarvis;
