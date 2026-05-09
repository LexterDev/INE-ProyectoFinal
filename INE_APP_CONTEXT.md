# INE App — Contexto del Proyecto para Claude Code

> Este archivo contiene todo el contexto necesario para desarrollar la aplicación. Léelo completo antes de escribir cualquier código.

---

## 1. Descripción general

**Nombre:** INE App  
**Descripción:** Sistema de Evaluación de Alternativas Económicas (SEAE) — herramienta web para evaluar proyectos de inversión mediante métodos financieros estándar.  
**Contexto académico:** Proyecto del Ciclo I/2026 — Ingeniería de Negocios, Universidad de El Salvador (Facultad Multidisciplinaria de Occidente).  
**Entrega:** Sábado 9 de mayo de 2026.

---

## 2. Objetivo de la aplicación

Permitir a analistas financieros (o estudiantes) evaluar alternativas económicas ingresando datos de proyectos de inversión y obteniendo resultados calculados mediante tres métodos:

- **VPN** — Valor Presente Neto
- **CAE** — Costo Anual Equivalente
- **TIR** — Tasa Interna de Retorno

La app debe comparar dos alternativas y generar un reporte exportable en PDF.

---

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Angular (versión más reciente estable) |
| Estilos | Tailwind CSS |
| Gráficas | Chart.js (`ng2-charts`) |
| Exportar PDF | jsPDF + html2canvas |
| Lenguaje | TypeScript |
| Backend | **Ninguno** — todo en el frontend |

---

## 4. Referencia de diseño visual

### Estilo general
Inspirado en dashboards financieros modernos tipo **Approx / Linear / Stripe**:
- Sidebar oscuro (`#0f172a` o similar) con íconos y navegación
- Área de contenido principal con fondo claro (`#f8fafc`)
- Tarjetas blancas con sombra suave para agrupar secciones
- Tipografía limpia, números grandes y legibles para resultados
- Colores de acento para estados: verde = aceptado, rojo = rechazado

### Paleta de colores principal
```
Sidebar bg:        #0f172a
Sidebar texto:     #94a3b8
Sidebar activo:    #6366f1 (indigo)
Contenido bg:      #f8fafc
Card bg:           #ffffff
Acento primario:   #6366f1
Éxito / Aceptado:  #10b981
Peligro / Rechazado: #f43f5e
Texto principal:   #1e293b
Texto secundario:  #64748b
Borde:             #e2e8f0
```

### Tipografía recomendada
- Display / números grandes: `font-semibold` con Tailwind
- Labels: `text-xs uppercase tracking-wide text-slate-500`
- Valores resultado: `text-3xl font-bold`

---

## 5. Estructura de carpetas sugerida

```
src/
└── app/
    ├── core/
    │   └── services/
    │       ├── vpn.service.ts        ← Lógica de cálculo VPN
    │       ├── cae.service.ts        ← Lógica de cálculo CAE
    │       ├── tir.service.ts        ← Lógica de cálculo TIR
    │       └── pdf-export.service.ts ← Generación de PDF
    ├── shared/
    │   └── components/
    │       ├── sidebar/
    │       ├── topbar/
    │       ├── metric-card/          ← Tarjeta de resultado individual
    │       ├── verdict-badge/        ← Badge verde/rojo de aceptación
    │       └── cash-flow-chart/      ← Gráfica de barras Chart.js
    ├── pages/
    │   ├── vpn/
    │   │   ├── vpn.component.ts
    │   │   ├── vpn.component.html
    │   │   └── vpn.component.scss
    │   ├── cae/
    │   │   ├── cae.component.ts
    │   │   ├── cae.component.html
    │   │   └── cae.component.scss
    │   ├── tir/
    │   │   ├── tir.component.ts
    │   │   ├── tir.component.html
    │   │   └── tir.component.scss
    │   └── comparacion/
    │       ├── comparacion.component.ts
    │       ├── comparacion.component.html
    │       └── comparacion.component.scss
    └── app.routes.ts
```

---

## 6. Funcionalidades requeridas (Must-Have)

Estas son obligatorias. Sin ellas el proyecto no cumple.

### 6.1 Módulo VPN (Valor Presente Neto)
**Fórmula:**
```
VPN = -Inversión + Σ [Ft / (1 + i)^t] + [VS / (1 + i)^n]
```
Donde:
- `Ft` = Flujo de caja en el período t
- `i` = Tasa de descuento (decimal)
- `n` = Vida útil del proyecto (años)
- `VS` = Valor de salvamento

**Datos de entrada:**
- Inversión inicial (`$`)
- Tasa de descuento (`%`)
- Vida útil del proyecto (años)
- Flujos de caja por año (ingresar uno por año, dinámico según vida útil)
- Valor de salvamento (`$`)

**Salidas:**
- VPN calculado
- VP de ingresos
- VP de costos
- Veredicto: `VPN > 0` → ACEPTADO | `VPN < 0` → RECHAZADO | `VPN = 0` → INDIFERENTE

---

### 6.2 Módulo CAE (Costo Anual Equivalente)
**Fórmula:**
```
CAE = VP × [i(1+i)^n / ((1+i)^n - 1)]
```
O equivalentemente, convertir todos los costos a una anualidad uniforme.

**Datos de entrada:**
- Costo inicial (`$`)
- Tasa de descuento (`%`)
- Vida útil (años)
- Costos de operación anuales (`$`)
- Valor de salvamento (`$`)

**Salidas:**
- CAE calculado (costo anual equivalente total)
- Veredicto: Se elige la alternativa con **menor CAE**

---

### 6.3 Módulo TIR (Tasa Interna de Retorno)
**Fórmula:** La tasa `r` que hace VPN = 0:
```
0 = -Inversión + Σ [Ft / (1 + r)^t] + [VS / (1 + r)^n]
```
Calcular `r` por método iterativo (bisección o Newton-Raphson).

**Datos de entrada:**
- Inversión inicial (`$`)
- Vida útil (años)
- Flujos de caja por año
- Valor de salvamento (`$`)
- Tasa de descuento mínima aceptable (TMAR) (`%`) — para el veredicto

**Salidas:**
- TIR calculada (`%`)
- Veredicto: `TIR > TMAR` → ACEPTADO | `TIR < TMAR` → RECHAZADO

---

### 6.4 Comparación de alternativas
- Permitir ingresar datos de **dos alternativas** (A y B) para cualquier método
- Mostrar tabla comparativa lado a lado
- Determinar automáticamente cuál es la mejor opción según el criterio del método:
  - VPN: mayor VPN positivo
  - CAE: menor CAE
  - TIR: mayor TIR (ambas deben superar la TMAR)

---

### 6.5 Exportar reporte PDF
Usar `jsPDF` + `html2canvas` para capturar y exportar. El PDF debe incluir:

1. **Portada**
   - Logo / nombre "INE App"
   - Nombre del método utilizado
   - Fecha de generación
   - Nombres de los integrantes del equipo (hardcodeados como constante)

2. **Sección de datos ingresados**
   - Tabla con todos los parámetros de entrada

3. **Sección de resultados**
   - Resultado principal (VPN / CAE / TIR)
   - Veredicto con justificación

4. **Sección de comparación** (si aplica)
   - Tabla lado a lado de las dos alternativas
   - Alternativa ganadora destacada

---

## 7. Funcionalidades recomendadas (Good-to-Have)

Estas suben la calidad percibida:

- **Gráfica de flujos de caja** — barras por año con Chart.js, visible en cada módulo
- **Inputs dinámicos** — que aparezcan N campos de flujo según el número de años ingresado
- **Validación de formularios** — mensajes claros si faltan datos o son inválidos
- **Tooltips explicativos** — al lado de cada campo, explicar qué es (ej: "La tasa de descuento representa el costo de oportunidad del capital")
- **Animación de resultado** — que el número aparezca con un contador animado al calcular
- **Reseteo por módulo** — botón para limpiar todos los campos

---

## 8. Extras que impresionan

- **Mini dashboard home** — pantalla inicial con tarjetas de los 3 métodos disponibles y acceso rápido
- **Historial de cálculos** — guardar en `localStorage` los últimos 5 cálculos realizados
- **Modo de ejemplo** — botón "Cargar ejemplo" que rellena el formulario con datos de prueba realistas
- **PDF con gráfica incluida** — capturar el canvas de Chart.js y embeber la imagen en el PDF

---

## 9. Layout de la interfaz

### Estructura general
```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (oscuro, fijo)  │  TOPBAR (título + acciones)│
│                          ├─────────────────────────────┤
│  Logo: INE App           │                             │
│                          │  TABS: Alt. A | Alt. B |    │
│  [VPN]                   │        Comparación          │
│  [CAE]                   │                             │
│  [TIR]                   │  ┌──────────┐ ┌──────────┐  │
│  ──────                  │  │ FORM     │ │RESULTADOS│  │
│  [Comparar]              │  │ entrada  │ │          │  │
│                          │  │          │ │ VPN:$X   │  │
│                          │  └──────────┘ │ ✓ACEPTADO│  │
│                          │               └──────────┘  │
│                          │  ┌──────────────────────┐   │
│                          │  │ GRÁFICA flujos       │   │
│                          │  └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Componente Metric Card
```
┌─────────────────────┐
│ VALOR PRESENTE NETO │  ← label xs uppercase
│                     │
│  $14,823.50         │  ← número grande bold
│                     │
│  ✓ ACEPTADO         │  ← badge verde
└─────────────────────┘
```

---

## 10. Navegación / Rutas

```typescript
// app.routes.ts
[
  { path: '',           redirectTo: 'vpn', pathMatch: 'full' },
  { path: 'vpn',        component: VpnComponent },
  { path: 'cae',        component: CaeComponent },
  { path: 'tir',        component: TirComponent },
  { path: 'comparacion',component: ComparacionComponent },
]
```

---

## 11. Lógica de los servicios (TypeScript)

### VpnService
```typescript
calcularVPN(inversion: number, tasa: number, flujos: number[], salvamento: number): number {
  const i = tasa / 100;
  const n = flujos.length;
  let vpIngresos = flujos.reduce((acc, f, t) => acc + f / Math.pow(1 + i, t + 1), 0);
  vpIngresos += salvamento / Math.pow(1 + i, n);
  return vpIngresos - inversion;
}
```

### TirService (bisección)
```typescript
calcularTIR(inversion: number, flujos: number[], salvamento: number): number {
  const npv = (rate: number) => {
    const n = flujos.length;
    return -inversion
      + flujos.reduce((acc, f, t) => acc + f / Math.pow(1 + rate, t + 1), 0)
      + salvamento / Math.pow(1 + rate, n);
  };
  let low = 0, high = 1, mid = 0;
  for (let i = 0; i < 1000; i++) {
    mid = (low + high) / 2;
    if (npv(mid) > 0) low = mid; else high = mid;
    if (Math.abs(high - low) < 1e-8) break;
  }
  return mid * 100; // retorna como porcentaje
}
```

### CaeService
```typescript
calcularCAE(costoInicial: number, tasa: number, años: number, costosOperacion: number, salvamento: number): number {
  const i = tasa / 100;
  const factorRecuperacion = (i * Math.pow(1 + i, años)) / (Math.pow(1 + i, años) - 1);
  const vpSalvamento = salvamento / Math.pow(1 + i, años);
  return (costoInicial - vpSalvamento) * factorRecuperacion + costosOperacion;
}
```

---

## 12. Generación del PDF

Instalar: `npm install jspdf html2canvas`

```typescript
// pdf-export.service.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async exportarPDF(elementId: string, nombreMetodo: string): Promise<void> {
  const elemento = document.getElementById(elementId)!;
  const canvas = await html2canvas(elemento, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Portada
  pdf.setFillColor(15, 23, 42); // sidebar color
  pdf.rect(0, 0, 210, 297, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.text('INE App', 20, 50);
  pdf.setFontSize(16);
  pdf.text(`Reporte: ${nombreMetodo}`, 20, 70);
  pdf.setFontSize(11);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Generado: ${new Date().toLocaleDateString('es-SV')}`, 20, 85);
  // ... nombres del equipo
  
  // Página de resultados
  pdf.addPage();
  const imgWidth = 190;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  
  pdf.save(`INE_App_Reporte_${nombreMetodo}.pdf`);
}
```

---

## 13. Criterios de evaluación (rúbrica)

| Criterio | Peso | Qué se evalúa |
|---|---|---|
| Funcionamiento del sistema | 30% | Que los cálculos sean correctos y el sistema no tenga bugs |
| Comunicación / Presentación | 30% | PPT creativa, participación del equipo, 15 min |
| Resolución del problema | 20% | Que el sistema muestre reporte de los datos ingresados |
| Generación de reporte | 20% | PDF exportado enviado a `clara.rojas@ues.edu.sv` con portada e integrantes |

---

## 14. Notas importantes

- **No hay backend.** Todo es frontend puro. Los cálculos van en servicios de Angular.
- **El PDF generado** debe enviarse al correo `clara.rojas@ues.edu.sv` con portada que incluya nombres de los integrantes.
- **En la exposición**, a cada grupo se le asigna aleatoriamente un solo método para demostrar, pero la app debe tener los tres funcionando.
- **Tiempo de exposición:** 15 minutos. Todos los integrantes deben participar con cámara encendida.
- El proyecto vale **20%** de la nota global; la exposición **15%** adicional.

---

## 15. Prompt de inicio sugerido para Claude Code

Cuando abras Claude Code en tu proyecto, puedes iniciar con este prompt:

```
Lee el archivo INE_APP_CONTEXT.md completo. 
Ese es el contexto total del proyecto que vamos a construir juntos.

Comenzaremos paso a paso:
1. Primero inicializa el proyecto Angular con Tailwind CSS configurado.
2. Luego crea la estructura de carpetas exacta descrita en la sección 5.
3. Después construiremos el layout base (sidebar + topbar) siguiendo el diseño de la sección 9.

No escribas código de ninguna página todavía. Solo el setup inicial y el layout.
Confirma cuando esté listo para continuar.
```

---

*INE App — SEAE · Ciclo I/2026 · UES Occidente*
