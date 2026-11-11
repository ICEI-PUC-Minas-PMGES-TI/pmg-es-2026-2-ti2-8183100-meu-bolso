import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, UserPen, LogOut, Menu, X } from "lucide-react";
import logo from "/images/Logo_meu_bolso_clean.png";
import styles from "./Header.module.css";
import { obterUsuario, sair } from "../../service/Api";
import ModalPerfil from "../ModalPerfil/ModalPerfil";
import AvatarUsuario from "../AvatarUsuario/AvatarUsuario";

// Itens de navegação do topo.
// Apenas "Visão geral" (/dashboard) existe hoje; os demais ficam como
// itens visuais ate as paginas serem criadas.
const navItems = [
  { nome: "Visão geral", caminho: "/dashboard" },
  { nome: "Evolução", caminho: "/evolucao-financeira" },
  { nome: "Gastos", caminho: "/gastos" },
  { nome: "Receitas", caminho: "/receitas" },
  { nome: "Carteiras", caminho: "/carteiras" },
  { nome: "Metas", caminho: "/metas" },
  { nome: "Simulador", caminho: "/simulador" },
  { nome: "Assistente IA", caminho: "/assistente" },
  { nome: "WhatsApp", caminho: "/whatsapp" },
];

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // Dados do usuário logado. Mantidos em estado para refletir edições de
  // perfil na hora (o Header lê do localStorage, que muda ao salvar).
  const [usuario, setUsuario] = useState(() => obterUsuario());
  const nomeExibido = usuario?.nome || usuario?.email || "Usuário";

  // Controle do menu suspenso do perfil.
  // `menuAberto` monta o menu; `menuFechando` roda a animação de saída
  // antes de desmontar, para abrir e fechar de forma suave.
  const [menuAberto, setMenuAberto] = useState(false);
  const [menuFechando, setMenuFechando] = useState(false);
  const perfilRef = useRef(null);

  // Fecha o menu com animação: marca como "fechando", espera a transição
  // e só então desmonta.
  function fecharMenu() {
    setMenuFechando(true);
    window.setTimeout(() => {
      setMenuAberto(false);
      setMenuFechando(false);
    }, 150);
  }

  function alternarMenu() {
    if (menuAberto) {
      fecharMenu();
    } else {
      setMenuAberto(true);
    }
  }

  // Controle do menu de navegação (dropdown no mobile).
  const [navAberta, setNavAberta] = useState(false);
  const navRef = useRef(null);

  // Controle do modal de editar perfil.
  const [perfilAberto, setPerfilAberto] = useState(false);

  // Fecha o menu do perfil ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!menuAberto) return;

    function aoClicarFora(e) {
      if (perfilRef.current && !perfilRef.current.contains(e.target)) {
        fecharMenu();
      }
    }
    function aoTeclar(e) {
      if (e.key === "Escape") fecharMenu();
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [menuAberto]);

  // Fecha o menu de navegação (mobile) ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!navAberta) return;

    function aoClicarFora(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setNavAberta(false);
      }
    }
    function aoTeclar(e) {
      if (e.key === "Escape") setNavAberta(false);
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [navAberta]);

  // Ao trocar de rota, garante que o menu de navegação feche.
  useEffect(() => {
    setNavAberta(false);
  }, [location.pathname]);

  function handleSair() {
    sair(); // apaga o token e os dados do usuário
    navigate("/");
  }

  function handleEditarPerfil() {
    setMenuAberto(false);
    setMenuFechando(false);
    setPerfilAberto(true);
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

      {/* Centro: navegação. Em telas largas é uma pílula com os links;
          no mobile vira um botão que abre um dropdown com os mesmos links. */}
      <div className={styles.navArea} ref={navRef}>
        <button
          type="button"
          className={styles.navToggle}
          onClick={() => setNavAberta((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={navAberta}
          aria-label={navAberta ? "Fechar navegação" : "Abrir navegação"}
        >
          {navAberta ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Menu size={20} aria-hidden="true" />
          )}
          <span className={styles.navToggleTexto}>Menu</span>
        </button>

        <nav
          className={`${styles.nav} ${navAberta ? styles.navAberta : ""}`}
          aria-label="Navegação principal"
        >
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
                onClick={() => setNavAberta(false)}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkAtivo : ""}`
                }
              >
                {item.nome}
              </NavLink>
            ),
          )}
        </nav>
      </div>

      {/* Direita: usuário (pílula que abre um menu) */}
      <div className={styles.usuario} ref={perfilRef}>
        <button
          type="button"
          className={styles.usuarioBotao}
          onClick={alternarMenu}
          aria-haspopup="menu"
          aria-expanded={menuAberto}
          aria-label="Abrir menu do perfil"
        >
          <AvatarUsuario
            foto={usuario?.foto}
            nome={nomeExibido}
            tamanho={40}
            className={styles.avatar}
          />
          <span className={styles.usuarioNome}>{nomeExibido}</span>
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${menuAberto ? styles.chevronAberto : ""}`}
            aria-hidden="true"
          />
        </button>

        {menuAberto && (
          <div
            className={`${styles.menu} ${menuFechando ? styles.menuFechando : ""}`}
            role="menu"
          >
            {/* Cabeçalho do menu: avatar + nome */}
            <div className={styles.menuTopo}>
              <AvatarUsuario
                foto={usuario?.foto}
                nome={nomeExibido}
                tamanho={64}
                className={styles.menuAvatar}
              />
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

      {/* Modal de edição de perfil (sobrepõe a tela atual) */}
      <ModalPerfil
        aberto={perfilAberto}
        onFechar={() => setPerfilAberto(false)}
        onAtualizado={() => setUsuario(obterUsuario())}
      />
    </header>
  );
}

export default Header;
