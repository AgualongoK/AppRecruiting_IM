import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function evaluateCandidateForOffer(candidate: any, offer: any) {
  const prompt = `
    Evalúa si el siguiente candidato es apto para la oferta de trabajo.
    
    Oferta:
    Título: ${offer.title}
    Descripción: ${offer.description}
    Requisitos: ${offer.requirements}
    
    Candidato:
    Nombre: ${candidate.Nombre}
    Perfil: ${candidate.Perfil}
    Conocimientos Clave: ${candidate['Key Knowledge']}
    Conocimiento: ${candidate.Conocimiento}
    
    Responde en formato JSON con dos campos:
    - isFit: boolean (true si es apto, false si no)
    - recommendation: string (breve justificación de 1-2 frases)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFit: { type: Type.BOOLEAN },
            recommendation: { type: Type.STRING }
          },
          required: ['isFit', 'recommendation']
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Evaluation error:", error);
    return { isFit: false, recommendation: "Error al evaluar con IA." };
  }
}

export async function recommendCandidatesForNeeds(needs: string, candidates: any[]) {
  const prompt = `
    Tengo las siguientes necesidades de cliente para un proyecto/puesto:
    "${needs}"
    
    Y tengo la siguiente lista de candidatos (en formato JSON):
    ${JSON.stringify(candidates)}
    
    Devuelve una lista de los IDs de los candidatos que mejor encajen con estas necesidades, junto con una breve justificación para cada uno y una puntuación del 0 al 100 indicando el nivel de encaje.
    Responde en formato JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              candidateId: { type: Type.STRING },
              justification: { type: Type.STRING },
              score: { type: Type.NUMBER, description: "Puntuación de encaje del 0 al 100" }
            },
            required: ['candidateId', 'justification', 'score']
          }
        }
      }
    });
    
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("AI Recommendation error:", error);
    return [];
  }
}
