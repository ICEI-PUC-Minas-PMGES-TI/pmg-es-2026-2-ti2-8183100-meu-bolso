import { NavLink, useNavigate } from "react-router-dom";
import logo from "/images/Logo_meu_bolso_clean.png";
import styles from "./Header.module.css";
import { obterUsuario, sair } from "../../service/Api";

const navItems = [
  { nome: "Visão geral", caminho: "/dashboard" },
  { nome: "Gastos", caminho: "/gastos" },
  { nome: "Planejamento", caminho: "/planejamento", futuro: true },
  { nome: "Carteiras", caminho: "/carteiras" },
  { nome: "Metas", caminho: "/metas" },
  { nome: "Simulador", caminho: "/simulador", futuro: true },
  { nome: "Assistente IA", caminho: "/assistente", futuro: true },
  { nome: "Aprender", caminho: "/aprender", futuro: true },
];

function Header() {
  const navigate = useNavigate();

  // Obtém os dados dinâmicos do usuário logado no localStorage
  const usuario = obterUsuario();

  function handleSair() {
    sair(); // remove token e dados do usuário
    navigate("/");
  }

  return (
    <header className={styles.header}>
      {/* Esquerda: marca */}
      <div className={styles.marca}>
        <span className={styles.logoCirculo}>
          <img src={logo} alt="Logo Meu Bolso" className={styles.logo} />
        </span>
        <span className={styles.marcaTexto}>Meu Bolso</span>
      </div>

      {/* Centro: navegação */}
      <nav className={styles.nav} aria-label="Navegação principal">
        {navItems.map((item) =>
          item.futuro ? (
            <span
              key={item.nome}
              className={`${styles.navLink} ${styles.navLinkFuturo}`}
              aria-disabled="true"
              title="Em breve"
            >
              {item.nome}
            </span>
          ) : (
            <NavLink
              key={item.nome}
              to={item.caminho}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkAtivo : ""}`
              }
            >
              {item.nome}
            </NavLink>
          ),
        )}
      </nav>

      {/* Direita: dados do usuário logado */}
      <div className={styles.usuario}>
        <img
          src={usuario?.avatar || "/images/default-avatar.png"}
          alt="Foto do usuário"
          className={styles.avatar}
        />
        <div className={styles.usuarioInfo}>
          <strong>{usuario?.nome || usuario?.email || "Usuário"}</strong>
          <button className={styles.sair} type="button" onClick={handleSair}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
