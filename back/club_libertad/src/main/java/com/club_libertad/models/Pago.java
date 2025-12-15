package com.club_libertad.models;

import com.club_libertad.enums.MetodoPago;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "pago")
@Data
@EqualsAndHashCode(exclude = {"cuotas"})
@NoArgsConstructor
public class Pago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "fecha_pago",nullable = false)
    private LocalDate fechaPago;
    @Column(name = "monto_total",nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotal;
    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago")
    private MetodoPago metodoPago;
    @Column(columnDefinition = "TEXT")
    private String observaciones;
    @JsonIgnore
    @OneToMany(mappedBy = "pagoId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Cuota> cuotas;
}
