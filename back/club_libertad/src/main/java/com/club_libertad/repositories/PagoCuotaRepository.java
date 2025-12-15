package com.club_libertad.repositories;

import com.club_libertad.models.PagoCuota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PagoCuotaRepository extends JpaRepository<PagoCuota, Long> {
}
