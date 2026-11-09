import { useMemo, useState } from "react";

import styles from "./Simulacao.module.css";
import { CATEGORIAS, converterValor, validar, simular } from "./calculoSimulacao";
import { useDadosSimulacao } from "./useDadosSimulacao";
import FormularioCompra from "./FormularioCompra";
import ComparacaoCenario from "./ComparacaoCenario";
import ImpactoMetas from "./ImpactoMetas";
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
  juros: "", // % ao mês; vazio = sem juros
  carteiraId: "",
};

function Simulacao() {
  const { carteiras, metas, carregando, erro } = useDadosSimulacao();

  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});
  const [resultado, setResultado] = useState(null);

  // Carteira efetiva: a escolhida ou a primeira da lista (sem efeito).
  const carteiraId = form.carteiraId || carteiras[0]?.id || "";
  const saldoAtual = useMemo(
    () => carteiras.find((c) => c.id === carteiraId)?.saldo ?? 0,
    [carteiras, carteiraId],
  );

  // Altera um campo e invalida o resultado anterior (evita cenário velho).
  function aoAlterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setResultado(null);
  }

  function aoCalcular(e) {
    e.preventDefault();

    const errosValidacao = validar(form);
    setErros(errosValidacao);
    if (Object.keys(errosValidacao).length > 0) {
      setResultado(null);
      return;
    }

    // A simulação é só um cálculo em memória — não grava nada.
    setResultado(
      simular({
        valor: converterValor(form.valor),
        forma: form.forma,
        parcelas: Number(form.parcelas),
        juros: form.juros,
        saldoAtual,
        metas,
      }),
    );
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

          <div className={styles.resultado}>
            <ComparacaoCenario saldoAtual={saldoAtual} resultado={resultado} />
            <ImpactoMetas resultado={resultado} temMetas={metas.length > 0} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Simulacao;
