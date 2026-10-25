    /**
     * Acesso aos dados da página de Gastos.
     *
     * Existem duas implementações com o MESMO contrato (todas as funções são async):
     *   - "local":  localStorage — é o que o projeto usa na Sprint 1.
     *   - "remoto": API Spring Boot (service/Api.js -> gastosApi).
     *
     * Para usar o back-end, coloque VITE_GASTOS_API=true no .env do Frontend.
     * A tela (pages/Gastos) só conhece o objeto exportado no final deste arquivo.
     */

    import { gastosApi } from "./Api";
    import {
    dataDaOcorrencia,
    hojeISO,
    mesAtualChave,
    mudarMes,
    } from "../utils/Gastosutils";

    const USAR_API = import.meta.env.VITE_GASTOS_API === "true";

    /* ========================================
    IMPLEMENTAÇÃO LOCAL (localStorage)
    ======================================== */

    const CHAVES = {
    gastos: "meubolso:gastos", // mesma chave que a página já usava
    recorrencias: "meubolso:gastos:recorrencias",
    orcamento: "meubolso:gastos:orcamento",
    };

    // Trava de segurança: nunca gera mais do que isso numa só passada
    const LIMITE_OCORRENCIAS = 120;

    function ler(chave, padrao) {
    try {
        const bruto = localStorage.getItem(chave);
        if (bruto !== null) return JSON.parse(bruto);
    } catch {
        // Dado corrompido: cai no valor padrão.
    }
    return padrao;
    }

    function gravar(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
        // Ignora falhas no armazenamento local.
    }
    }

    function novoId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    }

    function dataRelativa(mesesAtras, dia) {
    const hoje = new Date();
    return hojeISO(new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras, dia));
    }

    // Dados de exemplo mostrados na primeira vez que a página é aberta
    function gastosFicticios() {
    return [
        { id: 1, descricao: "Almoço no restaurante", categoria: "Alimentação", carteira: "Nubank", data: dataRelativa(0, 3), valor: 38.9 },
        { id: 2, descricao: "Uber para a faculdade", categoria: "Transporte", carteira: "Carteira", data: dataRelativa(0, 5), valor: 22.5 },
        { id: 3, descricao: "Netflix", categoria: "Assinaturas", carteira: "Cartão de crédito", data: dataRelativa(0, 8), valor: 44.9 },
        { id: 4, descricao: "Cinema com amigos", categoria: "Lazer", carteira: "Inter", data: dataRelativa(0, 12), valor: 56, comentario: "Sessão das 19h, dividi a pipoca." },
        { id: 5, descricao: "Aluguel", categoria: "Moradia", carteira: "Itaú", data: dataRelativa(0, 1), valor: 850 },
        { id: 6, descricao: "Curso de inglês", categoria: "Educação", carteira: "Nubank", data: dataRelativa(1, 10), valor: 120 },
        { id: 7, descricao: "Farmácia", categoria: "Saúde", carteira: "Carteira", data: dataRelativa(1, 18), valor: 47.3 },
        { id: 8, descricao: "Supermercado", categoria: "Alimentação", carteira: "Inter", data: dataRelativa(1, 22), valor: 213.75 },
    ];
    }

    function limparCampos(dados) {
    return {
        descricao: dados.descricao.trim(),
        categoria: dados.categoria,
        carteira: dados.carteira,
        data: dados.data,
        valor: Number(dados.valor),
        comentario: (dados.comentario ?? "").trim(),
    };
    }

    // A recorrência nasce a partir de um gasto: o dia do mês vem da data dele.
    function criarRecorrenciaDe(gasto) {
    return {
        id: novoId(),
        descricao: gasto.descricao,
        categoria: gasto.categoria,
        carteira: gasto.carteira,
        valor: gasto.valor,
        comentario: gasto.comentario,
        diaDoMes: Number(gasto.data.slice(8, 10)),
        ativa: true,
        ultimoMes: gasto.data.slice(0, 7), // último mês que já tem lançamento
    };
    }

    /**
     * Lança os gastos das recorrências ativas que já venceram.
     * É idempotente: só avança a partir de "ultimoMes", então rodar duas vezes
     * não duplica nada (e um gasto apagado à mão não volta).
     */
    export function processarRecorrencias(gastos, recorrencias, hoje = hojeISO()) {
    const novos = [];

    const atualizadas = recorrencias.map((rec) => {
        if (!rec.ativa) return rec;

        let ultimoMes = rec.ultimoMes;
        let proximo = mudarMes(ultimoMes, 1);

        while (
        dataDaOcorrencia(proximo, rec.diaDoMes) <= hoje &&
        novos.length < LIMITE_OCORRENCIAS
        ) {
        novos.push({
            id: novoId(),
            descricao: rec.descricao,
            categoria: rec.categoria,
            carteira: rec.carteira,
            data: dataDaOcorrencia(proximo, rec.diaDoMes),
            valor: rec.valor,
            comentario: rec.comentario,
            recorrenciaId: rec.id,
        });
        ultimoMes = proximo;
        proximo = mudarMes(proximo, 1);
        }

        return ultimoMes === rec.ultimoMes ? rec : { ...rec, ultimoMes };
    });

    return { gastos: [...novos, ...gastos], recorrencias: atualizadas };
    }

    const local = {
    async carregarTudo() {
        const gastosSalvos = ler(CHAVES.gastos, null) ?? gastosFicticios();
        const recorrenciasSalvas = ler(CHAVES.recorrencias, []);

        const { gastos, recorrencias } = processarRecorrencias(
        gastosSalvos,
        recorrenciasSalvas,
        );

        gravar(CHAVES.gastos, gastos);
        gravar(CHAVES.recorrencias, recorrencias);

        return {
        gastos,
        recorrencias,
        orcamento: Number(ler(CHAVES.orcamento, 0)) || 0,
        };
    },

    async criarGasto({ recorrente, ...dados }) {
        const gasto = { id: novoId(), ...limparCampos(dados) };
        const recorrencias = ler(CHAVES.recorrencias, []);

        if (recorrente) {
        const recorrencia = criarRecorrenciaDe(gasto);
        gasto.recorrenciaId = recorrencia.id;
        recorrencias.push(recorrencia);
        gravar(CHAVES.recorrencias, recorrencias);
        }

        gravar(CHAVES.gastos, [gasto, ...ler(CHAVES.gastos, [])]);
    },

    async atualizarGasto(id, { recorrente, ...dados }) {
        const recorrencias = ler(CHAVES.recorrencias, []);

        const gastos = ler(CHAVES.gastos, []).map((gasto) => {
        if (gasto.id !== id) return gasto;

        const atualizado = { ...gasto, ...limparCampos(dados) };

        // Transformar um gasto avulso em recorrente
        if (recorrente && !gasto.recorrenciaId) {
            const recorrencia = criarRecorrenciaDe(atualizado);
            atualizado.recorrenciaId = recorrencia.id;
            recorrencias.push(recorrencia);
        }

        return atualizado;
        });

        gravar(CHAVES.gastos, gastos);
        gravar(CHAVES.recorrencias, recorrencias);
    },

    async atualizarComentario(id, comentario) {
        gravar(
        CHAVES.gastos,
        ler(CHAVES.gastos, []).map((gasto) =>
            gasto.id === id ? { ...gasto, comentario: comentario.trim() } : gasto,
        ),
        );
    },

    async excluirGasto(id) {
        gravar(
        CHAVES.gastos,
        ler(CHAVES.gastos, []).filter((gasto) => gasto.id !== id),
        );
    },

    async atualizarRecorrencia(id, dados) {
        const mesAnterior = mudarMes(mesAtualChave(), -1);

        gravar(
        CHAVES.recorrencias,
        ler(CHAVES.recorrencias, []).map((rec) => {
            if (rec.id !== id) return rec;

            const atualizada = { ...rec, ...dados };
            if (dados.descricao !== undefined) atualizada.descricao = dados.descricao.trim();
            if (dados.comentario !== undefined) atualizada.comentario = dados.comentario.trim();

            // Ao reativar, não gera retroativamente os meses em que ficou pausada
            if (dados.ativa === true && !rec.ativa && atualizada.ultimoMes < mesAnterior) {
            atualizada.ultimoMes = mesAnterior;
            }

            return atualizada;
        }),
        );
    },

    async excluirRecorrencia(id) {
        gravar(
        CHAVES.recorrencias,
        ler(CHAVES.recorrencias, []).filter((rec) => rec.id !== id),
        );

        // Os gastos já lançados continuam, só perdem o vínculo com a regra
        gravar(
        CHAVES.gastos,
        ler(CHAVES.gastos, []).map((gasto) =>
            gasto.recorrenciaId === id ? { ...gasto, recorrenciaId: undefined } : gasto,
        ),
        );
    },

    async salvarOrcamento(valor) {
        gravar(CHAVES.orcamento, Number(valor) || 0);
    },
    };

    /* ========================================
    IMPLEMENTAÇÃO REMOTA (Spring Boot + MongoDB)
    ======================================== */

    // O back devolve BigDecimal como número; garantimos Number e sem campos nulos.
    function normalizarGasto(gasto) {
    return {
        ...gasto,
        valor: Number(gasto.valor),
        comentario: gasto.comentario ?? "",
        recorrenciaId: gasto.recorrenciaId ?? undefined,
    };
    }

    function normalizarRecorrencia(rec) {
    return { ...rec, valor: Number(rec.valor), comentario: rec.comentario ?? "" };
    }

    const remoto = {
    async carregarTudo() {
        // Primeiro a lista de gastos: é ela que dispara a geração das recorrências no back
        const gastos = await gastosApi.listar();
        const [recorrencias, orcamento] = await Promise.all([
        gastosApi.listarRecorrentes(),
        gastosApi.obterOrcamento(),
        ]);

        return {
        gastos: gastos.map(normalizarGasto),
        recorrencias: recorrencias.map(normalizarRecorrencia),
        orcamento: Number(orcamento.valorMensal) || 0,
        };
    },

    async criarGasto(dados) {
        await gastosApi.criar({ ...limparCampos(dados), recorrente: Boolean(dados.recorrente) });
    },

    async atualizarGasto(id, dados) {
        await gastosApi.atualizar(id, {
        ...limparCampos(dados),
        recorrente: Boolean(dados.recorrente),
        });
    },

    async atualizarComentario(id, comentario) {
        await gastosApi.atualizarComentario(id, comentario.trim());
    },

    async excluirGasto(id) {
        await gastosApi.excluir(id);
    },

    async atualizarRecorrencia(id, dados) {
        // O back espera o objeto completo; pegamos a regra atual e aplicamos a mudança
        const atuais = await gastosApi.listarRecorrentes();
        const atual = atuais.find((rec) => rec.id === id);
        if (!atual) throw new Error("Recorrência não encontrada.");

        await gastosApi.atualizarRecorrente(id, {
        descricao: atual.descricao,
        categoria: atual.categoria,
        carteira: atual.carteira,
        valor: atual.valor,
        diaDoMes: atual.diaDoMes,
        comentario: atual.comentario ?? "",
        ativa: atual.ativa,
        ...dados,
        });
    },

    async excluirRecorrencia(id) {
        await gastosApi.excluirRecorrente(id);
    },

    async salvarOrcamento(valor) {
        await gastosApi.salvarOrcamento(Number(valor) || 0);
    },
    };

    const gastosService = USAR_API ? remoto : local;

    export default gastosService;