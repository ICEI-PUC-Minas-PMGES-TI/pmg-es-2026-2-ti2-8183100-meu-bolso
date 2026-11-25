import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ShieldCheck, ChevronRight } from "lucide-react";

import { listarMetas } from "../../service/Api";
import { coberturaDaReserva, ehReserva, formatarMoeda } from "./reserva";
import styles from "./ReservaEmergencia.module.css";

/**
 * Faixa da reserva de emergência na Visão geral.
 *  - sem reserva configurada: convite discreto;
 *  - vazia ou crítica: faixa vermelha;
 *  - atenção (abaixo do mínimo): faixa amarela;
 *  - protegida (ou sem mínimo calculável): não mostra nada.
 * Leva sempre para a página de Metas.
 */
function AlertaReserva() {
  // undefined = carregando; null = sem reserva; objeto = reserva.
  const [reserva, setReserva] = useState(undefined);

  useEffect(() => {
    let ativo = true;
    listarMetas()
      .then((metas) => {
        if (ativo) setReserva((metas ?? []).find(ehReserva) ?? null);
      })
      .catch(() => {
        // Sem metas (erro de rede): a faixa simplesmente não aparece.
        if (ativo) setReserva(undefined);
      });
    return () => {
      ativo = false;
    };
  }, []);

  if (reserva === undefined) return null;

  if (reserva === null) {
    return (
      <Link to="/metas" className={`${styles.alerta} ${styles["alerta-neutro"]}`}>
        <ShieldCheck size={18} aria-hidden="true" />
        <span>Configure sua reserva de emergência: o primeiro passo para lidar com imprevistos.</span>
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    );
  }

  const meses = coberturaDaReserva(reserva);
  const falta = Math.max(Number(reserva.valorMinimo ?? 0) - Number(reserva.valorAtual ?? 0), 0);

  let cor;
  let texto;
  if (reserva.nivel === "vazia") {
    cor = "erro";
    texto = "Sua reserva de emergência está vazia. Qualquer imprevisto vira dívida.";
  } else if (reserva.nivel === "critica") {
    cor = "erro";
    texto = meses
      ? `Sua reserva de emergência só cobre ${meses} de gastos.`
      : "Sua reserva de emergência está com menos da metade do mínimo.";
  } else if (reserva.nivel === "atencao") {
    cor = "alerta";
    texto = `Faltam ${formatarMoeda(falta)} para o mínimo da sua reserva de emergência${
      meses ? ` (hoje ela cobre ${meses} de gastos)` : ""
    }.`;
  } else {
    return null;
  }

  return (
    <Link to="/metas" className={`${styles.alerta} ${styles[`alerta-${cor}`]}`} role="status">
      <ShieldAlert size={18} aria-hidden="true" />
      <span>{texto} Veja em Metas.</span>
      <ChevronRight size={18} aria-hidden="true" />
    </Link>
  );
}

export default AlertaReserva;
