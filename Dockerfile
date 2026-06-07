FROM eclipse-temurin:21-jre-jammy
ARG BUILD_VERSION=2026-06-07-02
WORKDIR /app
RUN addgroup --system appuser && adduser --system --group appuser
COPY --chown=appuser:appuser target/app.jar app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
