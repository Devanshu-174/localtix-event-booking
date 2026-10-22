package com.localtix.checkin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.security.Principal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/check-ins")
public class CheckInController {

  private final CheckInService service;

  public CheckInController(CheckInService service) {
    this.service = service;
  }

  public record Request(@NotBlank String code) {}

  @PostMapping("/scan")
  @PreAuthorize("hasRole('ORGANIZER')")
  public CheckInDtos.ScanResponse scan(
    @Valid @RequestBody Request r,
    Principal p
  ) {
    return service.scan(r.code(), p.getName());
  }
}
