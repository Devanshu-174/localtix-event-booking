package com.localtix.checkin;

import com.localtix.booking.Ticket;
import com.localtix.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ticket_check_ins")
public class CheckIn {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(optional = false)
  private Ticket ticket;

  @ManyToOne(optional = false)
  private User scannedBy;

  @Column(nullable = false, updatable = false)
  private Instant checkedInAt = Instant.now();

  protected CheckIn() {}

  public CheckIn(Ticket t, User u) {
    ticket = t;
    scannedBy = u;
  }

  public Long getId() {
    return id;
  }

  public Instant getCheckedInAt() {
    return checkedInAt;
  }

  public Ticket getTicket() {
    return ticket;
  }

  public User getScannedBy() {
    return scannedBy;
  }
}
