import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { resumoSemanalApi } from "../../service/Api";
import styles from "../Login/Login.module.css";

/**
 * Página aberta pelo link do e-mail do resumo semanal. Não exige login.
 * O cancelamento só acontece quando a pessoa clica no botão (e não ao abrir
 * a página), para que robôs de segurança de e-mail não cancelem sozinhos.
 */
export default function CancelarResumo() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function confirmar() {
    setErro("");
    if (!token) {
      setErro("Link inválido ou expirado.");
      return;
    }
    setEnviando(true);
    try {
      const r = await resumoSemanalApi.cancelar(token);
      setMensagem(r.mensagem);
      setConcluido(true);
    } catch (e) {
      setErro(e.message || "Link inválido ou expirado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-container"]}>
        <header className={styles["login-header"]}>
          <h1>Cancelar resumo semanal</h1>
          <p>
            {concluido
              ? mensagem
              : "Você não receberá mais o resumo semanal deste e-mail."}
          </p>
        </header>

        {!concluido && (
          <button
            type="button"
            className={styles["login-button"]}
            onClick={confirmar}
            disabled={enviando}
          >
            {enviando ? "Cancelando..." : "Confirmar cancelamento"}
          </button>
        )}

        {erro && (
          <p className={styles["login-error"]} role="alert">
            {erro}
          </p>
        )}

        <p className={styles["login-register"]}>
          <Link to="/">Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}
