package com.example.in_proj.config;

import com.example.in_proj.auth.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/index.html", "/static/**").permitAll()
                        .requestMatchers("/api/flight/status", "/api/flight/opensky").permitAll()
                        .requestMatchers("/api/user/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/user").permitAll()

                        .requestMatchers("/api/user/out").hasRole("ADMIN")
                        .requestMatchers("/api/bonus/client/**").hasRole("CLIENT")
                        .requestMatchers("/api/flight/avia/*", "/api/user/flight/*", "/api/bonus").hasRole("AVIA")
                        .requestMatchers("/api/airport", "/api/plane", "/api/flight", "/api/flight/status/*").hasAnyRole("ADMIN", "AVIA")
                        .requestMatchers("/api/order/**", "/api/ticket/order/*").hasAnyRole("ADMIN", "CLIENT")

                        .requestMatchers(HttpMethod.PUT, "/api/flight/*").hasAnyRole("ADMIN", "AVIA")
                        .requestMatchers(HttpMethod.GET, "/api/flight/*").hasRole("CLIENT")

                        .requestMatchers("/api/user/*").authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}