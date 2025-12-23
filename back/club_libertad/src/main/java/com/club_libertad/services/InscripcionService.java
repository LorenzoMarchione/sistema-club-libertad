package com.club_libertad.services;

import com.club_libertad.dtos.InscripcionDTO;
import com.club_libertad.models.Deporte;
import com.club_libertad.models.Inscripcion;
import com.club_libertad.models.Persona;
import com.club_libertad.repositories.InscripcionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class    InscripcionService {
    private final InscripcionRepository inscripcionRepository;
    public InscripcionService(InscripcionRepository inscripcionRepository) {
        this.inscripcionRepository = inscripcionRepository;
    }

    @Transactional(readOnly = true)
    public List<Inscripcion> getAllInscripciones(){
        return inscripcionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Inscripcion> getInscripcionById(Long id){
        return inscripcionRepository.findById(id);
    }

    @Transactional
    public Optional<Long> saveInscripcion(InscripcionDTO inscripcionTransfer){
        Inscripcion inscripcionCreate = new Inscripcion();
        Persona personaExisting = new Persona();
        personaExisting.setId(inscripcionTransfer.getPersonaId());
        inscripcionCreate.setPersonaId(personaExisting);
        Deporte deporteExisting = new Deporte();
        deporteExisting.setId(inscripcionTransfer.getDeporteId());
        inscripcionCreate.setDeporteId(deporteExisting);
        inscripcionCreate.setFechaInscripcion(inscripcionTransfer.getFechaInscripcion());
        Inscripcion inscripcionCreated = inscripcionRepository.save(inscripcionCreate);
        return Optional.of(inscripcionCreated.getId());
    }

    @Transactional
    public boolean darBajaInscripcion(Long id){
        boolean b = false;
        Optional<Inscripcion> i = inscripcionRepository.findById(id);
        if(i.isPresent()){
            i.get().setFechaBaja(LocalDate.now());
            b = true;
        }

        return b;
    }
}
