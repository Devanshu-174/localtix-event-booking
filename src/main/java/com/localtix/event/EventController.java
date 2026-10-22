package com.localtix.event;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
public class EventController {

  private final EventService service;

  public EventController(EventService service) {
    this.service = service;
  }

  @GetMapping
  public List<EventDtos.EventResponse> all() {
    return service.all();
  }

  @GetMapping("/{id}")
  public EventDtos.EventResponse get(@PathVariable Long id) {
    return service.get(id);
  }

  @GetMapping("/mine")
  @PreAuthorize("hasRole('ORGANIZER')")
  public List<EventDtos.EventResponse> mine(Principal p) {
    return service.mine(p.getName());
  }

  @PostMapping
  @PreAuthorize("hasRole('ORGANIZER')")
  public EventDtos.EventResponse create(
    @Valid @RequestBody EventDtos.EventRequest r,
    Principal p
  ) {
    return service.create(r, p.getName());
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ORGANIZER')")
  public EventDtos.EventResponse update(
    @PathVariable Long id,
    @Valid @RequestBody EventDtos.EventRequest r,
    Principal p
  ) {
    return service.update(id, r, p.getName());
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ORGANIZER')")
  public void delete(@PathVariable Long id, Principal p) {
    service.delete(id, p.getName());
  }
}
