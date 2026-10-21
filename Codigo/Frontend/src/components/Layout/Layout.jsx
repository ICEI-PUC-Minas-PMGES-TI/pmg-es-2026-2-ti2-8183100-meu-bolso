import { Outlet } from "react-router-dom";

import Header from "../Header/Header";

import styles from "./Layout.module.css";

function Layout() {
  return (
    <div className={styles["app-layout"]}>
      <Header />

      <main className={styles["app-main"]}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
