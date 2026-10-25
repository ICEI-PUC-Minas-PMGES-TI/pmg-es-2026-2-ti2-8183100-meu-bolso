// Resolve a posição de destaque "efetiva" de cada conta.
// Contas com posição válida mantêm a sua; as posições livres
// (principal, secundaria, terciaria) são preenchidas, na ordem,
// pelas contas sem posição, na ordem original da lista.

export const ORDEM_POSICAO = ["principal", "secundaria", "terciaria"];

/**
 * @param {Array} contas lista de contas
 * @returns {Array} mesmas contas com o campo extra `posicaoEfetiva`
 *   (uma de ORDEM_POSICAO ou null para as que sobrarem).
 */
export function posicaoEfetiva(contas = []) {
  const fixas = new Set(
    contas.map((c) => c.posicao).filter((p) => ORDEM_POSICAO.includes(p))
  );
  const livres = ORDEM_POSICAO.filter((p) => !fixas.has(p));

  let i = 0;
  return contas.map((c) => {
    if (ORDEM_POSICAO.includes(c.posicao)) {
      return { ...c, posicaoEfetiva: c.posicao };
    }
    const efetiva = i < livres.length ? livres[i++] : null;
    return { ...c, posicaoEfetiva: efetiva };
  });
}
