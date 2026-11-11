package Projeto.MeuBolso.Config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mongodb.client.ListIndexesIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.IndexOptions;
import java.util.Iterator;
import java.util.List;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Garante que o inicializador prepara a coleção "orcamentos" para o modelo por
 * mês: migra docs antigos, dropa o índice único só de usuarioId e cria o índice
 * composto (usuarioId, mes). Mocka apenas a MongoCollection (interface), pois o
 * Mockito não mocka a classe concreta MongoTemplate no JDK atual.
 */
@ExtendWith(MockitoExtension.class)
class OrcamentoIndexInitializerTest {

    @Mock
    MongoCollection<Document> orcamentos;

    @SuppressWarnings("unchecked")
    private void comIndices(Document... indices) {
        ListIndexesIterable<Document> iterable = mock(ListIndexesIterable.class);
        MongoCursor<Document> cursor = mock(MongoCursor.class);

        Iterator<Document> it = List.of(indices).iterator();
        when(iterable.iterator()).thenReturn(cursor);
        when(cursor.hasNext()).thenAnswer(inv -> it.hasNext());
        when(cursor.next()).thenAnswer(inv -> it.next());

        when(orcamentos.listIndexes()).thenReturn(iterable);
    }

    private static Document indice(String nome, Document chave, boolean unico) {
        Document d = new Document("name", nome).append("key", chave);
        if (unico) d.append("unique", true);
        return d;
    }

    @Test
    void migraDocsAntigosDropaIndiceAntigoECriaComposto() {
        comIndices(
            indice("_id_", new Document("_id", 1), false),
            indice("usuarioId", new Document("usuarioId", 1), true));

        OrcamentoIndexInitializer.prepararColecao(orcamentos, "2026-11");

        // Migra documentos sem "mes" (um updateMany com filtro $exists:false).
        verify(orcamentos).updateMany(any(Bson.class), any(Bson.class));
        // Dropa o índice antigo só de usuarioId, mas nunca o _id_.
        verify(orcamentos).dropIndex("usuarioId");
        verify(orcamentos, never()).dropIndex("_id_");
        // Cria o índice composto único (usuarioId, mes).
        verify(orcamentos).createIndex(any(Bson.class), any(IndexOptions.class));
    }

    @Test
    void naoDropaOProprioIndiceCompostoNemOId() {
        comIndices(
            indice("_id_", new Document("_id", 1), false),
            indice("usuario_mes_unico", new Document("usuarioId", 1).append("mes", 1), true));

        OrcamentoIndexInitializer.prepararColecao(orcamentos, "2026-11");

        verify(orcamentos, never()).dropIndex(eq("usuario_mes_unico"));
        verify(orcamentos, never()).dropIndex(eq("_id_"));
        verify(orcamentos).createIndex(any(Bson.class), any(IndexOptions.class));
    }
}
