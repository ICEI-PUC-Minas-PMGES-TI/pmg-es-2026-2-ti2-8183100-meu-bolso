import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import logoBranca from "/images/Logo_meu_bolso_branca.png";

import { resumoSemanalApi } from "../../service/Api";
import styles from "../Login/Login.module.css";

/**
 * Página aberta pelo link do e-mail do resumo semanal. Não exige login.
 * O cancelamento só acontece quando a pessoa clica no botão (e não ao abrir
 * a página), para que robôs de segurança de e-mail não cancelem sozinhos.
 *
 * Reaproveita o layout em duas colunas das telas de login (painel de marca
 * à esquerda, card à direita), assim a página parece parte do mesmo produto.
 */
export default function CancelarResumo() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(token ? "" : "Link inválido ou expirado.");

  async function confirmar() {
    setErro("");
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

  // Sem token (ou depois de um erro de link) não há o que confirmar.
  const podeConfirmar = !concluido && Boolean(token) && !erro;

  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-split"]}>
        {/* PAINEL ESQUERDO (MARCA) */}
        <aside className={styles["login-marketing"]}>
          <div className={styles["login-marketing-topo"]}>
            <img
              src={logoBranca}
              alt="Meu Bolso"
              className={styles["login-marketing-logo"]}
            />
          </div>

          <div className={styles["login-marketing-centro"]}>
            <h2 className={styles["login-marketing-titulo"]}>
              Você decide o que recebe.
            </h2>
            <p className={styles["login-marketing-descricao"]}>
              O resumo semanal é opcional. Cancele quando quiser e volte a
              ativar a qualquer momento em Editar perfil.
            </p>
          </div>

          <p className={styles["login-marketing-rodape"]}>
            Por segurança, só o link do e-mail mais recente funciona, e o
            cancelamento só vale depois da sua confirmação.
          </p>
        </aside>

        {/* PAINEL DIREITO (CARD) */}
        <div className={styles["login-container"]}>
          <div className={styles["login-header"]}>
            <h1>
              {concluido ? "Resumo cancelado" : "Cancelar resumo semanal"}
            </h1>
            <p>
              {concluido
                ? "Tudo certo, você não receberá mais o resumo."
                : "Confirme para parar de receber o resumo semanal por e-mail."}
            </p>
          </div>

          <div className={styles["login-form"]}>
            {concluido && mensagem && (
              <p className={styles["login-sucesso"]}>{mensagem}</p>
            )}

            {erro && (
              <p className={styles["login-error"]} role="alert">
                {erro}
              </p>
            )}

            {podeConfirmar && (
              <button
                type="button"
                className={styles["login-button"]}
                onClick={confirmar}
                disabled={enviando}
              >
                {enviando ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            )}
          </div>

          <div className={styles["login-register"]}>
            {concluido ? "Mudou de ideia? " : "Não quer cancelar? "}
            <Link to="/">Voltar para o login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
