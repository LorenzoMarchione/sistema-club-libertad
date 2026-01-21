package com.club_libertad.controllers;

import com.club_libertad.dtos.PagoCuotaDTO;
import com.club_libertad.models.PagoCuota;
import com.club_libertad.services.PagoCuotaService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController(value = "pagoCuotaController")
public class PagoCuotaController {
    private final PagoCuotaService pagoCuotaService;
    public PagoCuotaController(PagoCuotaService pagoCuotaService) {
        this.pagoCuotaService = pagoCuotaService;
    }

    @GetMapping("/pagoCuotas")
    @Operation(summary = "Obtiene todas las pago_cuotas")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARIO')")
    public ResponseEntity<List<PagoCuota>> getAllPagoCuotas(){
        ResponseEntity<List<PagoCuota>> response = ResponseEntity.noContent().build();
        List<PagoCuota> pagoCuotas = pagoCuotaService.getAllPagoCuotas();
        if(!pagoCuotas.isEmpty()) response = ResponseEntity.ok(pagoCuotas);
        return response;
    }

    @GetMapping("/pagoCuota/{id}")
    @Operation(summary = "Obtiene un pago_cuota por su id")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARIO')")
    public ResponseEntity<PagoCuota> getPagoCuotaById(@PathVariable Long id){
        ResponseEntity<PagoCuota> response = ResponseEntity.notFound().build();
        Optional<PagoCuota> pagoCuota = pagoCuotaService.getPagoCuotaById(id);
        if(pagoCuota.isPresent()) response = ResponseEntity.ok(pagoCuota.get());
        return response;
    }

    @PostMapping("/pagoCuota")
    @Operation(summary = "Crea un pago_cuota")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARIO')")
    public ResponseEntity<String> createPagoCuota(@RequestBody PagoCuotaDTO pagoCuotaTransfer){
        ResponseEntity<String> response = ResponseEntity
                .status(400)
                .body("Error al crear la cuota");
        try{
            Optional<Long> id = pagoCuotaService.savePagoCuota(pagoCuotaTransfer);
            if(id.isPresent()) response = ResponseEntity.ok("Cuota con id " + id.get() + " creada con exito");
        } catch (Exception e){
            System.out.println("------------------\n"
                    + e.getMessage()
                    + "\n------------------");
        }
        return response;
    }

    @DeleteMapping("/pagoCuota/{id}")
    @Operation(summary = "Elimina un pago_cuota por su id")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARIO')")
    public ResponseEntity<String> deletePagoCuota(@PathVariable Long id){
        ResponseEntity<String> response = ResponseEntity.badRequest().build();
        try{
            boolean b = pagoCuotaService.deletePagoCuotaById(id);
            if(b) response = ResponseEntity.ok("Cuota con id " + id + " eliminada con exito");
        } catch (Exception e){
            System.out.println("------------------\n"
                    + e.getMessage()
                    + "\n------------------");
        }
        return response;
    }
}
