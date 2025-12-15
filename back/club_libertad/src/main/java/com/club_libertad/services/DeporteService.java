package com.club_libertad.services;

import com.club_libertad.dtos.DeporteDTO;
import com.club_libertad.models.Deporte;
import com.club_libertad.models.Persona;
import com.club_libertad.repositories.DeporteRepository;
import com.club_libertad.repositories.PersonaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class DeporteService {
    private final DeporteRepository deporteRepository;
    private final PersonaRepository personaRepository;
    
    public DeporteService(DeporteRepository deporteRepository, PersonaRepository personaRepository) {
        this.deporteRepository = deporteRepository;
        this.personaRepository = personaRepository;
    }

    @Transactional(readOnly = true)
    public List<Deporte> getAllDeportes(){
        return deporteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Deporte> getDeporteById(Long id){
        return deporteRepository.findById(id);
    }

    @Transactional
    public Optional<Long> saveDeporte(DeporteDTO deporteTransfer){
        Deporte deporteCreate = new Deporte();
        deporteCreate.setNombre(deporteTransfer.getNombre());
        deporteCreate.setDescripcion(deporteTransfer.getDescripcion());
        if(deporteTransfer.getCuotaMensual() == null) deporteCreate.setCuotaMensual(BigDecimal.ZERO);
        Deporte deporteCreated = deporteRepository.save(deporteCreate);
        return Optional.of(deporteCreated.getId());
    }

    @Transactional
    public boolean updateDeporte(Long id, Deporte deporteUpdate){
        boolean b = false;
        Optional<Deporte> deporte = getDeporteById(id);
        if(deporte.isPresent()){
            if(deporteUpdate.getNombre() != null) deporte.get().setNombre(deporteUpdate.getNombre());
            if(deporteUpdate.getDescripcion() != null) deporte.get().setDescripcion(deporteUpdate.getDescripcion());
            if(deporteUpdate.getCuotaMensual() != null) deporte.get().setCuotaMensual(deporteUpdate.getCuotaMensual());
            b = true;
        }
        return b;
    }

    public boolean deleteDeporteById(Long id){
        boolean b = false;
        deporteRepository.deleteById(id);
        return b;
    }

    @Transactional(readOnly = true)
    public Set<Persona> getPersonasByDeporteId(Long deporteId){
        Optional<Deporte> deporte = deporteRepository.findById(deporteId);
        return deporte.map(Deporte::getPersonas).orElse(null);
    }
}
