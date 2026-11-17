# ======================================================================
# Backend "Meu Bolso" — build multi-stage (Spring Boot 3.3 / Java 21)
#
# Etapa 1 (build): compila o JAR com o Maven wrapper do projeto.
# Etapa 2 (runtime): imagem enxuta só com o JRE 21 e o JAR gerado.
#
# No Render: Runtime = Docker, Root Directory = Codigo/Backend.
# O container escuta na porta definida por $PORT (injetada pela plataforma);
# em local, cai no 8080 (mesmo padrão do application.properties).
# ======================================================================

# ---------- Etapa 1: build ----------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copia primeiro só o necessário para resolver dependências.
# Assim o cache do Docker é reaproveitado enquanto o pom.xml não muda.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline

# Agora o código-fonte e o empacotamento.
COPY src/ src/
RUN ./mvnw -q -B clean package -DskipTests

# ---------- Etapa 2: runtime ----------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Usuário sem privilégios (boa prática: não rodar como root).
RUN useradd --system --no-create-home --uid 10001 spring
USER spring

# Copia o fat jar gerado na etapa de build (nome resiliente a versão).
COPY --from=build /app/target/*.jar app.jar

# A plataforma (Render) injeta a porta em $PORT. Repassa ao Spring via
# server.port; sem $PORT (ex.: docker run local), usa 8080.
ENV JAVA_OPTS=""
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar app.jar"]
