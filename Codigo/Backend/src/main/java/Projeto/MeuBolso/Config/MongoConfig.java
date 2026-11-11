package Projeto.MeuBolso.Config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;

@Configuration
public class MongoConfig {

    private final MappingMongoConverter mappingMongoConverter;

    public MongoConfig(MappingMongoConverter mappingMongoConverter) {
        this.mappingMongoConverter = mappingMongoConverter;
    }

    // Permite chaves de Map com ponto (ex.: contagem de cédulas "0.5"),
    // substituindo o ponto por "_DOT_" ao gravar no MongoDB.
    @PostConstruct
    public void configurarMapKeyDotReplacement() {
        mappingMongoConverter.setMapKeyDotReplacement("_DOT_");
    }
}
