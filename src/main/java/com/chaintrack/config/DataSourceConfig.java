package com.chaintrack.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Value("${SPRING_DATASOURCE_URL:${POSTGRES_URL:${DATABASE_URL:${DB_URL:}}}}")
    private String databaseUrl;

    @Value("${SPRING_DATASOURCE_USERNAME:${POSTGRES_USER:${DB_USERNAME:}}}")
    private String username;

    @Value("${SPRING_DATASOURCE_PASSWORD:${POSTGRES_PASSWORD:${DB_PASSWORD:}}}")
    private String password;

    @Bean
    @Primary
    @Profile("!test")
    public DataSource dataSource() {
        String url = databaseUrl;

        // Ensure JDBC prefix for PostgreSQL
        if (url != null && !url.isEmpty() && !url.startsWith("jdbc:")) {
            if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
                url = "jdbc:" + url;
            } else if (!url.contains("://")) {
                url = "jdbc:postgresql://" + url;
            }
        }

        if (url == null || url.isEmpty()) {
            throw new IllegalStateException("Database URL is not configured. Set SPRING_DATASOURCE_URL, POSTGRES_URL, DATABASE_URL, or DB_URL environment variable.");
        }

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(url)
                .username(username)
                .password(password)
                .build();
    }

    @Bean
    @Profile("test")
    public DataSource testDataSource() {
        return DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE")
                .username("sa")
                .password("")
                .build();
    }
}