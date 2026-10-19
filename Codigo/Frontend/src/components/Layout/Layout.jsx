
    import { useState } from "react";
    import { Outlet } from "react-router-dom";

    import Sidebar from "../Sidebar/Sidebar";
    import Header from "../Header/Header";

    import "./Layout.css";

    function Layout() {
    const [menuAberto, setMenuAberto] = useState(false);

    return (
        <div className="app-layout">
        <Sidebar
            aberta={menuAberto}
            fechar={() => setMenuAberto(false)}
        />

        <div className="app-conteudo">
            <Header abrirMenu={() => setMenuAberto(true)} />

            <main className="app-main">
            <Outlet />
            </main>
        </div>
        </div>
    );
    }

    export default Layout;
