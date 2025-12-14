package com.club_libertad.models;

import com.club_libertad.dtos.CuotaDTO;
import com.club_libertad.enums.EstadoCuota;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "cuota", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"persona_id", "deporte_id", "periodo"}, name = "uk_cuota_persona_deporte_periodo")
})
@Data
@NoArgsConstructor
public class Cuota {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "persona_id", nullable = false)
    private Persona personaId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deporte_id", nullable = false)
    private Deporte deporteId;
    @Column(nullable = false)
    private LocalDate periodo;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoCuota estado;
    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;
    @Column(name = "fecha_generacion", nullable = false)
    private LocalDate fechaGeneracion;
}
