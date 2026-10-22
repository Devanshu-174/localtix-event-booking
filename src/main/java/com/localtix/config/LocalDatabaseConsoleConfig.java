package com.localtix.config;

import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.expression.WebExpressionAuthorizationManager;

/** Database inspection for the local H2 profile only. */
@Configuration
@Profile("h2")
public class LocalDatabaseConsoleConfig {

  @Bean
  @Order(1)
  SecurityFilterChain localDatabaseConsole(HttpSecurity http) throws Exception {
    return http
      .securityMatcher(PathRequest.toH2Console())
      .authorizeHttpRequests(auth ->
        auth
          .anyRequest()
          .access(
            new WebExpressionAuthorizationManager(
              "hasIpAddress('127.0.0.1') or hasIpAddress('::1')"
            )
          )
      )
      .csrf(csrf -> csrf.disable())
      .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
      .build();
  }
}
