package com.club_libertad.controllers;

import com.club_libertad.dtos.LoginDTO;
import com.club_libertad.dtos.UsuarioDTO;
import com.club_libertad.models.Usuario;
import com.club_libertad.services.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController(value = "usuarioController")
public class UsuarioController {
    private final UsuarioService usuarioService;
    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/usuarios")
    @Operation(summary = "Obtiene todos los usuarios")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARIO')")
    public ResponseEntity<List<Usuario>> getUsuarios(){
        ResponseEntity<List<Usuario>> response = ResponseEntity.noContent().build();
        List<Usuario> usuarios = usuarioService.getAllUsuarios();
        if(!usuarios.isEmpty()) {
            response = ResponseEntity.ok(usuarios);
        }
        return response;
    }

    @PostMapping("/usuario")
    @Operation(summary = "Crea un usuario", description = "Roles - 0 = ADMIN - 1 = SECRETARIO")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARIO')")
    public ResponseEntity<String> createUsuario(@RequestBody UsuarioDTO usuarioTransfer){
        ResponseEntity<String> response = ResponseEntity
                .status(400)
                .body("Error al crear el usuario");
        try{
            Optional<Long> id = usuarioService.saveUsuario(usuarioTransfer);
            if(id.isPresent()) response = ResponseEntity.ok("Usuario con id " + id.get() +" creado con exito");
        } catch (Exception e){
            System.out.println("------------------\n"
                    + e.getMessage()
                    + "\n------------------");
        }
        return response;
    }

    @PostMapping("/usuario/validate")
    @Operation(summary = "Valida un usuario")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARIO')")
    public ResponseEntity<String> validateUsuario(@RequestBody LoginDTO login){
        ResponseEntity<String> response = ResponseEntity.ok("Usuario o contraseña incorrectos");
        Optional<Usuario> u = usuarioService.validateUsuario(login);
        if(u.isPresent()){
            response = ResponseEntity.ok("Usuario con id " + u.get().getId() +" validado con exito");
        }
        return response;
    }

    @PatchMapping("/usuario/estado/{id}")
    @Operation(summary = "Da de baja/alta a un usuario por su id")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARIO')")
    public ResponseEntity<String> cambiarEstadoUsuario(@PathVariable Long id){
        ResponseEntity<String> response = ResponseEntity.badRequest().build();
        boolean b = usuarioService.estadoUsuario(id);
        if(b) response = ResponseEntity.ok("Usuario con id " + id +" dado de baja/alta con exito");
        return response;
    }

    @PatchMapping("/usuario/{id}")
    @Operation(summary = "Actualiza uno o varios campos de un usuario por id")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARIO')")
    public ResponseEntity<String> updateUsuario(@PathVariable Long id, @RequestBody UsuarioDTO usuarioUpdate){
        ResponseEntity<String> response = ResponseEntity.badRequest().build();
        boolean b = usuarioService.updateUsuarioParcial(id, usuarioUpdate);
        if(b){
            response = ResponseEntity.ok("Usuario actualizado con exito");
        }
        return response;
    }

    @DeleteMapping("/usuario/{id}")
    @Operation(summary = "Elimina un usuario por su id")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARIO')")
    public ResponseEntity<String> deleteUsuario(@PathVariable Long id){
        boolean b = usuarioService.deleteUsuarioById(id);
        if(b) return ResponseEntity.ok("Usuario con id " + id + " eliminado con exito");
        return ResponseEntity.notFound().build();
    }


}
