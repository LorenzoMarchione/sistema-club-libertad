package com.club_libertad.services;

import com.club_libertad.dtos.DeporteDTO;
import com.club_libertad.models.Deporte;
import com.club_libertad.repositories.DeporteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class DeporteService {
    private final DeporteRepository deporteRepository;
    public DeporteService(DeporteRepository deporteRepository) {
        this.deporteRepository = deporteRepository;
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
}
