package com.club_libertad.models;

import com.club_libertad.enums.CategoriaPersona;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDate;
import java.time.ZonedDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Persona {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String nombre;
    @Column(nullable = false)
    private String apellido;
    @Column(unique = true, nullable = false)
    private String dni;
    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;
    private String email;
    private String telefono;
    private String direccion;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaPersona categoria;
    @Column(name = "fecha_registro",nullable = false)
    private ZonedDateTime fechaRegistro;
    @Column(nullable = false)
    private Boolean activo;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_responsable_id", nullable = true)
    private Persona socioResponsable;
}
