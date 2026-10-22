package com.localtix.booking;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class BookingDtos {

  private BookingDtos() {}

  public record CreateRequest(
    @NotNull Long eventId,
    @Min(1) @Max(10) int quantity
  ) {}

  public record TicketResponse(
    Long id,
    String seatLabel,
    String ticketCode,
    String qrPayload,
    String status
  ) {}

  public record BookingResponse(
    Long id,
    String reference,
    int quantity,
    BigDecimal total,
    BookingStatus status,
    Instant createdAt,
    Long eventId,
    String eventTitle,
    String venue,
    java.time.LocalDateTime startsAt,
    String customerName,
    String customerEmail,
    List<TicketResponse> tickets
  ) {}

  public static BookingResponse from(Booking b, List<TicketResponse> tickets) {
    return new BookingResponse(
      b.getId(),
      b.getReference(),
      b.getQuantity(),
      b.getTotal(),
      b.getStatus(),
      b.getCreatedAt(),
      b.getEvent().getId(),
      b.getEvent().getTitle(),
      b.getEvent().getVenue(),
      b.getEvent().getStartsAt(),
      b.getCustomer().getName(),
      b.getCustomer().getEmail(),
      tickets
    );
  }
}
