package com.localtix.config;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiErrors {

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, String>> businessError(
    ResponseStatusException exception
  ) {
    return ResponseEntity.status(exception.getStatusCode()).body(
      Map.of(
        "message",
        exception.getReason() == null
          ? "Request could not be completed"
          : exception.getReason()
      )
    );
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> validationError(
    MethodArgumentNotValidException exception
  ) {
    String message = exception
      .getBindingResult()
      .getFieldErrors()
      .stream()
      .map(error -> error.getField() + ": " + error.getDefaultMessage())
      .findFirst()
      .orElse("Please check the form values");
    return ResponseEntity.badRequest().body(Map.of("message", message));
  }
}
