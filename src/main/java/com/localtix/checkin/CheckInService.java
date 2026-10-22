package com.localtix.checkin;

import com.localtix.auth.QrService;
import com.localtix.booking.*;
import com.localtix.user.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CheckInService {

  private final CheckInRepository checks;
  private final UserRepository users;
  private final QrService qr;
  private final TicketRepository tickets;

  public CheckInService(
    CheckInRepository checks,
    UserRepository users,
    QrService qr,
    TicketRepository tickets
  ) {
    this.checks = checks;
    this.users = users;
    this.qr = qr;
    this.tickets = tickets;
  }

  @Transactional
  public CheckInDtos.ScanResponse scan(String raw, String email) {
    String code = qr
      .verify(raw)
      .orElseThrow(() ->
        new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Invalid QR signature"
        )
      );
    Ticket ticket = tickets
      .findLockedByTicketCode(code)
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found")
      );
    if (
      !ticket.getBooking().getEvent().getOrganizer().getEmail().equals(email)
    ) throw new ResponseStatusException(
      HttpStatus.FORBIDDEN,
      "This ticket is for an event managed by another organizer"
    );
    if (
      ticket.getStatus() == TicketStatus.CANCELLED
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "This ticket has been cancelled"
    );
    var existing = checks.findByTicketTicketCode(code);
    if (existing.isPresent()) return CheckInDtos.from(
      false,
      "Already checked in at " + existing.get().getCheckedInAt(),
      existing.get()
    );
    ticket.checkIn();
    var check = checks.save(
      new CheckIn(ticket, users.findByEmail(email).orElseThrow())
    );
    return CheckInDtos.from(true, "Ticket verified. Entry recorded.", check);
  }
}
