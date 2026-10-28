import { useState, useEffect, useMemo } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";

import styles from "./EvolucaoFinanceira.module.css";
import gastosService from "../../service/gastosService";
import {
  ALTURA_GRAFICO,
  agruparPorMes,
  calcularAcumulado,
  movimentacoesDasCarteiras,
} from "./dados";
import GraficoEvolucao from "./GraficoEvolucao";
import GraficoBarras from "./GraficoBarras";
import SeletorGrafico from "./SeletorGrafico";

// ============================================================
// EVOLUÇÃO FINANCEIRA (RF-06)
// ------------------------------------------------------------
// Busca as transações reais do usuário (gastosService), agrupa
// por mês e deriva as duas séries dos gráficos. A evolução é
// calculada em tempo de consulta — não é armazenada.
//
// Um seletor alterna entre dois gráficos: linha com o saldo
// acumulado e barras com gastos/guardado por mês.
// ============================================================

function EvolucaoFinanceira() {
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Gráfico em exibição: "acumulado" (linha) ou "mensal" (barras).
  const [graficoAtivo, setGraficoAtivo] = useState("acumulado");

  // Busca as transações do usuário ao montar a página.
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        // Saídas: gastos do usuário. Entradas (e saídas): movimentações
        // das carteiras. As duas fontes são combinadas numa só lista.
        const { gastos } = await gastosService.carregarTudo();
        const movimentacoes = movimentacoesDasCarteiras();

        if (ativo) setTransacoes([...(gastos ?? []), ...movimentacoes]);
      } catch (e) {
        if (ativo) {
          setErro(
            e?.message ?? "Não foi possível carregar a evolução financeira.",
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  // Agrega as transações por mês e deriva a série acumulada.
  const dadosMensais = useMemo(
    () => agruparPorMes(transacoes),
    [transacoes],
  );
  const dadosAcumulado = useMemo(
    () => calcularAcumulado(dadosMensais),
    [dadosMensais],
  );

  const temDados = dadosMensais.length > 0;

  const seletor = (
    <SeletorGrafico ativo={graficoAtivo} aoMudar={setGraficoAtivo} />
  );

  function renderConteudo() {
    if (carregando) {
      return (
        <div className={`card ${styles.estado}`}>
          <p className="texto-secundario">Carregando sua evolução...</p>
        </div>
      );
    }

    if (erro) {
      return (
        <div className={`card ${styles.estado}`}>
          <AlertCircle size={32} className={styles.estadoIconeErro} aria-hidden="true" />
          <p className={styles.estadoTitulo}>Não foi possível carregar</p>
          <p className="texto-secundario">{erro}</p>
        </div>
      );
    }

    if (!temDados) {
      return (
        <div className={`card ${styles.estado}`}>
          <TrendingUp size={32} className={styles.estadoIcone} aria-hidden="true" />
          <p className={styles.estadoTitulo}>Ainda não há transações</p>
          <p className="texto-secundario">
            Registre seus gastos para ver a evolução do seu dinheiro ao longo
            dos meses.
          </p>
        </div>
      );
    }

    // key força a remontagem ao trocar de gráfico, reexecutando as animações
    return graficoAtivo === "acumulado" ? (
      <GraficoEvolucao
        key="acumulado"
        dados={dadosAcumulado}
        subtitulo={`Saldo acumulado nos últimos ${dadosMensais.length} meses`}
        altura={ALTURA_GRAFICO}
        acoes={seletor}
      />
    ) : (
      <GraficoBarras
        key="mensal"
        dados={dadosMensais}
        altura={ALTURA_GRAFICO}
        acoes={seletor}
      />
    );
  }

  return (
    <div className={styles.evolucao}>
      <div className={styles.cabecalho}>
        <h1>Evolução financeira</h1>
        <p className="texto-secundario">
          Acompanhe o crescimento do seu dinheiro ao longo dos meses.
        </p>
      </div>

      {renderConteudo()}
    </div>
  );
}

export default EvolucaoFinanceira;
