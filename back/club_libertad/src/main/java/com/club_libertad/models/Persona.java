package com.club_libertad.models;

import com.club_libertad.enums.CategoriaPersona;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;


import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "persona")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@EqualsAndHashCode(exclude = {"deportes", "socioResponsable", "promocion"})
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
    @JsonFormat(pattern = "yyyy-MM-dd")
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
    private Set<Deporte> deportes;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promocion_id")
    private Promocion promocion;

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

    @JsonProperty("promocionId")
    public Long getPromocionId(){
        return promocion != null ? promocion.getId() : null;
    }

}
