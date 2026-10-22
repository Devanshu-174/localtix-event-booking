package com.localtix.config;

import com.localtix.event.*;
import com.localtix.user.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DemoDataSeeder {

  @Bean
  CommandLineRunner seedDemoData(
    UserRepository users,
    EventRepository events,
    PasswordEncoder encoder,
    @Value("${app.seed:false}") boolean enabled
  ) {
    return args -> {
      if (!enabled || users.count() > 0) return;
      User organizer = users.save(
        new User(
          "Riya Sharma",
          "organizer@demo.com",
          encoder.encode("Organizer@123"),
          Role.ORGANIZER
        )
      );
      users.save(
        new User(
          "Arjun Mehta",
          "customer@demo.com",
          encoder.encode("Customer@123"),
          Role.CUSTOMER
        )
      );
      LocalDateTime now = LocalDateTime.now();
      events.save(
        new Event(
          "Indie Night Live",
          "An evening of original indie bands from the city's best local scene.",
          "Music",
          "Town Hall Auditorium",
          now.plusDays(7).withHour(19).withMinute(0),
          new BigDecimal("799.00"),
          60,
          "/events/indie-night.jpg",
          organizer
        )
      );
      events.save(
        new Event(
          "Pottery for Beginners",
          "A relaxed hands-on workshop. Materials provided; take your piece home.",
          "Workshop",
          "Clay Studio, C-Scheme",
          now.plusDays(10).withHour(11).withMinute(0),
          new BigDecimal("499.00"),
          25,
          "/events/pottery-beginners.jpg",
          organizer
        )
      );
      events.save(
        new Event(
          "Stand-up Saturday",
          "Four comedians, one stage, zero filters.",
          "Comedy",
          "The Laugh Loft",
          now.plusDays(14).withHour(20).withMinute(30),
          new BigDecimal("599.00"),
          80,
          "/events/comedy-saturday.jpg",
          organizer
        )
      );
    };
  }
}
