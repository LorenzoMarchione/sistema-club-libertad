# Copilot Instructions for Sistema Club Libertad

- Scope: monorepo with Spring Boot backend (back/club_libertad) and Vite + React + TS frontend (front/gestion-socios-front). No existing AI rules to merge.
- Run backend from back/club_libertad with `./mvnw spring-boot:run`; Postgres settings live in back/club_libertad/src/main/resources/application.properties (db url/user/pw, ddl-auto=update). No Spring Security; CORS allows only http://localhost:3000 in config/CorsConfig.java—adjust to Vite dev port (5173) when integrating.
- Run frontend from front/gestion-socios-front with `npm install && npm run dev`; API base URL is `import.meta.env.VITE_API_BASE_URL` (defaults to http://localhost:8080) in src/services/api.ts.
- Backend architecture: thin controllers + services + JPA entities/DTOs. CRUD endpoints use `ResponseEntity` and null/empty checks for 204/404 fallbacks (e.g., PersonaController, DeporteController). No global exception handling or validation—callers must sanitize input.
- Entities model many-to-many Persona↔Deporte and links to Cuota, Pago, Usuario. Relationships are LAZY and @JsonIgnore to avoid cycles; DTOs are used only for creates/partial updates, with setters populated manually in services.
- Persona creation sets `fechaRegistro=ZonedDateTime.now()` and `activo=true`; updates toggle or patch only non-null fields (PersonaService.updatePersonaParcial). Associate/desasociate deportes via /persona/{id}/deporte/{deporteId}.
- Usuarios store plain passwords and simple roles (ADMIN, SECRETARIO). Login validation compares plain text and also checks Persona.activo; no JWT/session—any future auth should replace validateUsuario.
- Cuotas: unique by persona+deporte+periodo; created with current fechaGeneracion; PATCH updates estado only. Pagos: create then loop cuotaIds to set pagoId and estado=PAGADA. DeporteService.deleteDeporteById currently always returns false even after delete.
- Inscripciones: create with personaId/deporteId + fechaInscripcion; PATCH sets fechaBaja=now.
- Frontend state: App.tsx gates UI behind mock login (hardcoded users in components/login-screen.tsx). Tabs render Socios/Deportes/Promociones/Pagos/Notificaciones and optional Admin when role=admin.
- Frontend data layer: axios instance in src/services/api.ts; personaService/deporteService expose REST calls mirroring backend paths. Be mindful of naming gaps—frontend `correo`/`estado`/`deportes` differ from backend `email`/`activo`/`deportesIds`.
- Types: src/types/persona.ts and deporte.ts mirror expected payloads; Persona.id is string on FE, but backend uses Long—cast/convert when composing requests.
- UI: heavy use of shadcn/ui components under src/components/ui; socios-module.tsx drives most data interactions and still contains placeholder history data and TODO comments about backend gaps (e.g., forcing deportes arrays).
- Testing: no automated tests present (backend or frontend). Verify endpoints manually via browser/postman; watch for LAZY loading serialization—entities expose *_Ids helpers instead of nested graphs.
- When adding endpoints: keep REST paths flat (no versioning), return ResponseEntity with noContent/notFound defaults, and set defaults server-side (activo true, BigDecimal.ZERO, fechaGeneracion now). Add DTOs for incoming payloads and rely on transactional dirty checking instead of explicit saves after field mutation.
- When wiring FE to BE: align Vite dev origin with CORS, convert FE booleans/strings to backend expectations, and remove mock login in favor of /usuario/validate once password handling improves.
