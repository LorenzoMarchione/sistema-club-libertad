package com.club_libertad.repositories;

import com.club_libertad.models.Inscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {
    @Query("SELECT i FROM Inscripcion i WHERE i.fechaBaja IS NULL")
    List<Inscripcion> findAllActive();
}
