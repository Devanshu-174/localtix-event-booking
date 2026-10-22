package com.localtix.checkin;

import java.time.Instant;

public final class CheckInDtos {

  private CheckInDtos() {}

  public record ScanResponse(
    boolean valid,
    String message,
    String reference,
    String seatLabel,
    String eventTitle,
    String attendeeName,
    int quantity,
    Instant checkedInAt
  ) {}

  public static ScanResponse from(boolean valid, String message, CheckIn c) {
    var t = c.getTicket();
    var b = t.getBooking();
    return new ScanResponse(
      valid,
      message,
      t.getTicketCode(),
      t.getSeatLabel(),
      b.getEvent().getTitle(),
      b.getCustomer().getName(),
      1,
      c.getCheckedInAt()
    );
  }
}
