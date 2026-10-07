    import { useState } from "react";
    import logo from "../../assets/images/Logo_meu_bolso.png";
    import "./Login.css";

    function Login() {
    const [email, setEmail] = useState("");
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
            <h1>Bem-vindo</h1>
            <p>Seu dinheiro, suas escolhas, seu futuro</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>

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
                <label htmlFor="senha">Senha</label>

                <input
                id="senha"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                />
            </div>

            <div className="login-options">
                <a href="#" className="esqueceu-senha">
                Esqueceu sua senha?
                </a>
            </div>

            <button className="login-button" type="submit">
                Entrar
            </button>

            </form>

            <div className="login-register">
            Ainda não possui uma conta?{" "}
            <a href="/cadastro">Cadastre-se</a>
            </div>

        </div>

        </div>
    );
    }

    export default Login;