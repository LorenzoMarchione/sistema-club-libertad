package com.club_libertad.models;

import com.club_libertad.enums.CategoriaPersona;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;


import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "persona")
@Data
@EqualsAndHashCode(exclude = {"deportes", "socioResponsable", "promociones"})
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
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_responsable_id")
    private Persona socioResponsable;
    @JsonIgnore
    @ManyToMany
    @JoinTable(
        name = "persona_deporte",
        joinColumns = @JoinColumn(name = "persona_id"),
        inverseJoinColumns = @JoinColumn(name = "deporte_id")
    )
    private Set<Deporte> deportes = new HashSet<>();
    @JsonIgnore
    @ManyToMany
    @JoinTable(
        name = "persona_promocion",
        joinColumns = @JoinColumn(name = "persona_id"),
        inverseJoinColumns = @JoinColumn(name = "promocion_id")
    )
    private Set<Promocion> promociones = new HashSet<>();

    @JsonProperty("socioResponsableId")
    public Long getSocioResponsableId() {
        return socioResponsable != null ? socioResponsable.getId() : null;
    }

    @JsonProperty("deportesIds")
    public List<Long> getDeportesIds() {
        return deportes != null ? deportes.stream()
                .map(Deporte::getId)
                .collect(Collectors.toList()) : null;
    }

    @JsonProperty("promocionesIds")
    public List<Long> getPromocionesIds() {
        return promociones != null ? promociones.stream()
                .map(Promocion::getId)
                .collect(Collectors.toList()) : null;
    }
}
