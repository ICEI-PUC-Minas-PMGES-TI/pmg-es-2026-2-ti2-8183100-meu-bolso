import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Repeat } from "lucide-react";

import receitasService from "../../service/receitasService";
import { listarFormasDePagamento } from "../../service/carteirasStorage";
import {
  FILTROS_INICIAIS,
  ORDENACAO_INICIAL,
  calcularDistribuicao,
  calcularResumo,
  diasNoMes,
  filtrarReceitas,
  formatarMesExtenso,
  mesAtualChave,
  mudarMes,
  ordenarReceitas,
  temFiltroAtivo,
} from "../../utils/Receitasutils";

import DistribuicaoCategorias from "../../components/Receitas/DistribuicaoCategorias";
import FiltrosReceitas from "../../components/Receitas/FiltrosReceitas";
import ModalComentario from "../../components/Receitas/ModalComentario";
import ModalReceita from "../../components/Receitas/ModalReceita";
import ModalRecorrencias from "../../components/Receitas/ModalRecorrencia";
import ResumoCards from "../../components/Receitas/ResumoCards";
import TabelaReceitas from "../../components/Receitas/TabelaReceitas";

import styles from "./Receitas.module.css";

// Tempo da animação de saída da linha (precisa bater com .receitas-linha-saindo no CSS)
const DURACAO_SAIDA_MS = 180;

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export default function Receitas() {
  // { receitas, recorrencias } — null enquanto carrega
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  const [mesSelecionado, setMesSelecionado] = useState(mesAtualChave);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [ordenacao, setOrdenacao] = useState(ORDENACAO_INICIAL);

  // Qual modal está aberto: { tipo: "receita" | "comentario" | "recorrencias", receita? }
  const [modal, setModal] = useState(null);
  // IDs das linhas que estão fazendo a animação de saída
  const [removendo, setRemovendo] = useState(() => new Set());

  /* ---------- Carregamento ---------- */

  const carregar = useCallback(async () => {
    try {
      setDados(await receitasService.carregarTudo());
      setErro("");
    } catch (e) {
      setErro(e.message || "Não foi possível carregar as receitas.");
    }
  }, []);

  // Carga inicial. O "ativo" evita atualizar o estado se a página for fechada antes
  // da resposta (e também o disparo duplicado do StrictMode em desenvolvimento).
  useEffect(() => {
    let ativo = true;

    receitasService
      .carregarTudo()
      .then((carregados) => {
        if (!ativo) return;
        setDados(carregados);
        setErro("");
      })
      .catch((e) => {
        if (ativo) setErro(e.message || "Não foi possível carregar as receitas.");
      });

    return () => {
      ativo = false;
    };
  }, []);

  // Formas de recebimento (contas/cartões/dinheiro) para os selects de carteira.
  useEffect(() => {
    let ativo = true;
    listarFormasDePagamento()
      .then((formas) => {
        if (ativo) setFormasPagamento(formas);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  /* ---------- Dados derivados ---------- */

  const receitasDoMes = useMemo(
    () => (dados?.receitas ?? []).filter((receita) => receita.data.startsWith(mesSelecionado)),
    [dados, mesSelecionado],
  );

  // Cards e categorias olham para o mês inteiro, sem os filtros da lista
  const resumo = useMemo(
    () => calcularResumo(receitasDoMes, mesSelecionado),
    [receitasDoMes, mesSelecionado],
  );

  const distribuicao = useMemo(() => calcularDistribuicao(receitasDoMes), [receitasDoMes]);

  const receitasVisiveis = useMemo(
    () => ordenarReceitas(filtrarReceitas(receitasDoMes, filtros), ordenacao),
    [receitasDoMes, filtros, ordenacao],
  );

  const carregando = dados === null && !erro;
  const recorrenciasAtivas = (dados?.recorrencias ?? []).filter((rec) => rec.ativa).length;

  /* ---------- Navegação entre meses ---------- */

  function irParaMes(mes) {
    setMesSelecionado(mes);
    // O período "de/até" só faz sentido dentro de um mês
    setFiltros((atual) => ({ ...atual, de: "", ate: "" }));
  }

  /* ---------- Ações ---------- */

  const fecharModal = useCallback(() => setModal(null), []);

  async function salvarReceita(dadosForm, receitaEditada) {
    if (receitaEditada) {
      await receitasService.atualizarReceita(receitaEditada.id, dadosForm);
    } else {
      await receitasService.criarReceita(dadosForm);
      setFiltros(FILTROS_INICIAIS); // garante que a receita nova apareça na lista
    }

    await carregar();

    const mesDaReceita = dadosForm.data.slice(0, 7);
    if (mesDaReceita !== mesSelecionado) irParaMes(mesDaReceita);
    setModal(null);
  }

  async function salvarComentario(receita, comentario) {
    await receitasService.atualizarComentario(receita.id, comentario);
    await carregar();
    setModal(null);
  }

  async function atualizarRecorrencia(id, alteracoes) {
    await receitasService.atualizarRecorrencia(id, alteracoes);
    await carregar();
  }

  async function excluirRecorrencia(id) {
    await receitasService.excluirRecorrencia(id);
    await carregar();
  }

  async function excluirReceita(receita) {
    if (!window.confirm(`Deseja excluir "${receita.descricao}"?`)) return;

    // 1) toca a animação de saída; 2) só então apaga de verdade
    setRemovendo((atual) => new Set(atual).add(receita.id));
    await esperar(DURACAO_SAIDA_MS);

    try {
      await receitasService.excluirReceita(receita.id);
      await carregar();
    } catch (e) {
      setErro(e.message || "Não foi possível excluir a receita.");
    } finally {
      setRemovendo((atual) => {
        const proximo = new Set(atual);
        proximo.delete(receita.id);
        return proximo;
      });
    }
  }

  /* ---------- Tela ---------- */

  return (
    <section className={styles["receitas-pagina"]}>
      <header className={styles["receitas-topo"]}>
        <div>
          <h1 className={styles["receitas-titulo"]}>Receitas</h1>
          <p className={styles["receitas-subtitulo"]}>{formatarMesExtenso(mesSelecionado)}</p>
        </div>

        <div className={styles["receitas-topo-acoes"]}>
          <div className={styles["receitas-seletor-mes"]} role="group" aria-label="Selecionar mês">
            <button
              type="button"
              className={styles["receitas-seletor-botao"]}
              onClick={() => irParaMes(mudarMes(mesSelecionado, -1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>

            <span className={styles["receitas-seletor-texto"]} aria-live="polite">
              {formatarMesExtenso(mesSelecionado)}
            </span>

            <button
              type="button"
              className={styles["receitas-seletor-botao"]}
              onClick={() => irParaMes(mudarMes(mesSelecionado, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => setModal({ tipo: "recorrencias" })}
            disabled={!dados}
          >
            <Repeat size={16} aria-hidden="true" />
            Recorrentes
            {recorrenciasAtivas > 0 && (
              <span className={styles["receitas-contagem"]}>{recorrenciasAtivas}</span>
            )}
          </button>

          <button
            type="button"
            className={`btn btn-primario ${styles["receitas-botao-adicionar"]}`}
            onClick={() => setModal({ tipo: "receita" })}
            disabled={!dados}
          >
            <Plus size={16} aria-hidden="true" />
            Adicionar Receita
          </button>
        </div>
      </header>

      {erro && (
        <div className={`mensagem mensagem-erro ${styles["receitas-erro-banner"]}`} role="alert">
          <span>{erro}</span>
          <button type="button" className="btn btn-secundario" onClick={carregar}>
            Tentar novamente
          </button>
        </div>
      )}

      {(dados || carregando) && (
        <>
          <ResumoCards
            resumo={resumo}
            mesSelecionado={mesSelecionado}
            carregando={carregando}
          />

          <DistribuicaoCategorias
            itens={distribuicao}
            selecionada={filtros.categoria}
            onSelecionar={(categoria) => setFiltros((atual) => ({ ...atual, categoria }))}
            carregando={carregando}
          />

          <div className={styles["receitas-card"]}>
            {!carregando && (
              <FiltrosReceitas
                filtros={filtros}
                onAlterar={setFiltros}
                onLimpar={() => setFiltros(FILTROS_INICIAIS)}
                ordenacao={ordenacao}
                onOrdenar={setOrdenacao}
                mesSelecionado={mesSelecionado}
                diasDoMes={diasNoMes(mesSelecionado)}
                carteiras={formasPagamento}
              />
            )}

            <TabelaReceitas
              receitas={receitasVisiveis}
              quantidadeDoMes={receitasDoMes.length}
              filtrando={temFiltroAtivo(filtros)}
              carregando={carregando}
              removendo={removendo}
              ordenacao={ordenacao}
              onOrdenar={setOrdenacao}
              onEditar={(receita) => setModal({ tipo: "receita", receita })}
              onExcluir={excluirReceita}
              onComentario={(receita) => setModal({ tipo: "comentario", receita })}
              onLimparFiltros={() => setFiltros(FILTROS_INICIAIS)}
              mesExtenso={formatarMesExtenso(mesSelecionado)}
            />
          </div>
        </>
      )}

      {modal?.tipo === "receita" && (
        <ModalReceita
          receita={modal.receita}
          mesSelecionado={mesSelecionado}
          carteiras={formasPagamento}
          onFechar={fecharModal}
          onSalvar={(dadosForm) => salvarReceita(dadosForm, modal.receita)}
        />
      )}

      {modal?.tipo === "comentario" && (
        <ModalComentario
          receita={modal.receita}
          onFechar={fecharModal}
          onSalvar={(comentario) => salvarComentario(modal.receita, comentario)}
        />
      )}

      {modal?.tipo === "recorrencias" && (
        <ModalRecorrencias
          recorrencias={dados?.recorrencias ?? []}
          carteiras={formasPagamento}
          onAtualizar={atualizarRecorrencia}
          onExcluir={excluirRecorrencia}
          onFechar={fecharModal}
        />
      )}
    </section>
  );
}
