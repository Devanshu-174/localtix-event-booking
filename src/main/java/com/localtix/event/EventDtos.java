package com.localtix.event;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class EventDtos {

  private EventDtos() {}

  public record EventRequest(
    @NotBlank @Size(max = 150) String title,
    @Size(max = 2000) String description,
    @NotBlank @Size(max = 60) String category,
    @NotBlank @Size(max = 150) String venue,
    @NotNull @Future LocalDateTime startsAt,
    @NotNull
    @DecimalMin("0.00")
    @Digits(integer = 8, fraction = 2)
    BigDecimal price,
    @Min(1) @Max(1000000) int capacity,
    @Size(max = 500) String imageUrl
  ) {}

  public record EventResponse(
    Long id,
    String title,
    String description,
    String category,
    String venue,
    LocalDateTime startsAt,
    BigDecimal price,
    int capacity,
    int ticketsSold,
    int available,
    String imageUrl,
    Long organizerId,
    String organizerName
  ) {}

  public static EventResponse from(Event e) {
    return new EventResponse(
      e.getId(),
      e.getTitle(),
      e.getDescription(),
      e.getCategory(),
      e.getVenue(),
      e.getStartsAt(),
      e.getPrice(),
      e.getCapacity(),
      e.getTicketsSold(),
      e.getAvailable(),
      e.getImageUrl(),
      e.getOrganizer().getId(),
      e.getOrganizer().getName()
    );
  }
}
