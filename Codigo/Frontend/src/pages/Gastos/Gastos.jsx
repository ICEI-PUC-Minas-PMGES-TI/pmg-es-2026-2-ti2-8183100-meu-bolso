    import { useCallback, useEffect, useMemo, useState } from "react";
    import { ChevronLeft, ChevronRight, Plus, Repeat } from "lucide-react";

    import gastosService from "../../service/gastosService";
    import {
    FILTROS_INICIAIS,
    ORDENACAO_INICIAL,
    calcularDistribuicao,
    calcularResumo,
    calcularStatusOrcamento,
    diasNoMes,
    filtrarGastos,
    formatarMesExtenso,
    mesAtualChave,
    mudarMes,
    ordenarGastos,
    temFiltroAtivo,
    } from "../../utils/Gastosutils";

    import DistribuicaoCategorias from "../../components/Gastos/DistribuicaoCategorias";
    import FiltrosGastos from "../../components/Gastos/FiltrosGastos";
    import ModalComentario from "../../components/Gastos/ModalComentario";
    import ModalGasto from "../../components/Gastos/ModalGasto";
    import ModalOrcamento from "../../components/Gastos/ModalOrcamento";
    import ModalRecorrencias from "../../components/Gastos/ModalRecorrencia";
    import ResumoCards from "../../components/Gastos/ResumoCards";
    import StatusOrcamento from "../../components/Gastos/StatusOrcamento";
    import TabelaGastos from "../../components/Gastos/TabelaGastos";

    import styles from "./Gastos.module.css";

    // Tempo da animação de saída da linha (precisa bater com .gastos-linha-saindo no CSS)
    const DURACAO_SAIDA_MS = 180;

    const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

    export default function Gastos() {
    // { gastos, recorrencias, orcamento } — null enquanto carrega
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState("");

    const [mesSelecionado, setMesSelecionado] = useState(mesAtualChave);
    const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
    const [ordenacao, setOrdenacao] = useState(ORDENACAO_INICIAL);

    // Qual modal está aberto: { tipo: "gasto" | "comentario" | "recorrencias" | "orcamento", gasto? }
    const [modal, setModal] = useState(null);
    // IDs das linhas que estão fazendo a animação de saída
    const [removendo, setRemovendo] = useState(() => new Set());

    /* ---------- Carregamento ---------- */

    const carregar = useCallback(async () => {
        try {
        setDados(await gastosService.carregarTudo());
        setErro("");
        } catch (e) {
        setErro(e.message || "Não foi possível carregar os gastos.");
        }
    }, []);

    // Carga inicial. O "ativo" evita atualizar o estado se a página for fechada antes
    // da resposta (e também o disparo duplicado do StrictMode em desenvolvimento).
    useEffect(() => {
        let ativo = true;

        gastosService
        .carregarTudo()
        .then((carregados) => {
            if (!ativo) return;
            setDados(carregados);
            setErro("");
        })
        .catch((e) => {
            if (ativo) setErro(e.message || "Não foi possível carregar os gastos.");
        });

        return () => {
        ativo = false;
        };
    }, []);

    /* ---------- Dados derivados ---------- */

    const gastosDoMes = useMemo(
        () => (dados?.gastos ?? []).filter((gasto) => gasto.data.startsWith(mesSelecionado)),
        [dados, mesSelecionado],
    );

    // Cards, orçamento e categorias olham para o mês inteiro, sem os filtros da lista
    const resumo = useMemo(
        () => calcularResumo(gastosDoMes, mesSelecionado),
        [gastosDoMes, mesSelecionado],
    );

    const distribuicao = useMemo(() => calcularDistribuicao(gastosDoMes), [gastosDoMes]);

    const statusOrcamento = useMemo(
        () => calcularStatusOrcamento(resumo.total, dados?.orcamento ?? 0),
        [resumo.total, dados],
    );

    const gastosVisiveis = useMemo(
        () => ordenarGastos(filtrarGastos(gastosDoMes, filtros), ordenacao),
        [gastosDoMes, filtros, ordenacao],
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

    async function salvarGasto(dadosForm, gastoEditado) {
        if (gastoEditado) {
        await gastosService.atualizarGasto(gastoEditado.id, dadosForm);
        } else {
        await gastosService.criarGasto(dadosForm);
        setFiltros(FILTROS_INICIAIS); // garante que o gasto novo apareça na lista
        }

        await carregar();

        const mesDoGasto = dadosForm.data.slice(0, 7);
        if (mesDoGasto !== mesSelecionado) irParaMes(mesDoGasto);
        setModal(null);
    }

    async function salvarComentario(gasto, comentario) {
        await gastosService.atualizarComentario(gasto.id, comentario);
        await carregar();
        setModal(null);
    }

    async function salvarOrcamento(valor) {
        await gastosService.salvarOrcamento(valor);
        await carregar();
        setModal(null);
    }

    async function atualizarRecorrencia(id, alteracoes) {
        await gastosService.atualizarRecorrencia(id, alteracoes);
        await carregar();
    }

    async function excluirRecorrencia(id) {
        await gastosService.excluirRecorrencia(id);
        await carregar();
    }

    async function excluirGasto(gasto) {
        if (!window.confirm(`Deseja excluir "${gasto.descricao}"?`)) return;

        // 1) toca a animação de saída; 2) só então apaga de verdade
        setRemovendo((atual) => new Set(atual).add(gasto.id));
        await esperar(DURACAO_SAIDA_MS);

        try {
        await gastosService.excluirGasto(gasto.id);
        await carregar();
        } catch (e) {
        setErro(e.message || "Não foi possível excluir o gasto.");
        } finally {
        setRemovendo((atual) => {
            const proximo = new Set(atual);
            proximo.delete(gasto.id);
            return proximo;
        });
        }
    }

    /* ---------- Tela ---------- */

    return (
        <section className={styles["gastos-pagina"]}>
        <header className={styles["gastos-topo"]}>
            <div>
            <h1 className={styles["gastos-titulo"]}>Gastos</h1>
            <p className={styles["gastos-subtitulo"]}>{formatarMesExtenso(mesSelecionado)}</p>
            </div>

            <div className={styles["gastos-topo-acoes"]}>
            <div className={styles["gastos-seletor-mes"]} role="group" aria-label="Selecionar mês">
                <button
                type="button"
                className={styles["gastos-seletor-botao"]}
                onClick={() => irParaMes(mudarMes(mesSelecionado, -1))}
                aria-label="Mês anterior"
                >
                <ChevronLeft size={20} aria-hidden="true" />
                </button>

                <span className={styles["gastos-seletor-texto"]} aria-live="polite">
                {formatarMesExtenso(mesSelecionado)}
                </span>

                <button
                type="button"
                className={styles["gastos-seletor-botao"]}
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
                <span className={styles["gastos-contagem"]}>{recorrenciasAtivas}</span>
                )}
            </button>

            <button
                type="button"
                className={`btn btn-primario ${styles["gastos-botao-adicionar"]}`}
                onClick={() => setModal({ tipo: "gasto" })}
                disabled={!dados}
            >
                <Plus size={16} aria-hidden="true" />
                Adicionar Gasto
            </button>
            </div>
        </header>

        {erro && (
            <div className={`mensagem mensagem-erro ${styles["gastos-erro-banner"]}`} role="alert">
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

            <div className={styles["gastos-painel"]}>
                <StatusOrcamento
                totalGasto={resumo.total}
                orcamento={dados?.orcamento ?? 0}
                status={statusOrcamento}
                carregando={carregando}
                onEditar={() => setModal({ tipo: "orcamento" })}
                />

                <DistribuicaoCategorias
                itens={distribuicao}
                selecionada={filtros.categoria}
                onSelecionar={(categoria) => setFiltros((atual) => ({ ...atual, categoria }))}
                carregando={carregando}
                />
            </div>

            <div className={styles["gastos-card"]}>
                {!carregando && (
                <FiltrosGastos
                    filtros={filtros}
                    onAlterar={setFiltros}
                    onLimpar={() => setFiltros(FILTROS_INICIAIS)}
                    ordenacao={ordenacao}
                    onOrdenar={setOrdenacao}
                    mesSelecionado={mesSelecionado}
                    diasDoMes={diasNoMes(mesSelecionado)}
                />
                )}

                <TabelaGastos
                gastos={gastosVisiveis}
                quantidadeDoMes={gastosDoMes.length}
                filtrando={temFiltroAtivo(filtros)}
                carregando={carregando}
                removendo={removendo}
                ordenacao={ordenacao}
                onOrdenar={setOrdenacao}
                onEditar={(gasto) => setModal({ tipo: "gasto", gasto })}
                onExcluir={excluirGasto}
                onComentario={(gasto) => setModal({ tipo: "comentario", gasto })}
                onLimparFiltros={() => setFiltros(FILTROS_INICIAIS)}
                mesExtenso={formatarMesExtenso(mesSelecionado)}
                />
            </div>
            </>
        )}

        {modal?.tipo === "gasto" && (
            <ModalGasto
            gasto={modal.gasto}
            mesSelecionado={mesSelecionado}
            onFechar={fecharModal}
            onSalvar={(dadosForm) => salvarGasto(dadosForm, modal.gasto)}
            />
        )}

        {modal?.tipo === "comentario" && (
            <ModalComentario
            gasto={modal.gasto}
            onFechar={fecharModal}
            onSalvar={(comentario) => salvarComentario(modal.gasto, comentario)}
            />
        )}

        {modal?.tipo === "orcamento" && (
            <ModalOrcamento
            orcamentoAtual={dados?.orcamento ?? 0}
            onFechar={fecharModal}
            onSalvar={salvarOrcamento}
            />
        )}

        {modal?.tipo === "recorrencias" && (
            <ModalRecorrencias
            recorrencias={dados?.recorrencias ?? []}
            onAtualizar={atualizarRecorrencia}
            onExcluir={excluirRecorrencia}
            onFechar={fecharModal}
            />
        )}
        </section>
    );
    }
