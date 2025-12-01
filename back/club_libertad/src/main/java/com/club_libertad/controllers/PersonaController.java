package com.club_libertad.controllers;

import com.club_libertad.services.PersonaService;
import com.club_libertad.models.Persona;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController(value = "personaController")
public class PersonaController {

    private final PersonaService personaService;
    public PersonaController(PersonaService personaService) {
        this.personaService = personaService;
    }

    @GetMapping("/personas")
    @Operation(summary = "Obtiene todas las personas")
    public ResponseEntity<List<Persona>> getPersonas() {
        List<Persona> personas = personaService.getAllPersonas();
        ResponseEntity<List<Persona>> response = ResponseEntity.noContent().build();
        if(!personas.isEmpty()) response = ResponseEntity.ok(personas);
        return response;
    }

    @GetMapping("/persona/{id}")
    @Operation(summary = "Obtiene una persona por su id")
    public ResponseEntity<Persona> getPersonaById(@PathVariable Long id) {
        Persona persona = personaService.getPersonaById(id);
        ResponseEntity<Persona> response = ResponseEntity.notFound().build();
        if(persona != null) response = ResponseEntity.ok(persona);
        return response;
    }

    @PostMapping("/persona")
    @Operation(summary = "Crea una persona (Socio o Jugador)", description = "No mandar id para crear una persona - Roles - 0 = SOCIO - 1 = JUGADOR - 2 = SOCIOYJUGADOR")
    public ResponseEntity<String> createPersona(@RequestBody Persona persona) {
        ResponseEntity<String> response = ResponseEntity.badRequest().build();
        Long id = personaService.savePersona(persona);
        if(id != null) response = ResponseEntity.ok("Persona con id " + id + " creada con exito");
        return response;
    }

    @PatchMapping("/persona/activo/{id}")
    @Operation(summary = "Da de baja/alta a una persona por su id")
    public ResponseEntity<String> cambiarEstadoPersona(@PathVariable Long id) {
        ResponseEntity<String> response = ResponseEntity.badRequest().build();
        boolean b = personaService.cambiarEstadoPersona(id);
        if(b) response = ResponseEntity.ok("Persona con id " + id + " dada de baja/alta con exito");
        return response;
    }

    @PatchMapping("/persona/{id}")
    @Operation(summary = "Actualiza uno o varios campos de una persona por su id")
    public ResponseEntity<String> updatePersona(@PathVariable Long id, @RequestBody Persona persona) {
        ResponseEntity<String> response = ResponseEntity.badRequest().build();
        boolean b = personaService.updatePersonaParcial(id, persona);
        if(b) response = ResponseEntity.ok("Persona con id " + id + " actualizada con exito");
        return response;
    }

}
