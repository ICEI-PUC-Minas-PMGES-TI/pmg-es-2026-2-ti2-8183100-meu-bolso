// ============================================================
// ORDENAÇÃO DAS METAS (RF-05 — Definir prioridades)
// ------------------------------------------------------------
// Organiza os objetivos por importância e prazo. Três critérios:
//
//  - "prioridade" (padrão): alta > média > baixa; empate pelo prazo
//    mais próximo (sem prazo por último).
//  - "prazo": prazo mais próximo primeiro (vencidas no topo, porque
//    têm a data mais antiga; sem prazo por último); empate pela
//    prioridade.
//  - "progresso": quem está mais perto de concluir primeiro; empate
//    pela prioridade.
//
// Em todos os critérios:
//  - metas CONCLUÍDAS (100%) vão para o fim, porque não pedem ação;
//  - o último desempate é o nome, para a ordem ser sempre a mesma.
// A função não altera a lista recebida.
// ============================================================

export const OPCOES_ORDENACAO_METAS = [
  { valor: "prioridade", rotulo: "Prioridade" },
  { valor: "prazo", rotulo: "Prazo" },
  { valor: "progresso", rotulo: "Progresso" },
];
export const ORDENACAO_METAS_PADRAO = "prioridade";

export const ROTULO_PRIORIDADE = { alta: "Alta", media: "Média", baixa: "Baixa" };
const PESO_PRIORIDADE = { alta: 0, media: 1, baixa: 2 };

// Percentual de 0 a 100.
export function progressoMeta(meta) {
  const alvo = Number(meta?.valorAlvo) || 0;
  if (alvo <= 0) return 0;
  const p = ((Number(meta?.valorAtual) || 0) / alvo) * 100;
  return Math.min(Math.max(p, 0), 100);
}

const pesoPrioridade = (meta) => PESO_PRIORIDADE[meta?.prioridade] ?? 3;

// Sem prazo vai para o fim: "9999-12-31" é maior que qualquer data real.
const chavePrazo = (meta) => (meta?.prazo ? String(meta.prazo).slice(0, 10) : "9999-12-31");

const porPrioridade = (a, b) => pesoPrioridade(a) - pesoPrioridade(b);
const porPrazo = (a, b) => chavePrazo(a).localeCompare(chavePrazo(b));
const porProgresso = (a, b) => progressoMeta(b) - progressoMeta(a);
const porNome = (a, b) =>
  String(a?.nome ?? "").localeCompare(String(b?.nome ?? ""), "pt-BR", { sensitivity: "base" });

const CRITERIOS = {
  prioridade: [porPrioridade, porPrazo, porNome],
  prazo: [porPrazo, porPrioridade, porNome],
  progresso: [porProgresso, porPrioridade, porNome],
};

export function ordenarMetas(metas, criterio = ORDENACAO_METAS_PADRAO) {
  const comparadores = CRITERIOS[criterio] ?? CRITERIOS[ORDENACAO_METAS_PADRAO];
  const concluida = (m) => (progressoMeta(m) >= 100 ? 1 : 0);

  return [...(metas ?? [])].sort((a, b) => {
    const fim = concluida(a) - concluida(b);
    if (fim !== 0) return fim;
    for (const comparar of comparadores) {
      const r = comparar(a, b);
      if (r !== 0) return r;
    }
    return 0;
  });
}

// Texto do prazo para o card, a partir de "AAAA-MM-DD".
// `hoje` em "AAAA-MM-DD" (parâmetro só para facilitar testes).
// Retorna null quando a meta não tem prazo.
export function descreverPrazo(prazo, hoje = hojeLocal()) {
  if (!prazo) return null;
  const alvo = String(prazo).slice(0, 10);
  const dias = Math.round((paraData(alvo) - paraData(hoje)) / 86_400_000);
  const [ano, mes, dia] = alvo.split("-");
  const data = `${dia}/${mes}/${ano}`;

  if (dias < 0) {
    const n = -dias;
    return { data, texto: `${data} · venceu há ${n} ${n === 1 ? "dia" : "dias"}`, vencido: true, dias };
  }
  if (dias === 0) return { data, texto: `${data} · vence hoje`, vencido: false, dias };
  return {
    data,
    texto: `${data} · ${dias === 1 ? "falta 1 dia" : `faltam ${dias} dias`}`,
    vencido: false,
    dias,
  };
}

function paraData(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d); // meia-noite local, sem problema de fuso
}

function hojeLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
