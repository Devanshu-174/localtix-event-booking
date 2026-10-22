package com.localtix.booking;

import com.localtix.event.Event;
import com.localtix.user.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "bookings")
public class Booking {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String reference;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  private User customer;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  private Event event;

  @Column(nullable = false)
  private int quantity;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal total;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BookingStatus status = BookingStatus.CONFIRMED;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected Booking() {}

  public Booking(
    String reference,
    User customer,
    Event event,
    int quantity,
    BigDecimal total
  ) {
    this.reference = reference;
    this.customer = customer;
    this.event = event;
    this.quantity = quantity;
    this.total = total;
  }

  public Long getId() {
    return id;
  }

  public String getReference() {
    return reference;
  }

  public User getCustomer() {
    return customer;
  }

  public Event getEvent() {
    return event;
  }

  public int getQuantity() {
    return quantity;
  }

  public BigDecimal getTotal() {
    return total;
  }

  public BookingStatus getStatus() {
    return status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void cancel() {
    status = BookingStatus.CANCELLED;
  }
}
