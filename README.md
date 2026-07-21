# Omnimind 🧠

Agente inteligente de análisis documental. Subís un PDF, Excel o CSV, hacés una pregunta en lenguaje natural, y Omnimind responde basándose **únicamente** en el contenido del archivo.

## Características

- 📄 **Lectura de PDF** — extracción de texto vía [`unpdf`](https://github.com/unjs/unpdf), sin dependencias nativas ni problemas de worker en entornos serverless.
- 📊 **Lectura de Excel / CSV** — soporte para `.xlsx`, `.xls` y `.csv` vía [`xlsx`](https://www.npmjs.com/package/xlsx) (SheetJS), incluyendo archivos con múltiples hojas.
- 🤖 **Respuestas basadas en el documento** — impulsado por Gemini 2.5 Flash, con instrucciones estrictas para no inventar información que no esté en el archivo.
- 🎨 **Interfaz sobria y responsiva** — diseño propio (no template), con soporte completo mobile-first.
- 🖱️ **Drag & drop** de archivos, validación de formato en el cliente.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| IA | Google Gemini API (`@google/generative-ai`) |
| Parsing PDF | `unpdf` |
| Parsing Excel/CSV | `xlsx` (SheetJS) |

## Requisitos previos

- Node.js 18 o superior
- Una API key de Google Gemini ([obtenerla acá](https://aistudio.google.com/apikey))

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd onmi_mind

# Instalar dependencias
npm install
```

## Variables de entorno

Creá un archivo `.env.local` en la raíz del proyecto:

```env
GEMINI_API_KEY=tu_api_key_de_gemini
```

> ⚠️ No subas este archivo a git. Ya debería estar incluido en `.gitignore` por defecto en un proyecto Next.js.

## Uso en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador.

1. Subí un documento (PDF, XLSX, XLS o CSV) arrastrándolo al recuadro o haciendo clic para seleccionarlo.
2. Escribí una pregunta relacionada con el contenido del archivo.
3. Hacé clic en **Consultar a Omnimind**.
4. La respuesta aparece debajo, generada exclusivamente a partir del contenido extraído del documento.

## Probar la página

👉 **[Abrir Omnimind](https://onmi-mind-ten.vercel.app/)** ← reemplazar con el enlace real una vez desplegado

## Estructura del proyecto

```
onmi_mind/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts     # Endpoint que extrae texto y consulta a Gemini
│   └── page.tsx              # Interfaz principal (formulario + resultado)
├── .env.local                 # Variables de entorno (no versionado)
├── package.json
└── README.md
```

## Cómo funciona el backend (`/api/chat`)

1. Recibe el archivo y la pregunta vía `FormData`.
2. Detecta el tipo de archivo por su extensión.
3. Extrae el texto:
   - **PDF** → `unpdf` (`getDocumentProxy` + `extractText`)
   - **Excel/CSV** → `xlsx` (`sheet_to_csv` por cada hoja del libro)
4. Arma un prompt con reglas estrictas: responder solo con información del documento, o devolver un mensaje explícito de "no tengo información suficiente" si no la encuentra.
5. Envía el prompt a Gemini 2.5 Flash y devuelve la respuesta como JSON.

## Formatos soportados

| Formato | Extensión | Notas |
|---|---|---|
| PDF | `.pdf` | Requiere texto seleccionable; PDFs escaneados sin OCR no se pueden leer |
| Excel | `.xlsx`, `.xls` | Soporta múltiples hojas |
| CSV | `.csv` | Una sola tabla |

## Limitaciones conocidas

- No procesa PDFs escaneados (imágenes) sin una capa de OCR adicional.
- El contenido extraído se trunca a 50.000 caracteres antes de enviarse a Gemini, para mantener el prompt dentro de límites razonables.
- No hay persistencia: cada consulta es independiente, sin historial de conversación.

## Roadmap / posibles mejoras

- [ ] Soporte OCR para PDFs escaneados
- [ ] Historial de conversación por documento
- [ ] Soporte para múltiples archivos en una misma consulta
- [ ] Exportar la respuesta a PDF o Word

## Licencia

Este proyecto es de uso privado/educativo. Ajustá esta sección según corresponda antes de publicarlo.
