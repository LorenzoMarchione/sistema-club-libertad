package com.club_libertad.services;

import com.club_libertad.dtos.PagoDTO;
import com.club_libertad.enums.EstadoCuota;
import com.club_libertad.models.Cuota;
import com.club_libertad.models.Pago;
import com.club_libertad.models.Persona;
import com.club_libertad.repositories.CuotaRepository;
import com.club_libertad.repositories.PagoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class PagoService {
    private final PagoRepository pagoRepository;
    private final CuotaRepository cuotaRepository;
    
    public PagoService(PagoRepository pagoRepository, CuotaRepository cuotaRepository) {
        this.pagoRepository = pagoRepository;
        this.cuotaRepository = cuotaRepository;
    }

    @Transactional(readOnly = true)
    public List<Pago> getAllPagos(){ return pagoRepository.findAll(); }

    @Transactional(readOnly = true)
    public Optional<Pago> getPagoById(Long id){ return pagoRepository.findById(id); }

    @Transactional
    public Optional<Long> savePago(PagoDTO pagoTransfer){
        Pago pagoCreate = new Pago();
        Persona socioExisting = new Persona();
        socioExisting.setId(pagoTransfer.getSocioId());
        pagoCreate.setSocioId(socioExisting);
        pagoCreate.setFechaPago(pagoTransfer.getFechaPago());
        // Calcular montoOriginal a partir de las cuotas
        BigDecimal montoOriginal = BigDecimal.ZERO;
        if(pagoTransfer.getCuotaIds() != null && !pagoTransfer.getCuotaIds().isEmpty()) {
            for(Long cuotaId : pagoTransfer.getCuotaIds()) {
                Optional<Cuota> cuotaOpt = cuotaRepository.findById(cuotaId);
                if(cuotaOpt.isPresent()) {
                    Cuota cuota = cuotaOpt.get();
                    montoOriginal = montoOriginal.add(cuota.getMonto());
                }
            }
        }

        // Si viene informado desde frontend, se usa; si no, se toma 0
        BigDecimal montoDescuento = pagoTransfer.getMontoDescuento() != null ? pagoTransfer.getMontoDescuento() : BigDecimal.ZERO;
        pagoCreate.setMontoOriginal(pagoTransfer.getMontoOriginal() != null ? pagoTransfer.getMontoOriginal() : montoOriginal);
        pagoCreate.setMontoDescuento(montoDescuento);
        pagoCreate.setMontoTotal(pagoCreate.getMontoOriginal().subtract(montoDescuento));
        if(pagoTransfer.getMetodoPago() != null) pagoCreate.setMetodoPago(pagoTransfer.getMetodoPago());
        if(pagoTransfer.getObservaciones() != null) pagoCreate.setObservaciones(pagoTransfer.getObservaciones());
        
        // Save pago first to get its ID
        Pago pagoCreated = pagoRepository.save(pagoCreate);
        
        // Associate cuotas with this pago
        if(pagoTransfer.getCuotaIds() != null && !pagoTransfer.getCuotaIds().isEmpty()) {
            for(Long cuotaId : pagoTransfer.getCuotaIds()) {
                Optional<Cuota> cuotaOpt = cuotaRepository.findById(cuotaId);
                if(cuotaOpt.isPresent()) {
                    Cuota cuota = cuotaOpt.get();
                    cuota.setPagoId(pagoCreated);
                    cuota.setEstado(EstadoCuota.PAGADA);
                    cuotaRepository.save(cuota);
                }
            }
        }
        
        return Optional.of(pagoCreated.getId());
    }
}
