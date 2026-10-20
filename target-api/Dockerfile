# syntax=docker/dockerfile:1
# Build context is the repository root.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY target-api target-api
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -f target-api/pom.xml -DskipTests package

FROM eclipse-temurin:21-jre
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /build/target-api/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
