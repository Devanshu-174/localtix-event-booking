package com.localtix.booking;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {
  boolean existsByEventId(Long eventId);
  List<Booking> findByCustomerEmailOrderByCreatedAtDesc(String email);
  Optional<Booking> findByReference(String reference);
  List<Booking> findByEventOrganizerEmailOrderByCreatedAtDesc(String email);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select b from Booking b where b.id=:id and b.customer.email=:email")
  Optional<Booking> findLockedByIdAndCustomerEmail(
    @Param("id") Long id,
    @Param("email") String email
  );
}
