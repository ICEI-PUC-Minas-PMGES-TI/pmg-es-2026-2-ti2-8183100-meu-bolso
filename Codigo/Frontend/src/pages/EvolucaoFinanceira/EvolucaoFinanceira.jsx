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
  PREVISAO_PADRAO,
} from "./dados";
import GraficoEvolucao from "./GraficoEvolucao";
import GraficoBarras from "./GraficoBarras";
import GraficoInvestimento from "./GraficoInvestimento";
import SeletorGrafico from "./SeletorGrafico";
import SeletorPrevisao from "./SeletorPrevisao";
import CardsResumo from "./CardsResumo";
import { mesAtualChave, mudarMes } from "../../utils/Gastosutils";

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

function EvolucaoFinanceira({ mostrarResumo = false }) {
  const [transacoes, setTransacoes] = useState([]);
  const [aportes, setAportes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Gráfico em exibição: "mensal" (barras, padrão) ou "acumulado" (linha).
  const [graficoAtivo, setGraficoAtivo] = useState("mensal");

  // Horizonte da prospecção: 3, 6 ou 12 meses à frente.
  const [mesesPrevisao, setMesesPrevisao] = useState(PREVISAO_PADRAO);

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

  // Agrega as transações por mês (realizado x previsto, até o horizonte
  // escolhido no filtro) e deriva as séries dos gráficos.
  const dadosMensais = useMemo(
    () => agruparPorMes(transacoes, { mesesPrevisao }),
    [transacoes, mesesPrevisao],
  );
  const dadosAcumulado = useMemo(
    () => calcularAcumulado(dadosMensais),
    [dadosMensais],
  );
  // Aportes de investimento agrupados por mês (cada item tem a chave
  // "AAAA-MM"); base tanto do gráfico quanto da variação do card Guardado.
  const investimentosMensais = useMemo(
    () => agruparInvestimentosPorMes(aportes),
    [aportes],
  );
  const dadosInvestido = useMemo(
    () => calcularAcumuladoInvestido(investimentosMensais),
    [investimentosMensais],
  );

  // Totais dos cards de resumo (só o realizado, sem previsto/futuro) e os
  // valores do fim do mês anterior, para a variação percentual. O mês
  // anterior é identificado pela chave "AAAA-MM" (mudarMes), nunca por
  // posição no array, para não depender do filtro de previsão.
  //  - saldoAtual: saldo realizado acumulado até o mês;
  //  - guardado:   total investido acumulado até o mês;
  //  - receitasMes/gastosMes: realizado do próprio mês.
  const resumo = useMemo(() => {
    const mesAtual = mesAtualChave();
    const mesAnterior = mudarMes(mesAtual, -1);

    // Saldo realizado acumulado até o fim de um mês (inclusive).
    const saldoAteMes = (chaveLimite) =>
      dadosMensais
        .filter((d) => d.chave <= chaveLimite)
        .reduce((soma, d) => soma + d.rendaRealizada - d.gastosRealizados, 0);

    // Total investido acumulado até o fim de um mês (inclusive), a partir
    // dos aportes agrupados (cada um com sua chave de mês).
    const investidoAteMes = (chaveLimite) =>
      investimentosMensais
        .filter((d) => d.chave <= chaveLimite)
        .reduce((soma, d) => soma + d.aporte, 0);

    const mes = dadosMensais.find((d) => d.chave === mesAtual);
    const anterior = dadosMensais.find((d) => d.chave === mesAnterior);

    return {
      saldoAtual: saldoAteMes(mesAtual),
      saldoAnterior: saldoAteMes(mesAnterior),
      guardado: investidoAteMes(mesAtual),
      guardadoAnterior: investidoAteMes(mesAnterior),
      receitasMes: mes?.rendaRealizada ?? 0,
      receitasAnterior: anterior?.rendaRealizada ?? 0,
      gastosMes: mes?.gastosRealizados ?? 0,
      gastosAnterior: anterior?.gastosRealizados ?? 0,
    };
  }, [dadosMensais, investimentosMensais]);

  const temDados = dadosMensais.length > 0;

  // Meses até o atual x meses futuros (prospecção das recorrências).
  const mesesFuturos = dadosMensais.filter((d) => d.futuro).length;
  const mesesAteHoje = dadosMensais.length - mesesFuturos;
  const plural = (n) => `${n} ${n === 1 ? "mês" : "meses"}`;
  const subtituloAcumulado =
    mesesFuturos > 0
      ? `Saldo de ${plural(mesesAteHoje)} e previsão para ${plural(mesesFuturos)}`
      : `Saldo acumulado em ${plural(mesesAteHoje)}`;

  const seletor = (
    <SeletorGrafico ativo={graficoAtivo} aoMudar={setGraficoAtivo} />
  );

  // Gastos/renda e saldo têm o filtro da previsão; investimentos não
  // (não há projeção de aportes).
  const acoesComPrevisao = (
    <div className={styles.acoesGrafico}>
      <SeletorPrevisao meses={mesesPrevisao} aoMudar={setMesesPrevisao} />
      {seletor}
    </div>
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
        key={`acumulado-${mesesPrevisao}`}
        dados={dadosAcumulado}
        subtitulo={subtituloAcumulado}
        altura={ALTURA_GRAFICO}
        acoes={acoesComPrevisao}
      />
    ) : (
      <GraficoBarras
        key={`mensal-${mesesPrevisao}`}
        dados={dadosMensais}
        altura={ALTURA_GRAFICO}
        acoes={acoesComPrevisao}
      />
    );
  }

  return (
    <section className={styles.evolucao} aria-label="Evolução financeira">
      {mostrarResumo && !carregando && !erro && (
        <CardsResumo resumo={resumo} />
      )}

      {renderConteudo()}
    </section>
  );
}

export default EvolucaoFinanceira;
