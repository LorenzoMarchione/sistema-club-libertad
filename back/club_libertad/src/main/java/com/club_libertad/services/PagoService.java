package com.club_libertad.services;

import com.club_libertad.dtos.PagoDTO;
import com.club_libertad.models.Pago;
import com.club_libertad.models.Persona;
import com.club_libertad.repositories.PagoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PagoService {
    private final PagoRepository pagoRepository;
    public PagoService(PagoRepository pagoRepository) {
        this.pagoRepository = pagoRepository;
    }

    @Transactional(readOnly = true)
    public List<Pago> getAllPagos(){ return pagoRepository.findAll(); }

    @Transactional(readOnly = true)
    public Optional<Pago> getPagoById(Long id){ return pagoRepository.findById(id); }

    @Transactional
    public Optional<Long> savePago(PagoDTO pagoTransfer){
        Pago pagoCreate = new Pago();
        Persona personaExisting = new Persona();
        personaExisting.setId(pagoTransfer.getSocioId());
        pagoCreate.setSocioId(personaExisting);
        pagoCreate.setFechaPago(pagoTransfer.getFechaPago());
        pagoCreate.setMontoTotal(pagoTransfer.getMontoTotal());
        if(pagoTransfer.getMetodoPago() != null) pagoCreate.setMetodoPago(pagoTransfer.getMetodoPago());
        if(pagoTransfer.getConceptos() != null) pagoCreate.setConceptos(pagoTransfer.getConceptos());
        if(pagoTransfer.getObservaciones() != null) pagoCreate.setObservaciones(pagoTransfer.getObservaciones());
        Pago pagoCreated = pagoRepository.save(pagoCreate);
        return Optional.of(pagoCreated.getId());
    }
}
