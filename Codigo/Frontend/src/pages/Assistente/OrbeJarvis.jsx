import { useEffect, useRef } from "react";

import styles from "./OrbeJarvis.module.css";

// ============================================================
// ORBE JARVIS
// ------------------------------------------------------------
// Visualizador circular em canvas 2D: anel orgânico de espessura
// variável, miolo quase vazio e poeira de partículas ao redor.
// A prop `estado` ("parado" | "pensando" | "falando") só atualiza um
// ref: a animação roda em requestAnimationFrame, sem re-render por
// quadro. Pausa com a aba oculta ou fora da tela. Em prefers-reduced-
// motion desenha um único quadro estático.
// ============================================================

const INCLINACAO_X = 0.25;
const DOIS_PI = Math.PI * 2;

// Parâmetros visuais do anel/poeira.
const RAIO_ANEL = 0.375;
const ONDAS = 1.0;
const GORDURA_BORDA = 1.2;
const POEIRA = 0.3;
const BRILHO_ANEL = 0.9;
const PONTOS = 1.3;
const BRILHO_PONTOS = 0.9;
const MARGEM_ESCURA = 2;
const LINHA_BRANCA = 1.4;
const BRILHO_VOLTA = 1.0;

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function aleatorio(min, max) {
  return min + Math.random() * (max - min);
}

function menosMovimento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

// Fallback numérico por variável (sem hex no JS). Usado quando o
// getComputedStyle não retorna uma cor rgb legível.
const COR_PADRAO = {
  "--orbe-disco": [22, 48, 31],
  "--orbe-anel": [127, 168, 120],
  "--orbe-nucleo": [255, 255, 255],
  "--orbe-ponto": [233, 241, 231],
  "--orbe-poeira": [16, 24, 23],
  "--orbe-texto": [233, 241, 231],
};

// Resolve uma variável CSS de cor para [r, g, b] via <span> temporário
// anexado DENTRO do recipiente (onde as --orbe-* existem). Sem hex no JS.
function resolverCor(recipiente, nome) {
  const span = document.createElement("span");
  span.style.position = "absolute";
  span.style.visibility = "hidden";
  span.style.color = `var(${nome})`;
  recipiente.appendChild(span);
  const cor = getComputedStyle(span).color;
  recipiente.removeChild(span);
  const m = cor.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  return m
    ? [Number(m[1]), Number(m[2]), Number(m[3])]
    : COR_PADRAO[nome];
}

// Partículas fixas do miolo e do anel (criadas uma vez por montagem).
function gerarMiolo(n) {
  const pts = new Array(n);
  for (let i = 0; i < n; i++) {
    pts[i] = {
      a: Math.random() * DOIS_PI,
      r: Math.sqrt(Math.random()) * 0.88,
      w: (Math.random() - 0.5) * 0.00004,
      ph: Math.random() * DOIS_PI,
      s: aleatorio(0.9, 1.9),
    };
  }
  return pts;
}

function gerarAnel(n) {
  const pts = new Array(n);
  for (let i = 0; i < n; i++) {
    pts[i] = {
      a: (i / n) * DOIS_PI + Math.random() * 0.015,
      o: (Math.random() - 0.5) * 0.07,
      s: aleatorio(0.8, 2.0),
      ph: Math.random() * DOIS_PI,
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
    tempo: 0,
    raf: 0,
    visivelAba: true,
    visivelTela: true,
    // Interatividade (mouse/foco/clique). Suavizados no quadro.
    alvoX: INCLINACAO_X,
    alvoY: 0,
    inclinacaoX: INCLINACAO_X,
    inclinacaoY: 0,
    atento: 0,
    excitacao: 0,
    pulso: 0,
    rajada: 0, // partículas extras de poeira ao clique
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
      if (e.target.closest?.('[data-orbe="atento"]')) {
        dados.pulso = 1;
        dados.rajada = 20;
      }
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
    const estreito = window.innerWidth < 480;

    // Cores resolvidas uma vez por montagem. cor(nome, alfa) monta rgba.
    const paleta = {
      "--orbe-disco": resolverCor(recipiente, "--orbe-disco"),
      "--orbe-anel": resolverCor(recipiente, "--orbe-anel"),
      "--orbe-nucleo": resolverCor(recipiente, "--orbe-nucleo"),
      "--orbe-ponto": resolverCor(recipiente, "--orbe-ponto"),
      "--orbe-poeira": resolverCor(recipiente, "--orbe-poeira"),
      "--orbe-texto": resolverCor(recipiente, "--orbe-texto"),
    };
    function cor(nome, alfa = 1) {
      const [r, g, b] = paleta[nome];
      return `rgba(${r}, ${g}, ${b}, ${clamp(alfa, 0, 1)})`;
    }

    // Cor do interior: disco + (anel − disco)·0.16, calculada uma vez.
    const corInterior = (() => {
      const d = paleta["--orbe-disco"];
      const a = paleta["--orbe-anel"];
      const mix = d.map((v, i) => Math.round(v + (a[i] - v) * 0.16));
      return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
    })();

    // Estruturas fixas.
    const MIOLO_N = estreito ? 60 : 120;
    const miolo = gerarMiolo(200);
    const anel = gerarAnel(estreito ? 180 : 360);
    const POEIRA_MAX = estreito ? 50 : 90;
    const poeira = [];

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

    // Ruído do contorno do anel.
    function ruido(th, t) {
      return (
        (0.6 * Math.sin(2 * th + t / 1300) +
          0.5 * Math.sin(3 * th + t / 900) +
          0.35 * Math.sin(5 * th - t / 1000) +
          0.2 * Math.sin(7 * th - t / 600) +
          0.1 * Math.sin(13 * th + t / 300)) /
        1.75
      );
    }

    // Raio do anel irregular (amp = amplitude, au = "amassados").
    function rad(th, t, amp, au, R) {
      const w = ruido(th, t);
      const a =
        au *
        (0.5 * Math.abs(Math.sin(6 * th + t / 240)) +
          0.5 * Math.abs(Math.sin(11 * th - t / 170)));
      return R * (1 + amp * w + a);
    }

    // Espessura variável da borda.
    function fator(th, t) {
      const fat =
        0.8 * Math.pow(0.5 + 0.5 * Math.sin(3 * th + t / 2500), 4) +
        0.6 * Math.pow(0.5 + 0.5 * Math.sin(5 * th - t / 1800), 5);
      return clamp(0.45 + GORDURA_BORDA * fat, 0.35, 2.4);
    }

    // Uma camada do anel: polígono preenchido (evenodd) com um contorno
    // externo e um interno, 180 pontos cada.
    function camadaAnel(cx, cy, t, amp, au, R, escala, base, estilo) {
      ctx.fillStyle = estilo;
      ctx.beginPath();
      const N = 180;
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * DOIS_PI;
        const r = rad(th, t, amp, au, R) * escala + (base * fator(th, t)) / 2;
        const x = cx + Math.cos(th) * r;
        const y = cy + Math.sin(th) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * DOIS_PI;
        const r = Math.max(
          rad(th, t, amp, au, R) * escala - (base * fator(th, t)) / 2,
          1,
        );
        const x = cx + Math.cos(th) * r;
        const y = cy + Math.sin(th) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill("evenodd");
    }

    // Caminho fechado do interior (180 pontos): até a borda interna do
    // anel branco, mais a margem escura.
    function caminhoInterior(cx, cy, t, amp, au, R, escala) {
      ctx.beginPath();
      const N = 180;
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * DOIS_PI;
        const r =
          rad(th, t, amp, au, R) * escala +
          (LINHA_BRANCA * fator(th, t)) / 2 +
          MARGEM_ESCURA;
        const x = cx + Math.cos(th) * r;
        const y = cy + Math.sin(th) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    function desenhar() {
      const lado = Math.min(largura, altura);
      const cx = largura / 2;
      const cy = altura / 2;
      const R = RAIO_ANEL * lado;
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

      // Parâmetros por estado.
      let amp;
      let au;
      let escala;
      if (est === "pensando") {
        amp = 0.04;
        au = 0.012;
        escala = 1 + 0.035 * Math.sin(t / 140);
      } else if (est === "falando") {
        amp = 0.03;
        au = 0.06 * (0.6 + 0.4 * Math.sin(t / 190));
        escala = 1;
      } else {
        amp = 0.028;
        au = 0;
        escala = 1 + 0.015 * Math.sin(t / 900);
      }
      const reforco = ONDAS * (1 + 0.35 * exc);
      amp *= reforco;
      au *= reforco;
      escala += pulso * 0.06;

      ctx.clearRect(0, 0, largura, altura);

      // (a) Interior verde translúcido + halo, sem disco/clip externo.
      caminhoInterior(cx, cy, t, amp, au, R, escala);
      ctx.fillStyle = corInterior;
      ctx.fill();

      const halo = ctx.createRadialGradient(cx, cy, 0.55 * R, cx, cy, 1.05 * R);
      halo.addColorStop(0, cor("--orbe-anel", 0));
      halo.addColorStop(1, cor("--orbe-anel", 0.16));
      caminhoInterior(cx, cy, t, amp, au, R, escala);
      ctx.fillStyle = halo;
      ctx.fill();

      // (b) Miolo, com leve parallax das inclinações suavizadas.
      const paraX = incY * R * 0.15;
      const paraY = (incX - 0.25) * R * 0.15;
      for (let i = 0; i < MIOLO_N; i++) {
        const p = miolo[i];
        p.a += p.w * 16;
        const px = cx + Math.cos(p.a) * p.r * R + paraX;
        const py = cy + Math.sin(p.a) * p.r * R + paraY;
        const alfa =
          (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 500 + p.ph))) * BRILHO_PONTOS;
        ctx.fillStyle = cor("--orbe-ponto", alfa);
        ctx.beginPath();
        ctx.arc(px, py, p.s * PONTOS, 0, DOIS_PI);
        ctx.fill();
      }

      // (c) Poeira (sem nascer em reduced-motion).
      if (!reduzido) {
        const velEstado = est === "falando" ? 1 : est === "pensando" ? 0.5 : 0.3;
        const taxa = velEstado * POEIRA * (1 + exc);
        let nascer = Math.floor(taxa) + (Math.random() < taxa % 1 ? 1 : 0);
        nascer += dados.rajada;
        dados.rajada = 0;
        const d0 = R + MARGEM_ESCURA + 8;
        for (let i = 0; i < nascer && poeira.length < POEIRA_MAX; i++) {
          poeira.push({
            a: Math.random() * DOIS_PI,
            d: d0 + Math.random() * 4,
            v: aleatorio(0.1, 0.4),
            vida: 0,
            max: Math.floor(aleatorio(70, 200)),
            ta: (Math.random() - 0.5) * 0.004,
            s: aleatorio(0.6, 1.7),
          });
        }
        const lim = lado / 2 - 2;
        for (let i = poeira.length - 1; i >= 0; i--) {
          const p = poeira[i];
          p.d += p.v * (est === "falando" ? 1.6 : 1);
          p.a += p.ta;
          p.vida += 1;
          if (p.vida >= p.max || p.d > lim) {
            poeira.splice(i, 1);
            continue;
          }
          const fade = clamp((lim - p.d) / (lim - d0), 0, 1);
          const alfa = Math.sin((Math.PI * p.vida) / p.max) * 0.85 * fade;
          ctx.fillStyle = cor("--orbe-poeira", alfa);
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(p.a) * p.d,
            cy + Math.sin(p.a) * p.d,
            p.s * PONTOS,
            0,
            DOIS_PI,
          );
          ctx.fill();
        }
      }

      // (d) Anel em três camadas.
      camadaAnel(
        cx,
        cy,
        t,
        amp,
        au,
        R,
        escala,
        7 * BRILHO_VOLTA,
        cor("--orbe-anel", 0.14),
      );
      camadaAnel(
        cx,
        cy,
        t,
        amp,
        au,
        R,
        escala,
        3.5 * BRILHO_VOLTA,
        cor("--orbe-anel", 0.28),
      );
      camadaAnel(
        cx,
        cy,
        t,
        amp,
        au,
        R,
        escala,
        LINHA_BRANCA,
        cor("--orbe-nucleo", Math.min(BRILHO_ANEL + exc * 0.1 + pulso * 0.25, 1)),
      );

      // (e) Partículas do anel.
      for (let i = 0; i < anel.length; i++) {
        const p = anel[i];
        const r = rad(p.a, t, amp, au, R) * escala * (1 + p.o);
        const alfa =
          (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t / 400 + p.ph))) * BRILHO_PONTOS;
        ctx.fillStyle = cor("--orbe-ponto", alfa);
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(p.a) * r,
          cy + Math.sin(p.a) * r,
          p.s * PONTOS,
          0,
          DOIS_PI,
        );
        ctx.fill();
      }
    }

    let anterior = 0;
    function quadro(agora) {
      if (!anterior) anterior = agora;
      dados.tempo += agora - anterior;
      anterior = agora;
      try {
        desenhar();
      } catch {
        // Em caso de exceção, cancela o loop (não morre a cada quadro).
        parar();
        return;
      }
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
