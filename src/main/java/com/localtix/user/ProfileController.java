package com.localtix.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.security.Principal;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

  private final UserRepository users;

  public ProfileController(UserRepository users) {
    this.users = users;
  }

  public record Profile(
    Long id,
    String name,
    String email,
    Role role,
    Instant createdAt
  ) {}

  public record Update(@NotBlank @Size(max = 100) String name) {}

  @GetMapping
  public Profile get(Principal principal) {
    return response(current(principal));
  }

  @PutMapping
  @Transactional
  public Profile update(
    @Valid @RequestBody Update update,
    Principal principal
  ) {
    User user = current(principal);
    user.rename(update.name().trim());
    return response(user);
  }

  private User current(Principal principal) {
    if (principal == null) throw new ResponseStatusException(
      HttpStatus.UNAUTHORIZED
    );
    return users
      .findByEmail(principal.getName())
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
  }

  private Profile response(User user) {
    return new Profile(
      user.getId(),
      user.getName(),
      user.getEmail(),
      user.getRole(),
      user.getCreatedAt()
    );
  }
}
