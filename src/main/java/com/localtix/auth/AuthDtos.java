package com.localtix.auth;

import com.localtix.user.Role;
import jakarta.validation.constraints.*;

public final class AuthDtos {

  private AuthDtos() {}

  public record RegisterRequest(
    @NotBlank String name,
    @Email @NotBlank String email,
    @NotBlank @Size(min = 8) String password,
    Role role
  ) {}

  public record LoginRequest(
    @Email @NotBlank String email,
    @NotBlank String password
  ) {}

  public record AuthResponse(
    String token,
    Long id,
    String name,
    String email,
    Role role
  ) {}
}
