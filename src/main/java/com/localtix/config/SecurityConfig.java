package com.localtix.config;

import com.localtix.auth.JwtFilter;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  SecurityFilterChain securityFilterChain(
    HttpSecurity http,
    JwtFilter jwtFilter
  ) throws Exception {
    return http
      .csrf(c -> c.disable())
      .cors(c -> {})
      .sessionManagement(s ->
        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      )
      .authorizeHttpRequests(a ->
        a
          .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR)
          .permitAll()
          .requestMatchers("/api/auth/**", "/api/events/**")
          .permitAll()
          .requestMatchers(HttpMethod.OPTIONS, "/**")
          .permitAll()
          .anyRequest()
          .authenticated()
      )
      .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
      .build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource(
    @Value("${app.cors.allowed-origin}") String origin
  ) {
    CorsConfiguration c = new CorsConfiguration();
    c.setAllowedOriginPatterns(
      List.of(origin, "http://localhost:[*]", "http://127.0.0.1:[*]")
    );
    c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    c.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
    s.registerCorsConfiguration("/**", c);
    return s;
  }
}
