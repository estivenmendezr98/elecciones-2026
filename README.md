# Sistema de Elección de Directivo Docente 2026

Sistema integral y seguro para gestionar la **Elección del directivo docente representante ante el Comité Regional de Prestaciones Sociales** — Cauca, 30 de marzo de 2026.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Base de Datos | PostgreSQL |
| Backend | Node.js + Express.js |
| Autenticación | JWT + bcrypt |
| Frontend | React + Vite + Tailwind CSS v4 |

---

## Instalación Paso a Paso

### Requisitos Previos
- Node.js ≥ 18
- PostgreSQL ≥ 13

---

### 1. Base de Datos

Abrir `psql` o pgAdmin como superusuario y **crear la base de datos**:

```sql
CREATE USER root WITH PASSWORD '1234';
CREATE DATABASE elecciones_2026 OWNER root;
GRANT ALL PRIVILEGES ON DATABASE elecciones_2026 TO root;
```

#### Credenciales de la Base de Datos
| Atributo | Valor |
|----------|-------|
| **Usuario** | `root` |
| **Contraseña** | `1234` |
| **Base de Datos** | `elecciones_2026` |
| **Hostname** | `localhost` |
| **Puerto** | `5432` |

---

### 2. Backend

```bash
cd backend
npm install
```

El archivo `.env` ya está preconfigurado con las credenciales correctas.

**Inicializar la base de datos** (crea tablas, semillas, y genera el hash bcrypt del admin):

```bash
npm run setup
```

**Iniciar el servidor de desarrollo:**

```bash
npm run dev
```

El servidor corre en `http://localhost:5000`

---

### 3. Frontend

En una nueva terminal:

```bash
cd frontend
npm install
npm run dev
```

La aplicación corre en `http://localhost:5173`

---

## Credenciales de Acceso

| Rol | Usuario (Cédula) | Contraseña |
|-----|-----------------|-----------|
| **Administrador** | `admin` | `Sedc@uc@s0s6#` |
| **Votante** | (número de cédula) | (misma cédula) |

> **Nota:** Los votantes deben ser registrados desde el Panel Administrativo → pestaña "Votantes".

---

## Funcionalidades

### Panel del Votante
- ✅ Ver información de la elección (fecha, horario, estado)
- ✅ Ver tarjetón con candidatos (nombre, institución, municipio, propuesta)
- ✅ Emitir voto con modal de confirmación
- ✅ Bloqueo automático si ya votó

### Panel Administrativo
- ✅ **Resultados** — Votos en tiempo real con porcentajes visuales
- ✅ **Candidatos** — Agregar y eliminar candidatos
- ✅ **Votantes** — Registrar y gestionar directivos docentes
- ✅ **Control de elección** — Iniciar / Cerrar / Reabrir la votación

### Seguridad
- 🔐 Contraseñas hasheadas con bcrypt
- 🎫 Sesiones manejadas con JWT (8h de vigencia)
- 🚫 Control de doble voto (restricción UNIQUE en BD + verificación en API)
- 🌐 Registro de IP por voto
- 🔒 Rutas protegidas por rol (VOTANTE / ADMIN)

---

## Estructura del Proyecto

```
elecciones2026-2/
├── db/
│   └── init.sql              # Schema SQL
├── backend/
│   ├── config/db.js          # Pool PostgreSQL
│   ├── controllers/          # Lógica de negocio
│   ├── middlewares/          # Auth JWT + RBAC
│   ├── routes/               # Rutas API REST
│   ├── setup.js              # Script inicialización DB
│   └── server.js             # Punto de entrada
└── frontend/
    └── src/
        ├── context/AuthContext.jsx
        ├── components/ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── VoterDashboard.jsx
            └── AdminDashboard.jsx
```

---

*Secretaría de Educación Departamental del Cauca — Sistema de Elecciones 2026*
