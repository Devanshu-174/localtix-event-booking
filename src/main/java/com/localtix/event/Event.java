package com.localtix.event;

import com.localtix.user.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class Event {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String title;

  @Column(length = 2000)
  private String description;

  @Column(nullable = false)
  private String category;

  @Column(nullable = false)
  private String venue;

  @Column(nullable = false)
  private LocalDateTime startsAt;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal price;

  @Column(nullable = false)
  private int capacity;

  @Column(nullable = false)
  private int ticketsSold = 0;

  private String imageUrl;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  private User organizer;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected Event() {}

  public Event(
    String title,
    String description,
    String category,
    String venue,
    LocalDateTime startsAt,
    BigDecimal price,
    int capacity,
    String imageUrl,
    User organizer
  ) {
    this.title = title;
    this.description = description;
    this.category = category;
    this.venue = venue;
    this.startsAt = startsAt;
    this.price = price;
    this.capacity = capacity;
    this.imageUrl = imageUrl;
    this.organizer = organizer;
  }

  public Long getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

  public String getDescription() {
    return description;
  }

  public String getCategory() {
    return category;
  }

  public String getVenue() {
    return venue;
  }

  public LocalDateTime getStartsAt() {
    return startsAt;
  }

  public BigDecimal getPrice() {
    return price;
  }

  public int getCapacity() {
    return capacity;
  }

  public int getTicketsSold() {
    return ticketsSold;
  }

  public int getAvailable() {
    return capacity - ticketsSold;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public User getOrganizer() {
    return organizer;
  }

  public void update(
    String title,
    String description,
    String category,
    String venue,
    LocalDateTime startsAt,
    BigDecimal price,
    int capacity,
    String imageUrl
  ) {
    this.title = title;
    this.description = description;
    this.category = category;
    this.venue = venue;
    this.startsAt = startsAt;
    this.price = price;
    this.capacity = capacity;
    this.imageUrl = imageUrl;
  }

  public void sell(int count) {
    ticketsSold += count;
  }

  public void returnTickets(int count) {
    if (count < 0 || count > ticketsSold) throw new IllegalArgumentException(
      "Invalid ticket return count"
    );
    ticketsSold -= count;
  }
}
