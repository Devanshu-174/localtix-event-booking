package com.localtix.auth;

import com.localtix.user.UserRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtFilter extends OncePerRequestFilter {

  private final JwtService jwt;
  private final UserRepository users;

  public JwtFilter(JwtService jwt, UserRepository users) {
    this.jwt = jwt;
    this.users = users;
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest req,
    HttpServletResponse res,
    FilterChain chain
  ) throws ServletException, IOException {
    String h = req.getHeader("Authorization");
    if (h != null && h.startsWith("Bearer ")) try {
      String email = jwt.subject(h.substring(7));
      users.findByEmail(email).ifPresent(u -> {
        var auth = new UsernamePasswordAuthenticationToken(
          u.getEmail(),
          null,
          List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name()))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
      });
    } catch (Exception ignored) {}
    chain.doFilter(req, res);
  }
}
