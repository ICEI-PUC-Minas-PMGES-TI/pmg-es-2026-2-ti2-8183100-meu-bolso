/**
 * De onde vêm os gastos e as receitas: API (padrão) ou localStorage.
 *
 * A API é o padrão: os dados ficam no back-end (MongoDB), valem em
 * qualquer navegador e são os mesmos que o bot do WhatsApp, o resumo
 * semanal e o assistente enxergam.
 *
 * O localStorage existe só como modo de desenvolvimento sem back-end
 * e precisa ser pedido de forma EXPLÍCITA no .env do Frontend:
 *   VITE_GASTOS_API=false    -> gastos (e receitas) no localStorage
 *   VITE_RECEITAS_API=false  -> só as receitas no localStorage
 * Qualquer outro valor, ou a variável ausente, usa a API.
 */

const env = import.meta.env;

const desligado = (valor) => String(valor ?? "").trim().toLowerCase() === "false";

export const USAR_API_GASTOS = !desligado(env.VITE_GASTOS_API);

// As receitas seguem os gastos, a menos que tenham configuração própria.
export const USAR_API_RECEITAS =
  env.VITE_RECEITAS_API === undefined || env.VITE_RECEITAS_API === ""
    ? USAR_API_GASTOS
    : !desligado(env.VITE_RECEITAS_API);
