import { useState } from "react";
import { X, MoreVertical, Pencil, Trash2, ArrowRight } from "lucide-react";
import CarteiraVisual from "../CarteiraVisual/CarteiraVisual";
import { formatarBRL } from "../../pages/Carteiras/carteirasMock";
import styles from "./PainelDetalhes.module.css";

/**
 * Painel lateral reutilizável (abre pela direita).
 * O conteúdo muda conforme o tipo do item; a estrutura permanece.
 *
 * props:
 *  - item: objeto selecionado (ou null = fechado)
 *  - movimentacoes: lista de movimentações do item
 *  - contaAssociada: conta vinculada (para cartões/reservas), opcional
 *  - onFechar: fecha o painel
 *  - onVerMovimentacoes, onEditar, onExcluir: callbacks (placeholders)
 */
function PainelDetalhes({
  item,
  movimentacoes = [],
  contaAssociada = null,
  onFechar,
  onVerMovimentacoes,
  onEditar,
  onExcluir,
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const aberto = Boolean(item);

  return (
    <>
      {/* fundo escurecido */}
      <div
        className={`${styles.overlay} ${aberto ? styles.overlayVisivel : ""}`}
        onClick={onFechar}
        aria-hidden="true"
      />

      <aside
        className={`${styles.painel} ${aberto ? styles.painelAberto : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={item ? `Detalhes de ${item.apelido}` : "Detalhes"}
      >
        {item && (
          <>
            {/* Cabeçalho */}
            <header className={styles.cabecalho}>
              <button
                className={styles.botaoFechar}
                type="button"
                onClick={onFechar}
                aria-label="Fechar painel"
              >
                <X size={20} />
              </button>

              <div className={styles.cabecalhoTexto}>
                <strong className={styles.titulo}>{item.apelido}</strong>
                {item.instituicao ? (
                  <span className={styles.subtitulo}>{item.instituicao}</span>
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
                        onEditar?.();
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
                        onExcluir?.();
                      }}
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </header>

            {/* Área visual compacta do item */}
            <div className={styles.visual}>
              <CarteiraVisual
                tipo={item.tipo}
                compacto
                apelido={item.apelido}
                instituicao={item.instituicao}
                bandeira={item.bandeira}
                tema={item.tema}
                ultimosDigitos={item.ultimosDigitos}
                validade={item.validade}
                valor={formatarBRL(item.saldo)}
              />
            </div>

            {/* Resumo financeiro (varia por tipo) */}
            <section className={styles.resumo}>
              <ResumoPorTipo item={item} contaAssociada={contaAssociada} />
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
                <ul className={styles.listaMov}>
                  {movimentacoes.map((mov) => (
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
                        {formatarBRL(Math.abs(mov.valor))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                className={styles.verTodas}
                type="button"
                onClick={onVerMovimentacoes}
              >
                Ver todas as movimentações
                <ArrowRight size={16} />
              </button>
            </section>
          </>
        )}
      </aside>
    </>
  );
}

/** Resumo financeiro específico por tipo de item. */
function ResumoPorTipo({ item, contaAssociada }) {
  if (item.tipo === "conta") {
    return (
      <Linha rotulo="Saldo registrado" valor={formatarBRL(item.saldo)} destaque />
    );
  }

  if (item.tipo === "dinheiro") {
    return (
      <Linha rotulo="Saldo registrado" valor={formatarBRL(item.saldo)} destaque />
    );
  }

  if (item.tipo === "reserva") {
    return (
      <>
        <Linha rotulo="Valor reservado" valor={formatarBRL(item.valorReservado)} destaque />
        {item.objetivo ? (
          <Linha rotulo="Objetivo" valor={formatarBRL(item.objetivo)} />
        ) : null}
        {contaAssociada ? (
          <Linha rotulo="Guardado em" valor={contaAssociada.apelido} />
        ) : null}
      </>
    );
  }

  if (item.tipo === "cartao") {
    // Crédito: fatura + limite. Débito: usa a conta associada (sem saldo próprio).
    if (item.subtipo === "credito") {
      return (
        <>
          <Linha rotulo="Tipo" valor="Cartão de crédito" />
          {item.faturaAtual != null ? (
            <Linha rotulo="Fatura atual" valor={formatarBRL(item.faturaAtual)} destaque />
          ) : null}
          {item.limite != null ? (
            <Linha rotulo="Limite" valor={formatarBRL(item.limite)} />
          ) : null}
          {contaAssociada ? (
            <Linha rotulo="Conta associada" valor={contaAssociada.apelido} />
          ) : null}
        </>
      );
    }

    // débito
    return (
      <>
        <Linha rotulo="Tipo" valor="Cartão de débito" />
        {contaAssociada ? (
          <Linha rotulo="Conta associada" valor={contaAssociada.apelido} />
        ) : null}
      </>
    );
  }

  return null;
}

function Linha({ rotulo, valor, destaque = false }) {
  return (
    <div className={styles.linha}>
      <span className={styles.linhaRotulo}>{rotulo}</span>
      <span className={`${styles.linhaValor} ${destaque ? styles.linhaDestaque : ""}`}>
        {valor}
      </span>
    </div>
  );
}

export default PainelDetalhes;
