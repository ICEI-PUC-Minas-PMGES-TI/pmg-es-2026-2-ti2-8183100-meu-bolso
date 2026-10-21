import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";

import styles from "./Layout.module.css";

function Layout() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className={styles["app-layout"]}>
      <Sidebar
        aberta={menuAberto}
        fechar={() => setMenuAberto(false)}
      />

      <div className={styles["app-conteudo"]}>
        <Header abrirMenu={() => setMenuAberto(true)} />

        <main className={styles["app-main"]}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
