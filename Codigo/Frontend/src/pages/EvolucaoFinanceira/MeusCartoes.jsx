import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import styles from "./MeusCartoes.module.css";
import { obterCarteiras } from "../../service/Api";
import { posicaoEfetiva, ORDEM_POSICAO } from "../../data/posicaoContas";
import CartaoVisual from "../../components/CartaoVisual/CartaoVisual";

// ============================================================
// MEUS CARTÕES (bloco lateral do Dashboard)
// ------------------------------------------------------------
// Mostra, em pilha, só os cartões classificados (principal,
// secundaria, terciaria) — o mesmo critério da página Carteiras.
// Reusa o CartaoVisual, então o visual é idêntico ao de Carteiras.
// O principal fica na frente e inteiro; os de trás surgem 40px do
// topo cada.
// ============================================================

function MeusCartoes() {
  const [cartoes, setCartoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await obterCarteiras();
        if (ativo) setCartoes(dados?.cartoes ?? []);
      } catch {
        if (ativo) setErro(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Só os classificados, na ordem principal → secundaria → terciaria.
  const efetivos = posicaoEfetiva(cartoes);
  const destaque = ORDEM_POSICAO.map((p) =>
    efetivos.find((c) => c.posicao === p),
  ).filter(Boolean);

  return (
    <section
      className={`card ${styles.bloco}`}
      aria-labelledby="meus-cartoes-titulo"
    >
      <div className={styles.cabecalho}>
        <h3 id="meus-cartoes-titulo">Meus cartões</h3>
        <Link to="/carteiras" className={styles.verTodos}>
          Ver todos <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {carregando ? (
        <div className={styles.estado}>
          <p className="texto-secundario">Carregando cartões...</p>
        </div>
      ) : erro ? (
        <div className={styles.estado} role="alert">
          <p className="texto-secundario">Não foi possível carregar os cartões.</p>
        </div>
      ) : destaque.length === 0 ? (
        <div className={styles.estado}>
          <p className="texto-secundario">Nenhum cartão em destaque.</p>
          <Link to="/carteiras" className={styles.verTodos}>
            Ir para Carteiras <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className={styles.centro}>
          <div className={styles.pilha}>
            {destaque.map((cartao, i) => (
              <div
                key={cartao.id}
                className={styles.camada}
                style={{ marginTop: `${i * 40}px`, zIndex: i + 1 }}
              >
                <CartaoVisual cartao={cartao} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default MeusCartoes;
