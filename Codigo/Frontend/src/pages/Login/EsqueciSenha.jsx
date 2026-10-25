import { useState } from "react";
import logoBranca from "/images/Logo_meu_bolso_branca.png";
import styles from "./Login.module.css";
import { Link } from "react-router-dom";
import { esqueciSenha } from "../../service/Api";

function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await esqueciSenha(email.trim());
      setEnviado(true);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-split"]}>
        {/* PAINEL ESQUERDO (APRESENTAÇÃO) */}
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
              Acontece com todo mundo.
            </h2>
            <p className={styles["login-marketing-descricao"]}>
              Informe o seu e-mail e enviaremos um link para você criar uma nova
              senha e voltar a cuidar do seu dinheiro.
            </p>
          </div>

          <p className={styles["login-marketing-rodape"]}>
            Por segurança, o link de recuperação expira em pouco tempo e só
            pode ser usado uma vez.
          </p>
        </aside>

        {/* PAINEL DIREITO (FORMULÁRIO) */}
        <div className={styles["login-container"]}>
          <div className={styles["login-header"]}>
            <h1>Esqueceu sua senha?</h1>
            <p>Sem problemas, a gente te ajuda a recuperar o acesso</p>
          </div>

          {enviado ? (
            <div className={styles["login-form"]}>
              <p className={styles["login-sucesso"]}>
                Se este e-mail estiver cadastrado, você receberá em instantes um
                link para criar uma nova senha. Confira também a caixa de spam.
              </p>
            </div>
          ) : (
            <form className={styles["login-form"]} onSubmit={handleSubmit}>
              <div className={styles["input-group"]}>
                <label htmlFor="email">E-mail</label>

                <input
                  id="email"
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {erro && <p className={styles["login-error"]}>{erro}</p>}

              <button
                className={styles["login-button"]}
                type="submit"
                disabled={carregando}
              >
                {carregando ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          )}

          <div className={styles["login-register"]}>
            Lembrou da senha? <Link to="/">Entrar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EsqueciSenha;
