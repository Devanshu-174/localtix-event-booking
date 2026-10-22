package com.localtix.checkin;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CheckInRepository extends JpaRepository<CheckIn, Long> {
  Optional<CheckIn> findByTicketTicketCode(String code);
}
