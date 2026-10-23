import { useState } from "react";
import { Plus, Target, PiggyBank, TrendingUp, Pencil } from "lucide-react";

import ModalNovaMeta from "../../components/ModalNovaMeta/ModalNovaMeta";

import styles from "./Metas.module.css";

// ============================================================
// METAS (RF-02 / RF-03 — F4: Metas e reserva)
// ------------------------------------------------------------
// Esqueleto da página de Metas. A estrutura segue o padrão das
// demais páginas (componente funcional + CSS Module + classes
// globais do global.css).
//
// O modelo de dados (ver Documentacao/ModeloDeDados.md, coleção
// "metas") define cada meta com: nome, valorAlvo, valorAtual,
// prazo e prioridade ("alta" | "media" | "baixa"). A reserva é
// apenas uma meta com nome próprio. O progresso é calculado por
// valorAtual / valorAlvo.
//
// TODO (back-end): substituir os dados de exemplo por chamadas
// ao serviço de API (src/service/Api.js) e implementar as ações
// de criar meta e registrar aporte.
// ============================================================

// Dados de exemplo apenas para visualizar o layout do esqueleto.
// Serão removidos quando a integração com a API for feita.
const metasExemplo = [
  {
    _id: "exemplo-1",
    nome: "Reserva de emergência",
    valorAlvo: 5000,
    valorAtual: 1800,
    prazo: "2026-12-31",
    prioridade: "alta",
  },
  {
    _id: "exemplo-2",
    nome: "Viagem",
    valorAlvo: 3000,
    valorAtual: 750,
    prazo: "2027-06-30",
    prioridade: "media",
  },
];

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
  // Estado inicial com os dados de exemplo (trocar por fetch na API).
  const [metas, setMetas] = useState(metasExemplo);

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

  // Recebe a meta salva pelo modal. Se já tem _id, atualiza a
  // existente; senão, cria uma nova (ainda sem back-end).
  function salvarMeta(meta) {
    if (meta._id) {
      setMetas((lista) =>
        lista.map((m) => (m._id === meta._id ? { ...m, ...meta } : m))
      );
    } else {
      setMetas((lista) => [...lista, { ...meta, _id: `meta-${Date.now()}` }]);
    }
  }

  // Resumo simples para os cartões de visão geral.
  const totalMetas = metas.length;
  const totalGuardado = metas.reduce((soma, meta) => soma + meta.valorAtual, 0);
  const totalAlvo = metas.reduce((soma, meta) => soma + meta.valorAlvo, 0);

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

        {metas.length === 0 ? (
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

              return (
                <article
                  key={meta._id}
                  className={`card card-interativo ${styles.cardMeta}`}
                >
                  <header className={styles.metaTopo}>
                    <h3>{meta.nome}</h3>
                    <span
                      className={`${styles.tag} ${
                        styles[`tag-${meta.prioridade}`]
                      }`}
                    >
                      {meta.prioridade}
                    </span>
                  </header>

                  {/* Barra de progresso */}
                  <div className={styles.progresso}>
                    <div
                      className={styles.progressoBarra}
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
                      onClick={() => abrirEdicao(meta)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Editar
                    </button>

                    {/* TODO: registrar aporte (cria uma transação com metaId) */}
                    <button
                      type="button"
                      className="btn btn-secundario"
                      disabled
                    >
                      Registrar aporte
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
      />
    </div>
  );
}

export default Metas;
