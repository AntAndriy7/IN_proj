package com.example.in_proj.auth;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class JwtAuthFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Пропускаємо api
        if (path.matches("/api/user/login") ||
                ("/api/user".equals(path) && ("GET".equals(method) || "POST".equals(method))) ||
                ("/api/plane".equals(path) && "GET".equals(method)) ||
                ("/api/plane/status".equals(path) && "GET".equals(method))) {
            chain.doFilter(req, res);
            return;
        }

        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Missing token");
            return;
        }

        String token = auth.substring(7);
        if (!JwtUtil.validate(token)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
            return;
        }

        String role = JwtUtil.getRole(token);
        System.out.println(role);
        if (path.startsWith("/api/plane") && ("POST".equals(method) || "PUT".equals(method)) && !("ADMIN".equals(role) || "AVIA".equals(role))) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Only admin and avia company can POST /api/plane");
            System.out.println(role);
            return;
        }

        chain.doFilter(req, res);
    }
}
