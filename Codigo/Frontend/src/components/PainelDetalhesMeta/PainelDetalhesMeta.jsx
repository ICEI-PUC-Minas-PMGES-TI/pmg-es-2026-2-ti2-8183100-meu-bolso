import { useState } from "react";
import {
  X,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowRight,
  Target,
} from "lucide-react";

import styles from "./PainelDetalhesMeta.module.css";

/**
 * Painel lateral de detalhes de uma META (abre pela direita).
 *
 * Segue a mesma linha visual do PainelDetalhes usado na página Carteiras
 * (reserva de emergência): resumo da meta + movimentações recentes +
 * botão "Ver todas as movimentações".
 *
 * O modelo de dados (ver Documentacao/ModeloDeDados.md, coleção "metas")
 * define: nome, valorAlvo, valorAtual, prazo e prioridade. O progresso é
 * valorAtual / valorAlvo.
 *
 * props:
 *  - meta: objeto da meta selecionada (ou null = fechado)
 *  - movimentacoes: histórico da meta (mais recente primeiro)
 *  - onFechar: fecha o painel
 *  - onEditar, onExcluir: callbacks de ação
 *  - onVerTodas: callback opcional ao expandir "ver todas" (apenas informativo)
 */

const QTD_RECENTES = 3;

/** Formata um número como moeda brasileira (R$). */
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor ?? 0);
}

/** Percentual de progresso (0 a 100). */
function calcularProgresso(valorAtual, valorAlvo) {
  if (!valorAlvo || valorAlvo <= 0) return 0;
  const percentual = (valorAtual / valorAlvo) * 100;
  return Math.min(Math.max(percentual, 0), 100);
}

/** Formata a data-alvo (YYYY-MM-DD) para pt-BR, sem fuso. */
function formatarPrazo(prazo) {
  if (!prazo) return null;
  const [ano, mes, dia] = String(prazo).split("-");
  if (!ano || !mes || !dia) return prazo;
  return `${dia}/${mes}/${ano}`;
}

function PainelDetalhesMeta({
  meta,
  movimentacoes = [],
  onFechar,
  onEditar,
  onExcluir,
  onVerTodas,
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const aberto = Boolean(meta);

  // O painel fica sempre montado (anima via classe, como o PainelDetalhes
  // da página Carteiras). Ao fechar, reinicia o estado interno aqui — sem
  // useEffect — para a próxima meta abrir "limpa".
  function fechar() {
    setMenuAberto(false);
    setMostrarTodas(false);
    onFechar?.();
  }

  const progresso = meta ? calcularProgresso(meta.valorAtual, meta.valorAlvo) : 0;
  const prazoFormatado = meta ? formatarPrazo(meta.prazo) : null;

  const temMais = movimentacoes.length > QTD_RECENTES;
  const listaVisivel = mostrarTodas
    ? movimentacoes
    : movimentacoes.slice(0, QTD_RECENTES);

  return (
    <>
      {/* fundo escurecido */}
      <div
        className={`${styles.overlay} ${aberto ? styles.overlayVisivel : ""}`}
        onClick={fechar}
        aria-hidden="true"
      />

      <aside
        className={`${styles.painel} ${aberto ? styles.painelAberto : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={meta ? `Detalhes da meta ${meta.nome}` : "Detalhes da meta"}
      >
        {meta && (
          <>
            {/* Cabeçalho */}
            <header className={styles.cabecalho}>
              <button
                className={styles.botaoFechar}
                type="button"
                onClick={fechar}
                aria-label="Fechar painel"
              >
                <X size={20} />
              </button>

              <div className={styles.cabecalhoTexto}>
                <strong className={styles.titulo}>{meta.nome}</strong>
                {prazoFormatado ? (
                  <span className={styles.subtitulo}>
                    Prazo: {prazoFormatado}
                  </span>
                ) : null}
              </div>

              <div className={styles.acoes}>
                <button
                  className={styles.botaoMenu}
                  type="button"
                  onClick={() => setMenuAberto((v) => !v)}
                  aria-label="Ações"
                >
                  <MoreVertical size={20} />
                </button>

                {menuAberto && (
                  <div className={styles.menu}>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuAberto(false);
                        onEditar?.(meta);
                      }}
                    >
                      <Pencil size={16} />
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.menuPerigo}
                      onClick={() => {
                        setMenuAberto(false);
                        onExcluir?.(meta);
                      }}
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </header>

            {/* Topo visual: ícone + nome + prioridade */}
            <div className={styles.visual}>
              <span className={styles.visualIcone}>
                <Target size={24} aria-hidden="true" />
              </span>
              <div className={styles.visualTexto}>
                <span className={styles.visualNome}>{meta.nome}</span>
                <span
                  className={`${styles.tag} ${styles[`tag-${meta.prioridade}`]}`}
                >
                  {meta.prioridade}
                </span>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className={styles.progresso}>
              <div className={styles.progressoBarra}>
                <div
                  className={styles.progressoPreenchido}
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <div className={styles.progressoRotulo}>
                <span>{formatarMoeda(meta.valorAtual)} guardado</span>
                <span>{Math.round(progresso)}%</span>
              </div>
            </div>

            {/* Resumo financeiro */}
            <section className={styles.resumo}>
              <div className={styles.linha}>
                <span className={styles.linhaRotulo}>Valor guardado</span>
                <span className={`${styles.linhaValor} ${styles.linhaDestaque}`}>
                  {formatarMoeda(meta.valorAtual)}
                </span>
              </div>
              <div className={styles.linha}>
                <span className={styles.linhaRotulo}>Valor-alvo</span>
                <span className={styles.linhaValor}>
                  {formatarMoeda(meta.valorAlvo)}
                </span>
              </div>
              <div className={styles.linha}>
                <span className={styles.linhaRotulo}>Falta</span>
                <span className={styles.linhaValor}>
                  {formatarMoeda(Math.max(meta.valorAlvo - meta.valorAtual, 0))}
                </span>
              </div>
              {prazoFormatado ? (
                <div className={styles.linha}>
                  <span className={styles.linhaRotulo}>Prazo</span>
                  <span className={styles.linhaValor}>{prazoFormatado}</span>
                </div>
              ) : null}
            </section>

            {/* Movimentações recentes */}
            <section className={styles.movimentacoes}>
              <div className={styles.movTopo}>
                <h3>Movimentações recentes</h3>
              </div>

              {movimentacoes.length === 0 ? (
                <p className={styles.vazio}>
                  Nenhuma movimentação registrada ainda.
                </p>
              ) : (
                <>
                  <ul className={styles.listaMov}>
                    {listaVisivel.map((mov) => (
                      <li key={mov.id} className={styles.itemMov}>
                        <div className={styles.movInfo}>
                          <span className={styles.movDescricao}>
                            {mov.descricao}
                          </span>
                          <span className={styles.movMeta}>
                            {mov.categoria} · {mov.data}
                          </span>
                        </div>
                        <span
                          className={`${styles.movValor} ${
                            mov.entrada ? styles.movEntrada : styles.movSaida
                          }`}
                        >
                          {mov.entrada ? "+ " : "- "}
                          {formatarMoeda(Math.abs(mov.valor))}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {temMais && (
                    <button
                      className={styles.verTodas}
                      type="button"
                      onClick={() => {
                        setMostrarTodas((v) => !v);
                        onVerTodas?.(meta);
                      }}
                    >
                      {mostrarTodas
                        ? "Mostrar apenas recentes"
                        : "Ver todas as movimentações"}
                      <ArrowRight size={16} />
                    </button>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </aside>
    </>
  );
}

export default PainelDetalhesMeta;
