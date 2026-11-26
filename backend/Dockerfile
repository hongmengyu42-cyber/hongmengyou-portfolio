# syntax=docker/dockerfile:1

# ---- Build stage: JDK 17 + a pinned Maven (no Maven Wrapper needed) ----
FROM eclipse-temurin:17-jdk AS build
ARG MAVEN_VERSION=3.9.11
RUN curl -fsSL "https://archive.apache.org/dist/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz" \
      | tar -xz -C /opt \
 && ln -s "/opt/apache-maven-${MAVEN_VERSION}/bin/mvn" /usr/local/bin/mvn
WORKDIR /build
COPY pom.xml .
COPY src ./src
# The cache mount keeps downloaded dependencies between builds, so rebuilds take seconds instead of minutes.
# Tests are skipped here on purpose: run `mvn verify` in CI or locally before you deploy.
RUN --mount=type=cache,target=/root/.m2 mvn -B -DskipTests package \
 && cp target/portfolio-api-*.jar /app.jar

# ---- Runtime stage: JRE only, non-root user ----
FROM eclipse-temurin:17-jre
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --no-create-home app \
 && mkdir -p /data/uploads \
 && chown -R app:app /data
WORKDIR /app
COPY --from=build /app.jar /app/app.jar
USER app
ENV SPRING_PROFILES_ACTIVE=prod \
    STORAGE_ROOT=/data/uploads \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -Djava.awt.headless=true"
EXPOSE 8080
VOLUME /data/uploads
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD curl -fsS http://localhost:8080/actuator/health/readiness || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
