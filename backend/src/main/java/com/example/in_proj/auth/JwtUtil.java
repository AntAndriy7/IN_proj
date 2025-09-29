package com.example.in_proj.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.JWTVerifier;

import java.util.Date;

public class JwtUtil {

    private static final String SECRET = "L4IB?zMQAE9xp[fFbY4vXHX0=7L$%#aB6%ugDqvPLO";
    private static final Algorithm ALGORITHM = Algorithm.HMAC256(SECRET);
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 24;

    public static String generate(String email, String role, String name, int id) {
        return JWT.create()
                .withSubject(email)
                .withClaim("name", name)
                .withClaim("role", role)
                .withClaim("id", id)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .sign(ALGORITHM);
    }

    public static boolean validate(String token) {
        try {
            JWTVerifier verifier = JWT.require(ALGORITHM).build();
            verifier.verify(token);
            return true;
        } catch (JWTVerificationException e) {
            return false;
        }
    }

    public static String getRole(String token) {
        try {
            return JWT.decode(token).getClaim("role").asString();
        } catch (Exception e) {
            return null;
        }
    }
}
