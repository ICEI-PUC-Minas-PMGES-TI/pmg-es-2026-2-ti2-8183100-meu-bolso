import { useEffect, useId } from "react";
import { MessageSquareText, Pencil, Repeat, Trash2, X } from "lucide-react";

import { formatarData, formatarMoeda } from "../../utils/Gastosutils";
import { TIPO_RECEITA } from "../../utils/Movimentacoesutils";
import IconeGasto from "../Gastos/IconeCategoria";
import IconeReceita from "../Receitas/IconeCategoria";
import styles from "../../pages/Movimentacoes/Movimentacoes.module.css";

/**
 * Painel lateral com os detalhes de uma movimentação e as ações
 * (editar, comentário, excluir). Fecha com Esc ou clique fora.
 */
// escutarEsc=false enquanto um modal está aberto por cima, para o Esc fechar só o modal.
export default function PainelMovimentacao({
  item,
  escutarEsc = true,
  onFechar,
  onEditar,
  onComentario,
  onExcluir,
}) {
  const idTitulo = useId();
  const receita = item.tipo === TIPO_RECEITA;
  const Icone = receita ? IconeReceita : IconeGasto;

  useEffect(() => {
    if (!escutarEsc) return undefined;
    function aoPressionarTecla(event) {
      if (event.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoPressionarTecla);
    return () => document.removeEventListener("keydown", aoPressionarTecla);
  }, [escutarEsc, onFechar]);

  return (
    <div
      className={styles["painel-overlay"]}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onFechar();
      }}
    >
      <aside className={styles.painel} role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
        <div className={styles["painel-topo"]}>
          <span className={`${styles["painel-tipo"]} ${receita ? styles["painel-tipo-entrada"] : ""}`}>
            {receita ? "Receita" : "Gasto"}
          </span>
          <button
            type="button"
            className={styles["painel-fechar"]}
            onClick={onFechar}
            aria-label="Fechar"
            autoFocus
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className={styles["painel-cabecalho"]}>
          <span className={`${styles["linha-icone"]} ${receita ? styles["linha-icone-entrada"] : ""}`}>
            <Icone categoria={item.categoria} />
          </span>
          <div>
            <h2 id={idTitulo} className={styles["painel-titulo"]}>
              {item.descricao}
            </h2>
            <strong
              className={`${styles["painel-valor"]} ${receita ? styles["valor-entrada"] : styles["valor-saida"]}`}
            >
              {receita ? "+" : "−"} {formatarMoeda(item.valor)}
            </strong>
          </div>
        </div>

        {item.projetado && (
          <p className="mensagem mensagem-info">
            Lançamento previsto: ainda não aconteceu. Ele vem de uma recorrência e só pode ser removido.
          </p>
        )}

        <dl className={styles["painel-dados"]}>
          <div>
            <dt>Categoria</dt>
            <dd>{item.categoria}</dd>
          </div>
          <div>
            <dt>Carteira</dt>
            <dd>{item.carteira}</dd>
          </div>
          <div>
            <dt>Data</dt>
            <dd>{formatarData(item.data)}</dd>
          </div>
          <div>
            <dt>Repetição</dt>
            <dd>
              {item.recorrenciaId ? (
                <span className={styles["painel-recorrente"]}>
                  <Repeat size={14} aria-hidden="true" /> Repete todo mês
                </span>
              ) : (
                "Não repete"
              )}
            </dd>
          </div>
        </dl>

        {!item.projetado && (
          <section className={styles["painel-comentario"]}>
            <h3>Comentário</h3>
            {item.comentario ? (
              <p>{item.comentario}</p>
            ) : (
              <p className="texto-secundario">Nenhum comentário.</p>
            )}
          </section>
        )}

        <div className={styles["painel-acoes"]}>
          {!item.projetado && (
            <>
              <button type="button" className="btn btn-primario" onClick={() => onEditar(item)}>
                <Pencil size={16} aria-hidden="true" />
                Editar
              </button>
              <button type="button" className="btn btn-secundario" onClick={() => onComentario(item)}>
                <MessageSquareText size={16} aria-hidden="true" />
                {item.comentario ? "Editar comentário" : "Adicionar comentário"}
              </button>
            </>
          )}
          <button
            type="button"
            className={`btn btn-secundario ${styles["painel-excluir"]}`}
            onClick={() => onExcluir(item)}
          >
            <Trash2 size={16} aria-hidden="true" />
            {item.projetado ? "Remover recorrência" : "Excluir"}
          </button>
        </div>
      </aside>
    </div>
  );
}
