/**
 * Acesso à biblioteca de categorias (gasto/receita), salva no back-end.
 *
 * As telas usam este serviço para carregar as categorias do usuário e para o
 * gerenciador (adicionar, renomear, trocar ícone, remover). O tipo é "gasto"
 * ou "receita".
 *
 * Também guarda uma cópia em memória das duas bibliotecas (useCategorias), para
 * que ícones, filtros e o simulador usem as categorias do usuário sem cada
 * componente buscar a lista de novo. Criar, renomear ou remover recarrega a
 * cópia na hora.
 */
import { useEffect, useSyncExternalStore } from "react";

import { categoriasApi, obterUsuario } from "./Api";

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

/* ---------- Cópia em memória das bibliotecas ---------- */

// Por tipo: { dono, lista } (lista = null enquanto não carregou).
const cache = { [TIPO_GASTO]: { dono: null, lista: null }, [TIPO_RECEITA]: { dono: null, lista: null } };
const emAndamento = {};
const ouvintes = new Set();

// Dono da cópia: evita mostrar as categorias de outra conta depois de trocar de login.
function usuarioAtual() {
  const usuario = obterUsuario();
  return usuario?.id ?? usuario?.email ?? null;
}

function avisar() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

function inscrever(ouvinte) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

/** Lista em memória do tipo, ou null se ainda não carregou (ou é de outra conta). */
export function categoriasEmMemoria(tipo) {
  const entrada = cache[tipo];
  return entrada && entrada.dono === usuarioAtual() ? entrada.lista : null;
}

/** Busca a biblioteca do tipo e atualiza a cópia (não repete se já tiver). */
export function carregarCategorias(tipo, forcar = false) {
  const dono = usuarioAtual();
  if (!dono) return Promise.resolve(null);
  if (!forcar && cache[tipo].dono === dono && cache[tipo].lista) {
    return Promise.resolve(cache[tipo].lista);
  }
  if (emAndamento[tipo]) return emAndamento[tipo];

  emAndamento[tipo] = categoriasApi
    .listar(tipo)
    .then((lista) => {
      cache[tipo] = { dono, lista: lista.map(normalizar) };
      avisar();
      return cache[tipo].lista;
    })
    .catch(() => null)
    .finally(() => {
      emAndamento[tipo] = null;
    });
  return emAndamento[tipo];
}

/**
 * Hook: biblioteca do tipo ([{ id, nome, icone, ... }]) ou null enquanto
 * carrega. Atualiza sozinho quando a biblioteca muda em "Gerenciar".
 */
export function useCategorias(tipo) {
  const lista = useSyncExternalStore(inscrever, () => categoriasEmMemoria(tipo));
  useEffect(() => {
    carregarCategorias(tipo);
  }, [tipo]);
  return lista;
}

/* ---------- API ---------- */

const categoriasService = {
  async listar(tipo) {
    const lista = (await categoriasApi.listar(tipo)).map(normalizar);
    const dono = usuarioAtual();
    if (dono) {
      cache[tipo] = { dono, lista };
      avisar();
    }
    return lista;
  },

  async criar(tipo, { nome, icone }) {
    const criada = normalizar(await categoriasApi.criar(tipo, { nome, icone }));
    await carregarCategorias(tipo, true);
    return criada;
  },

  async atualizar(tipo, id, { nome, icone }) {
    const atualizada = normalizar(await categoriasApi.atualizar(tipo, id, { nome, icone }));
    await carregarCategorias(tipo, true);
    return atualizada;
  },

  async excluir(tipo, id) {
    await categoriasApi.excluir(tipo, id);
    await carregarCategorias(tipo, true);
  },
};

export default categoriasService;
