# ===== Stage 1: Build =====
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

# ===== Stage 2: Production =====
FROM eclipse-temurin:17-jre AS production
WORKDIR /app
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -s /bin/sh appuser
COPY --from=build /app/target/*.jar app.jar
USER appuser
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8081/api/auth/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
