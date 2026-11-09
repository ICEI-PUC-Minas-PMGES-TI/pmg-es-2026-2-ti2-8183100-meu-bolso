import { useState } from "react";

import { formatarData, formatarMoeda } from "../../utils/Receitasutils";
import { TAMANHO_MAX_COMENTARIO } from "../../pages/Receitas/Constantes";
import Modal from "./Modal";
import styles from "../../pages/Receitas/Receitas.module.css";

/** Mostra o comentário da receita já em modo de edição (visualizar = ler o campo). */
export default function ModalComentario({ receita, onFechar, onSalvar }) {
  const [texto, setTexto] = useState(receita.comentario ?? "");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(novoTexto) {
    setSalvando(true);
    setErro("");

    try {
      await onSalvar(novoTexto);
    } catch (e) {
      setErro(e.message || "Não foi possível salvar o comentário.");
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Comentário" onFechar={onFechar} largura={460}>
      <p className={styles["receitas-comentario-contexto"]}>
        <strong>{receita.descricao}</strong>
        <span className="texto-secundario">
          {formatarData(receita.data)} · {formatarMoeda(receita.valor)}
        </span>
      </p>

      <form
        className={styles["receitas-form-coluna"]}
        onSubmit={(event) => {
          event.preventDefault();
          salvar(texto.trim());
        }}
      >
        <div className="form-group">
          <label className="form-label" htmlFor="comentario-texto">
            Observação
          </label>
          <textarea
            id="comentario-texto"
            className={`form-input ${styles["receitas-textarea"]}`}
            rows={4}
            maxLength={TAMANHO_MAX_COMENTARIO}
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            autoFocus
          />
          <span className={styles["receitas-contador"]}>
            {texto.length}/{TAMANHO_MAX_COMENTARIO}
          </span>
        </div>

        {erro && (
          <p className="mensagem mensagem-erro" role="alert">
            {erro}
          </p>
        )}

        <div className={styles["receitas-form-acoes"]}>
          {receita.comentario && (
            <button
              type="button"
              className={`btn btn-secundario ${styles["receitas-acao-esquerda"]}`}
              onClick={() => salvar("")}
              disabled={salvando}
            >
              Remover comentário
            </button>
          )}

          <button type="button" className="btn btn-secundario" onClick={onFechar}>
            Cancelar
          </button>

          <button type="submit" className="btn btn-primario" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
