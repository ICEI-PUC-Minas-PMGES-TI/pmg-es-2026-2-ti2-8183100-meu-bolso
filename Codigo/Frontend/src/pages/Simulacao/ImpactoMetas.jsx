import { Target } from "lucide-react";

import styles from "./Simulacao.module.css";
import { formatarMoeda } from "./calculoSimulacao";

// Conteúdo do card conforme o estado (sem simulação, sem metas, ou lista).
function Conteudo({ resultado, temMetas }) {
  if (!resultado) {
    return (
      <p className={`texto-secundario ${styles.placeholder}`}>
        Preencha os dados e clique em &quot;Calcular impacto&quot;.
      </p>
    );
  }

  if (!temMetas) {
    return (
      <p className="texto-secundario">
        Você ainda não tem metas para avaliar o impacto.
      </p>
    );
  }

  return (
    <ul className={styles.listaMetas}>
      {resultado.reflexoMetas.map((m) => (
        <li key={m.id} className={styles.itemMeta}>
          <span className={styles.metaIcone}>
            <Target size={18} aria-hidden="true" />
          </span>
          <div className={styles.metaInfo}>
            <strong>{m.nome}</strong>
            <span className="texto-secundario texto-pequeno">
              Falta guardar {formatarMoeda(m.faltava)}
            </span>
          </div>
          <span
            className={`${styles.metaStatus} ${
              m.compromete ? styles.statusRuim : styles.statusOk
            }`}
          >
            {m.compromete ? "Compromete" : "Sem impacto"}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Card "Impacto no seu planejamento": reflexo da compra nas metas.
function ImpactoMetas({ resultado, temMetas }) {
  return (
    <div className={`card ${styles.planejamento}`}>
      <h3>Impacto no seu planejamento</h3>
      <Conteudo resultado={resultado} temMetas={temMetas} />
    </div>
  );
}

export default ImpactoMetas;
