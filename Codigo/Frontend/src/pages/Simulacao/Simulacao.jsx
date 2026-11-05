import { useState } from "react";

import styles from "./Simulacao.module.css";
import { CATEGORIAS, validar } from "./calculoSimulacao";
import { useDadosSimulacao } from "./useDadosSimulacao";
import FormularioCompra from "./FormularioCompra";
import EstadoCard from "./EstadoCard";

// ============================================================
// SIMULAÇÃO (RF-08 — Planejamento / Simulação)
// ------------------------------------------------------------
// Simula o impacto de uma compra (à vista ou parcelada) no saldo
// e nas metas do usuário. O cálculo é feito em memória a partir
// do saldo das carteiras e das metas atuais — nada é persistido.
// ============================================================

const FORM_INICIAL = {
  valor: "",
  categoria: CATEGORIAS[0],
  forma: "avista", // "avista" | "parcelado"
  parcelas: 2,
  carteiraId: "",
};

function Simulacao() {
  const { carteiras, carregando, erro } = useDadosSimulacao();

  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});

  // Carteira efetiva: a escolhida ou a primeira da lista (sem efeito).
  const carteiraId = form.carteiraId || carteiras[0]?.id || "";

  function aoAlterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function aoCalcular(e) {
    e.preventDefault();
    setErros(validar(form));
  }

  return (
    <div className={styles.simulacao}>
      <div className={styles.cabecalho}>
        <h1>Simulador de compras</h1>
        <p className="texto-secundario">
          Entenda o impacto de uma compra antes de decidir.
        </p>
      </div>

      {carregando || erro ? (
        <EstadoCard erro={erro} />
      ) : (
        <div className={`grid grid-2 ${styles.conteudo}`}>
          <FormularioCompra
            form={{ ...form, carteiraId }}
            erros={erros}
            carteiras={carteiras}
            aoAlterar={aoAlterar}
            aoCalcular={aoCalcular}
          />
        </div>
      )}
    </div>
  );
}

export default Simulacao;
