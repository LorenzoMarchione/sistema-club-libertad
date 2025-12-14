package com.club_libertad.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Data
@NoArgsConstructor
public class InscripcionDTO {
    public Long personaId;
    public Long deporteId;
    public ZonedDateTime fechaInscripcion;
}
