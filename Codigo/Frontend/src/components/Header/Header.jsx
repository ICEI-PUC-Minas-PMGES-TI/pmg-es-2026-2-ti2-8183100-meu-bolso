import { Menu, Bell } from "lucide-react";
import { useLocation } from "react-router-dom";
import styles from "./Header.module.css";

const titulos = {
  "/dashboard": "Dashboard",
  "/gastos": "Gastos",
  "/carteiras": "Carteiras",
  "/metas": "Metas",
  "/perfil": "Meu perfil"
};

function Header({ abrirMenu }) {
  const location = useLocation();
  const titulo = titulos[location.pathname] || "MeuBolso";

  return (
    <header className={styles.header}>
      <div className={styles["header-esquerda"]}>
        <button
          className={styles["header-menu-button"]}
          onClick={abrirMenu}
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>

        <div className={styles["header-titulos"]}>
          <h1>{titulo}</h1>
          <p>Seu dinheiro, suas escolhas, seu futuro.</p>
        </div>
      </div>

      <div className={styles["header-direita"]}>
        <button
          className={styles["header-icone"]}
          aria-label="Notificações"
          title="Notificações em desenvolvimento"
          disabled
        >
          <Bell size={21} />
        </button>

        <div className={styles["header-usuario"]}>
          <img
            src="/images/abner.do.mal.jpg"
            alt="foto do usuário"
            className={styles["header-avatar"]}
          />

          <div className={styles["header-usuario-info"]}>
            <strong>Usuário</strong>
            <span>Minha conta</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
