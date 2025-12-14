package com.club_libertad.dtos;

import com.club_libertad.enums.MetodoPago;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
public class PagoDTO {
    public Long socioId;
    public LocalDate fechaPago;
    public BigDecimal montoTotal;
    @Enumerated(EnumType.STRING)
    public MetodoPago metodoPago;
    private String conceptos;
    private String observaciones;
}
