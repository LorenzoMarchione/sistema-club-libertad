package com.club_libertad.controllers;

import com.club_libertad.dtos.PersonaDTO;
import com.club_libertad.services.PersonaService;
import com.club_libertad.models.Persona;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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
        Optional<Persona> persona = personaService.getPersonaById(id);
        ResponseEntity<Persona> response = ResponseEntity.notFound().build();
        if(persona.isPresent()) response = ResponseEntity.ok(persona.get());
        return response;
    }

    @PostMapping("/persona")
    @Operation(summary = "Crea una persona (Socio o Jugador)", description = "Roles - 0 = SOCIO - 1 = JUGADOR - 2 = SOCIOYJUGADOR")
    public ResponseEntity<String> createPersona(@RequestBody PersonaDTO personaTransfer) {
        ResponseEntity<String> response = ResponseEntity
                .status(400)
                .body("Error al crear la persona");
        try{
            Optional<Long> id = personaService.savePersona(personaTransfer);
            if(id.isPresent()) response = ResponseEntity.ok("Persona con id " + id.get() + " creada con exito");
        }
        catch (Exception e){
            System.out.println("------------------\n"
                    + e.getMessage()
                    + "\n------------------");
        }
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
