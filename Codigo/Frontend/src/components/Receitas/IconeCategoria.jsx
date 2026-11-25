import { createElement } from "react";

import { ICONES_CATEGORIAS } from "../../pages/Receitas/Constantes";
import { iconeDe } from "../../data/categoriaIcones";
import { TIPO_RECEITA, useCategorias } from "../../service/categoriasService";

/**
 * Ícone de uma categoria de receita: o que o usuário escolheu na biblioteca
 * ("Gerenciar"). Enquanto a biblioteca carrega, ou se a categoria não estiver
 * nela, usa o ícone padrão da categoria (ou o de "Outros").
 */
export default function IconeCategoria({ categoria, tamanho = 18 }) {
  const biblioteca = useCategorias(TIPO_RECEITA);
  const daBiblioteca = biblioteca?.find((c) => c.nome === categoria);
  const Icone = daBiblioteca
    ? iconeDe(daBiblioteca.icone)
    : ICONES_CATEGORIAS[categoria] ?? ICONES_CATEGORIAS.Outros;

  // createElement: o componente vem de um mapa fixo, não é criado aqui.
  return createElement(Icone, { size: tamanho, strokeWidth: 2, "aria-hidden": true });
}
