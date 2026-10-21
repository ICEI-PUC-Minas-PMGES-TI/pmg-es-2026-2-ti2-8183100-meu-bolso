import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  UserRound,
  LogOut,
  X
} from "lucide-react";
import logo from "/images/Logo_meu_bolso.png";
import styles from "./Sidebar.module.css";

const menuItems = [
  { nome: "Dashboard", caminho: "/dashboard", icone: LayoutDashboard },
  { nome: "Gastos", caminho: "/gastos", icone: Receipt },
  { nome: "Carteiras", caminho: "/carteiras", icone: Wallet },
  { nome: "Metas", caminho: "/metas", icone: Target },
  { nome: "Perfil", caminho: "/perfil", icone: UserRound }
];

function Sidebar({ aberta, fechar }) {
  const navigate = useNavigate();

  function handleSair() {
    // Logout temporário, até existir autenticação no backend
    fechar();
    navigate("/");
  }

  return (
    <>
      {aberta && (
        <div
          className={styles["sidebar-overlay"]}
          onClick={fechar}
        />
      )}

      <aside
        className={`${styles.sidebar} ${aberta ? styles["sidebar-aberta"] : ""}`}
      >
        <div className={styles["sidebar-topo"]}>
          <div className={styles["sidebar-marca"]}>
            <img src={logo} alt="MeuBolso" />
          </div>

          <button
            className={styles["sidebar-fechar"]}
            onClick={fechar}
            aria-label="Fechar menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className={styles["sidebar-menu"]} aria-label="Menu principal">
          {menuItems.map((item) => {
            const Icone = item.icone;

            return (
              <NavLink
                key={item.caminho}
                to={item.caminho}
                onClick={fechar}
                className={({ isActive }) =>
                  `${styles["sidebar-link"]} ${
                    isActive ? styles["sidebar-link-ativo"] : ""
                  }`
                }
              >
                <Icone size={20} />
                <span>{item.nome}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className={styles["sidebar-rodape"]}>
          <button className={styles["sidebar-sair"]} onClick={handleSair}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
