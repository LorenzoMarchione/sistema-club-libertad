package com.club_libertad.services;

import com.club_libertad.models.Persona;
import com.club_libertad.repositories.PersonaRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PersonaService {
    private final PersonaRepository personaRepository;

    public PersonaService(PersonaRepository personaRepository) {
        this.personaRepository = personaRepository;
    }

    @Transactional(readOnly = true)
    public List<Persona> getAllPersonas(){
        return personaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Persona> getPersonaById(Long id){
        return personaRepository.findById(id);
    }

    @Transactional
    public Optional<Long> savePersona(Persona persona){
        // Me aseguro de que la fecha de registro se setee si es una nueva persona
        if (persona.getId() == null) {
            persona.setFechaRegistro(ZonedDateTime.now());
        }
        // Me aseguro de que 'activo' tenga un valor por defecto si el cliente no lo envía
        if (persona.getActivo() == null) {
            persona.setActivo(true); // o false, según tu lógica
        }
        Persona p = personaRepository.save(persona);
        return Optional.of(p.getId());
    }

    @Transactional
    public boolean cambiarEstadoPersona(Long id){
        boolean b = false;
        Optional<Persona> persona = personaRepository.findById(id);
        if(persona.isPresent()){
            persona.get().setActivo(!persona.get().getActivo());
            b = true;
        }
        return b;
    }

    @Transactional
    public boolean updatePersonaParcial(Long id, Persona personaUpdate){
        boolean b = false;
        Optional<Persona> persona = getPersonaById(id);
        if(persona.isPresent()){
            if(personaUpdate.getNombre() != null) persona.get().setNombre(personaUpdate.getNombre());
            if(personaUpdate.getApellido() != null) persona.get().setApellido(personaUpdate.getApellido());
            if(personaUpdate.getEmail() != null) persona.get().setEmail(personaUpdate.getEmail());
            if(personaUpdate.getTelefono() != null) persona.get().setTelefono(personaUpdate.getTelefono());
            if(personaUpdate.getDireccion() != null) persona.get().setDireccion(personaUpdate.getDireccion());
            if(personaUpdate.getCategoria() != null) persona.get().setCategoria(personaUpdate.getCategoria());
            if(personaUpdate.getSocioResponsable() != null) persona.get().setSocioResponsable(personaUpdate.getSocioResponsable());
            b = true;
        }
        return b;
    }
}
