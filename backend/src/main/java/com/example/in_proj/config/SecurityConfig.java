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
                        .requestMatchers("/api/plane/status").permitAll()
                        .requestMatchers("/api/user/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/user").permitAll()

                        .requestMatchers("/api/plane").hasAnyRole("ADMIN", "AVIA")
                        .requestMatchers("/api/plane/avia/*", "/api/user/plane/*", "/api/bonus").hasRole("AVIA")
                        .requestMatchers("/api/user/*", "/api/bonus/client/**").hasRole("CLIENT")

                        .requestMatchers("/api/order/client/*", "/api/order/*"/*PUT*/, "/api/ticket/order/*", "/api/plane/*").hasRole("CLIENT") //test order (paid -> canceled)

                        .requestMatchers(HttpMethod.POST, "/api/order").hasRole("CLIENT")
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