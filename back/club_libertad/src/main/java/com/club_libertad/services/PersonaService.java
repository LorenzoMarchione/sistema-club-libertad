package com.club_libertad.services;

import com.club_libertad.dtos.PersonaDTO;
import com.club_libertad.models.Deporte;
import com.club_libertad.models.Persona;
import com.club_libertad.repositories.DeporteRepository;
import com.club_libertad.repositories.PersonaRepository;
import com.club_libertad.repositories.RegistroRepository;
import com.club_libertad.repositories.InscripcionRepository;
import com.club_libertad.repositories.CuotaRepository;
import com.club_libertad.models.Registro;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class PersonaService {
    private final PersonaRepository personaRepository;
    private final DeporteRepository deporteRepository;
    private final RegistroRepository registroRepository;
    private final InscripcionRepository inscripcionRepository;
    private final CuotaRepository cuotaRepository;

    public PersonaService(PersonaRepository personaRepository, DeporteRepository deporteRepository, RegistroRepository registroRepository, InscripcionRepository inscripcionRepository, CuotaRepository cuotaRepository) {
        this.personaRepository = personaRepository;
        this.deporteRepository = deporteRepository;
        this.registroRepository = registroRepository;
        this.inscripcionRepository = inscripcionRepository;
        this.cuotaRepository = cuotaRepository;
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
    public Optional<Long> savePersona(PersonaDTO personaTransfer){
        Persona personaCreate = new Persona();
        personaCreate.setNombre(personaTransfer.getNombre());
        personaCreate.setApellido(personaTransfer.getApellido());
        personaCreate.setDni(personaTransfer.getDni());
        personaCreate.setFechaNacimiento(personaTransfer.getFechaNacimiento());
        personaCreate.setEmail(personaTransfer.getEmail());
        personaCreate.setTelefono(personaTransfer.getTelefono());
        personaCreate.setDireccion(personaTransfer.getDireccion());
        personaCreate.setCategoria(personaTransfer.getCategoria());
        // Me aseguro que se cree un registro de fecha de registro
        ZonedDateTime fechaRegistro = ZonedDateTime.now();
        personaCreate.setFechaRegistro(fechaRegistro);
        // Me aseguro de que 'activo' tenga un valor por defecto
        personaCreate.setActivo(true);
        if(personaTransfer.getSocioResponsableId() != null){
            Persona socioResponsable = new Persona();
            socioResponsable.setId(personaTransfer.getSocioResponsableId());
            personaCreate.setSocioResponsable(socioResponsable);
        }
        Persona p = personaRepository.save(personaCreate);

        // Crear registro inmutable asociado a la creación de la persona
        Registro registro = new Registro();
        registro.setNombre(personaCreate.getNombre());
        registro.setApellido(personaCreate.getApellido());
        registro.setDni(personaCreate.getDni());
        registro.setFechaRegistro(fechaRegistro);
        registroRepository.save(registro);

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

    @Transactional
    public boolean asociarDeporte(Long personaId, Long deporteId){
        Optional<Persona> persona = personaRepository.findById(personaId);
        Optional<Deporte> deporte = deporteRepository.findById(deporteId);
        if(persona.isPresent() && deporte.isPresent()){
            persona.get().getDeportes().add(deporte.get());
            personaRepository.save(persona.get());
            return true;
        }
        return false;
    }

    @Transactional
    public boolean desasociarDeporte(Long personaId, Long deporteId){
        Optional<Persona> persona = personaRepository.findById(personaId);
        Optional<Deporte> deporte = deporteRepository.findById(deporteId);
        if(persona.isPresent() && deporte.isPresent()){
            persona.get().getDeportes().remove(deporte.get());
            personaRepository.save(persona.get());
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public Set<Deporte> getDeportesByPersonaId(Long personaId){
        Optional<Persona> persona = personaRepository.findById(personaId);
        return persona.map(Persona::getDeportes).orElse(null);
    }

    @Transactional
    public boolean deletePersonaById(Long id){
        if(personaRepository.existsById(id)){
            Optional<Persona> persona = personaRepository.findById(id);
            if(persona.isPresent()){
                // 1. Eliminar todas las cuotas asociadas a esta persona
                cuotaRepository.deleteByPersonaId_Id(id);
                
                // 2. Eliminar todas las inscripciones de esta persona
                inscripcionRepository.deleteByPersonaId_Id(id);
                
                // 3. Desasociar deportes (relación many-to-many)
                persona.get().getDeportes().clear();
                personaRepository.save(persona.get());
                
                // 4. Eliminar referencias como socioResponsable de otras personas
                List<Persona> personasDependientes = personaRepository.findAll().stream()
                    .filter(p -> p.getSocioResponsable() != null && p.getSocioResponsable().getId().equals(id))
                    .toList();
                for(Persona p : personasDependientes){
                    p.setSocioResponsable(null);
                }
                
                // 5. Finalmente, eliminar la persona
                personaRepository.deleteById(id);
                return true;
            }
        }
        return false;
    }
}
