import { Outlet, useLocation } from "react-router-dom";

import Header from "../Header/Header";

import styles from "./Layout.module.css";

function Layout() {
  // O Dashboard usa uma largura máxima um pouco maior que as demais páginas.
  const { pathname } = useLocation();
  const main = pathname.startsWith("/dashboard")
    ? `${styles["app-main"]} ${styles["app-main-largo"]}`
    : styles["app-main"];

  return (
    <div className={styles["app-layout"]}>
      <Header />

      <main className={main}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
