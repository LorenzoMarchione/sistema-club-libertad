package com.club_libertad.services;

import com.club_libertad.models.Usuario;
import com.club_libertad.repositories.UsuarioRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;


/**
 * Servicio encargado de cargar los detalles del usuario para Spring Security.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UserDetailsServiceImpl(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Buscamos el usuario en nuestro repositorio
        Usuario u = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con username: " + username));

        // 2. Mapeamos nuestro Enum RoleUsuario a una Authority de Spring Security.
        // Importante: Spring Security suele esperar el prefijo "ROLE_" para las comprobaciones de hasRole().
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + u.getRole().name());

        // 3. Devolvemos la implementación estándar de User que Spring Security ya conoce.
        // Pasamos: username, password (hash), habilitado, cuentaNoExpirada, credencialesNoExpiradas, cuentaNoBloqueada, y roles.
        return new User(
                u.getUsername(),
                u.getPassword(),
                u.getActivo() != null && u.getActivo(), // enabled
                true,          // accountNonExpired
                true,          // credentialsNonExpired
                u.getBloqueado() == null || !u.getBloqueado(), // accountNonLocked
                Collections.singletonList(authority)
        );
    }
}
