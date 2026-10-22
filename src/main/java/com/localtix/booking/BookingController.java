package com.localtix.booking;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

  private final BookingService service;

  public BookingController(BookingService service) {
    this.service = service;
  }

  @PostMapping
  @PreAuthorize("hasRole('CUSTOMER')")
  public BookingDtos.BookingResponse create(
    @Valid @RequestBody BookingDtos.CreateRequest r,
    Principal p
  ) {
    return service.create(r, p.getName());
  }

  @GetMapping("/mine")
  public List<BookingDtos.BookingResponse> mine(Principal p) {
    return service.mine(p.getName());
  }

  @GetMapping("/organizer")
  @PreAuthorize("hasRole('ORGANIZER')")
  public List<BookingDtos.BookingResponse> organizer(Principal p) {
    return service.organizerBookings(p.getName());
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('CUSTOMER')")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void cancel(@PathVariable Long id, Principal p) {
    service.cancel(id, p.getName());
  }
}
