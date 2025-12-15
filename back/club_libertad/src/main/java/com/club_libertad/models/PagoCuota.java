package com.club_libertad.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "pago_cuota", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"cuota_id"}, name = "uk_pago_cuota_cuota_id")
})
@Data
@NoArgsConstructor
public class PagoCuota {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pago_id", nullable = false)
    private Pago pagoId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuota_id", nullable = false)
    private Cuota cuotaId;
    @Column(name = "monto_aplicado",nullable = false, precision = 10, scale = 2)
    private BigDecimal montoAplicado;
}
