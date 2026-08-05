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
        const file = formData.get('file') as File | null;
        const question = formData.get('question') as string;
        const mode = (formData.get('mode') as string) || 'document';

        if (!question) {
        return NextResponse.json(
            { error: 'Falta proveer la pregunta.' },
            { status: 400 }
        );
        }

        // En modo documento, el archivo es obligatorio
        if (mode === 'document' && (!file || file.size === 0)) {
        return NextResponse.json(
            { error: 'Debes adjuntar un archivo para consultar en Modo Documentos.' },
            { status: 400 }
        );
        }

        let documentText = '';

        // Extraer texto si hay un archivo presente
        if (file && file.size > 0) {
        const fileName = file.name.toLowerCase();
        const isPDF = fileName.endsWith('.pdf');
        const isSpreadsheet =
            fileName.endsWith('.xlsx') ||
            fileName.endsWith('.xls') ||
            fileName.endsWith('.csv');

        if (isPDF || isSpreadsheet) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            try {
            if (isPDF) {
                const pdf = await getDocumentProxy(new Uint8Array(buffer));
                const { text } = await extractText(pdf, { mergePages: true });
                documentText = text;
            } else {
                documentText = extractTextFromSpreadsheet(buffer);
            }
            } catch (parseError) {
            console.error('Error extrayendo texto del archivo:', parseError);
            }
        }
        }

        // Definir comportamiento según el modo seleccionado
        const systemInstructions = {
        document: `
            Eres Omnimind, un agente experto en análisis de documentos y datos.
            Tu objetivo principal es responder basándote en la información del documento adjunto.
            Si la respuesta no está explícita pero se puede deducir lógicamente, puedes hacerlo aclarándolo brevemente.
        `,
        trivia: `
            Eres Omnimind Curioso, un bot entusiasta, dinámico y amigable especializado en trivia, ciencia, datos curiosos e historia.
            Responde a la pregunta de forma entretenida y directa. Si el usuario adjuntó un documento, puedes usarlo como contexto secundario, pero no es obligatorio para responder.
        `,
        };

        const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction:
            systemInstructions[mode as keyof typeof systemInstructions] ||
            systemInstructions.document,
        });

        const prompt = documentText
        ? `CONTENIDO DEL ARCHIVO ADJUNTO:\n${documentText.substring(0, 50000)}\n\nPREGUNTA DEL USUARIO:\n${question}`
        : `PREGUNTA DEL USUARIO:\n${question}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        return NextResponse.json({ answer: response.text() });
    } catch (error: any) {
        console.error('Error en el servidor:', error);
        return NextResponse.json(
        { error: error.message || 'Ocurrió un error procesando la solicitud.' },
        { status: 500 }
        );
    }
    }