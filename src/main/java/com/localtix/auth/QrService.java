package com.localtix.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class QrService {

  private static final String PREFIX = "LT1";
  private final byte[] secret;

  public QrService(@Value("${app.qr.secret}") String secret) {
    this.secret = secret.getBytes(StandardCharsets.UTF_8);
  }

  public String payload(String reference) {
    return PREFIX + "." + reference + "." + sign(reference);
  }

  public Optional<String> verify(String payload) {
    if (payload == null) return Optional.empty();
    String[] parts = payload.trim().split("\\.");
    if (parts.length != 3 || !PREFIX.equals(parts[0])) return Optional.empty();
    byte[] expected = sign(parts[1]).getBytes(StandardCharsets.UTF_8),
      actual = parts[2].getBytes(StandardCharsets.UTF_8);
    return MessageDigest.isEqual(expected, actual)
      ? Optional.of(parts[1])
      : Optional.empty();
  }

  private String sign(String value) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret, "HmacSHA256"));
      return Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)))
        .substring(0, 16);
    } catch (Exception e) {
      throw new IllegalStateException("Unable to sign ticket QR", e);
    }
  }
}
