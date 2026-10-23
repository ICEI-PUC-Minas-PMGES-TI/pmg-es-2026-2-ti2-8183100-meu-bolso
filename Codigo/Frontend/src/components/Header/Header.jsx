import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, UserPen, LogOut } from "lucide-react";
import logo from "/images/Logo_meu_bolso_clean.png";
import styles from "./Header.module.css";
import { obterUsuario, sair } from "../../service/Api";

// Itens de navegação do topo.
// Apenas "Visão geral" (/dashboard) existe hoje; os demais ficam como
// itens visuais ate as paginas serem criadas.
const navItems = [
  { nome: "Visão geral", caminho: "/dashboard" },
  { nome: "Evolução", caminho: "/evolucao-financeira" },
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

  // Dados do usuário que fez login (guardados em Api.js)
  const usuario = obterUsuario();
  const nomeExibido = usuario?.nome || usuario?.email || "Usuário";
  const avatarUrl = usuario?.avatar || "/images/default-avatar.png";

  // Controle do menu suspenso do perfil.
  const [menuAberto, setMenuAberto] = useState(false);
  const perfilRef = useRef(null);

  // Fecha o menu ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!menuAberto) return;

    function aoClicarFora(e) {
      if (perfilRef.current && !perfilRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    }
    function aoTeclar(e) {
      if (e.key === "Escape") setMenuAberto(false);
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [menuAberto]);

  function handleSair() {
    sair(); // apaga o token e os dados do usuário
    navigate("/");
  }

  function handleEditarPerfil() {
    setMenuAberto(false);
    navigate("/perfil");
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
          ),
        )}
      </nav>

      {/* Direita: usuário (pílula que abre um menu) */}
      <div className={styles.usuario} ref={perfilRef}>
        <button
          type="button"
          className={styles.usuarioBotao}
          onClick={() => setMenuAberto((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuAberto}
          aria-label="Abrir menu do perfil"
        >
          <img src={avatarUrl} alt="" className={styles.avatar} />
          <span className={styles.usuarioNome}>{nomeExibido}</span>
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${menuAberto ? styles.chevronAberto : ""}`}
            aria-hidden="true"
          />
        </button>

        {menuAberto && (
          <div className={styles.menu} role="menu">
            {/* Cabeçalho do menu: avatar + nome */}
            <div className={styles.menuTopo}>
              <img src={avatarUrl} alt="" className={styles.menuAvatar} />
              <strong className={styles.menuNome}>{nomeExibido}</strong>
              {usuario?.email ? (
                <span className={styles.menuEmail}>{usuario.email}</span>
              ) : null}
            </div>

            <div className={styles.menuSeparador} />

            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={handleEditarPerfil}
            >
              <UserPen size={18} aria-hidden="true" />
              Editar perfil
            </button>

            <button
              type="button"
              className={`${styles.menuItem} ${styles.menuItemPerigo}`}
              role="menuitem"
              onClick={handleSair}
            >
              <LogOut size={18} aria-hidden="true" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
