package Projeto.MeuBolso.whatsapp;

import Projeto.MeuBolso.assistente.FormatoBRL;
import Projeto.MeuBolso.whatsapp.ConversaWhatsApp.Etapa;
import Projeto.MeuBolso.whatsapp.ConversaWhatsApp.Operacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Máquina de estados da conversa do chatbot (menu numerado por texto).
 *
 * Recebe a conversa (estado atual) e o texto enviado, altera a conversa e
 * devolve a resposta a ser enviada. Não acessa banco nem WhatsApp diretamente:
 * as regras de negócio vêm de {@link OperacoesChatbot}.
 *
 * Fluxos (o "0" cancela e volta ao menu em qualquer etapa):
 *  1 Receita / 2 Gasto : valor -> categoria -> descrição -> carteira -> confirmação
 *  3 Depósito em meta  : valor -> meta -> conta -> confirmação
 *  4 Retirada de meta  : valor -> meta -> conta -> confirmação
 *  5 Transferência     : valor -> conta de origem -> conta de destino -> confirmação
 *  6 Saldos e metas    : mostra e volta ao menu
 */
public class FluxoChatbot {

    // Mesmas listas do front (pages/Gastos/Constantes.js e pages/Receitas/Constantes.js).
    static final List<String> CATEGORIAS_GASTO = List.of(
        "Alimentação", "Transporte", "Lazer", "Moradia", "Educação", "Saúde", "Assinaturas", "Outros");
    static final List<String> CATEGORIAS_RECEITA = List.of(
        "Salário", "Freelance", "Investimentos", "Presente", "Reembolso", "Vendas", "Outros");

    static final int TAMANHO_MAX_DESCRICAO = 200;

    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.forLanguageTag("pt-BR"));

    static final String MENU = """
        O que você deseja fazer?

        1 - Registrar depósito (receita)
        2 - Registrar gasto
        3 - Depositar em uma meta
        4 - Retirar de uma meta
        5 - Transferir entre contas
        6 - Ver saldos e metas

        Responda com o número da opção. Envie 0 a qualquer momento para cancelar.""";

    private final OperacoesChatbot ops;

    public FluxoChatbot(OperacoesChatbot ops) {
        this.ops = ops;
    }

    /**
     * Processa uma mensagem do usuário.
     *
     * @param c           conversa (estado); é alterada por este método
     * @param texto       texto recebido
     * @param nomeUsuario nome do usuário, para a saudação
     * @return resposta a enviar
     */
    public String processar(ConversaWhatsApp c, String texto, String nomeUsuario) {
        String t = texto == null ? "" : texto.trim();

        // Primeira mensagem (ou após expirar): qualquer texto chama o bot.
        if (c.getEtapa() == null || c.getEtapa() == Etapa.OCIOSO) {
            c.limparOperacao(Etapa.MENU);
            return saudacao(nomeUsuario) + " Eu sou o bot do Meu Bolso. 💰\n\n" + MENU;
        }

        if (ehCancelamento(t)) {
            boolean havia = c.getEtapa() != Etapa.MENU;
            c.limparOperacao(Etapa.MENU);
            return (havia ? "Operação cancelada.\n\n" : "") + MENU;
        }

        return switch (c.getEtapa()) {
            case MENU -> escolherOperacao(c, t);
            case VALOR -> informarValor(c, t);
            case CATEGORIA -> escolherCategoria(c, t);
            case DESCRICAO -> informarDescricao(c, t);
            case META -> escolherMeta(c, t);
            case CARTEIRA -> escolherCarteira(c, t);
            case DESTINO -> escolherDestino(c, t);
            case CONFIRMACAO -> confirmar(c, t);
            default -> {
                c.limparOperacao(Etapa.MENU);
                yield MENU;
            }
        };
    }

    /* ------------------------------------------------------------------ */
    /* Etapas                                                              */
    /* ------------------------------------------------------------------ */

    private String escolherOperacao(ConversaWhatsApp c, String t) {
        Integer n = numero(t);
        if (n == null || n < 1 || n > Operacao.values().length) {
            return "Não entendi. 🤔\n\n" + MENU;
        }
        Operacao op = Operacao.values()[n - 1];
        String usuarioId = c.getUsuarioId();

        if (op == Operacao.SALDOS) {
            return resumoSaldos(usuarioId) + "\n\n" + MENU;
        }

        // Pré-requisitos: avisa logo, antes de pedir o valor.
        switch (op) {
            case RECEITA, GASTO -> {
                if (ops.carteirasDeLancamento(usuarioId).isEmpty()) {
                    return semCadastro("uma conta, cartão ou dinheiro", "Carteiras");
                }
            }
            case META_DEPOSITO, META_RETIRADA -> {
                if (ops.metas(usuarioId).isEmpty()) return semCadastro("uma meta", "Metas");
                if (ops.contas(usuarioId).isEmpty()) return semCadastro("uma conta bancária", "Carteiras");
            }
            case TRANSFERENCIA -> {
                if (ops.contas(usuarioId).size() < 2) return semCadastro("pelo menos duas contas bancárias", "Carteiras");
            }
            default -> { }
        }

        c.setOperacao(op);
        c.setEtapa(Etapa.VALOR);
        return switch (op) {
            case RECEITA -> "Qual o valor do depósito? (ex.: 150,00)";
            case GASTO -> "Qual o valor do gasto? (ex.: 25,90)";
            case META_DEPOSITO -> "Quanto você quer depositar na meta? (ex.: 100,00)";
            case META_RETIRADA -> "Quanto você quer retirar da meta? (ex.: 50,00)";
            case TRANSFERENCIA -> "Qual o valor da transferência? (ex.: 200,00)";
            default -> MENU;
        };
    }

    private String informarValor(ConversaWhatsApp c, String t) {
        Optional<BigDecimal> valor = ValorMonetario.interpretar(t);
        if (valor.isEmpty()) {
            return "Valor inválido. Envie só o número, por exemplo: 25,90";
        }
        c.setValor(valor.get());

        return switch (c.getOperacao()) {
            case RECEITA, GASTO -> mostrarCategorias(c);
            case META_DEPOSITO, META_RETIRADA -> mostrarMetas(c);
            case TRANSFERENCIA -> mostrarLista(c, Etapa.CARTEIRA, ops.contas(c.getUsuarioId()),
                "De qual conta vai sair o dinheiro?");
            default -> MENU;
        };
    }

    private String escolherCategoria(ConversaWhatsApp c, String t) {
        Opcao escolhida = escolher(c, t);
        if (escolhida == null) return opcaoInvalida(c, "Escolha a categoria:");
        c.setCategoria(escolhida.nome());
        c.setEtapa(Etapa.DESCRICAO);
        c.setOpcoes(List.of());
        return "Escreva uma descrição curta (ex.: Mercado do mês).\n"
            + "Ou envie - para usar \"" + escolhida.nome() + "\".";
    }

    private String informarDescricao(ConversaWhatsApp c, String t) {
        if (t.isEmpty()) return "Escreva uma descrição ou envie - para usar \"" + c.getCategoria() + "\".";
        String descricao = "-".equals(t) ? c.getCategoria() : t;
        if (descricao.length() > TAMANHO_MAX_DESCRICAO) {
            return "A descrição pode ter no máximo " + TAMANHO_MAX_DESCRICAO + " caracteres. Tente uma mais curta.";
        }
        c.setDescricao(descricao);
        String pergunta = c.getOperacao() == Operacao.RECEITA
            ? "Em qual carteira o dinheiro entrou?"
            : "De qual carteira o dinheiro saiu?";
        return mostrarLista(c, Etapa.CARTEIRA, ops.carteirasDeLancamento(c.getUsuarioId()), pergunta);
    }

    private String escolherMeta(ConversaWhatsApp c, String t) {
        Opcao meta = escolher(c, t);
        if (meta == null) return opcaoInvalida(c, "Escolha a meta:");

        boolean deposito = c.getOperacao() == Operacao.META_DEPOSITO;
        if (!deposito && meta.valor() != null && c.getValor().compareTo(meta.valor()) > 0) {
            return "A meta " + meta.nome() + " tem só " + FormatoBRL.moeda(meta.valor())
                + " guardado. Escolha outra meta ou envie 0 para cancelar.\n\n" + lista(c.getOpcoes());
        }
        c.setMeta(meta);
        String pergunta = deposito
            ? "De qual conta vai sair o dinheiro?"
            : "Para qual conta vai o dinheiro?";
        return mostrarLista(c, Etapa.CARTEIRA, ops.contas(c.getUsuarioId()), pergunta);
    }

    private String escolherCarteira(ConversaWhatsApp c, String t) {
        Opcao carteira = escolher(c, t);
        if (carteira == null) return opcaoInvalida(c, "Escolha a carteira:");

        // Quando o dinheiro sai de uma conta para a meta/outra conta, valida o saldo já aqui.
        boolean saiDaConta = c.getOperacao() == Operacao.META_DEPOSITO || c.getOperacao() == Operacao.TRANSFERENCIA;
        if (saiDaConta && carteira.valor() != null && c.getValor().compareTo(carteira.valor()) > 0) {
            return "Saldo insuficiente em " + carteira.nome() + " (" + FormatoBRL.moeda(carteira.valor())
                + "). Escolha outra conta ou envie 0 para cancelar.\n\n" + lista(c.getOpcoes());
        }
        c.setCarteira(carteira);

        if (c.getOperacao() == Operacao.TRANSFERENCIA) {
            List<Opcao> destinos = ops.contas(c.getUsuarioId()).stream()
                .filter(o -> !o.id().equals(carteira.id()))
                .toList();
            return mostrarLista(c, Etapa.DESTINO, destinos, "Para qual conta vai o dinheiro?");
        }
        return mostrarConfirmacao(c);
    }

    private String escolherDestino(ConversaWhatsApp c, String t) {
        Opcao destino = escolher(c, t);
        if (destino == null) return opcaoInvalida(c, "Escolha a conta de destino:");
        c.setDestino(destino);
        return mostrarConfirmacao(c);
    }

    private String confirmar(ConversaWhatsApp c, String t) {
        if ("2".equals(t)) {
            c.limparOperacao(Etapa.MENU);
            return "Operação cancelada.\n\n" + MENU;
        }
        if (!"1".equals(t)) {
            return "Responda 1 para confirmar ou 2 para cancelar.";
        }

        String usuarioId = c.getUsuarioId();
        String sucesso;
        try {
            sucesso = switch (c.getOperacao()) {
                case RECEITA -> {
                    ops.registrarReceita(usuarioId, c.getValor(), c.getCategoria(), c.getDescricao(), c.getCarteira(), ops.hoje());
                    yield "✅ Depósito de " + FormatoBRL.moeda(c.getValor()) + " registrado em " + c.getCarteira().nome() + ".";
                }
                case GASTO -> {
                    ops.registrarGasto(usuarioId, c.getValor(), c.getCategoria(), c.getDescricao(), c.getCarteira(), ops.hoje());
                    yield "✅ Gasto de " + FormatoBRL.moeda(c.getValor()) + " registrado em " + c.getCarteira().nome() + ".";
                }
                case META_DEPOSITO, META_RETIRADA -> {
                    boolean deposito = c.getOperacao() == Operacao.META_DEPOSITO;
                    BigDecimal guardado = ops.movimentarMeta(usuarioId, c.getMeta().id(), deposito, c.getValor(), c.getCarteira().id());
                    yield "✅ " + (deposito ? "Depósito" : "Retirada") + " de " + FormatoBRL.moeda(c.getValor())
                        + (deposito ? " na" : " da") + " meta " + c.getMeta().nome() + " registrado.\n"
                        + "Agora a meta tem " + FormatoBRL.moeda(guardado) + " guardado.";
                }
                case TRANSFERENCIA -> {
                    ops.transferir(usuarioId, c.getCarteira().id(), c.getDestino().id(), c.getValor());
                    yield "✅ Transferência de " + FormatoBRL.moeda(c.getValor()) + " de "
                        + c.getCarteira().nome() + " para " + c.getDestino().nome() + " registrada.";
                }
                default -> "";
            };
        } catch (ResponseStatusException e) {
            c.limparOperacao(Etapa.MENU);
            String motivo = e.getReason() == null ? "tente novamente." : e.getReason();
            return "❌ Não foi possível concluir: " + motivo + "\n\n" + MENU;
        }

        c.limparOperacao(Etapa.MENU);
        return sucesso + "\n\nPosso ajudar em algo mais?\n\n" + MENU;
    }

    /* ------------------------------------------------------------------ */
    /* Listas e textos                                                     */
    /* ------------------------------------------------------------------ */

    private String mostrarCategorias(ConversaWhatsApp c) {
        List<String> nomes = c.getOperacao() == Operacao.RECEITA ? CATEGORIAS_RECEITA : CATEGORIAS_GASTO;
        List<Opcao> opcoes = nomes.stream().map(n -> new Opcao(n, n, "", null)).toList();
        return mostrarLista(c, Etapa.CATEGORIA, opcoes, "Qual a categoria?");
    }

    private String mostrarMetas(ConversaWhatsApp c) {
        String pergunta = c.getOperacao() == Operacao.META_DEPOSITO
            ? "Em qual meta vai entrar o dinheiro?"
            : "De qual meta vai sair o dinheiro?";
        return mostrarLista(c, Etapa.META, ops.metas(c.getUsuarioId()), pergunta);
    }

    private String mostrarLista(ConversaWhatsApp c, Etapa etapa, List<Opcao> opcoes, String pergunta) {
        if (opcoes.isEmpty()) {
            c.limparOperacao(Etapa.MENU);
            return "Não encontrei opções disponíveis para continuar. Confira seus cadastros no site.\n\n" + MENU;
        }
        c.setEtapa(etapa);
        c.setOpcoes(opcoes);
        return pergunta + "\n\n" + lista(opcoes);
    }

    private String mostrarConfirmacao(ConversaWhatsApp c) {
        c.setEtapa(Etapa.CONFIRMACAO);
        c.setOpcoes(List.of());
        String valor = FormatoBRL.moeda(c.getValor());
        String hoje = ops.hoje().format(DATA_BR);

        String corpo = switch (c.getOperacao()) {
            case RECEITA -> "Confirma o depósito?\n\n"
                + "💰 Valor: " + valor + "\n"
                + "🏷️ Categoria: " + c.getCategoria() + "\n"
                + "📝 Descrição: " + c.getDescricao() + "\n"
                + "💳 Carteira: " + c.getCarteira().nome() + "\n"
                + "📅 Data: " + hoje;
            case GASTO -> "Confirma o gasto?\n\n"
                + "💸 Valor: " + valor + "\n"
                + "🏷️ Categoria: " + c.getCategoria() + "\n"
                + "📝 Descrição: " + c.getDescricao() + "\n"
                + "💳 Carteira: " + c.getCarteira().nome() + "\n"
                + "📅 Data: " + hoje;
            case META_DEPOSITO -> "Confirma o depósito na meta?\n\n"
                + "💰 Valor: " + valor + "\n"
                + "🎯 Meta: " + c.getMeta().nome() + "\n"
                + "🏦 Sai da conta: " + c.getCarteira().nome();
            case META_RETIRADA -> "Confirma a retirada da meta?\n\n"
                + "💰 Valor: " + valor + "\n"
                + "🎯 Meta: " + c.getMeta().nome() + "\n"
                + "🏦 Vai para a conta: " + c.getCarteira().nome();
            case TRANSFERENCIA -> "Confirma a transferência?\n\n"
                + "💰 Valor: " + valor + "\n"
                + "⬅️ De: " + c.getCarteira().nome() + "\n"
                + "➡️ Para: " + c.getDestino().nome();
            default -> "";
        };
        return corpo + "\n\n1 - Confirmar\n2 - Cancelar";
    }

    private String resumoSaldos(String usuarioId) {
        StringBuilder sb = new StringBuilder("📊 Seus saldos\n");
        List<Opcao> contas = ops.contas(usuarioId);
        if (contas.isEmpty()) {
            sb.append("\nNenhuma conta bancária cadastrada.");
        } else {
            BigDecimal total = BigDecimal.ZERO;
            for (Opcao conta : contas) {
                sb.append("\n🏦 ").append(conta.nome()).append(": ").append(FormatoBRL.moeda(conta.valor()));
                total = total.add(conta.valor());
            }
            sb.append("\nTotal em contas: ").append(FormatoBRL.moeda(total));
        }

        sb.append("\n\n🎯 Suas metas\n");
        List<Opcao> metas = ops.metas(usuarioId);
        if (metas.isEmpty()) {
            sb.append("\nNenhuma meta cadastrada.");
        } else {
            for (Opcao meta : metas) {
                sb.append("\n• ").append(meta.nome()).append(": ").append(meta.detalhe());
            }
        }
        return sb.toString();
    }

    private String opcaoInvalida(ConversaWhatsApp c, String pergunta) {
        return "Opção inválida. " + pergunta + "\n\n" + lista(c.getOpcoes());
    }

    private String semCadastro(String oQue, String pagina) {
        return "Para isso, cadastre antes " + oQue + " na página " + pagina
            + " do site e tente de novo.\n\n" + MENU;
    }

    /** "1 - Nubank (saldo R$ 120,00)" para cada opção. */
    static String lista(List<Opcao> opcoes) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < opcoes.size(); i++) {
            Opcao o = opcoes.get(i);
            if (i > 0) sb.append('\n');
            sb.append(i + 1).append(" - ").append(o.nome());
            if (o.detalhe() != null && !o.detalhe().isBlank()) sb.append(" (").append(o.detalhe()).append(')');
        }
        sb.append("\n\nResponda com o número.");
        return sb.toString();
    }

    private static Opcao escolher(ConversaWhatsApp c, String t) {
        Integer n = numero(t);
        List<Opcao> opcoes = c.getOpcoes();
        if (n == null || opcoes == null || n < 1 || n > opcoes.size()) return null;
        return opcoes.get(n - 1);
    }

    private static Integer numero(String t) {
        if (t == null || !t.matches("\\d{1,3}")) return null;
        return Integer.parseInt(t);
    }

    private static boolean ehCancelamento(String t) {
        String s = t.toLowerCase(Locale.ROOT);
        return s.equals("0") || s.equals("menu") || s.equals("cancelar") || s.equals("sair");
    }

    private static String saudacao(String nome) {
        if (nome == null || nome.isBlank()) return "Olá!";
        return "Olá, " + nome.trim().split("\\s+")[0] + "!";
    }
}
