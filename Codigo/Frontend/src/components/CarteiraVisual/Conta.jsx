import { Landmark, PiggyBank, Wallet } from "lucide-react";
import styles from "./Conta.module.css";

/**
 * Representação simples (placeholder) para itens que ainda não têm
 * arte própria: conta bancária, reserva e (fallback) dinheiro.
 * Sem gradiente/efeitos — refino visual fica para depois.
 *
 * props:
 *  - tipo: "conta" | "reserva" | "dinheiro"
 *  - apelido: nome exibido
 *  - instituicao: banco/origem (opcional)
 *  - compacto: versão reduzida para o topo do painel
 */
const icones = {
  conta: Landmark,
  reserva: PiggyBank,
  dinheiro: Wallet,
};

function Conta({ tipo = "conta", apelido = "Conta", instituicao = "", compacto = false }) {
  const Icone = icones[tipo] || Landmark;

  return (
    <div className={`${styles.conta} ${compacto ? styles.compacto : ""}`}>
      <span className={styles.icone}>
        <Icone size={compacto ? 20 : 26} />
      </span>
      <div className={styles.texto}>
        <strong className={styles.apelido}>{apelido}</strong>
        {instituicao ? (
          <span className={styles.instituicao}>{instituicao}</span>
        ) : null}
      </div>
    </div>
  );
}

export default Conta;
