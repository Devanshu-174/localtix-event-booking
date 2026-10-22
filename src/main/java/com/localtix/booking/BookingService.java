package com.localtix.booking;

import com.localtix.auth.QrService;
import com.localtix.event.*;
import com.localtix.user.*;
import java.math.RoundingMode;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookingService {

  private final BookingRepository bookings;
  private final EventRepository events;
  private final UserRepository users;
  private final QrService qr;
  private final TicketRepository tickets;

  public BookingService(
    BookingRepository bookings,
    EventRepository events,
    UserRepository users,
    QrService qr,
    TicketRepository tickets
  ) {
    this.bookings = bookings;
    this.events = events;
    this.users = users;
    this.qr = qr;
    this.tickets = tickets;
  }

  @Transactional
  public BookingDtos.BookingResponse create(
    BookingDtos.CreateRequest r,
    String email
  ) {
    Event e = events
      .findLockedById(r.eventId())
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found")
      );
    if (
      !e.getStartsAt().isAfter(java.time.LocalDateTime.now())
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "This event has already started"
    );
    if (e.getAvailable() < r.quantity()) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "Not enough tickets remain"
    );
    User customer = users.findByEmail(email).orElseThrow();
    e.sell(r.quantity());
    String ref =
      "LT-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
    Booking b = bookings.save(
      new Booking(
        ref,
        customer,
        e,
        r.quantity(),
        e
          .getPrice()
          .multiply(java.math.BigDecimal.valueOf(r.quantity()))
          .setScale(2, RoundingMode.HALF_UP)
      )
    );
    List<Ticket> saved = tickets.saveAll(
      java.util.stream.IntStream.range(0, r.quantity())
        .mapToObj(i -> new Ticket(b, "GA-" + String.format("%04d", i + 1)))
        .toList()
    );
    return response(b, saved);
  }

  public List<BookingDtos.BookingResponse> mine(String email) {
    return bookings
      .findByCustomerEmailOrderByCreatedAtDesc(email)
      .stream()
      .map(b -> response(b, tickets.findByBookingIdOrderByIdAsc(b.getId())))
      .toList();
  }

  public List<BookingDtos.BookingResponse> organizerBookings(String email) {
    return bookings
      .findByEventOrganizerEmailOrderByCreatedAtDesc(email)
      .stream()
      .map(b -> response(b, tickets.findByBookingIdOrderByIdAsc(b.getId())))
      .toList();
  }

  @Transactional
  public void cancel(Long id, String email) {
    Booking b = bookings
      .findLockedByIdAndCustomerEmail(id, email)
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found")
      );
    if (
      b.getStatus() != BookingStatus.CONFIRMED
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "This booking is already cancelled"
    );
    if (
      !b.getEvent().getStartsAt().isAfter(java.time.LocalDateTime.now())
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "Bookings cannot be cancelled after an event starts"
    );
    Event e = events
      .findLockedById(b.getEvent().getId())
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found")
      );
    List<Ticket> issued = tickets.findLockedByBookingId(b.getId());
    if (
      issued.stream().anyMatch(t -> t.getStatus() == TicketStatus.CHECKED_IN)
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "A checked-in ticket cannot be cancelled"
    );
    e.returnTickets(b.getQuantity());
    b.cancel();
    issued.forEach(Ticket::cancel);
  }

  private BookingDtos.BookingResponse response(Booking b, List<Ticket> ts) {
    return BookingDtos.from(
      b,
      ts
        .stream()
        .map(t ->
          new BookingDtos.TicketResponse(
            t.getId(),
            t.getSeatLabel(),
            t.getTicketCode(),
            qr.payload(t.getTicketCode()),
            t.getStatus().name()
          )
        )
        .toList()
    );
  }

  public Booking byReference(String reference) {
    return bookings
      .findByReference(reference)
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found")
      );
  }
}
