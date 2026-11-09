/**
 * Acesso aos dados da página de Receitas.
 *
 * Espelho de service/gastosService.js, sem a parte de orçamento (que é
 * exclusiva de gastos). Existem duas implementações com o MESMO contrato
 * (todas async):
 *   - "local":  localStorage — fallback de desenvolvimento.
 *   - "remoto": API Spring Boot (service/Api.js -> receitasApi).
 *
 * Para usar o back-end, coloque VITE_RECEITAS_API=true no .env do Frontend
 * (ou VITE_GASTOS_API=true, que também liga as receitas por padrão).
 * A tela (pages/Receitas) só conhece o objeto exportado no final deste arquivo.
 */

import { receitasApi } from "./Api";
import {
  comProjecoes,
  dataDaOcorrencia,
  hojeISO,
  mesAtualChave,
  mudarMes,
} from "../utils/Receitasutils";

const USAR_API =
  import.meta.env.VITE_RECEITAS_API === "true" ||
  import.meta.env.VITE_GASTOS_API === "true";

/* ========================================
   IMPLEMENTAÇÃO LOCAL (localStorage)
   ======================================== */

const CHAVES = {
  receitas: "meubolso:receitas",
  recorrencias: "meubolso:receitas:recorrencias",
};

// Trava de segurança: nunca gera mais do que isso numa só passada
const LIMITE_OCORRENCIAS = 120;

function ler(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave);
    if (bruto !== null) return JSON.parse(bruto);
  } catch {
    // Dado corrompido: cai no valor padrão.
  }
  return padrao;
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Ignora falhas no armazenamento local.
  }
}

function novoId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function dataRelativa(mesesAtras, dia) {
  const hoje = new Date();
  return hojeISO(new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras, dia));
}

// Dados de exemplo mostrados na primeira vez que a página é aberta
function receitasFicticias() {
  return [
    { id: 1, descricao: "Salário", categoria: "Salário", carteira: "Nubank", data: dataRelativa(0, 5), valor: 3200 },
    { id: 2, descricao: "Projeto freelance", categoria: "Freelance", carteira: "Inter", data: dataRelativa(0, 12), valor: 850 },
    { id: 3, descricao: "Rendimento CDB", categoria: "Investimentos", carteira: "Itaú", data: dataRelativa(0, 2), valor: 47.3 },
    { id: 4, descricao: "Venda de usados", categoria: "Vendas", carteira: "Carteira", data: dataRelativa(0, 18), valor: 120 },
    { id: 5, descricao: "Reembolso da empresa", categoria: "Reembolso", carteira: "Nubank", data: dataRelativa(1, 8), valor: 230.9 },
    { id: 6, descricao: "Presente de aniversário", categoria: "Presente", carteira: "Carteira", data: dataRelativa(1, 22), valor: 200 },
  ];
}

function limparCampos(dados) {
  return {
    descricao: dados.descricao.trim(),
    categoria: dados.categoria,
    carteira: dados.carteira,
    data: dados.data,
    valor: Number(dados.valor),
    comentario: (dados.comentario ?? "").trim(),
    carteiraId: dados.carteiraId || null,
  };
}

// A recorrência nasce a partir de uma receita: o dia do mês vem da data dela.
function criarRecorrenciaDe(receita) {
  return {
    id: novoId(),
    descricao: receita.descricao,
    categoria: receita.categoria,
    carteira: receita.carteira,
    valor: receita.valor,
    comentario: receita.comentario,
    diaDoMes: Number(receita.data.slice(8, 10)),
    ativa: true,
    ultimoMes: receita.data.slice(0, 7),
    mesesPulados: [], // meses "removidos só neste mês"
  };
}

/**
 * Lança as receitas das recorrências ativas que já venceram.
 * É idempotente: só avança a partir de "ultimoMes".
 */
export function processarRecorrencias(receitas, recorrencias, hoje = hojeISO()) {
  const novas = [];

  const atualizadas = recorrencias.map((rec) => {
    if (!rec.ativa) return rec;

    const pulados = new Set(rec.mesesPulados ?? []);
    let ultimoMes = rec.ultimoMes;
    let proximo = mudarMes(ultimoMes, 1);

    while (
      dataDaOcorrencia(proximo, rec.diaDoMes) <= hoje &&
      novas.length < LIMITE_OCORRENCIAS
    ) {
      // Mês marcado como "pular" (removido só neste mês): avança sem lançar.
      if (!pulados.has(proximo)) {
        novas.push({
          id: novoId(),
          descricao: rec.descricao,
          categoria: rec.categoria,
          carteira: rec.carteira,
          data: dataDaOcorrencia(proximo, rec.diaDoMes),
          valor: rec.valor,
          comentario: rec.comentario,
          recorrenciaId: rec.id,
        });
      }
      ultimoMes = proximo;
      proximo = mudarMes(proximo, 1);
    }

    return ultimoMes === rec.ultimoMes ? rec : { ...rec, ultimoMes };
  });

  return { receitas: [...novas, ...receitas], recorrencias: atualizadas };
}

const local = {
  async carregarTudo() {
    const receitasSalvas = ler(CHAVES.receitas, null) ?? receitasFicticias();
    const recorrenciasSalvas = ler(CHAVES.recorrencias, []);

    const { receitas, recorrencias } = processarRecorrencias(
      receitasSalvas,
      recorrenciasSalvas,
    );

    gravar(CHAVES.receitas, receitas);
    gravar(CHAVES.recorrencias, recorrencias);

    // Projeta os recorrentes para os próximos meses (ocorrências virtuais).
    return { receitas: comProjecoes(receitas, recorrencias), recorrencias };
  },

  async criarReceita({ recorrente, ...dados }) {
    const receita = { id: novoId(), ...limparCampos(dados) };
    const recorrencias = ler(CHAVES.recorrencias, []);

    if (recorrente) {
      const recorrencia = criarRecorrenciaDe(receita);
      receita.recorrenciaId = recorrencia.id;
      recorrencias.push(recorrencia);
      gravar(CHAVES.recorrencias, recorrencias);
    }

    gravar(CHAVES.receitas, [receita, ...ler(CHAVES.receitas, [])]);
  },

  async atualizarReceita(id, { recorrente, ...dados }) {
    const recorrencias = ler(CHAVES.recorrencias, []);

    const receitas = ler(CHAVES.receitas, []).map((receita) => {
      if (receita.id !== id) return receita;

      const atualizada = { ...receita, ...limparCampos(dados) };

      if (recorrente && !receita.recorrenciaId) {
        const recorrencia = criarRecorrenciaDe(atualizada);
        atualizada.recorrenciaId = recorrencia.id;
        recorrencias.push(recorrencia);
      }

      return atualizada;
    });

    gravar(CHAVES.receitas, receitas);
    gravar(CHAVES.recorrencias, recorrencias);
  },

  async atualizarComentario(id, comentario) {
    gravar(
      CHAVES.receitas,
      ler(CHAVES.receitas, []).map((receita) =>
        receita.id === id ? { ...receita, comentario: comentario.trim() } : receita,
      ),
    );
  },

  async excluirReceita(id) {
    gravar(
      CHAVES.receitas,
      ler(CHAVES.receitas, []).filter((receita) => receita.id !== id),
    );
  },

  async atualizarRecorrencia(id, dados) {
    const mesAnterior = mudarMes(mesAtualChave(), -1);

    gravar(
      CHAVES.recorrencias,
      ler(CHAVES.recorrencias, []).map((rec) => {
        if (rec.id !== id) return rec;

        const atualizada = { ...rec, ...dados };
        if (dados.descricao !== undefined) atualizada.descricao = dados.descricao.trim();
        if (dados.comentario !== undefined) atualizada.comentario = dados.comentario.trim();

        if (dados.ativa === true && !rec.ativa && atualizada.ultimoMes < mesAnterior) {
          atualizada.ultimoMes = mesAnterior;
        }

        return atualizada;
      }),
    );
  },

  async excluirRecorrencia(id) {
    gravar(
      CHAVES.recorrencias,
      ler(CHAVES.recorrencias, []).filter((rec) => rec.id !== id),
    );

    gravar(
      CHAVES.receitas,
      ler(CHAVES.receitas, []).map((receita) =>
        receita.recorrenciaId === id ? { ...receita, recorrenciaId: undefined } : receita,
      ),
    );
  },

  // "Remover só neste mês": marca o mês na recorrência e apaga a receita real
  // daquele mês (se já tiver sido lançada). Os demais meses seguem normais.
  async pularMesRecorrencia(id, mes) {
    gravar(
      CHAVES.recorrencias,
      ler(CHAVES.recorrencias, []).map((rec) => {
        if (rec.id !== id) return rec;
        const pulados = new Set(rec.mesesPulados ?? []);
        pulados.add(mes);
        return { ...rec, mesesPulados: [...pulados] };
      }),
    );

    gravar(
      CHAVES.receitas,
      ler(CHAVES.receitas, []).filter(
        (receita) => !(receita.recorrenciaId === id && receita.data.startsWith(mes)),
      ),
    );
  },
};

/* ========================================
   IMPLEMENTAÇÃO REMOTA (Spring Boot + MongoDB)
   ======================================== */

// O back devolve BigDecimal como número; garantimos Number e sem campos nulos.
function normalizarReceita(receita) {
  return {
    ...receita,
    valor: Number(receita.valor),
    comentario: receita.comentario ?? "",
    recorrenciaId: receita.recorrenciaId ?? undefined,
  };
}

function normalizarRecorrencia(rec) {
  return {
    ...rec,
    valor: Number(rec.valor),
    comentario: rec.comentario ?? "",
    mesesPulados: rec.mesesPulados ?? [],
  };
}

const remoto = {
  async carregarTudo() {
    // Primeiro a lista de receitas: é ela que dispara a geração das recorrências no back
    const receitas = await receitasApi.listar();
    const recorrencias = await receitasApi.listarRecorrentes();

    const recorrenciasNorm = recorrencias.map(normalizarRecorrencia);

    return {
      // Projeta os recorrentes para os próximos meses (ocorrências virtuais).
      receitas: comProjecoes(receitas.map(normalizarReceita), recorrenciasNorm),
      recorrencias: recorrenciasNorm,
    };
  },

  async criarReceita(dados) {
    await receitasApi.criar({ ...limparCampos(dados), recorrente: Boolean(dados.recorrente) });
  },

  async atualizarReceita(id, dados) {
    await receitasApi.atualizar(id, {
      ...limparCampos(dados),
      recorrente: Boolean(dados.recorrente),
    });
  },

  async atualizarComentario(id, comentario) {
    await receitasApi.atualizarComentario(id, comentario.trim());
  },

  async excluirReceita(id) {
    await receitasApi.excluir(id);
  },

  async atualizarRecorrencia(id, dados) {
    // O back espera o objeto completo; pegamos a regra atual e aplicamos a mudança
    const atuais = await receitasApi.listarRecorrentes();
    const atual = atuais.find((rec) => rec.id === id);
    if (!atual) throw new Error("Recorrência não encontrada.");

    await receitasApi.atualizarRecorrente(id, {
      descricao: atual.descricao,
      categoria: atual.categoria,
      carteira: atual.carteira,
      carteiraId: atual.carteiraId ?? null,
      valor: atual.valor,
      diaDoMes: atual.diaDoMes,
      comentario: atual.comentario ?? "",
      ativa: atual.ativa,
      ...dados,
    });
  },

  async excluirRecorrencia(id) {
    await receitasApi.excluirRecorrente(id);
  },

  async pularMesRecorrencia(id, mes) {
    await receitasApi.pularRecorrente(id, mes);
  },
};

const receitasService = USAR_API ? remoto : local;

export default receitasService;
