package com.localtix.auth;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService service;

  public AuthController(AuthService service) {
    this.service = service;
  }

  @PostMapping("/register")
  public AuthDtos.AuthResponse register(
    @Valid @RequestBody AuthDtos.RegisterRequest r
  ) {
    return service.register(r);
  }

  @PostMapping("/login")
  public AuthDtos.AuthResponse login(
    @Valid @RequestBody AuthDtos.LoginRequest r
  ) {
    return service.login(r);
  }
}
