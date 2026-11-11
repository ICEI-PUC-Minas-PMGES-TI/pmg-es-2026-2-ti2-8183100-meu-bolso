import { Banknote } from "lucide-react";
import { textoResumo, chipsDaContagem } from "../../data/denominacoes";
import styles from "./Cedula.module.css";

/**
 * Cartão da carteira do tipo "dinheiro/espécie".
 * Visual escuro com ícone, título e saldo exibido uma única vez.
 * Quando recebe `contagem`, mostra o bloco "Notas e moedas".
 *
 * props:
 *  - apelido: rótulo (ex: "Dinheiro na carteira")
 *  - valor: valor exibido (ex: "R$ 180,00")
 *  - contagem: { "200": n, ... } (opcional)
 *  - compacto: variante reduzida usada no painel de detalhes
 */
function Cedula({ apelido = "Dinheiro", valor = "R$ 0,00", contagem = null, compacto = false }) {
  const chips = contagem ? chipsDaContagem(contagem) : [];
  const resumo = contagem ? textoResumo(contagem) : "";

  return (
    <div className={`${styles.cartao} ${compacto ? styles.compacto : ""}`}>
      <div className={styles.topo}>
        <span className={styles.icone} aria-hidden="true">
          <Banknote size={22} />
        </span>
        <div className={styles.textoTopo}>
          <strong className={styles.titulo}>{apelido}</strong>
          <span className={styles.subtitulo}>Em espécie</span>
        </div>
      </div>

      <div className={styles.saldo}>
        <span className={styles.saldoRotulo}>Saldo disponível</span>
        <strong className={styles.saldoValor}>{valor}</strong>
      </div>

      {contagem ? (
        <div className={styles.notas}>
          <div className={styles.notasTopo}>
            <span className={styles.notasTitulo}>Notas e moedas</span>
            {resumo ? <span className={styles.notasResumo}>{resumo}</span> : null}
          </div>
          {chips.length > 0 ? (
            <div className={styles.chips}>
              {chips.map((c) => (
                <span key={c.chave} className={styles.chip}>
                  {c.rotulo}
                  {c.qtd > 1 ? <span className={styles.chipQtd}>x{c.qtd}</span> : null}
                </span>
              ))}
            </div>
          ) : (
            <span className={styles.notasVazio}>Sem cédulas ou moedas</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default Cedula;
