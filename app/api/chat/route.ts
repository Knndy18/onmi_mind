    import { NextRequest, NextResponse } from 'next/server';
    import { GoogleGenerativeAI } from '@google/generative-ai';
    import { extractText, getDocumentProxy } from 'unpdf';
    import * as XLSX from 'xlsx';

    // Inicializa el cliente de Gemini con la clave de entorno
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    // Convierte un archivo Excel/CSV a texto plano legible para la IA
    function extractTextFromSpreadsheet(buffer: Buffer): string {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let fullText = '';

    workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        // Convierte cada hoja a texto tipo CSV, fácil de leer para la IA
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        fullText += `\n--- Hoja: ${sheetName} ---\n${csvText}\n`;
    });

    return fullText;
    }

    export async function POST(req: NextRequest) {
    try {
        // 1. Recibir los datos del Frontend
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const question = formData.get('question') as string;

        if (!file || !question) {
        return NextResponse.json(
            { error: 'Falta proveer el archivo o la pregunta.' },
            { status: 400 }
        );
        }

        // 2. Detectar tipo de archivo por su nombre/extensión
        const fileName = file.name.toLowerCase();
        const isPDF = fileName.endsWith('.pdf');
        const isSpreadsheet =
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls') ||
        fileName.endsWith('.csv');

        if (!isPDF && !isSpreadsheet) {
        return NextResponse.json(
            { error: 'Formato no soportado. Subí un archivo .pdf, .xlsx, .xls o .csv.' },
            { status: 400 }
        );
        }

        // 3. Preparar el archivo
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 4. Extraer el texto según el tipo de archivo
        let documentText = '';
        try {
        if (isPDF) {
            const pdf = await getDocumentProxy(new Uint8Array(buffer));
            const { text } = await extractText(pdf, { mergePages: true });
            documentText = text;
        } else {
            documentText = extractTextFromSpreadsheet(buffer);
        }
        } catch (parseError: any) {
        console.error('Error extrayendo texto del archivo:', parseError);
        throw new Error('No se pudo leer el archivo. Verificá que no esté corrupto o protegido.');
        }

        if (!documentText || documentText.trim().length === 0) {
        return NextResponse.json(
            {
            error: isPDF
                ? 'No se pudo extraer texto del PDF. Puede que sea un documento escaneado (imagen) sin texto seleccionable.'
                : 'El archivo parece estar vacío.',
            },
            { status: 400 }
        );
        }

        // 5. Configurar el modelo de Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // 6. Crear el Prompt (Instrucción) para la IA
        const tipoDocumento = isPDF ? 'documento PDF' : 'archivo de datos (Excel/CSV)';

        const prompt = `
        Eres Omnimind, un agente inteligente experto en análisis de documentos y datos.
        A continuación, te proporciono el contenido extraído de un ${tipoDocumento} y una pregunta del usuario.
        
        Reglas estrictas:
        - Responde la pregunta basándote ÚNICAMENTE en la información proporcionada.
        - Si el contenido es una tabla de datos, analizá filas, columnas y valores con atención antes de responder.
        - Si la respuesta no se encuentra en el contenido proporcionado, responde EXACTAMENTE: "No tengo suficiente información en este documento para responder a eso."
        - Sé claro, directo y profesional en tu respuesta.

        CONTENIDO:
        ${documentText.substring(0, 50000)}

        PREGUNTA:
        ${question}
        `;

        // 7. Enviar a Gemini y devolver respuesta
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ answer: text });

    } catch (error: any) {
        console.error('Error en el servidor:', error);
        return NextResponse.json(
        { error: error.message || 'Ocurrió un error procesando el documento o conectando con la IA.' },
        { status: 500 }
        );
    }
    }