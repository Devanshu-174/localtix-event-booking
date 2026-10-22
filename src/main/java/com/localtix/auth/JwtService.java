package com.localtix.auth;

import com.localtix.user.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final SecretKey key;
  private final long expiration;

  public JwtService(
    @Value("${app.jwt.secret}") String secret,
    @Value("${app.jwt.expiration-ms}") long expiration
  ) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expiration = expiration;
  }

  public String generate(User u) {
    Date now = new Date();
    return Jwts.builder()
      .subject(u.getEmail())
      .claim("role", u.getRole().name())
      .issuedAt(now)
      .expiration(new Date(now.getTime() + expiration))
      .signWith(key)
      .compact();
  }

  public String subject(String token) {
    return Jwts.parser()
      .verifyWith(key)
      .build()
      .parseSignedClaims(token)
      .getPayload()
      .getSubject();
  }
}
