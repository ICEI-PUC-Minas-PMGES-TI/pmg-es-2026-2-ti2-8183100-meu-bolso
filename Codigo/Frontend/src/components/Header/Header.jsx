import { NavLink, useNavigate } from "react-router-dom";
import logo from "/images/Logo_meu_bolso_clean.png";
import styles from "./Header.module.css";

// Itens de navegação do topo.
// Apenas "Visão geral" (/dashboard) existe hoje; os demais ficam como
// itens visuais ate as paginas serem criadas.
const navItems = [
  { nome: "Visão geral", caminho: "/dashboard" },
  { nome: "Gastos", caminho: "/gastos", futuro: true },
  { nome: "Planejamento", caminho: "/planejamento", futuro: true },
  { nome: "Metas", caminho: "/metas", futuro: true },
  { nome: "Simulador", caminho: "/simulador", futuro: true },
  { nome: "Assistente IA", caminho: "/assistente", futuro: true },
  { nome: "Aprender", caminho: "/aprender", futuro: true },
];

function Header() {
  const navigate = useNavigate();

  function handleSair() {
    // Logout temporário, até existir autenticação no backend
    navigate("/");
  }

  return (
    <header className={styles.header}>
      {/* Esquerda: marca (pílula) */}
      <div className={styles.marca}>
        <span className={styles.logoCirculo}>
          <img src={logo} alt="" className={styles.logo} />
        </span>
        <span className={styles.marcaTexto}>Meu Bolso</span>
      </div>

      {/* Centro: navegação (pílula) */}
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
          )
        )}
      </nav>

      {/* Direita: usuário */}
      <div className={styles.usuario}>
        <img
          src="/images/abner.do.mal.jpg"
          alt="Foto do usuário"
          className={styles.avatar}
        />
        <div className={styles.usuarioInfo}>
          <strong>Daniel Tsuruga</strong>
          <button className={styles.sair} type="button" onClick={handleSair}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
