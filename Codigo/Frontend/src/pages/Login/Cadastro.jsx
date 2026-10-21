import { useState } from "react";
import logoBranca from "/images/Logo_meu_bolso_branca.png";
import styles from "./Login.module.css";
import { Link } from "react-router-dom";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    console.log({
      email,
      senha,
    });
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
              Comece a cuidar do seu primeiro dinheiro.
            </h2>
            <p className={styles["login-marketing-descricao"]}>
              Mesada, primeiro salário ou aumento: crie sua conta e veja para
              onde o seu dinheiro vai.
            </p>
          </div>

          <p className={styles["login-marketing-rodape"]}>
            As orientações do assistente de IA são educativas e não substituem
            a consultoria de um profissional financeiro.
          </p>
        </aside>

        {/* PAINEL DIREITO (FORMULÁRIO) */}
        <div className={styles["login-container"]}>
          <div className={styles["login-header"]}>
            <h1>Crie sua conta</h1>
            <p>Comece a organizar sua vida financeira</p>
          </div>

          <form className={styles["login-form"]} onSubmit={handleSubmit}>
            <div className={styles["input-group"]}>
              <label htmlFor="nome">Nome Completo</label>
              <input
                id="nome"
                type="text"
                placeholder="Como você se chama?"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

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
              <label htmlFor="telefone">Telefone</label>
              <input
                id="telefone"
                type="text"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
              <p className={styles["input-ajuda"]}>
                Usado pelo assistente do WhatsApp
              </p>
            </div>

            <div className={styles["input-group"]}>
              <label htmlFor="senha">Senha</label>
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
              <label htmlFor="confirmarSenha">Confirmar Senha</label>
              <input
                id="confirmarSenha"
                type="password"
                placeholder="Repita a senha"
                required
              />
            </div>

            <label className={styles["login-termos"]}>
              <input type="checkbox" required />
              <span>
                Li e aceito os Termos de uso e a Política de Privacidade, de
                acordo com a LGPD.
              </span>
            </label>

            <button className={styles["login-button"]} type="submit">
              Criar conta
            </button>
          </form>

          <div className={styles["login-register"]}>
            Já tem conta? <Link to="/">Entrar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cadastro;
