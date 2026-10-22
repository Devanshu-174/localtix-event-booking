package com.localtix.booking;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(
  name = "tickets",
  uniqueConstraints = @UniqueConstraint(
    columnNames = { "booking_id", "seat_label" }
  )
)
public class Ticket {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false, fetch = FetchType.EAGER)
  private Booking booking;

  @Column(nullable = false, length = 20)
  private String seatLabel;

  @Column(nullable = false, unique = true, length = 36)
  private String ticketCode = UUID.randomUUID().toString();

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TicketStatus status = TicketStatus.BOOKED;

  protected Ticket() {}

  public Ticket(Booking booking, String seatLabel) {
    this.booking = booking;
    this.seatLabel = seatLabel;
  }

  public Long getId() {
    return id;
  }

  public Booking getBooking() {
    return booking;
  }

  public String getSeatLabel() {
    return seatLabel;
  }

  public String getTicketCode() {
    return ticketCode;
  }

  public TicketStatus getStatus() {
    return status;
  }

  public void checkIn() {
    status = TicketStatus.CHECKED_IN;
  }

  public void cancel() {
    status = TicketStatus.CANCELLED;
  }
}
