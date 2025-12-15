package com.club_libertad.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class PagoCuotaDTO {
    public Long pagoId;
    public Long cuotaId;
    public BigDecimal montoAplicado;
}
