---

# 🏟️ Sistema de Gestión de Socios – Club Libertad

Sistema web desarrollado como proyecto de práctica profesionalizante para la gestión administrativa de socios del Club Libertad.

Permite administrar altas, bajas y modificaciones de socios, autenticación segura de usuarios y despliegue en servidor VPS con HTTPS.

---

## 📌 Descripción General

El sistema fue desarrollado con una arquitectura cliente-servidor basada en:

* Backend REST con Spring Boot
* Base de datos PostgreSQL
* Despliegue en VPS Linux
* Proxy inverso con Nginx
* Certificado SSL con Let's Encrypt
* Contenerización con Docker

El objetivo principal es digitalizar la gestión de socios y permitir el acceso seguro mediante autenticación.

---

## 🛠️ Stack Tecnológico

### Backend

* Java 17
* Spring Boot
* Spring Security
* JPA / Hibernate
* Maven

### Base de Datos

* PostgreSQL

### Infraestructura

* Docker
* Docker Compose
* Nginx
* Let's Encrypt (Certbot)
* VPS Linux (Ubuntu)

---

## 🏗️ Arquitectura

```
Usuario
   ↓
HTTPS (SSL)
   ↓
Nginx (Reverse Proxy)
   ↓
Spring Boot (Docker container)
   ↓
PostgreSQL (Docker container)
```

* Nginx maneja:

  * Redirección HTTP → HTTPS
  * Certificados SSL
  * Proxy hacia el backend

* El backend corre como contenedor Docker.

* La base de datos también corre como contenedor independiente.

---

## 🚀 Funcionalidades

* ✅ Registro y autenticación de usuarios
* ✅ Login con Spring Security
* ✅ Gestión completa de socios (CRUD)
* ✅ Persistencia en PostgreSQL
* ✅ Despliegue en producción con HTTPS
* ✅ Configuración con variables de entorno

---

## 📂 Estructura del Proyecto

```
clublibertad/
│
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Configuración Local

### 1️⃣ Clonar repositorio

```bash
git clone https://github.com/usuario/clublibertad.git
cd clublibertad
```

---

### 2️⃣ Configurar variables de entorno

En `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/clublibertad
spring.datasource.username=postgres
spring.datasource.password=tu_password
spring.jpa.hibernate.ddl-auto=update
```

---

### 3️⃣ Ejecutar backend

```bash
mvn clean install
mvn spring-boot:run
```

---

## 🐳 Despliegue con Docker

### docker-compose.yml

Ejemplo simplificado:

```yaml
services:
  backend:
    build: ./backend
    container_name: cl_backend
    ports:
      - "8080:8080"
    depends_on:
      - db

  db:
    image: postgres:15
    container_name: cl_db
    environment:
      POSTGRES_DB: clublibertad
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

### Levantar contenedores

```bash
docker compose up -d --build
```

Ver estado:

```bash
docker compose ps
```

---

## 🌍 Configuración de Producción

### VPS

Servidor Linux Ubuntu.

### Nginx

Archivo de configuración:

```
/etc/nginx/nginx.conf
```

Responsabilidades:

* Redirección HTTP → HTTPS
* Proxy hacia `localhost:8080`
* Manejo de certificados SSL

---

### SSL

Certificado emitido con:

```
certbot --nginx
```

Verificación de seguridad realizada con SSL Labs (calificación A+).

---

## 🔐 Seguridad

* Spring Security configurado para autenticación.
* Contraseñas cifradas.
* Comunicación cifrada con HTTPS.
* Acceso a base de datos restringido a contenedores internos.

---

## 🔄 Actualización del Sistema en Producción

### Subir nuevo JAR

Desde máquina local:

```bash
scp target/app.jar usuario@ip-servidor:/home/clublibertad/
```

Luego en el servidor:

```bash
docker compose down
docker compose up -d --build
```

---

## 📊 Base de Datos

Motor: PostgreSQL
Persistencia mediante volumen Docker.

Para acceder:

```bash
docker exec -it cl_db psql -U postgres
```

---

## 👨‍💻 Autor

Lorenzo Marchione
Técnico en Programación
Proyecto de Práctica Profesionalizante

---

## 📄 Licencia

Proyecto desarrollado con fines educativos y administrativos para uso interno del Club Libertad.

---
