import styles from "./Dashboard.module.css";

function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.saudacao}>
        <h1>Bom dia, Daniel</h1>
        <p className="texto-secundario">
          Veja para onde seu dinheiro foi e o que ainda dá para fazer neste mês.
        </p>
      </div>

      <section className={`card ${styles.placeholder}`}>
        <h2>Bem-vindo ao MeuBolso!</h2>
        <p className="texto-secundario">
          Seu Dashboard está em desenvolvimento.
        </p>
      </section>
    </div>
  );
}

export default Dashboard;
