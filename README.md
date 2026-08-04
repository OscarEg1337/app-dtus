# APP DTUs

Sistema de control de solicitudes de revisión técnica (DTU) por lote. Ver
`SPEC.md` para el plan completo (roles, modelo de datos, fases).

Proyecto **local** por ahora (sin backend, todo en `localStorage`). El
catálogo de Fraccionamiento/Superintendente/Facilitador ya es real (ver
`js/seed/fraccionamientos.seed.js`), pero las cuentas de login siguen
siendo ficticias por seguridad — ver `js/seed/usuarios.seed.js`.

## Correr local

```
npm install
npm start
```

Abre `http://localhost:8080`.

## Usuarios de prueba

Todos con contraseña `Test123`:

| Correo | Nombre (real) | Rol |
|---|---|---|
| residente1@test.local | Residente Uno | Residente |
| super1@test.local | Superintendente Uno | Superintendente |
| cesar.delarosa@test.local | Cesar De la Rosa | Facilitador |
| erik.calderon@test.local | Erik Calderon | Facilitador |
| carlos.torres@test.local | Carlos Torres | Facilitador |
| jose.eggermont@test.local | Jose Juan Eggermont | Facilitador |
| yolanda.rangel@test.local | Yolanda Rangel | Facilitador |
| carlos.ramirez@test.local | Carlos Ramirez | Facilitador |
| natalia.escalera@test.local | Natalia Escalera | Facilitador |
| julio.esquivel@test.local | Julio Esquivel | Facilitador |
| aldo.rodriguez@test.local | Aldo Rodriguez | Facilitador |
| joel.rodriguez@test.local | Joel Rodriguez | Facilitador |
| admin1@test.local | Admin Uno (Jefe/Coordinador) | Admin |
| analista1@test.local | Analista Uno | Analista |

## Catálogo de Fraccionamientos (real)

| Fraccionamiento | Superintendente | Facilitador(es) |
|---|---|---|
| ALMENDROS | Hugo Martinez | Cesar De la Rosa |
| ARBADOS MARQUESA | Hugo Martinez | Erik Calderon |
| CANADA ALBERTA | Hugo Martinez | Carlos Torres, Jose Juan Eggermont |
| PUERTA JARDÍN | Ramiro Fernandez | Carlos Torres, Yolanda Rangel, Carlos Ramirez |
| PUERTA JARDÍN PLUS | Ramiro Fernandez | Erik Calderon, Carlos Torres |
| PUERTA ORIENTE RF | Ramiro Fernandez | Yolanda Rangel |
| PUERTA ORIENTE EM | Hugo Martinez | Yolanda Rangel |
| ADARA | Reynaldo Zavala | Cesar De la Rosa, Natalia Escalera (rotación 1:1) |
| ALCAZAR | Reynaldo Zavala | Julio Esquivel |
| ALTAVIA | Reynaldo Zavala | Aldo Rodriguez, Jose Juan Eggermont |
| FONTANA | Reynaldo Zavala | Joel Rodriguez, Erik Calderon |
| MAGNOLIAS | Reynaldo Zavala | Natalia Escalera |
| AMIRA | Reynaldo Zavala | Julio Esquivel |
| LOS LINOS | Sebastian Hernandez | Jose Juan Eggermont, Natalia Escalera |
