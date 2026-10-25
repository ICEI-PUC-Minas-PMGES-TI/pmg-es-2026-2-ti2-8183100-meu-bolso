// Comunicação com o back-end (Spring Boot) e controle da sessão do usuário.

// Endereço da API. Pode ser trocado no arquivo .env (VITE_API_URL).
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

// Chaves usadas no localStorage
const CHAVE_TOKEN = "token";
const CHAVE_USUARIO = "usuario";

/* ========================================
   SESSÃO (token e dados do usuário)
   ======================================== */

export function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function obterUsuario() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIO));
  } catch {
    return null;
  }
}

function salvarSessao({ token, nome, email }) {
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify({ nome, email }));
}

export function sair() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_USUARIO);
}

// O token JWT carrega a data de expiração ("exp", em segundos) no meio dele.
export function estaLogado() {
  const token = obterToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/* ========================================
   REQUISIÇÕES
   ======================================== */

export class ApiError extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

function mensagemDeErro(status, dados) {
  // 400 = validação do back; o detalhe por campo fica em "errors", então usamos uma mensagem simples.
  if (status === 400) return "Confira os dados informados e tente novamente.";
  return dados.message || "Algo deu errado. Tente novamente.";
}

async function requisicao(
  caminho,
  { metodo = "GET", corpo, autenticado = false } = {},
) {
  const headers = {};
  if (corpo !== undefined) headers["Content-Type"] = "application/json";

  if (autenticado) {
    const token = obterToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    // fetch só lança erro quando nem chegou ao servidor (back desligado, CORS, sem rede...)
    throw new ApiError(
      "Não foi possível conectar ao servidor. Tente novamente.",
      0,
    );
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    // Token inválido ou expirado em rota protegida: encerra a sessão local
    if (resposta.status === 401 && autenticado) sair();
    throw new ApiError(mensagemDeErro(resposta.status, dados), resposta.status);
  }

  return dados;
}

/* ========================================
   FUNÇÕES QUE AS TELAS USAM
   ======================================== */

export async function cadastrar({ nome, email, telefone, senha }) {
  return requisicao("/api/auth/register", {
    metodo: "POST",
    corpo: { nome, email, telefone, senha },
  });
}

export async function entrar(email, senha) {
  const dados = await requisicao("/api/auth/login", {
    metodo: "POST",
    corpo: { email, senha },
  });
  salvarSessao(dados); // dados = { token, tipo, nome, email }
  return dados;
}

export async function buscarPerfil() {
  return requisicao("/api/usuarios/me", { autenticado: true });
}

/* ========================================
   RECUPERAÇÃO DE SENHA (rotas públicas)
   ======================================== */

// Pede o envio do e-mail com o link de redefinição. O back responde sempre
// com sucesso, exista o e-mail ou não, para não revelar quem tem conta.
export async function esqueciSenha(email) {
  return requisicao("/api/auth/esqueci-senha", {
    metodo: "POST",
    corpo: { email },
  });
}

// Define a nova senha usando o token que veio no link do e-mail.
// Token inválido, expirado ou já usado: o back responde 400.
export async function redefinirSenha(token, novaSenha) {
  return requisicao("/api/auth/redefinir-senha", {
    metodo: "POST",
    corpo: { token, novaSenha },
  });
}

/* ========================================
   METAS
   ======================================== */

// Lista as metas do usuário logado.
export async function listarMetas() {
  return requisicao("/api/metas", { autenticado: true });
}

// Cria uma meta nova. `dados` = { nome, valorAlvo, prazo, prioridade }.
// O prazo deve ser "YYYY-MM-DD" ou null.
export async function criarMeta(dados) {
  return requisicao("/api/metas", {
    metodo: "POST",
    corpo: dados,
    autenticado: true,
  });
}

// Atualiza os dados básicos de uma meta existente.
export async function atualizarMeta(id, dados) {
  return requisicao(`/api/metas/${id}`, {
    metodo: "PUT",
    corpo: dados,
    autenticado: true,
  });
}

// Exclui uma meta pelo id.
export async function excluirMeta(id) {
  return requisicao(`/api/metas/${id}`, {
    metodo: "DELETE",
    autenticado: true,
  });
}

/* ========================================
   PERFIL
   ======================================== */

// Atualiza nome, email e telefone. `dados` = { nome, email, telefone }.
// O back-end reemite o token (o e-mail pode ter mudado); atualizamos a
// sessão local para refletir os novos dados em todas as telas.
export async function atualizarPerfil(dados) {
  const perfil = await requisicao("/api/usuarios/me", {
    metodo: "PUT",
    corpo: dados,
    autenticado: true,
  });

  if (perfil?.token) {
    localStorage.setItem(CHAVE_TOKEN, perfil.token);
  }
  localStorage.setItem(
    CHAVE_USUARIO,
    JSON.stringify({ nome: perfil.nome, email: perfil.email }),
  );

  return perfil;
}

// Troca a senha. `dados` = { senhaAtual, novaSenha }.
export async function trocarSenha(dados) {
  return requisicao("/api/usuarios/me/senha", {
    metodo: "PUT",
    corpo: dados,
    autenticado: true,
  });
}

/* ========================================
   GASTOS, RECORRÊNCIAS E ORÇAMENTO
   (usados por service/gastosService.js quando VITE_GASTOS_API=true)
   ======================================== */

export const gastosApi = {
  // O back-end gera as recorrências que já venceram antes de devolver a lista
  listar: () => requisicao("/api/gastos", { autenticado: true }),

  criar: (corpo) =>
    requisicao("/api/gastos", { metodo: "POST", corpo, autenticado: true }),

  atualizar: (id, corpo) =>
    requisicao(`/api/gastos/${id}`, {
      metodo: "PUT",
      corpo,
      autenticado: true,
    }),

  atualizarComentario: (id, comentario) =>
    requisicao(`/api/gastos/${id}/comentario`, {
      metodo: "PATCH",
      corpo: { comentario },
      autenticado: true,
    }),

  excluir: (id) =>
    requisicao(`/api/gastos/${id}`, { metodo: "DELETE", autenticado: true }),

  listarRecorrentes: () =>
    requisicao("/api/gastos/recorrentes", { autenticado: true }),

  atualizarRecorrente: (id, corpo) =>
    requisicao(`/api/gastos/recorrentes/${id}`, {
      metodo: "PUT",
      corpo,
      autenticado: true,
    }),

  excluirRecorrente: (id) =>
    requisicao(`/api/gastos/recorrentes/${id}`, {
      metodo: "DELETE",
      autenticado: true,
    }),

  obterOrcamento: () => requisicao("/api/orcamento", { autenticado: true }),

  salvarOrcamento: (valorMensal) =>
    requisicao("/api/orcamento", {
      metodo: "PUT",
      corpo: { valorMensal },
      autenticado: true,
    }),
};
