package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.AuthDtos.MensagemResponse;
import Projeto.MeuBolso.model.RecuperacaoDtos.EsqueciSenhaRequest;
import Projeto.MeuBolso.model.RecuperacaoDtos.RedefinirSenhaRequest;
import Projeto.MeuBolso.service.RecuperacaoSenhaService;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Fica em /api/auth, que o SecurityConfig já libera (rotas públicas).
@RestController
@RequestMapping("/api/auth")
public class RecuperacaoSenhaController {

    private final RecuperacaoSenhaService service;

    public RecuperacaoSenhaController(RecuperacaoSenhaService service) {
        this.service = service;
    }

    // Sempre 200 com a mesma mensagem, exista o e-mail ou não.
    @PostMapping("/esqueci-senha")
    public MensagemResponse esqueciSenha(@Valid @RequestBody EsqueciSenhaRequest request) {
        service.solicitar(request.email());
        return new MensagemResponse("Se este e-mail estiver cadastrado, enviaremos um link de recuperação.");
    }

    // 200 se trocou a senha; 400 se o link for inválido, vencido ou já usado.
    @PostMapping("/redefinir-senha")
    public MensagemResponse redefinirSenha(@Valid @RequestBody RedefinirSenhaRequest request) {
        service.redefinir(request.token(), request.novaSenha());
        return new MensagemResponse("Senha redefinida com sucesso.");
    }
}
