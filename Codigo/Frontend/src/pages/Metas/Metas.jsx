import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Target,
  PiggyBank,
  TrendingUp,
  Pencil,
  ArrowLeftRight,
  CheckCircle2,
} from "lucide-react";

import ModalNovaMeta from "../../components/ModalNovaMeta/ModalNovaMeta";
import ModalMovimentarMeta from "../../components/ModalMovimentarMeta/ModalMovimentarMeta";
import PainelDetalhesMeta from "../../components/PainelDetalhesMeta/PainelDetalhesMeta";
import { ajustarSaldoCarteira } from "../../service/carteirasStorage";
import {
  listarMetas,
  criarMeta,
  atualizarMeta,
  excluirMeta as excluirMetaApi,
} from "../../service/Api";

import styles from "./Metas.module.css";

// ============================================================
// METAS (RF-02 / RF-03 — F4: Metas e reserva)
// ------------------------------------------------------------
// As metas são carregadas e persistidas no back-end (MongoDB),
// vinculadas ao usuário autenticado (ver src/service/Api.js e
// Documentacao/ModeloDeDados.md, coleção "metas"). Cada meta tem:
// nome, valorAlvo, valorAtual, prazo e prioridade. O progresso é
// valorAtual / valorAlvo.
//
// A movimentação (depósito/retirada) ainda é local: no back-end
// virará uma transação com metaId. Por isso o histórico de
// movimentações por meta segue em estado local por enquanto.
// ============================================================

// O back-end usa "id"; o restante da página usa "_id". Normaliza para _id
// para não precisar mudar modal, painel e cartões.
function normalizarMeta(meta) {
  return { ...meta, _id: meta.id ?? meta._id };
}

// Data curta no padrão "05 out" para novas movimentações.
function dataCurta(d = new Date()) {
  return d
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
}

// Formata um número como moeda brasileira (R$).
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor ?? 0);
}

// Calcula o percentual de progresso (0 a 100) de uma meta.
function calcularProgresso(valorAtual, valorAlvo) {
  if (!valorAlvo || valorAlvo <= 0) return 0;
  const percentual = (valorAtual / valorAlvo) * 100;
  return Math.min(Math.max(percentual, 0), 100);
}

function Metas() {
  // Metas vindas do back-end. Começa vazio e é preenchido no carregamento.
  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");

  // Histórico de movimentações por meta (indexado por _id).
  // Ainda local (depósito/retirada vira transação no back-end depois).
  const [movimentacoesPorMeta, setMovimentacoesPorMeta] = useState({});

  // Meta aberta no painel lateral de detalhes (null = painel fechado).
  const [metaSelecionada, setMetaSelecionada] = useState(null);

  // Ids de metas recém-concluídas (passaram de <100% para 100% agora),
  // para disparar a animação só na transição — não ao abrir a página com
  // metas já concluídas. Preenchido pela ação de movimentação.
  const [recemConcluidas, setRecemConcluidas] = useState(() => new Set());
  const timersConclusao = useRef(new Map());

  // Marca uma meta como recém-concluída e a remove após a animação (~1.2s).
  function celebrarConclusao(metaId) {
    setRecemConcluidas((atual) => new Set(atual).add(metaId));

    const timers = timersConclusao.current;
    if (timers.has(metaId)) clearTimeout(timers.get(metaId));
    timers.set(
      metaId,
      setTimeout(() => {
        setRecemConcluidas((atual) => {
          const prox = new Set(atual);
          prox.delete(metaId);
          return prox;
        });
        timers.delete(metaId);
      }, 1200)
    );
  }

  // Limpa timers pendentes ao desmontar.
  useEffect(() => {
    const timers = timersConclusao.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Carrega as metas do usuário ao abrir a página.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const lista = await listarMetas();
        if (ativo) setMetas(lista.map(normalizarMeta));
      } catch (e) {
        if (ativo) setErroCarregar(e.message || "Não foi possível carregar as metas.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Controle do modal. metaEmEdicao = null -> modo criação;
  // metaEmEdicao preenchida -> modo edição.
  const [modalAberto, setModalAberto] = useState(false);
  const [metaEmEdicao, setMetaEmEdicao] = useState(null);

  // Abre o modal em branco (criação).
  function abrirCriacao() {
    setMetaEmEdicao(null);
    setModalAberto(true);
  }

  // Abre o modal preenchido com a meta escolhida (edição).
  function abrirEdicao(meta) {
    setMetaEmEdicao(meta);
    setModalAberto(true);
  }

  // Fecha o modal e limpa a meta em edição.
  function fecharModal() {
    setModalAberto(false);
    setMetaEmEdicao(null);
  }

  // Controle do modal de movimentação (depósito/retirada).
  const [metaEmMovimentacao, setMetaEmMovimentacao] = useState(null);

  function abrirMovimentacao(meta) {
    setMetaEmMovimentacao(meta);
  }

  function fecharMovimentacao() {
    setMetaEmMovimentacao(null);
  }

  // Aplica a movimentação: atualiza o valorAtual da meta e o saldo da
  // carteira vinculada. (No back-end isto virará uma transação com metaId
  // e carteiraId, recalculando os dois saldos numa só operação.)
  //  - Depósito: sai da carteira (delta negativo), entra na meta.
  //  - Retirada: entra na carteira (delta positivo), sai da meta.
  async function confirmarMovimentacao(meta, { tipo, valor, titulo, novoValorAtual, carteiraId }) {
    const deltaCarteira = tipo === "deposito" ? -valor : valor;
    const ok = await ajustarSaldoCarteira(carteiraId, deltaCarteira);
    if (!ok) {
      alert("Não foi possível atualizar o saldo da carteira. Tente novamente.");
      return;
    }

    // Detecta a transição para "concluída" (cruzou de <100% para 100%)
    // para disparar a animação de celebração.
    const progressoAntes = calcularProgresso(meta.valorAtual, meta.valorAlvo);
    const progressoDepois = calcularProgresso(novoValorAtual, meta.valorAlvo);
    if (progressoAntes < 100 && progressoDepois >= 100) {
      celebrarConclusao(meta._id);
    }

    setMetas((lista) =>
      lista.map((m) =>
        m._id === meta._id ? { ...m, valorAtual: novoValorAtual } : m
      )
    );

    // Registra a movimentação no histórico da meta (mais recente primeiro).
    // O título informado pelo usuário vira a descrição; sem título, usa um
    // rótulo padrão conforme o tipo.
    const ehDeposito = tipo === "deposito";
    const novaMov = {
      id: Date.now(),
      descricao: titulo || (ehDeposito ? "Depósito" : "Retirada"),
      categoria: ehDeposito ? "Depósito" : "Retirada",
      data: dataCurta(),
      valor,
      entrada: ehDeposito,
    };
    setMovimentacoesPorMeta((mapa) => ({
      ...mapa,
      [meta._id]: [novaMov, ...(mapa[meta._id] ?? [])],
    }));

    // Mantém o painel refletindo o novo valor guardado, se estiver aberto.
    setMetaSelecionada((atual) =>
      atual && atual._id === meta._id
        ? { ...atual, valorAtual: novoValorAtual }
        : atual
    );
  }

  // Monta o corpo que o back-end espera a partir da meta do formulário.
  function corpoParaApi(meta) {
    return {
      nome: meta.nome,
      valorAlvo: meta.valorAlvo,
      prazo: meta.prazo || null,
      prioridade: meta.prioridade,
    };
  }

  // Recebe a meta salva pelo modal. Com _id, edita; sem _id, cria.
  // Persiste no back-end e atualiza a lista com a resposta.
  async function salvarMeta(meta) {
    try {
      if (meta._id) {
        const atualizada = normalizarMeta(await atualizarMeta(meta._id, corpoParaApi(meta)));
        setMetas((lista) =>
          lista.map((m) => (m._id === meta._id ? atualizada : m))
        );
        setMetaSelecionada((atual) =>
          atual && atual._id === meta._id ? atualizada : atual
        );
      } else {
        const criada = normalizarMeta(await criarMeta(corpoParaApi(meta)));
        setMetas((lista) => [...lista, criada]);
      }
    } catch (e) {
      // Mantém simples por enquanto: avisa o usuário sem derrubar a tela.
      alert(e.message || "Não foi possível salvar a meta.");
    }
  }

  // Exclui a meta no back-end, limpa o histórico local e fecha o painel.
  async function excluirMeta(meta) {
    try {
      await excluirMetaApi(meta._id);
    } catch (e) {
      alert(e.message || "Não foi possível excluir a meta.");
      return;
    }
    setMetas((lista) => lista.filter((m) => m._id !== meta._id));
    setMovimentacoesPorMeta((mapa) => {
      const copia = { ...mapa };
      delete copia[meta._id];
      return copia;
    });
    setMetaSelecionada((atual) =>
      atual && atual._id === meta._id ? null : atual
    );
  }

  // Resumo simples para os cartões de visão geral.
  // Number(...) protege caso os valores venham como string na serialização.
  const totalMetas = metas.length;
  const totalGuardado = metas.reduce((soma, meta) => soma + Number(meta.valorAtual ?? 0), 0);
  const totalAlvo = metas.reduce((soma, meta) => soma + Number(meta.valorAlvo ?? 0), 0);

  return (
    <div className={styles.metas}>
      {/* Cabeçalho da página */}
      <div className={styles.cabecalho}>
        <div>
          <h1>Metas</h1>
          <p className="texto-secundario">
            Defina objetivos, acompanhe o progresso e construa sua reserva.
          </p>
        </div>

        <button type="button" className="btn btn-verde" onClick={abrirCriacao}>
          <Plus size={18} aria-hidden="true" />
          Nova meta
        </button>
      </div>

      {/* Cartões de resumo */}
      <section className={`grid grid-3 ${styles.resumo}`}>
        <div className={`card ${styles.cardResumo}`}>
          <span className={styles.cardIcone}>
            <Target size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="texto-secundario texto-pequeno">Metas ativas</p>
            <strong className={styles.cardValor}>{totalMetas}</strong>
          </div>
        </div>

        <div className={`card ${styles.cardResumo}`}>
          <span className={styles.cardIcone}>
            <PiggyBank size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="texto-secundario texto-pequeno">Total guardado</p>
            <strong className={styles.cardValor}>
              {formatarMoeda(totalGuardado)}
            </strong>
          </div>
        </div>

        <div className={`card ${styles.cardResumo}`}>
          <span className={styles.cardIcone}>
            <TrendingUp size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="texto-secundario texto-pequeno">Total das metas</p>
            <strong className={styles.cardValor}>
              {formatarMoeda(totalAlvo)}
            </strong>
          </div>
        </div>
      </section>

      {/* Lista de metas */}
      <section className={styles.lista}>
        <h2>Suas metas</h2>

        {carregando ? (
          <div className={`card ${styles.vazio}`}>
            <p className="texto-secundario">Carregando suas metas...</p>
          </div>
        ) : erroCarregar ? (
          <div className={`card ${styles.vazio}`}>
            <p className="texto-secundario">{erroCarregar}</p>
          </div>
        ) : metas.length === 0 ? (
          <div className={`card ${styles.vazio}`}>
            <p className="texto-secundario">
              Você ainda não tem metas. Crie a primeira para começar a planejar.
            </p>
          </div>
        ) : (
          <div className={`grid grid-2 ${styles.gridMetas}`}>
            {metas.map((meta) => {
              const progresso = calcularProgresso(
                meta.valorAtual,
                meta.valorAlvo
              );
              const concluida = progresso >= 100;
              const animar = recemConcluidas.has(meta._id);

              return (
                <article
                  key={meta._id}
                  className={`card card-interativo ${styles.cardMeta} ${
                    concluida ? styles.cardConcluida : ""
                  } ${animar ? styles.cardCelebrar : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setMetaSelecionada(meta)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMetaSelecionada(meta);
                    }
                  }}
                  aria-label={`Abrir detalhes da meta ${meta.nome}${
                    concluida ? " (concluída)" : ""
                  }`}
                >
                  <header className={styles.metaTopo}>
                    <h3>{meta.nome}</h3>
                    {concluida ? (
                      <span className={styles.badgeConcluida}>
                        <CheckCircle2 size={14} aria-hidden="true" />
                        Concluída
                      </span>
                    ) : (
                      <span
                        className={`${styles.tag} ${
                          styles[`tag-${meta.prioridade}`]
                        }`}
                      >
                        {meta.prioridade}
                      </span>
                    )}
                  </header>

                  {/* Barra de progresso */}
                  <div className={styles.progresso}>
                    <div
                      className={`${styles.progressoBarra} ${
                        concluida ? styles.progressoBarraConcluida : ""
                      }`}
                      style={{ width: `${progresso}%` }}
                    />
                  </div>

                  <div className={styles.metaValores}>
                    <span>
                      <strong>{formatarMoeda(meta.valorAtual)}</strong>
                      <span className="texto-secundario texto-pequeno">
                        {" "}
                        de {formatarMoeda(meta.valorAlvo)}
                      </span>
                    </span>
                    <span className="texto-secundario texto-pequeno">
                      {Math.round(progresso)}%
                    </span>
                  </div>

                  <div className={styles.metaAcoes}>
                    <button
                      type="button"
                      className="btn btn-secundario"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirEdicao(meta);
                      }}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Editar
                    </button>

                    {/* Depósito ou retirada sobre o valor guardado da meta.
                        No back-end virará uma transação com metaId. */}
                    <button
                      type="button"
                      className="btn btn-secundario"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirMovimentacao(meta);
                      }}
                    >
                      <ArrowLeftRight size={16} aria-hidden="true" />
                      Movimentar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de criação/edição de meta. A key muda conforme a meta em
          edição, remontando o modal com os valores corretos a cada abertura. */}
      <ModalNovaMeta
        key={modalAberto ? metaEmEdicao?._id ?? "nova-meta" : "fechado"}
        aberto={modalAberto}
        metaParaEditar={metaEmEdicao}
        onFechar={fecharModal}
        onSalvar={salvarMeta}
        onExcluir={excluirMeta}
      />

      {/* Modal de movimentação (depósito/retirada) do valor guardado. */}
      <ModalMovimentarMeta
        key={metaEmMovimentacao?._id ?? "sem-movimentacao"}
        aberto={Boolean(metaEmMovimentacao)}
        meta={metaEmMovimentacao}
        onFechar={fecharMovimentacao}
        onConfirmar={confirmarMovimentacao}
      />

      {/* Painel lateral de detalhes da meta: resumo + movimentações.
          Fica sempre montado e anima pela classe interna (mesmo padrão do
          PainelDetalhes da página Carteiras), por isso não usa `key`. */}
      <PainelDetalhesMeta
        meta={metaSelecionada}
        movimentacoes={
          metaSelecionada ? movimentacoesPorMeta[metaSelecionada._id] ?? [] : []
        }
        onFechar={() => setMetaSelecionada(null)}
        onEditar={(meta) => {
          setMetaSelecionada(null);
          abrirEdicao(meta);
        }}
        onExcluir={excluirMeta}
      />
    </div>
  );
}

export default Metas;
