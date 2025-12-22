package com.club_libertad.models;

import com.club_libertad.enums.TipoDescuento;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "promocion")
@Data
@NoArgsConstructor
public class Promocion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(length = 100, unique = true, nullable = false)
    private String nombre;
    
    @Column(columnDefinition = "TEXT")
    private String descripcion;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDescuento tipoDescuento;
    
    @Column(name = "descuento", nullable = false, precision = 10, scale = 2)
    private BigDecimal descuento;
    
    @Column(nullable = false)
    private Boolean activo = true;
}
