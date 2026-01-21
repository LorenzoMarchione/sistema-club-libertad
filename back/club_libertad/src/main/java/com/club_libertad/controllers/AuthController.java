package com.club_libertad.controllers;

import com.club_libertad.dtos.AuthDTOs.LoginRequest;
import com.club_libertad.dtos.AuthDTOs.LoginResponse;
import com.club_libertad.enums.RoleUsuario;
import com.club_libertad.models.Usuario;
import com.club_libertad.repositories.UsuarioRepository;
import com.club_libertad.security.JwtUtil;
import com.club_libertad.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final long expirationMillis;

    public AuthController(AuthService authService,
                          UsuarioRepository usuarioRepository,
                          JwtUtil jwtUtil,
                          @Value("${app.jwt.expirationMillis:3600000}") long expirationMillis) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
        this.expirationMillis = expirationMillis;
    }

    @PostMapping("/login")
    @Operation(summary = "Autentica usuario y devuelve JWT")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        Optional<String> tokenOpt = authService.login(req.getUsername(), req.getPassword());
        if (tokenOpt.isEmpty()) return ResponseEntity.status(401).body("Credenciales inválidas o usuario bloqueado");
        Usuario u = usuarioRepository.findByUsername(req.getUsername()).orElseThrow();
        return ResponseEntity.ok(new LoginResponse(tokenOpt.get(), expirationMillis, u.getUsername(), u.getRole()));
    }

    @GetMapping("/me/{username}")
    @Operation(summary = "Obtiene información básica del usuario")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> me(@PathVariable String username) {
        return usuarioRepository.findByUsername(username)
                .map(u -> ResponseEntity.ok(new LoginResponse("", expirationMillis, u.getUsername(), u.getRole())))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
