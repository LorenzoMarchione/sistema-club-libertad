package com.club_libertad.dtos;

import com.club_libertad.enums.CategoriaPersona;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
public class PersonaDTO {
    public String nombre;
    public String apellido;
    public String dni;
    public LocalDate fechaNacimiento;
    public String email;
    public String telefono;
    public String direccion;
    @Enumerated(EnumType.STRING)
    public CategoriaPersona categoria;
    public Long socioResponsableId;
    public List<Long> promocionesIds;
}
