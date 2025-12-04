package com.club_libertad.services;

import com.club_libertad.models.Persona;
import com.club_libertad.repositories.PersonaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.List;

@Service
public class PersonaService {
    private final PersonaRepository personaRepository;

    public PersonaService(PersonaRepository personaRepository) {
        this.personaRepository = personaRepository;
    }

    public List<Persona> getAllPersonas(){
        return personaRepository.findAll();
    }

    public Persona getPersonaById(Long id){
        return personaRepository.findById(id).orElse(null);
    }

    public Long savePersona(Persona persona){
        // Me aseguro de que la fecha de registro se setee si es una nueva persona
        if (persona.getId() == null) {
            persona.setFechaRegistro(ZonedDateTime.now());
        }
        // Me aseguro de que 'activo' tenga un valor por defecto si el cliente no lo envía
        if (persona.getActivo() == null) {
            persona.setActivo(true); // o false, según tu lógica
        }
        Persona p = personaRepository.save(persona);
        return p.getId();
    }

    @Transactional
    public boolean cambiarEstadoPersona(Long id){
        boolean b = false;
        Persona persona = personaRepository.findById(id).orElse(null);
        if(persona != null){
            persona.setActivo(!persona.getActivo());
            b = true;
        }
        return b;
    }

    @Transactional
    public boolean updatePersonaParcial(Long id, Persona personaUpdate){
        boolean b = false;
        Persona persona = personaRepository.findById(id).orElse(null);
        if(persona != null){
            if(personaUpdate.getNombre() != null) persona.setNombre(personaUpdate.getNombre());
            if(personaUpdate.getApellido() != null) persona.setApellido(personaUpdate.getApellido());
            if(personaUpdate.getEmail() != null) persona.setEmail(personaUpdate.getEmail());
            if(personaUpdate.getTelefono() != null) persona.setTelefono(personaUpdate.getTelefono());
            if(personaUpdate.getDireccion() != null) persona.setDireccion(personaUpdate.getDireccion());
            if(personaUpdate.getCategoria() != null) persona.setCategoria(personaUpdate.getCategoria());
            if(personaUpdate.getSocioResponsable() != null) persona.setSocioResponsable(personaUpdate.getSocioResponsable());
            b = true;
        }
        return b;
    }
}
