import { useState, useEffect, useMemo } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";

import styles from "./EvolucaoFinanceira.module.css";
import gastosService from "../../service/gastosService";
import receitasService from "../../service/receitasService";
import { listarMetas, obterMovimentacoes } from "../../service/Api";
import {
  ALTURA_GRAFICO,
  agruparPorMes,
  calcularAcumulado,
  agruparInvestimentosPorMes,
  calcularAcumuladoInvestido,
  extrairAportesInvestimento,
  paraTransacoes,
} from "./dados";
import GraficoEvolucao from "./GraficoEvolucao";
import GraficoBarras from "./GraficoBarras";
import GraficoInvestimento from "./GraficoInvestimento";
import SeletorGrafico from "./SeletorGrafico";

// ============================================================
// EVOLUÇÃO FINANCEIRA (RF-06)
// ------------------------------------------------------------
// Busca as transações reais do usuário (gastos e receitas), agrupa
// por mês e deriva as séries dos gráficos. A evolução é calculada
// em tempo de consulta — não é armazenada.
//
// O seletor alterna entre três gráficos: saldo acumulado (linha),
// gastos x renda (barras lado a lado) e investimentos (linha do
// total investido).
//
// É exibida como seção da Visão geral (Dashboard), por isso o
// título é um <h2> dentro de uma <section>.
// ============================================================

function EvolucaoFinanceira() {
  const [transacoes, setTransacoes] = useState([]);
  const [aportes, setAportes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Gráfico em exibição: "mensal" (barras, padrão) ou "acumulado" (linha).
  const [graficoAtivo, setGraficoAtivo] = useState("mensal");

  // Carrega tudo ao montar a página, com o mínimo de requisições:
  //  - gastos (gastosService) e receitas (receitasService): gastos/renda
  //  - metas + histórico unificado (1 requisição cada): aportes de
  //    investimento, filtrados pelas metas cujo nome indica investimento.
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const [{ gastos }, { receitas }, metas, movimentacoes] =
          await Promise.all([
            gastosService.carregarTudo(),
            receitasService.carregarTudo(),
            listarMetas(),
            obterMovimentacoes(),
          ]);

        if (!ativo) return;
        setTransacoes(paraTransacoes(gastos, receitas));
        setAportes(extrairAportesInvestimento(metas, movimentacoes));
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

  // Agrega as transações por mês e deriva as séries dos gráficos.
  const dadosMensais = useMemo(
    () => agruparPorMes(transacoes),
    [transacoes],
  );
  const dadosAcumulado = useMemo(
    () => calcularAcumulado(dadosMensais),
    [dadosMensais],
  );
  const dadosInvestido = useMemo(
    () => calcularAcumuladoInvestido(agruparInvestimentosPorMes(aportes)),
    [aportes],
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

    // A aba de investimentos é independente das transações (gastos/renda):
    // tem sua própria fonte e seu próprio estado vazio no componente.
    if (graficoAtivo === "investimento") {
      return (
        <GraficoInvestimento
          key="investimento"
          dados={dadosInvestido}
          altura={ALTURA_GRAFICO}
          acoes={seletor}
        />
      );
    }

    if (!temDados) {
      return (
        <div className={`card ${styles.estado}`}>
          <TrendingUp size={32} className={styles.estadoIcone} aria-hidden="true" />
          <p className={styles.estadoTitulo}>Ainda não há transações</p>
          <p className="texto-secundario">
            Registre seus gastos e receitas para ver a evolução do seu
            dinheiro ao longo dos meses.
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
    <section className={styles.evolucao} aria-labelledby="evolucao-titulo">
      <div className={styles.cabecalho}>
        <h2 id="evolucao-titulo">Evolução financeira</h2>
        <p className="texto-secundario">
          Acompanhe o crescimento do seu dinheiro ao longo dos meses.
        </p>
      </div>

      {renderConteudo()}
    </section>
  );
}

export default EvolucaoFinanceira;
