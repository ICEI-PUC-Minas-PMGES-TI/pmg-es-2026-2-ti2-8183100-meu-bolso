import { ShieldCheck, ShieldAlert, Pencil, ArrowLeftRight } from "lucide-react";

import {
  coberturaDaReserva,
  formatarMoeda,
  infoNivel,
  progressoReserva,
  rotuloHorizonte,
} from "./reserva";
import styles from "./ReservaEmergencia.module.css";

/**
 * Card da reserva de emergência, sempre no topo da página de Metas.
 *
 * Mostra o valor guardado, a barra até o valor mínimo (a reserva não tem
 * valor-alvo), quantos meses de gastos o valor cobre e a faixa de alerta do
 * nível calculado pelo back-end (vazia, crítica, atenção, protegida).
 *
 * props:
 *  - reserva: meta do tipo "reserva" (com valorMinimo, nivel, mesesCobertos)
 *  - onAbrir: abre o painel de detalhes
 *  - onEditar, onMovimentar: ações dos botões
 */
function CardReserva({ reserva, onAbrir, onEditar, onMovimentar }) {
  const info = infoNivel(reserva);
  const progresso = progressoReserva(reserva);
  const minimo = Number(reserva.valorMinimo ?? 0);
  const atual = Number(reserva.valorAtual ?? 0);
  const meses = coberturaDaReserva(reserva);
  const IconeAviso = info.cor === "sucesso" ? ShieldCheck : ShieldAlert;

  return (
    <article
      className={`${styles.card} ${styles[`card-${info.cor}`]}`}
      role="button"
      tabIndex={0}
      onClick={onAbrir}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAbrir();
        }
      }}
      aria-label={`Abrir detalhes da reserva de emergência ${reserva.nome}`}
    >
      <header className={styles.topo}>
        <span className={styles.icone} aria-hidden="true">
          <ShieldCheck size={22} />
        </span>
        <div className={styles.topoTexto}>
          <h3>{reserva.nome}</h3>
          <span className={styles.tag}>Reserva de emergência</span>
        </div>
      </header>

      <div className={styles.valores}>
        <strong className={styles.valorGuardado}>{formatarMoeda(atual)}</strong>
        <span className={styles.subtitulo}>
          {minimo > 0
            ? `de ${formatarMoeda(minimo)} · mínimo para ${rotuloHorizonte(reserva.horizonteMeses)}`
            : "guardados"}
        </span>
      </div>

      {minimo > 0 && (
        <>
          <div
            className={styles.trilho}
            role="progressbar"
            aria-label="Reserva em relação ao mínimo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progresso)}
          >
            <div
              className={`${styles.preenchimento} ${styles[`preenchimento-${info.cor}`]}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
          <div className={styles.rodapeBarra}>
            <span>
              {!meses
                ? ""
                : atual < Number(reserva.custoMensal ?? 0)
                ? `Sua reserva só cobre ${meses} de gastos`
                : `Cobre ${meses} dos seus gastos`}
            </span>
            <span>
              {atual >= minimo
                ? `${formatarMoeda(atual - minimo)} acima do mínimo`
                : `${Math.round(progresso)}% do mínimo`}
            </span>
          </div>
        </>
      )}

      <p className={`${styles.aviso} ${styles[`aviso-${info.cor}`]}`} role="status">
        <IconeAviso size={18} aria-hidden="true" />
        <span>
          <strong>{info.titulo}.</strong> {info.texto}
        </span>
      </p>

      <div className={styles.acoes}>
        <button
          type="button"
          className="btn btn-secundario"
          onClick={(e) => {
            e.stopPropagation();
            onEditar();
          }}
        >
          <Pencil size={16} aria-hidden="true" />
          Editar
        </button>
        <button
          type="button"
          className="btn btn-secundario"
          onClick={(e) => {
            e.stopPropagation();
            onMovimentar();
          }}
        >
          <ArrowLeftRight size={16} aria-hidden="true" />
          Movimentar
        </button>
      </div>
    </article>
  );
}

export default CardReserva;
