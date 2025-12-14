package com.club_libertad.services;

import com.club_libertad.dtos.LoginDTO;
import com.club_libertad.dtos.UsuarioDTO;
import com.club_libertad.models.Persona;
import com.club_libertad.models.Usuario;
import com.club_libertad.repositories.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<Usuario> getAllUsuarios(){
        return usuarioRepository.findAll();
    }

    @Transactional
    public Optional<Long> saveUsuario(UsuarioDTO usuarioTransfer){
        Usuario usuarioCreate = new Usuario();
        usuarioCreate.setUsername(usuarioTransfer.getUsername());
        usuarioCreate.setPassword(usuarioTransfer.getPassword());
        usuarioCreate.setRole(usuarioTransfer.getRole());
        Persona p = new Persona();
        p.setId(usuarioTransfer.getPersonaId());
        usuarioCreate.setPersona(p);
        Usuario usuarioCreated = usuarioRepository.save(usuarioCreate);
        return Optional.of(usuarioCreated.getId());
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> getUsuarioByUsername(String username){
        return usuarioRepository.findByUsername(username);
    }


    //Cambiar por JWT
    @Transactional(readOnly = true)
    public Optional<Usuario> validateUsuario(LoginDTO login){
        boolean b = false;
        Optional<Usuario> u = getUsuarioByUsername(login.getUsername());
        if(u.isPresent()){
            if(u.get().getPassword().equals(login.getPassword())
                    && u.get().getPersona().getActivo())
            {
                b = true;
            }
        }
        return b ? u : Optional.empty();
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
        Optional<Usuario> usuario = getUsuarioByUsername(usuarioUpdate.getUsername());
        if(usuario.isPresent()){
            if(usuarioUpdate.getUsername() != null) usuario.get().setUsername(usuarioUpdate.getUsername());
            if(usuarioUpdate.getPassword() != null) usuario.get().setPassword(usuarioUpdate.getPassword());
            if(usuarioUpdate.getRole() != null) usuario.get().setRole(usuarioUpdate.getRole());
            b = true;
        }
        return b;
    }

}
