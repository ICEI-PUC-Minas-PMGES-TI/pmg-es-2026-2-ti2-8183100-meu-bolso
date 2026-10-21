import { Plus, Wallet, Landmark, PiggyBank, CreditCard } from "lucide-react";
import styles from "./Carteiras.module.css";

// Dados estáticos de exemplo (layout apenas; sem lógica real ainda)
const carteiras = [
  {
    id: 1,
    nome: "Conta corrente",
    tipo: "Banco",
    saldo: "R$ 1.240,00",
    icone: Landmark,
  },
  {
    id: 2,
    nome: "Dinheiro",
    tipo: "Espécie",
    saldo: "R$ 180,00",
    icone: Wallet,
  },
  {
    id: 3,
    nome: "Poupança",
    tipo: "Reserva",
    saldo: "R$ 900,00",
    icone: PiggyBank,
  },
  {
    id: 4,
    nome: "Cartão de crédito",
    tipo: "Fatura",
    saldo: "- R$ 320,00",
    icone: CreditCard,
    negativo: true,
  },
];

function Carteiras() {
  return (
    <div className={styles.carteiras}>
      {/* Cabeçalho */}
      <div className={styles.topo}>
        <div>
          <h1>Carteiras</h1>
          <p className="texto-secundario">
            Acompanhe o saldo de cada conta e organize onde seu dinheiro está.
          </p>
        </div>

        <button className={styles.botaoNova} type="button">
          <Plus size={18} />
          Nova carteira
        </button>
      </div>

      {/* Saldo consolidado */}
      <section className={`card ${styles.cardSaldo}`}>
        <span className={styles.rotulo}>Saldo total</span>
        <strong className={styles.saldoTotal}>R$ 2.000,00</strong>
        <span className="texto-secundario">Somando todas as carteiras</span>
      </section>

      {/* Lista de carteiras */}
      <div className={styles.grade}>
        {carteiras.map((carteira) => {
          const Icone = carteira.icone;

          return (
            <section
              key={carteira.id}
              className={`card card-interativo ${styles.cardCarteira}`}
            >
              <div className={styles.cartTopo}>
                <span className={styles.iconeCircle}>
                  <Icone size={20} />
                </span>
                <span className={styles.tipo}>{carteira.tipo}</span>
              </div>

              <h3 className={styles.nome}>{carteira.nome}</h3>

              <strong
                className={`${styles.saldo} ${
                  carteira.negativo ? styles.saldoNegativo : ""
                }`}
              >
                {carteira.saldo}
              </strong>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default Carteiras;
