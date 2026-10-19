import { useState } from "react";
import logo from "/images/Logo_meu_bolso.png";
import "./Login.css";
import { Link } from "react-router-dom";

function Login() {
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
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img src={logo} alt="MeuBolso" />
        </div>

        <div className="login-header">
          <h1>Crie sua conta</h1>
          <p>Comece a organizar sua vida financeira</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="nome">Nome Completo</label>
            <input
              id="nome"
              type="text"
              placeholder="Digite seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">E-mail</label>

            <input
              id="email"
              type="email"
              placeholder="seuemail@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="telefone">Telefone</label>

            <input
              id="telefone"
              type="text"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
            />
            <p style={{ fontSize: "0.8rem", color: "gray" }}>
              Usado pelo assistente do WhatsApp
            </p>
          </div>

          <div className="input-group">
            <label htmlFor="senha">Senha</label>

            <input
              id="senha"
              type="password"
              placeholder="*********"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmarSenha">Confirmar Senha</label>
            <input
              id="confirmarSenha"
              type="password"
              placeholder="*********"
              required
            />
          </div>

          <button className="login-button" type="submit">
            Entrar
          </button>
        </form>

        <div className="login-register">
          Já possui uma conta? <Link to="/">Faça login</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
