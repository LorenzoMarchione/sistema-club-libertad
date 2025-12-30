package com.club_libertad.services;

import com.club_libertad.dtos.CuotaDTO;
import com.club_libertad.enums.EstadoCuota;
import com.club_libertad.models.Cuota;
import com.club_libertad.models.Deporte;
import com.club_libertad.models.Inscripcion;
import com.club_libertad.models.Persona;
import com.club_libertad.repositories.CuotaRepository;
import com.club_libertad.repositories.InscripcionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Service
public class CuotaService {
    private final CuotaRepository cuotaRepository;
    private final InscripcionRepository inscripcionRepository;
    
    public CuotaService(CuotaRepository cuotaRepository, InscripcionRepository inscripcionRepository) {
        this.cuotaRepository = cuotaRepository;
        this.inscripcionRepository = inscripcionRepository;
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
        cuotaCreate.setPeriodo(cuotaTransfer.getPeriodo());
        cuotaCreate.setMonto(cuotaTransfer.getMonto());
        cuotaCreate.setEstado(cuotaTransfer.getEstado());
        if(cuotaTransfer.getFechaVencimiento() != null) cuotaCreate.setFechaVencimiento(cuotaTransfer.getFechaVencimiento());
        if(cuotaTransfer.getConcepto() != null) cuotaCreate.setConcepto(cuotaTransfer.getConcepto());
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

    @Transactional
    public int generarCuotasMesActual(){
        LocalDate hoy = LocalDate.now();
        LocalDate primerDiaMes = hoy.withDayOfMonth(1);
        LocalDate primerDiaMesSiguiente = YearMonth.from(hoy).plusMonths(1).atDay(1);
        
        List<Inscripcion> inscripcionesActivas = inscripcionRepository.findAllActive();
        int cuotasGeneradas = 0;
        
        for (Inscripcion inscripcion : inscripcionesActivas) {
            Long personaId = inscripcion.getPersonaId().getId();
            Long deporteId = inscripcion.getDeporteId().getId();
            
            Optional<Cuota> cuotaExistente = cuotaRepository.findByPersonaDeporteAndPeriodo(
                personaId, deporteId, primerDiaMes
            );
            
            if (cuotaExistente.isEmpty()) {
                Cuota nuevaCuota = new Cuota();
                nuevaCuota.setPersonaId(inscripcion.getPersonaId());
                nuevaCuota.setDeporteId(inscripcion.getDeporteId());
                nuevaCuota.setPeriodo(primerDiaMes);
                nuevaCuota.setMonto(inscripcion.getDeporteId().getCuotaMensual());
                nuevaCuota.setEstado(EstadoCuota.GENERADA);
                nuevaCuota.setFechaVencimiento(primerDiaMesSiguiente);
                nuevaCuota.setFechaGeneracion(hoy);
                nuevaCuota.setConcepto("");
                
                cuotaRepository.save(nuevaCuota);
                cuotasGeneradas++;
            }
        }
        
        return cuotasGeneradas;
    }

}
