package com.club_libertad.services;

import com.club_libertad.dtos.CuotaDTO;
import com.club_libertad.enums.EstadoCuota;
import com.club_libertad.models.Cuota;
import com.club_libertad.models.Deporte;
import com.club_libertad.models.Persona;
import com.club_libertad.repositories.CuotaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CuotaService {
    private final CuotaRepository cuotaRepository;
    public CuotaService(CuotaRepository cuotaRepository) {
        this.cuotaRepository = cuotaRepository;
    }

    @Transactional(readOnly = true)
    public List<Cuota> getAllCuotas(){ return cuotaRepository.findAll(); }

    @Transactional(readOnly = true)
    public Optional<Cuota> getCuotaById(Long id){ return cuotaRepository.findById(id); }

    @Transactional
    public Optional<Long> saveCuota(CuotaDTO cuotaTransfer){
        Cuota cuotaCreate = new Cuota();
        Persona personaExisting = new Persona();
        personaExisting.setId(cuotaTransfer.getPersonaId());
        cuotaCreate.setPersonaId(personaExisting);
        Deporte deporteExisting = new Deporte();
        deporteExisting.setId(cuotaTransfer.getDeporteId());
        cuotaCreate.setDeporteId(deporteExisting);
        cuotaCreate.setPeriodo(cuotaTransfer.getPerido());
        cuotaCreate.setMonto(cuotaTransfer.getMonto());
        cuotaCreate.setEstado(cuotaTransfer.getEstado());
        if(cuotaTransfer.getFechaVencimiento() != null) cuotaCreate.setFechaVencimiento(cuotaTransfer.getFechaVencimiento());
        cuotaCreate.setFechaGeneracion(LocalDate.now());
        Cuota cuotaCreated = cuotaRepository.save(cuotaCreate);
        return Optional.of(cuotaCreated.getId());
    }

    @Transactional
    public boolean changeStateCuota(Long id, EstadoCuota estado){
        boolean b = false;
        Optional<Cuota> cuota = getCuotaById(id);
        if(cuota.isPresent()){
            cuota.get().setEstado(estado);
            b = true;
        }
        return b;
    }

}
