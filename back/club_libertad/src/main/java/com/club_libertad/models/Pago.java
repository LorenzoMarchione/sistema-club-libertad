package com.club_libertad.models;

import com.club_libertad.enums.MetodoPago;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "pago")
@Data
@NoArgsConstructor
public class Pago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id", nullable = false)
    private Persona socioId;
    @Column(name = "fecha_pago",nullable = false)
    private LocalDate fechaPago;
    @Column(name = "monto_total",nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotal;
    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago")
    private MetodoPago metodoPago;
    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String conceptos;
    @Column(columnDefinition = "TEXT")
    private String observaciones;
}
