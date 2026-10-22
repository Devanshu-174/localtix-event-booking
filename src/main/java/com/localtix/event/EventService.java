package com.localtix.event;

import com.localtix.user.*;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EventService {

  private final EventRepository events;
  private final UserRepository users;
  private final com.localtix.booking.BookingRepository bookings;

  public EventService(
    EventRepository events,
    UserRepository users,
    com.localtix.booking.BookingRepository bookings
  ) {
    this.events = events;
    this.users = users;
    this.bookings = bookings;
  }

  public List<EventDtos.EventResponse> all() {
    return events
      .findAllByOrderByStartsAtAsc()
      .stream()
      .map(EventDtos::from)
      .toList();
  }

  public List<EventDtos.EventResponse> mine(String email) {
    return events
      .findByOrganizerEmailOrderByStartsAtAsc(email)
      .stream()
      .map(EventDtos::from)
      .toList();
  }

  public EventDtos.EventResponse get(Long id) {
    return EventDtos.from(find(id));
  }

  @Transactional
  public EventDtos.EventResponse create(
    EventDtos.EventRequest r,
    String email
  ) {
    User u = users.findByEmail(email).orElseThrow();
    return EventDtos.from(
      events.save(
        new Event(
          r.title().trim(),
          r.description(),
          r.category().trim(),
          r.venue().trim(),
          r.startsAt(),
          r.price(),
          r.capacity(),
          r.imageUrl(),
          u
        )
      )
    );
  }

  @Transactional
  public EventDtos.EventResponse update(
    Long id,
    EventDtos.EventRequest r,
    String email
  ) {
    Event e = owned(id, email);
    if (r.capacity() < e.getTicketsSold()) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "Capacity cannot be lower than tickets already sold"
    );
    e.update(
      r.title().trim(),
      r.description(),
      r.category().trim(),
      r.venue().trim(),
      r.startsAt(),
      r.price(),
      r.capacity(),
      r.imageUrl()
    );
    return EventDtos.from(e);
  }

  @Transactional
  public void delete(Long id, String email) {
    Event e = owned(id, email);
    if (bookings.existsByEventId(id)) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "Events with booking history cannot be deleted"
    );
    events.delete(e);
  }

  public Event find(Long id) {
    return events
      .findById(id)
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found")
      );
  }

  public Event owned(Long id, String email) {
    Event e = events
      .findLockedById(id)
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found")
      );
    if (
      !e.getOrganizer().getEmail().equals(email)
    ) throw new ResponseStatusException(
      HttpStatus.FORBIDDEN,
      "This event belongs to another organizer"
    );
    return e;
  }
}
