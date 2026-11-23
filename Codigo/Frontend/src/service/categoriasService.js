/**
 * Acesso à biblioteca de categorias (gasto/receita), salva no back-end.
 *
 * As telas de Gastos e Receitas usam este serviço para carregar as categorias
 * do usuário e para o gerenciador (adicionar, renomear, trocar ícone, remover).
 * O tipo é "gasto" ou "receita".
 */
import { categoriasApi } from "./Api";

export const TIPO_GASTO = "gasto";
export const TIPO_RECEITA = "receita";

function normalizar(categoria) {
  return {
    id: categoria.id,
    tipo: categoria.tipo,
    nome: categoria.nome,
    icone: categoria.icone || "Tag",
    ordem: categoria.ordem ?? 0,
  };
}

const categoriasService = {
  async listar(tipo) {
    const lista = await categoriasApi.listar(tipo);
    return lista.map(normalizar);
  },

  async criar(tipo, { nome, icone }) {
    return normalizar(await categoriasApi.criar(tipo, { nome, icone }));
  },

  async atualizar(tipo, id, { nome, icone }) {
    return normalizar(await categoriasApi.atualizar(tipo, id, { nome, icone }));
  },

  async excluir(tipo, id) {
    await categoriasApi.excluir(tipo, id);
  },
};

export default categoriasService;
