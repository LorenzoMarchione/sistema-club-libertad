package com.club_libertad.services;

import com.club_libertad.dtos.CuotaDTO;
import com.club_libertad.enums.EstadoCuota;
import com.club_libertad.models.Cuota;
import com.club_libertad.models.Deporte;
import com.club_libertad.models.Inscripcion;
import com.club_libertad.models.Persona;
import com.club_libertad.models.Promocion;
import com.club_libertad.repositories.CuotaRepository;
import com.club_libertad.repositories.InscripcionRepository;
import com.club_libertad.repositories.PersonaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class CuotaService {
    private final CuotaRepository cuotaRepository;
    private final InscripcionRepository inscripcionRepository;
    private final PersonaRepository personaRepository;
    
    public CuotaService(CuotaRepository cuotaRepository, InscripcionRepository inscripcionRepository, PersonaRepository personaRepository) {
        this.cuotaRepository = cuotaRepository;
        this.inscripcionRepository = inscripcionRepository;
        this.personaRepository = personaRepository;
    }

    // Método auxiliar para calcular monto con descuentos de promociones
    private BigDecimal aplicarDescuentosPromociones(BigDecimal montoOriginal, Set<Promocion> promociones) {
        if (promociones == null || promociones.isEmpty()) {
            return montoOriginal;
        }
        
        BigDecimal descuentoTotal = BigDecimal.ZERO;
        for (Promocion promo : promociones) {
            if (promo.getActivo() != null && promo.getActivo()) {
                if (promo.getTipoDescuento().name().equals("PORCENTAJE")) {
                    BigDecimal descuentoPorcentual = montoOriginal.multiply(promo.getDescuento()).divide(BigDecimal.valueOf(100));
                    descuentoTotal = descuentoTotal.add(descuentoPorcentual);
                } else { // MONTO_FIJO
                    descuentoTotal = descuentoTotal.add(promo.getDescuento());
                }
            }
        }
        
        BigDecimal montoFinal = montoOriginal.subtract(descuentoTotal);
        return montoFinal.compareTo(BigDecimal.ZERO) > 0 ? montoFinal : BigDecimal.ZERO;
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
        
        // Aplicar descuentos de promociones si la persona los tiene
        BigDecimal montoBase = cuotaTransfer.getMonto();
        Optional<Persona> personaOpt = personaRepository.findById(cuotaTransfer.getPersonaId());
        if(personaOpt.isPresent()) {
            Set<Promocion> promociones = personaOpt.get().getPromociones();
            montoBase = aplicarDescuentosPromociones(montoBase, promociones);
        }
        cuotaCreate.setMonto(montoBase);
        
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
                
                // Aplicar descuentos de promociones si la persona los tiene
                BigDecimal montoBase = inscripcion.getDeporteId().getCuotaMensual();
                Set<Promocion> promociones = inscripcion.getPersonaId().getPromociones();
                BigDecimal montoFinal = aplicarDescuentosPromociones(montoBase, promociones);
                nuevaCuota.setMonto(montoFinal);
                
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

    @Transactional
    public int actualizarCuotasVencidas(){
        LocalDate hoy = LocalDate.now();
        List<Cuota> cuotas = cuotaRepository.findAll();
        int cuotasVencidas = 0;
        
        for (Cuota cuota : cuotas) {
            // Si la cuota está en GENERADA y su fecha de vencimiento es <= hoy, marcarla como VENCIDA
            if (cuota.getEstado() == EstadoCuota.GENERADA && 
                cuota.getFechaVencimiento() != null && 
                !cuota.getFechaVencimiento().isAfter(hoy)) {
                cuota.setEstado(EstadoCuota.VENCIDA);
                cuotasVencidas++;
            }
        }
        
        return cuotasVencidas;
    }

}
