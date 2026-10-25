import { useState } from "react";
import logoBranca from "/images/Logo_meu_bolso_branca.png";
import styles from "./Login.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { entrar } from "../../service/Api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Dados digitados pelo usuário
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Mensagem enviada pela tela de cadastro ("Cadastro realizado!...")
  const sucesso = location.state?.mensagem;

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await entrar(email.trim(), senha);
      navigate("/dashboard");
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-split"]}>
        {/* PAINEL ESQUERDO (MARKETING) */}
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
              Seu dinheiro, do seu jeito.
            </h2>
            <p className={styles["login-marketing-descricao"]}>
              Registre o que você gasta, defina metas e teste decisões antes de
              tomá-las.
            </p>
          </div>

          <ul className={styles["login-marketing-lista"]}>
            <li>Controle de gastos por categoria</li>
            <li>Simulador de compras e metas</li>
            <li>Assistente de IA com orientações educativas</li>
          </ul>
        </aside>

        {/* PAINEL DIREITO (FORMULÁRIO) */}
        <div className={styles["login-container"]}>
          <div className={styles["login-header"]}>
            <h1>Que bom te ver de novo</h1>
            <p>Entre para acompanhar seu mês</p>
          </div>

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

            <div className={styles["input-group"]}>
              <label htmlFor="senha">Senha</label>

              <input
                id="senha"
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <div className={styles["login-options"]}>
              <a href="/esqueci-senha" className={styles["esqueceu-senha"]}>
                Esqueci minha senha
              </a>
            </div>

            {sucesso && !erro && (
              <p className={styles["login-sucesso"]}>{sucesso}</p>
            )}

            {erro && <p className={styles["login-error"]}>{erro}</p>}

            <button
              className={styles["login-button"]}
              type="submit"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className={styles["login-register"]}>
            Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
          </div>

          <p className={styles["login-lgpd"]}>
            Seus dados são tratados conforme a LGPD e cada pessoa vê apenas as
            próprias informações.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
