import { useState } from "react";
import logoBranca from "/images/Logo_meu_bolso_branca.png";
import styles from "./Login.module.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { redefinirSenha } from "../../service/Api";

function RedefinirSenha() {
  const navigate = useNavigate();

  // O token chega pelo link do e-mail: /redefinir-senha?token=...
  const [params] = useSearchParams();
  const token = params.get("token");

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [linkInvalido, setLinkInvalido] = useState(!token);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    // Validações feitas antes de chamar o back (o back também valida)
    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);
    try {
      await redefinirSenha(token, senha);
      navigate("/", {
        state: {
          mensagem: "Senha redefinida! Faça login com a sua nova senha.",
        },
      });
    } catch (e) {
      if (e.status === 400) {
        // Token inválido, expirado ou já usado
        setLinkInvalido(true);
      } else {
        setErro(e.message);
      }
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
            <h2 className={styles["login-marketing-titulo"]}>Quase lá.</h2>
            <p className={styles["login-marketing-descricao"]}>
              Escolha uma nova senha para acessar o Meu Bolso e continuar de
              onde parou.
            </p>
          </div>

          <p className={styles["login-marketing-rodape"]}>
            Use uma senha que você não utiliza em outros sites.
          </p>
        </aside>

        {/* PAINEL DIREITO (FORMULÁRIO) */}
        <div className={styles["login-container"]}>
          <div className={styles["login-header"]}>
            <h1>Crie uma nova senha</h1>
            <p>Defina a senha que você vai usar no próximo acesso</p>
          </div>

          {linkInvalido ? (
            <div className={styles["login-form"]}>
              <p className={styles["login-error"]}>
                Este link é inválido ou expirou. Peça um novo link de
                recuperação.
              </p>
              <button
                className={styles["login-button"]}
                type="button"
                onClick={() => navigate("/esqueci-senha")}
              >
                Pedir novo link
              </button>
            </div>
          ) : (
            <form className={styles["login-form"]} onSubmit={handleSubmit}>
              <div className={styles["input-group"]}>
                <label htmlFor="senha">Nova senha</label>
                <input
                  id="senha"
                  type="password"
                  placeholder="Mínimo de 8 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              <div className={styles["input-group"]}>
                <label htmlFor="confirmarSenha">Confirmar nova senha</label>
                <input
                  id="confirmarSenha"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                />
              </div>

              {erro && <p className={styles["login-error"]}>{erro}</p>}

              <button
                className={styles["login-button"]}
                type="submit"
                disabled={carregando}
              >
                {carregando ? "Salvando..." : "Redefinir senha"}
              </button>
            </form>
          )}

          <div className={styles["login-register"]}>
            Voltar para o <Link to="/">login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RedefinirSenha;
