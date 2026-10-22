package com.localtix.event;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, Long> {
  List<Event> findAllByOrderByStartsAtAsc();
  List<Event> findByOrganizerEmailOrderByStartsAtAsc(String email);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select e from Event e where e.id=:id")
  Optional<Event> findLockedById(@Param("id") Long id);
}
