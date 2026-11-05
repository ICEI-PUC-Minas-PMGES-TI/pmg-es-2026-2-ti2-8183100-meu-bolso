import { AlertCircle } from "lucide-react";

import styles from "./Simulacao.module.css";

// Card de estado (carregando ou erro) exibido no lugar do conteúdo.
// Passe `erro` para o modo de erro; sem ele, mostra o carregamento.
function EstadoCard({ erro }) {
  if (erro) {
    return (
      <div className={`card ${styles.estado}`}>
        <AlertCircle size={32} className={styles.iconeErro} aria-hidden="true" />
        <p className={styles.estadoTitulo}>Não foi possível carregar</p>
        <p className="texto-secundario">{erro}</p>
      </div>
    );
  }

  return (
    <div className={`card ${styles.estado}`}>
      <p className="texto-secundario">Carregando seus dados...</p>
    </div>
  );
}

export default EstadoCard;
