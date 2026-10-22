package com.localtix.booking;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select t from Ticket t where t.booking.id=:bookingId order by t.id")
  List<Ticket> findLockedByBookingId(@Param("bookingId") Long bookingId);

  List<Ticket> findByBookingIdOrderByIdAsc(Long bookingId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select t from Ticket t where t.ticketCode=:code")
  Optional<Ticket> findLockedByTicketCode(@Param("code") String code);
}
