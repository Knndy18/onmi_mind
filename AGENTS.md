# 🧠 Omnimind — Document Analysis Agent

Bienvenido a la documentación técnica de **Omnimind**, un agente inteligente diseñado para procesar, extraer y responder preguntas sobre documentos en formato PDF de manera precisa utilizando modelos de lenguaje avanzados.

---

## 🎯 Objetivo del Agente

El propósito de Omnimind es actuar como un **asistente de lectura y análisis de documentos**, garantizando que las respuestas generadas sean:
1. **Fieles al contexto:** Basadas únicamente en la información proporcionada en el archivo subido.
2. **Deterministas:** Capaces de abstenerse de responder o alucinar información cuando el dato no se encuentra en el texto.
3. **Eficientes:** Respuestas concisas, directas y en formato estructurado para fácil lectura.

---

## 🏗️ Arquitectura del Agente

Omnimind está construido sobre una arquitectura **Serverless con Next.js App Router**:

* **Frontend (`/app/page.tsx`):** Interfaz limpia en React (Tailwind CSS) encargada de la captura del archivo PDF y la pregunta del usuario.
* **Backend API (`/app/api/chat/route.ts`):** Endpoint encargado de recibir los datos mediante `FormData`, procesar la extracción del documento e interactuar con la API de Google Gemini.
* **Extracción de PDF (`unpdf`):** Decodificación ligera en Node.js/Edge sin dependencias pesadas de Canvas.
* **Motor de IA (`@google/generative-ai`):** Integración con el modelo `gemini-1.5-flash` para razonamiento contextual de bajo latencia.

---

## 📜 Reglas de Comportamiento del Agente (System Rules)

Las instrucciones del agente están delimitadas de forma estricta en el Prompt principal:

> 1. **Fidelidad Estricta:** Responde la pregunta basándote ÚNICAMENTE en la información del documento.
> 2. **Fallback Obligatorio:** Si la respuesta no se encuentra expresamente en el texto, el agente DEBE responder:
>    `"No tengo suficiente información en este documento para responder a eso."`
> 3. **Tono y Estilo:** Mantén un tono profesional, claro y directo.
> 4. **Límite de Tokens:** Filtra/recorta texto largo para proteger el límite de ventana de contexto (hasta 50,000 caracteres por solicitud).

---

## 🛠️ Requisitos de Entorno y Variables

Para que el agente pueda responder, se requiere la clave de API oficial en el entorno local o en Vercel:

```env
GEMINI_API_KEY=tu_api_key_aqui