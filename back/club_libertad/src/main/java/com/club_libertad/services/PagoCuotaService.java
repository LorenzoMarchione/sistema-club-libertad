package com.club_libertad.services;

import com.club_libertad.dtos.PagoCuotaDTO;
import com.club_libertad.models.Cuota;
import com.club_libertad.models.Pago;
import com.club_libertad.models.PagoCuota;
import com.club_libertad.repositories.PagoCuotaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PagoCuotaService {
    private final PagoCuotaRepository pagoCuotaRepository;
    public PagoCuotaService(PagoCuotaRepository pagoCuotaRepository) {
        this.pagoCuotaRepository = pagoCuotaRepository;
    }

    @Transactional(readOnly = true)
    public List<PagoCuota> getAllPagoCuotas(){ return pagoCuotaRepository.findAll(); }

    @Transactional(readOnly = true)
    public Optional<PagoCuota> getPagoCuotaById(Long id){ return pagoCuotaRepository.findById(id); }

    @Transactional
    public Optional<Long> savePagoCuota(PagoCuotaDTO pagoCuotaTransfer){
        PagoCuota pagoCuotaCreate = new PagoCuota();
        Pago pagoExisting = new Pago();
        pagoExisting.setId(pagoCuotaTransfer.getPagoId());
        pagoCuotaCreate.setPagoId(pagoExisting);
        Cuota cuotaExisting = new Cuota();
        cuotaExisting.setId(pagoCuotaTransfer.getCuotaId());
        pagoCuotaCreate.setCuotaId(cuotaExisting);
        pagoCuotaCreate.setMontoAplicado(pagoCuotaTransfer.getMontoAplicado());
        PagoCuota pagoCuotaCreated = pagoCuotaRepository.save(pagoCuotaCreate);
        return Optional.of(pagoCuotaCreated.getId());
    }

    @Transactional
    public boolean deletePagoCuotaById(Long id){
        boolean b = false;
        Optional<PagoCuota> pagoCuota = getPagoCuotaById(id);
        if (pagoCuota.isPresent()) {
            pagoCuotaRepository.deleteById(id);
            b = true;
        }
        return b;
    }

}
