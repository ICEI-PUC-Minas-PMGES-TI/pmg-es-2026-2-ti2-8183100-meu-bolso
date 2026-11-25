import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Repeat, Settings2 } from "lucide-react";

import gastosService from "../../service/gastosService";
import receitasService from "../../service/receitasService";
import { listarContas } from "../../service/carteirasStorage";
import {
  FILTROS_INICIAIS,
  ORDENACAO_INICIAL,
  calcularDistribuicao as distribuicaoGastos,
  calcularResumo as resumoGastos,
  calcularStatusOrcamento,
  diasNoMes,
  formatarMesExtenso,
  mesAtualChave,
  mudarMes,
  temFiltroAtivo,
} from "../../utils/Gastosutils";
import {
  calcularDistribuicao as distribuicaoReceitas,
  calcularResumo as resumoReceitas,
} from "../../utils/Receitasutils";
import {
  TIPO_GASTO,
  TIPO_RECEITA,
  VISOES,
  filtrarMovimentacoes,
  filtrarPorVisao,
  ordenarMovimentacoes,
  somarComSinal,
  unificar,
} from "../../utils/Movimentacoesutils";
import { useCategorias } from "../../service/categoriasService";
import { CATEGORIAS as CATEGORIAS_GASTO } from "../Gastos/Constantes";
import { CATEGORIAS as CATEGORIAS_RECEITA } from "../Receitas/Constantes";

import DistribuicaoGastos from "../../components/Gastos/DistribuicaoCategorias";
import ModalComentarioGasto from "../../components/Gastos/ModalComentario";
import ModalGasto from "../../components/Gastos/ModalGasto";
import ModalOrcamento from "../../components/Gastos/ModalOrcamento";
import ModalRecorrenciasGastos from "../../components/Gastos/ModalRecorrencia";
import StatusOrcamento from "../../components/Gastos/StatusOrcamento";
import DistribuicaoReceitas from "../../components/Receitas/DistribuicaoCategorias";
import ModalComentarioReceita from "../../components/Receitas/ModalComentario";
import ModalReceita from "../../components/Receitas/ModalReceita";
import ModalRecorrenciasReceitas from "../../components/Receitas/ModalRecorrencia";
import FiltrosMovimentacoes from "../../components/Movimentacoes/FiltrosMovimentacoes";
import ListaMovimentacoes from "../../components/Movimentacoes/ListaMovimentacoes";
import PainelMovimentacao from "../../components/Movimentacoes/PainelMovimentacao";
import ResumoMovimentacoes from "../../components/Movimentacoes/ResumoMovimentacoes";

import g from "../Gastos/Gastos.module.css";
import styles from "./Movimentacoes.module.css";

// Tempo da animação de saída da linha (precisa bater com .gastos-linha-saindo no CSS)
const DURACAO_SAIDA_MS = 180;

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// /movimentacoes?tipo=entradas|saidas (os redirecionamentos de /receitas e /gastos usam isso)
function visaoDaUrl(parametro) {
  return Object.values(VISOES).includes(parametro) ? parametro : VISOES.tudo;
}

function SeletorTipo({ tipo, onTrocar }) {
  return (
    <div className={styles.segmento} role="group" aria-label="Tipo da movimentação">
      <button
        type="button"
        className={tipo === TIPO_GASTO ? styles["segmento-ativo"] : ""}
        aria-pressed={tipo === TIPO_GASTO}
        onClick={() => onTrocar(TIPO_GASTO)}
      >
        Gasto
      </button>
      <button
        type="button"
        className={tipo === TIPO_RECEITA ? styles["segmento-ativo"] : ""}
        aria-pressed={tipo === TIPO_RECEITA}
        onClick={() => onTrocar(TIPO_RECEITA)}
      >
        Receita
      </button>
    </div>
  );
}

export default function Movimentacoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const visao = visaoDaUrl(searchParams.get("tipo"));

  // { gastos, recorrencias } e { receitas, recorrencias } — null enquanto carrega
  const [dadosGastos, setDadosGastos] = useState(null);
  const [dadosReceitas, setDadosReceitas] = useState(null);
  const [erro, setErro] = useState("");

  const [mesSelecionado, setMesSelecionado] = useState(mesAtualChave);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [ordenacao, setOrdenacao] = useState(ORDENACAO_INICIAL);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [orcamentoMes, setOrcamentoMes] = useState(0);
  // Aba do card "Por categoria"
  const [abaCategorias, setAbaCategorias] = useState(
    visao === VISOES.entradas ? TIPO_RECEITA : TIPO_GASTO,
  );

  // Modal aberto:
  //  { tipo: "nova", natureza: "gasto" | "receita" }
  //  { tipo: "editar" | "comentario", item }
  //  { tipo: "recorrencias", natureza }
  //  { tipo: "orcamento" }
  const [modal, setModal] = useState(null);
  const [itemAberto, setItemAberto] = useState(null);
  // Último estado do formulário de "Nova movimentação", para não perder o que
  // foi digitado ao trocar entre Gasto e Receita.
  const rascunhoRef = useRef(null);
  const guardarRascunho = useCallback((form) => {
    rascunhoRef.current = form;
  }, []);
  const [menuRecorrentes, setMenuRecorrentes] = useState(false);
  const menuRecorrentesRef = useRef(null);
  // Chaves das linhas que estão fazendo a animação de saída
  const [removendo, setRemovendo] = useState(() => new Set());

  /* ---------- Carregamento ---------- */

  const carregar = useCallback(async () => {
    try {
      const [gastos, receitas] = await Promise.all([
        gastosService.carregarTudo(),
        receitasService.carregarTudo(),
      ]);
      setDadosGastos(gastos);
      setDadosReceitas(receitas);
      setErro("");
    } catch (e) {
      setErro(e.message || "Não foi possível carregar as movimentações.");
    }
  }, []);

  // Carga inicial. O "ativo" evita atualizar o estado se a página for fechada
  // antes da resposta (e o disparo duplicado do StrictMode em desenvolvimento).
  useEffect(() => {
    let ativo = true;
    Promise.all([gastosService.carregarTudo(), receitasService.carregarTudo()])
      .then(([gastos, receitas]) => {
        if (!ativo) return;
        setDadosGastos(gastos);
        setDadosReceitas(receitas);
        setErro("");
      })
      .catch((e) => {
        if (ativo) setErro(e.message || "Não foi possível carregar as movimentações.");
      });
    return () => {
      ativo = false;
    };
  }, []);

  // Contas da carteira para os selects (gasto e receita só entram se houver conta).
  useEffect(() => {
    let ativo = true;
    listarContas()
      .then((formas) => {
        if (ativo) setFormasPagamento(formas);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  // Orçamento do mês selecionado (cada mês tem o seu).
  useEffect(() => {
    let ativo = true;
    gastosService
      .obterOrcamento(mesSelecionado)
      .then((valor) => {
        if (ativo) setOrcamentoMes(Number(valor) || 0);
      })
      .catch(() => {
        if (ativo) setOrcamentoMes(0);
      });
    return () => {
      ativo = false;
    };
  }, [mesSelecionado]);

  // Fecha o menu "Recorrentes" ao clicar fora.
  useEffect(() => {
    if (!menuRecorrentes) return undefined;
    function aoClicar(event) {
      if (!menuRecorrentesRef.current?.contains(event.target)) setMenuRecorrentes(false);
    }
    function aoPressionarTecla(event) {
      if (event.key === "Escape") setMenuRecorrentes(false);
    }
    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoPressionarTecla);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [menuRecorrentes]);

  /* ---------- Dados derivados ---------- */

  const gastosDoMes = useMemo(
    () => (dadosGastos?.gastos ?? []).filter((gasto) => gasto.data.startsWith(mesSelecionado)),
    [dadosGastos, mesSelecionado],
  );

  const receitasDoMes = useMemo(
    () =>
      (dadosReceitas?.receitas ?? []).filter((receita) => receita.data.startsWith(mesSelecionado)),
    [dadosReceitas, mesSelecionado],
  );

  // Cards, orçamento e categorias olham para o mês inteiro, sem os filtros da lista
  const resumoDosGastos = useMemo(
    () => resumoGastos(gastosDoMes, mesSelecionado),
    [gastosDoMes, mesSelecionado],
  );
  const resumoDasReceitas = useMemo(
    () => resumoReceitas(receitasDoMes, mesSelecionado),
    [receitasDoMes, mesSelecionado],
  );

  const movimentacoesDoMes = useMemo(
    () => unificar(gastosDoMes, receitasDoMes),
    [gastosDoMes, receitasDoMes],
  );

  const saldo = useMemo(() => {
    const realizadas = movimentacoesDoMes.filter((item) => !item.projetado);
    return {
      total: somarComSinal(movimentacoesDoMes),
      semPrevistos: somarComSinal(realizadas),
      temPrevistos: realizadas.length !== movimentacoesDoMes.length,
    };
  }, [movimentacoesDoMes]);

  const distribuicaoDosGastos = useMemo(() => distribuicaoGastos(gastosDoMes), [gastosDoMes]);
  const distribuicaoDasReceitas = useMemo(
    () => distribuicaoReceitas(receitasDoMes),
    [receitasDoMes],
  );

  const statusOrcamento = useMemo(
    () => calcularStatusOrcamento(resumoDosGastos.total, orcamentoMes),
    [resumoDosGastos.total, orcamentoMes],
  );

  // Bibliotecas de categorias do usuário (null enquanto carregam).
  const bibliotecaGasto = useCategorias(TIPO_GASTO);
  const bibliotecaReceita = useCategorias(TIPO_RECEITA);

  // Categorias do filtro, conforme o chip: as da biblioteca do usuário (ou as
  // padrão, enquanto carrega) + as que aparecem no mês e saíram da biblioteca.
  // Cada uma leva o tipo, para o filtro mostrar o ícone certo.
  const categoriasDoFiltro = useMemo(() => {
    const nomesGasto = bibliotecaGasto?.map((c) => c.nome) ?? CATEGORIAS_GASTO;
    const nomesReceita = bibliotecaReceita?.map((c) => c.nome) ?? CATEGORIAS_RECEITA;
    const base = [
      ...(visao !== VISOES.entradas ? nomesGasto.map((nome) => ({ nome, tipo: TIPO_GASTO })) : []),
      ...(visao !== VISOES.saidas ? nomesReceita.map((nome) => ({ nome, tipo: TIPO_RECEITA })) : []),
    ];
    const doMes = filtrarPorVisao(movimentacoesDoMes, visao).map((item) => ({
      nome: item.categoria,
      tipo: item.tipo,
    }));

    // Um nome aparece uma vez só ("Outros" existe nos dois tipos).
    const porNome = new Map();
    for (const categoria of [...base, ...doMes]) {
      if (!porNome.has(categoria.nome)) porNome.set(categoria.nome, categoria);
    }
    return [...porNome.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [bibliotecaGasto, bibliotecaReceita, movimentacoesDoMes, visao]);

  const movimentacoesVisiveis = useMemo(
    () => ordenarMovimentacoes(filtrarMovimentacoes(movimentacoesDoMes, filtros, visao), ordenacao),
    [movimentacoesDoMes, filtros, visao, ordenacao],
  );

  const dados = dadosGastos && dadosReceitas;
  const carregando = !dados && !erro;
  const recorrenciasGastosAtivas = (dadosGastos?.recorrencias ?? []).filter((r) => r.ativa).length;
  const recorrenciasReceitasAtivas = (dadosReceitas?.recorrencias ?? []).filter((r) => r.ativa).length;
  const recorrenciasAtivas = recorrenciasGastosAtivas + recorrenciasReceitasAtivas;

  /* ---------- Navegação ---------- */

  function irParaMes(mes) {
    setMesSelecionado(mes);
    // O período "de/até" só faz sentido dentro de um mês
    setFiltros((atual) => ({ ...atual, de: "", ate: "" }));
  }

  function trocarVisao(nova) {
    const proximos = new URLSearchParams(searchParams);
    if (nova === VISOES.tudo) proximos.delete("tipo");
    else proximos.set("tipo", nova);
    setSearchParams(proximos, { replace: true });
    if (nova === VISOES.entradas) setAbaCategorias(TIPO_RECEITA);
    if (nova === VISOES.saidas) setAbaCategorias(TIPO_GASTO);
  }

  // Clique numa categoria do card: filtra a lista e mostra só aquele tipo.
  function selecionarCategoria(categoria, tipo) {
    setFiltros((atual) => ({ ...atual, categoria }));
    if (categoria) trocarVisao(tipo === TIPO_RECEITA ? VISOES.entradas : VISOES.saidas);
  }

  /* ---------- Ações ---------- */

  const fecharModal = useCallback(() => setModal(null), []);
  const fecharPainel = useCallback(() => setItemAberto(null), []);

  function servicoDe(tipo) {
    return tipo === TIPO_RECEITA ? receitasService : gastosService;
  }

  async function salvar(dadosForm, natureza, itemEditado) {
    if (itemEditado) {
      if (natureza === TIPO_RECEITA) await receitasService.atualizarReceita(itemEditado.id, dadosForm);
      else await gastosService.atualizarGasto(itemEditado.id, dadosForm);
    } else {
      if (natureza === TIPO_RECEITA) await receitasService.criarReceita(dadosForm);
      else await gastosService.criarGasto(dadosForm);
      // Garante que o lançamento novo apareça na lista
      setFiltros(FILTROS_INICIAIS);
      const visaoDoNovo = natureza === TIPO_RECEITA ? VISOES.entradas : VISOES.saidas;
      if (visao !== VISOES.tudo && visao !== visaoDoNovo) trocarVisao(VISOES.tudo);
    }

    await carregar();

    const mesDoItem = dadosForm.data.slice(0, 7);
    if (mesDoItem !== mesSelecionado) irParaMes(mesDoItem);
    setModal(null);
    setItemAberto(null);
  }

  async function salvarComentario(item, comentario) {
    await servicoDe(item.tipo).atualizarComentario(item.id, comentario);
    await carregar();
    setModal(null);
    setItemAberto(null);
  }

  async function salvarOrcamento(valor) {
    await gastosService.salvarOrcamento(valor, mesSelecionado);
    setOrcamentoMes(Number(valor) || 0);
    setModal(null);
  }

  async function atualizarRecorrencia(natureza, id, alteracoes) {
    await servicoDe(natureza).atualizarRecorrencia(id, alteracoes);
    await carregar();
  }

  async function excluirRecorrencia(natureza, id) {
    await servicoDe(natureza).excluirRecorrencia(id);
    await carregar();
  }

  async function excluir(item) {
    const servico = servicoDe(item.tipo);
    const receita = item.tipo === TIPO_RECEITA;

    // Recorrente (real ou projetado): escolher entre só este mês ou sempre.
    if (item.recorrenciaId) {
      const soEsteMes = window.confirm(
        `"${item.descricao}" é ${receita ? "uma receita recorrente" : "um gasto recorrente"}.\n\n` +
          "Clique em OK para remover a recorrência APENAS neste mês.\n" +
          "Clique em Cancelar para escolher remover de todos os meses.",
      );

      if (soEsteMes) {
        await removerComAnimacao(item, () =>
          servico.pularMesRecorrencia(item.recorrenciaId, item.data.slice(0, 7)),
        );
        return;
      }

      const paraSempre = window.confirm(
        `Remover a recorrência de "${item.descricao}" para SEMPRE?\n\n` +
          `Os próximos meses deixam de ser lançados. ${
            receita ? "As receitas já lançadas continuam" : "Os gastos já lançados continuam"
          } na lista.`,
      );
      if (!paraSempre) return;

      await removerComAnimacao(item, () => servico.excluirRecorrencia(item.recorrenciaId));
      return;
    }

    if (!window.confirm(`Deseja excluir "${item.descricao}"?`)) return;

    await removerComAnimacao(item, () =>
      receita ? receitasService.excluirReceita(item.id) : gastosService.excluirGasto(item.id),
    );
  }

  // Toca a animação de saída da linha e só então executa a ação de verdade.
  async function removerComAnimacao(item, acao) {
    setItemAberto(null);
    setRemovendo((atual) => new Set(atual).add(item.chave));
    await esperar(DURACAO_SAIDA_MS);

    try {
      await acao();
      await carregar();
    } catch (e) {
      setErro(e.message || "Não foi possível excluir a movimentação.");
    } finally {
      setRemovendo((atual) => {
        const proximo = new Set(atual);
        proximo.delete(item.chave);
        return proximo;
      });
    }
  }

  function abrirNova() {
    setModal({ tipo: "nova", natureza: visao === VISOES.entradas ? TIPO_RECEITA : TIPO_GASTO });
  }

  function abrirRecorrencias(natureza) {
    setMenuRecorrentes(false);
    setModal({ tipo: "recorrencias", natureza });
  }

  /* ---------- Tela ---------- */

  const mesExtenso = formatarMesExtenso(mesSelecionado);

  // Modal de gasto/receita (nova ou edição)
  let modalLancamento = null;
  if (modal?.tipo === "nova" || modal?.tipo === "editar") {
    const editando = modal.tipo === "editar";
    const natureza = editando ? modal.item.tipo : modal.natureza;
    // Ao trocar o tipo, leva tudo o que foi digitado; só a categoria é limpa,
    // porque as categorias de gasto e de receita são listas diferentes.
    const seletor = editando ? undefined : (
      <SeletorTipo
        tipo={natureza}
        onTrocar={(nova) => {
          if (nova === natureza) return;
          setModal({
            tipo: "nova",
            natureza: nova,
            rascunho: rascunhoRef.current ? { ...rascunhoRef.current, categoria: "" } : undefined,
          });
        }}
      />
    );
    const props = {
      mesSelecionado,
      carteiras: formasPagamento,
      onFechar: fecharModal,
      onSalvar: (dadosForm) => salvar(dadosForm, natureza, editando ? modal.item : null),
      seletorTipo: seletor,
      rascunho: editando ? undefined : modal.rascunho,
      onRascunho: editando ? undefined : guardarRascunho,
    };
    modalLancamento =
      natureza === TIPO_RECEITA ? (
        <ModalReceita key="receita" receita={editando ? modal.item : undefined} {...props} />
      ) : (
        <ModalGasto key="gasto" gasto={editando ? modal.item : undefined} {...props} />
      );
  }

  return (
    <section className={g["gastos-pagina"]}>
      <header className={g["gastos-topo"]}>
        <div>
          <h1 className={g["gastos-titulo"]}>Movimentações</h1>
          <p className={g["gastos-subtitulo"]}>Tudo o que entrou e saiu em {mesExtenso}</p>
        </div>

        <div className={g["gastos-topo-acoes"]}>
          <div className={g["gastos-seletor-mes"]} role="group" aria-label="Selecionar mês">
            <button
              type="button"
              className={g["gastos-seletor-botao"]}
              onClick={() => irParaMes(mudarMes(mesSelecionado, -1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <span className={g["gastos-seletor-texto"]} aria-live="polite">
              {mesExtenso}
            </span>
            <button
              type="button"
              className={g["gastos-seletor-botao"]}
              onClick={() => irParaMes(mudarMes(mesSelecionado, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>

          <div className={styles["menu-recorrentes"]} ref={menuRecorrentesRef}>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={() => setMenuRecorrentes((aberto) => !aberto)}
              disabled={!dados}
              aria-haspopup="menu"
              aria-expanded={menuRecorrentes}
            >
              <Repeat size={16} aria-hidden="true" />
              Recorrentes
              {recorrenciasAtivas > 0 && (
                <span className={g["gastos-contagem"]}>{recorrenciasAtivas}</span>
              )}
              <ChevronDown size={16} aria-hidden="true" />
            </button>

            {menuRecorrentes && (
              <div className={styles["menu-recorrentes-lista"]} role="menu">
                <button type="button" role="menuitem" onClick={() => abrirRecorrencias(TIPO_GASTO)}>
                  Gastos recorrentes
                  <span className={g["gastos-contagem"]}>{recorrenciasGastosAtivas}</span>
                </button>
                <button type="button" role="menuitem" onClick={() => abrirRecorrencias(TIPO_RECEITA)}>
                  Receitas recorrentes
                  <span className={g["gastos-contagem"]}>{recorrenciasReceitasAtivas}</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className={`btn btn-primario ${g["gastos-botao-adicionar"]}`}
            onClick={abrirNova}
            disabled={!dados}
          >
            <Plus size={16} aria-hidden="true" />
            Nova movimentação
          </button>
        </div>
      </header>

      {erro && (
        <div className={`mensagem mensagem-erro ${g["gastos-erro-banner"]}`} role="alert">
          <span>{erro}</span>
          <button type="button" className="btn btn-secundario" onClick={carregar}>
            Tentar novamente
          </button>
        </div>
      )}

      {(dados || carregando) && (
        <>
          <ResumoMovimentacoes
            resumoGastos={resumoDosGastos}
            resumoReceitas={resumoDasReceitas}
            saldo={saldo}
            mesSelecionado={mesSelecionado}
            carregando={carregando}
          />

          <div className={styles.grade}>
            <div className={g["gastos-card"]}>
              {!carregando && (
                <FiltrosMovimentacoes
                  visao={visao}
                  onVisao={trocarVisao}
                  filtros={filtros}
                  onAlterar={setFiltros}
                  onLimpar={() => setFiltros(FILTROS_INICIAIS)}
                  ordenacao={ordenacao}
                  onOrdenar={setOrdenacao}
                  mesSelecionado={mesSelecionado}
                  diasDoMes={diasNoMes(mesSelecionado)}
                  carteiras={formasPagamento}
                  categorias={categoriasDoFiltro}
                  avancadosAbertos={filtrosAbertos}
                  onAlternarAvancados={() => setFiltrosAbertos((aberto) => !aberto)}
                />
              )}

              <ListaMovimentacoes
                itens={movimentacoesVisiveis}
                quantidadeDoMes={movimentacoesDoMes.length}
                filtrando={temFiltroAtivo(filtros) || visao !== VISOES.tudo}
                carregando={carregando}
                removendo={removendo}
                ordenacao={ordenacao}
                onOrdenar={setOrdenacao}
                onAbrir={setItemAberto}
                onEditar={(item) => setModal({ tipo: "editar", item })}
                onExcluir={excluir}
                onComentario={(item) => setModal({ tipo: "comentario", item })}
                onLimparFiltros={() => {
                  setFiltros(FILTROS_INICIAIS);
                  trocarVisao(VISOES.tudo);
                }}
                mesExtenso={mesExtenso}
              />
            </div>

            <aside className={styles.lado}>
              <StatusOrcamento
                totalGasto={resumoDosGastos.total}
                orcamento={orcamentoMes}
                status={statusOrcamento}
                carregando={carregando}
                onEditar={() => setModal({ tipo: "orcamento" })}
              />

              <div className={styles.categorias}>
                <div className={styles.abas} role="tablist" aria-label="Categorias por tipo">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={abaCategorias === TIPO_GASTO}
                    className={abaCategorias === TIPO_GASTO ? styles["aba-ativa"] : ""}
                    onClick={() => setAbaCategorias(TIPO_GASTO)}
                  >
                    Saídas
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={abaCategorias === TIPO_RECEITA}
                    className={abaCategorias === TIPO_RECEITA ? styles["aba-ativa"] : ""}
                    onClick={() => setAbaCategorias(TIPO_RECEITA)}
                  >
                    Entradas
                  </button>
                </div>

                {abaCategorias === TIPO_GASTO ? (
                  <DistribuicaoGastos
                    itens={distribuicaoDosGastos}
                    selecionada={visao === VISOES.saidas ? filtros.categoria : ""}
                    onSelecionar={(categoria) => selecionarCategoria(categoria, TIPO_GASTO)}
                    carregando={carregando}
                    acao={
                      <Link to="/categorias" className={styles["link-gerenciar"]}>
                        <Settings2 size={14} aria-hidden="true" />
                        Gerenciar
                      </Link>
                    }
                  />
                ) : (
                  <DistribuicaoReceitas
                    itens={distribuicaoDasReceitas}
                    selecionada={visao === VISOES.entradas ? filtros.categoria : ""}
                    onSelecionar={(categoria) => selecionarCategoria(categoria, TIPO_RECEITA)}
                    carregando={carregando}
                    acao={
                      <Link to="/categorias?tipo=receita" className={styles["link-gerenciar"]}>
                        <Settings2 size={14} aria-hidden="true" />
                        Gerenciar
                      </Link>
                    }
                  />
                )}
              </div>
            </aside>
          </div>
        </>
      )}

      {itemAberto && (
        <PainelMovimentacao
          item={itemAberto}
          escutarEsc={!modal}
          onFechar={fecharPainel}
          onEditar={(item) => setModal({ tipo: "editar", item })}
          onComentario={(item) => setModal({ tipo: "comentario", item })}
          onExcluir={excluir}
        />
      )}

      {modalLancamento}

      {modal?.tipo === "comentario" &&
        (modal.item.tipo === TIPO_RECEITA ? (
          <ModalComentarioReceita
            receita={modal.item}
            onFechar={fecharModal}
            onSalvar={(comentario) => salvarComentario(modal.item, comentario)}
          />
        ) : (
          <ModalComentarioGasto
            gasto={modal.item}
            onFechar={fecharModal}
            onSalvar={(comentario) => salvarComentario(modal.item, comentario)}
          />
        ))}

      {modal?.tipo === "orcamento" && (
        <ModalOrcamento
          orcamentoAtual={orcamentoMes}
          mesExtenso={mesExtenso}
          onFechar={fecharModal}
          onSalvar={salvarOrcamento}
        />
      )}

      {modal?.tipo === "recorrencias" &&
        (modal.natureza === TIPO_RECEITA ? (
          <ModalRecorrenciasReceitas
            recorrencias={dadosReceitas?.recorrencias ?? []}
            carteiras={formasPagamento}
            onAtualizar={(id, alteracoes) => atualizarRecorrencia(TIPO_RECEITA, id, alteracoes)}
            onExcluir={(id) => excluirRecorrencia(TIPO_RECEITA, id)}
            onFechar={fecharModal}
          />
        ) : (
          <ModalRecorrenciasGastos
            recorrencias={dadosGastos?.recorrencias ?? []}
            carteiras={formasPagamento}
            onAtualizar={(id, alteracoes) => atualizarRecorrencia(TIPO_GASTO, id, alteracoes)}
            onExcluir={(id) => excluirRecorrencia(TIPO_GASTO, id)}
            onFechar={fecharModal}
          />
        ))}
    </section>
  );
}
