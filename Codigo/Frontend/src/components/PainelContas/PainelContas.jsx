import { useEffect } from "react";
import { X, Plus, ChevronRight } from "lucide-react";

import { bancoDe, chaveDoBanco, BANCOS, FUNDO_LOGO } from "../../data/bancos";
import { posicaoEfetiva, ORDEM_POSICAO } from "../../data/posicaoContas";
import { formatarBRL } from "../../pages/Carteiras/carteirasMock";
import styles from "./PainelContas.module.css";

// Etiqueta da posição de destaque (ou nenhuma).
const ROTULO_POSICAO = {
  principal: "Principal",
  secundaria: "Secundária",
  terciaria: "Terciária",
};

/** Resolve a chave do banco: conta.banco válido, senão deduz do texto. */
function chaveDaConta(conta) {
  if (conta.banco && BANCOS[conta.banco]) return conta.banco;
  return chaveDoBanco(conta.instituicao || conta.apelido);
}

/**
 * Painel lateral com a lista completa de contas.
 * Reaproveita o padrão visual do painel de detalhes (overlay sobreposto).
 *
 * props:
 *  - aberto: boolean
 *  - contas: lista completa
 *  - onFechar, onEditar(conta), onAdicionar
 */
function PainelContas({ aberto, contas = [], onFechar, onEditar, onAdicionar }) {
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e) => {
      if (e.key === "Escape") onFechar?.();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, onFechar]);

  // Posição efetiva primeiro (principal, secundária, terciária) e demais depois.
  const efetivas = posicaoEfetiva(contas);
  const contasOrdenadas = [
    ...ORDEM_POSICAO.map((p) =>
      efetivas.find((c) => c.posicaoEfetiva === p)
    ).filter(Boolean),
    ...efetivas.filter((c) => !c.posicaoEfetiva),
  ];

  return (
    <>
      <div
        className={`${styles.overlay} ${aberto ? styles.overlayVisivel : ""}`}
        onClick={onFechar}
        aria-hidden="true"
      />

      <aside
        className={`${styles.painel} ${aberto ? styles.painelAberto : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Todas as contas"
      >
        <header className={styles.cabecalho}>
          <strong className={styles.titulo}>Todas as contas</strong>
          <button
            className={styles.botaoFechar}
            type="button"
            onClick={onFechar}
            aria-label="Fechar painel"
          >
            <X size={20} />
          </button>
        </header>

        <div className={styles.lista}>
          {contas.length === 0 ? (
            <p className={styles.vazio}>Nenhuma conta cadastrada.</p>
          ) : (
            contasOrdenadas.map((conta) => {
              const chave = chaveDaConta(conta);
              const banco = bancoDe(chave);
              const rotulo = ROTULO_POSICAO[conta.posicaoEfetiva];
              const fundoLogo = chave ? FUNDO_LOGO[chave] : null;
              const estiloLogo = fundoLogo
                ? {
                    backgroundColor: fundoLogo.fundo,
                    ...(fundoLogo.anel
                      ? { boxShadow: `inset 0 0 0 1.5px ${fundoLogo.anel}` }
                      : {}),
                  }
                : undefined;
              return (
                <button
                  key={conta.id}
                  type="button"
                  className={styles.linha}
                  onClick={() => onEditar?.(conta)}
                >
                  <span className={styles.logo} style={estiloLogo}>
                    <img
                      src={banco.logo}
                      alt={banco.nome}
                      onError={(e) => {
                        if (!e.currentTarget.dataset.fallback) {
                          e.currentTarget.dataset.fallback = "1";
                          e.currentTarget.src = "/bancos/padrao.png";
                        }
                      }}
                    />
                  </span>
                  <span className={styles.info}>
                    <span className={styles.nome}>{conta.apelido}</span>
                    <span className={styles.saldo}>
                      {formatarBRL(conta.saldo)}
                    </span>
                  </span>
                  {rotulo ? (
                    <span className={styles.etiqueta}>{rotulo}</span>
                  ) : null}
                  <ChevronRight size={16} className={styles.seta} />
                </button>
              );
            })
          )}
        </div>

        <div className={styles.rodape}>
          <button
            type="button"
            className={styles.botaoAdicionar}
            onClick={onAdicionar}
          >
            <Plus size={16} />
            Adicionar conta
          </button>
        </div>
      </aside>
    </>
  );
}

export default PainelContas;
