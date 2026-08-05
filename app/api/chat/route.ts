    import { NextRequest, NextResponse } from 'next/server';
    import { GoogleGenerativeAI } from '@google/generative-ai';
    import { extractText, getDocumentProxy } from 'unpdf';
    import * as XLSX from 'xlsx';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    function extractTextFromSpreadsheet(buffer: Buffer): string {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let fullText = '';

    workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        fullText += `\n--- Hoja: ${sheetName} ---\n${csvText}\n`;
    });

    return fullText;
    }

    export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const question = formData.get('question') as string;

        if (!file || !question) {
        return NextResponse.json(
            { error: 'Falta proveer el archivo o la pregunta.' },
            { status: 400 }
        );
        }

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

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

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

        // Configuración del modelo con Instrucción de Sistema flexible
        const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: `
        Eres Omnimind, un asistente conversacional e inteligente experto en análisis de documentos y datos.
        
        Instrucciones de flexibilidad:
        - Tu prioridad principal es usar la información del documento adjunto para responder.
        - Si la respuesta exacta no está escrita de forma explícita en el documento, puedes realizar inferencias lógicas o complementar con tu conocimiento general.
        - Si respondes basándote en tu conocimiento general o en una deducción, acláralo amablemente de forma breve.
        - Si la pregunta es un saludo, una duda conceptual o conversación general, responde con naturalidad sin exigir que la información esté en el archivo.
        - Sé amable, claro y colaborativo en todo momento.
        `,
        });

        const tipoDocumento = isPDF ? 'documento PDF' : 'archivo de datos (Excel/CSV)';

        const prompt = `
        CONTENIDO DEL ${tipoDocumento.toUpperCase()}:
        ${documentText.substring(0, 50000)}

        PREGUNTA DEL USUARIO:
        ${question}
        `;

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