import { useState, useMemo } from "react";

import styles from "./EvolucaoFinanceira.module.css";
import { DADOS_MENSAIS, ALTURA_GRAFICO, calcularAcumulado } from "./dados";
import GraficoEvolucao from "./GraficoEvolucao";
import GraficoBarras from "./GraficoBarras";
import SeletorGrafico from "./SeletorGrafico";

// ============================================================
// EVOLUÇÃO FINANCEIRA
// ------------------------------------------------------------
// Página que mostra o dinheiro ao longo dos meses. Um seletor
// alterna entre dois gráficos (ambos derivados da mesma fonte
// de dados): linha com o total guardado acumulado e barras com
// gastos e guardado por mês.
// ============================================================

function EvolucaoFinanceira() {
  const dadosMensais = DADOS_MENSAIS;

  // Série acumulada do que foi guardado (para o gráfico de linha).
  const dadosAcumulado = useMemo(
    () => calcularAcumulado(dadosMensais),
    [dadosMensais],
  );

  // Gráfico em exibição: "acumulado" (linha) ou "mensal" (barras).
  const [graficoAtivo, setGraficoAtivo] = useState("acumulado");

  const seletor = (
    <SeletorGrafico ativo={graficoAtivo} aoMudar={setGraficoAtivo} />
  );

  return (
    <div className={styles.evolucao}>
      <div className={styles.cabecalho}>
        <h1>Evolução financeira</h1>
        <p className="texto-secundario">
          Acompanhe o crescimento do seu dinheiro ao longo dos meses.
        </p>
      </div>

      {graficoAtivo === "acumulado" ? (
        <GraficoEvolucao
          dados={dadosAcumulado}
          subtitulo={`Dinheiro acumulado nos últimos ${dadosMensais.length} meses`}
          altura={ALTURA_GRAFICO}
          acoes={seletor}
        />
      ) : (
        <GraficoBarras
          dados={dadosMensais}
          altura={ALTURA_GRAFICO}
          acoes={seletor}
        />
      )}
    </div>
  );
}

export default EvolucaoFinanceira;
