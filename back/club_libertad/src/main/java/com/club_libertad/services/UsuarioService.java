package com.club_libertad.services;

import com.club_libertad.dtos.LoginDTO;
import com.club_libertad.dtos.UsuarioDTO;
import com.club_libertad.models.Persona;
import com.club_libertad.models.Usuario;
import com.club_libertad.repositories.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public List<Usuario> getAllUsuarios(){
        return usuarioRepository.findAll();
    }

    public Usuario createUsuario(UsuarioDTO usuario){
        Usuario u = new Usuario();
        u.setUsername(usuario.getUsername());
        u.setPassword(usuario.getPassword());
        u.setRole(usuario.getRole());
        Persona p = new Persona();
        p.setId(usuario.getPersonaId());
        u.setPersona(p);
        u = usuarioRepository.save(u);
        return u;
    }

    public Usuario getUsuarioByUsername(String username){
        return usuarioRepository.findByUsername(username);
    }

    //Cambiar por JWT
    public Usuario validateUsuario(LoginDTO login){
        boolean b = false;
        Usuario u = getUsuarioByUsername(login.getUsername());
        if(u != null){
            if(u.getPassword().equals(login.getPassword())
                    && u.getPersona().getActivo())
            {
                b = true;
            }
        }
        return b ? u : null;
    }

    @Transactional
    public boolean estadoUsuario(Long id){
        boolean b = false;
        Usuario u = usuarioRepository.findById(id).orElse(null);
        if(u != null){
            Persona persona = u.getPersona();
            persona.setActivo(!persona.getActivo());
            b = true;
        }
        return b;
    }

    @Transactional
    public boolean updateUsuarioParcial(UsuarioDTO usuarioUpdate){
        boolean b = false;
        Usuario usuario = getUsuarioByUsername(usuarioUpdate.getUsername());
        if(usuario != null){
            if(usuarioUpdate.getUsername() != null) usuario.setUsername(usuarioUpdate.getUsername());
            if(usuarioUpdate.getPassword() != null) usuario.setPassword(usuarioUpdate.getPassword());
            if(usuarioUpdate.getRole() != null) usuario.setRole(usuarioUpdate.getRole());
            b = true;
        }
        return b;
    }

}
