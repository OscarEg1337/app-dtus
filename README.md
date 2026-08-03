# APP DTUs

Sistema de control de solicitudes de revisión técnica (DTU) por lote. Ver
`SPEC.md` para el plan completo (roles, modelo de datos, fases).

Proyecto **local** por ahora (sin backend, todo en `localStorage`). Usa
usuarios ficticios de prueba — ver `js/seed/usuarios.seed.js`.

## Correr local

```
npm install
npm start
```

Abre `http://localhost:8080`.

## Usuarios de prueba

Todos con contraseña `Test123`:

| Correo | Rol |
|---|---|
| residente1@test.local | Residente |
| super1@test.local | Superintendente |
| ana.test@test.local | Facilitador |
| luis.test@test.local | Facilitador |
| marta.test@test.local | Facilitador |
| pedro.test@test.local | Facilitador |
| sofia.test@test.local | Facilitador |
| admin1@test.local | Admin (Jefe/Coordinador) |
| analista1@test.local | Analista |
