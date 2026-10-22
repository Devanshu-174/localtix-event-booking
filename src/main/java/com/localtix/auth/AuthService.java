package com.localtix.auth;

import com.localtix.user.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  private final UserRepository users;
  private final PasswordEncoder encoder;
  private final JwtService jwt;

  public AuthService(
    UserRepository users,
    PasswordEncoder encoder,
    JwtService jwt
  ) {
    this.users = users;
    this.encoder = encoder;
    this.jwt = jwt;
  }

  public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest r) {
    String email = r.email().trim().toLowerCase(java.util.Locale.ROOT);
    if (users.existsByEmail(email)) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "Email already registered"
    );
    Role role = r.role() == null ? Role.CUSTOMER : r.role();
    User u = users.save(
      new User(r.name().trim(), email, encoder.encode(r.password()), role)
    );
    return response(u);
  }

  public AuthDtos.AuthResponse login(AuthDtos.LoginRequest r) {
    String email = r.email().trim().toLowerCase(java.util.Locale.ROOT);
    User u = users
      .findByEmail(email)
      .orElseThrow(() ->
        new ResponseStatusException(
          HttpStatus.UNAUTHORIZED,
          "Invalid email or password"
        )
      );
    if (
      !encoder.matches(r.password(), u.getPassword())
    ) throw new ResponseStatusException(
      HttpStatus.UNAUTHORIZED,
      "Invalid email or password"
    );
    return response(u);
  }

  private AuthDtos.AuthResponse response(User u) {
    return new AuthDtos.AuthResponse(
      jwt.generate(u),
      u.getId(),
      u.getName(),
      u.getEmail(),
      u.getRole()
    );
  }
}
