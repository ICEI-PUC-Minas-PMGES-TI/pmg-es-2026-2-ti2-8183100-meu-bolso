package Projeto.MeuBolso.Config;

import Projeto.MeuBolso.service.GastoRecorrenciaService;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import org.bson.Document;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

/**
 * Prepara a coleção "orcamentos" para o modelo POR MÊS (usuarioId, mes).
 *
 * Roda no startup, depois do contexto pronto. É idempotente:
 *  1) migra documentos antigos sem "mes" (orçamento global) para o mês atual;
 *  2) remove o índice único antigo que existia só em "usuarioId" (ele impediria
 *     dois meses do mesmo usuário);
 *  3) garante o índice único composto (usuarioId, mes).
 *
 * O índice não é declarado por anotação no modelo de propósito: a criação
 * automática por anotação conflitava com o índice antigo de mesmo nome.
 */
@Component
public class OrcamentoIndexInitializer implements ApplicationRunner {

    private static final String COLECAO = "orcamentos";
    private static final String INDICE_NOVO = "usuario_mes_unico";

    private final MongoTemplate mongoTemplate;

    public OrcamentoIndexInitializer(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        prepararColecao(mongoTemplate.getCollection(COLECAO), GastoRecorrenciaService.mesAtualChave());
    }

    /**
     * Lógica isolada (recebe a coleção e o mês atual) para ser testável sem
     * precisar mockar o MongoTemplate.
     */
    static void prepararColecao(MongoCollection<Document> orcamentos, String mesAtual) {
        // 1) Migra orçamentos antigos (sem "mes") para o mês atual.
        orcamentos.updateMany(
            new Document("mes", new Document("$exists", false)),
            new Document("$set", new Document("mes", mesAtual)));

        // 2) Remove índices antigos que atrapalham o par (usuarioId, mes).
        //    Qualquer índice único só em "usuarioId" precisa sair.
        for (Document indice : orcamentos.listIndexes()) {
            String nome = indice.getString("name");
            if ("_id_".equals(nome) || INDICE_NOVO.equals(nome)) continue;

            Document chave = indice.get("key", Document.class);
            boolean soUsuarioId = chave != null && chave.size() == 1 && chave.containsKey("usuarioId");
            if (soUsuarioId) {
                orcamentos.dropIndex(nome);
            }
        }

        // 3) Garante o índice único composto (usuarioId, mes).
        orcamentos.createIndex(
            Indexes.ascending("usuarioId", "mes"),
            new IndexOptions().name(INDICE_NOVO).unique(true));
    }
}
