
    import { Menu, Bell, UserRound } from "lucide-react";
    import { useLocation } from "react-router-dom";
    import "./Header.css";

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
        <header className="header">
        <div className="header-esquerda">
            <button
            className="header-menu-button"
            onClick={abrirMenu}
            aria-label="Abrir menu"
            >
            <Menu size={24} />
            </button>

            <div className="header-titulos">
            <h1>{titulo}</h1>
            <p>Seu dinheiro, suas escolhas, seu futuro.</p>
            </div>
        </div>

        <div className="header-direita">
            <button
            className="header-icone"
            aria-label="Notificações"
            title="Notificações em desenvolvimento"
            disabled
            >
            <Bell size={21} />
            </button>

            <div className="header-usuario">
            <div className="header-avatar">
                <UserRound size={20} />
            </div>

            <div className="header-usuario-info">
                <strong>Usuário</strong>
                <span>Minha conta</span>
            </div>
            </div>
        </div>
        </header>
    );
    }

    export default Header;
