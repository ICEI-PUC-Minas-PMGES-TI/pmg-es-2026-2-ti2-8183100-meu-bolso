package Projeto.MeuBolso.whatsapp;

import org.springframework.data.mongodb.repository.MongoRepository;

/** Estado das conversas do bot, uma por chat (id = chatId do WAHA). */
public interface ConversaWhatsAppRepository extends MongoRepository<ConversaWhatsApp, String> {}
