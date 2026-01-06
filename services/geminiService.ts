
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GeneratedImage } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // Enhanced error message for client-side Vercel deployments
  throw new Error(
    "La variable de entorno API_KEY no está configurada. Para despliegues de aplicaciones del lado del cliente en Vercel, " +
    "asegúrate de que tu API_KEY esté configurada como una variable de entorno en la configuración de tu proyecto Vercel " +
    "(por ejemplo, en 'Settings > Environment Variables') y correctamente expuesta al código del lado del cliente. " +
    "Esto a menudo requiere un paso de construcción para inyectar la clave en los activos estáticos, o una configuración de construcción personalizada de Vercel."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const imageModel = 'gemini-2.5-flash-image';
const textModel = 'gemini-3-flash-preview';

function processImageResponse(response: GenerateContentResponse): GeneratedImage {
  const parts = response.candidates?.[0]?.content?.parts;

  if (!parts) {
    console.error("Respuesta inválida del modelo de generación de imagen:", JSON.stringify(response, null, 2));
    throw new Error("La generación de imagen falló. La respuesta no contenía datos de imagen, posiblemente debido a filtros de seguridad o un error de API.");
  }
  
  for (const part of parts) {
    if (part.inlineData) {
      const { data, mimeType } = part.inlineData;
      return {
        url: `data:${mimeType};base64,${data}`,
        base64: data,
        mimeType: mimeType,
      };
    }
  }
  throw new Error("No se encontraron datos de imagen en la respuesta.");
}

export const generateImage = async (prompt: string): Promise<GeneratedImage> => {
  try {
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        },
      }
    });
    return processImageResponse(response);
  } catch (e: any) {
    console.error("Error durante la llamada a la API de generación de imagen:", e);
    let errorMessage = "Ocurrió un error desconocido durante la generación de imagen.";
    if (e.message) {
        errorMessage = e.message;
    } else if (e.response && e.response.error) {
        errorMessage = `Error de API: ${e.response.error.message || JSON.stringify(e.response.error)}`;
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    throw new Error(`La llamada a la API de Gemini falló para la generación de imagen: ${errorMessage}`);
  }
};

export const editImage = async (prompt: string, originalImage: GeneratedImage): Promise<GeneratedImage> => {
  try {
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: {
        parts: [
          {
            inlineData: {
              data: originalImage.base64,
              mimeType: originalImage.mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        },
      }
    });
    return processImageResponse(response);
  } catch (e: any) {
    console.error("Error durante la llamada a la API de edición de imagen:", e);
    let errorMessage = "Ocurrió un error desconocido durante la edición de imagen.";
    if (e.message) {
        errorMessage = e.message;
    } else if (e.response && e.response.error) {
        errorMessage = `Error de API: ${e.response.error.message || JSON.stringify(e.response.error)}`;
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    throw new Error(`La llamada a la API de Gemini falló para la edición de imagen: ${errorMessage}`);
  }
};

export const generateComicPanels = async (baseImage: GeneratedImage): Promise<GeneratedImage[]> => {
  const storyPrompt = `Eres un creativo escritor de cómics. Basado en la imagen proporcionada, inventa una historia sencilla y coherente de 4 paneles sobre una niña pequeña.
La historia debe ser consistente, con un comienzo, un desarrollo y un final claros.
Para cada uno de los 4 paneles, escribe una descripción visual corta, clara y vívida que un generador de imágenes de IA pueda usar para crear el panel.
El primer panel debe inspirarse en la imagen original del usuario, estableciendo a la niña y el escenario.
Asegúrate de que las descripciones de todos los paneles mantengan el mismo personaje (la niña pequeña) y el mismo escenario.`;

  let responseText = '';
  try {
    const storyResponse = await ai.models.generateContent({
      model: textModel,
      contents: {
        parts: [
          {
            inlineData: {
              data: baseImage.base64,
              mimeType: baseImage.mimeType,
            }
          },
          { text: storyPrompt }
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            panels: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: 'Una descripción visual para un panel de cómic.'
              }
            }
          },
          required: ['panels']
        },
        thinkingConfig: { thinkingBudget: 10000 }, // Added thinkingConfig for better JSON adherence and story coherence
      },
    });
    responseText = storyResponse.text.trim();
  } catch (e: any) {
    console.error("Error durante la llamada a la API de generación de historia de cómic:", e);
    let errorMessage = "Ocurrió un error desconocido durante la generación de historia de cómic.";
    if (e.message) {
        errorMessage = e.message;
    } else if (e.response && e.response.error) {
        errorMessage = `Error de API: ${e.response.error.message || JSON.stringify(e.response.error)}`;
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    throw new Error(`La llamada a la API de Gemini falló para la generación de historia de cómic: ${errorMessage}`);
  }

  let panelDescriptions;
  try {
    panelDescriptions = JSON.parse(responseText).panels;
  } catch (e) {
    console.error("Fallo al parsear la respuesta JSON para los paneles del cómic:", responseText, e);
    throw new Error(`La IA devolvió un JSON inválido para los paneles del cómic. La respuesta fue: ${responseText.substring(0, 200)}...`);
  }
  
  if (!Array.isArray(panelDescriptions) || panelDescriptions.length !== 4) {
      throw new Error("La IA no devolvió 4 descripciones de paneles de cómic.");
  }

  const comicPanels: GeneratedImage[] = [];
  // Usa la imagen original del usuario como referencia para el primer panel.
  let referenceImage = baseImage;

  for (const description of panelDescriptions) {
    // Esta instrucción le indica a la IA que cree un *nuevo* panel, pero usando la `referenceImage`
    // para mantener el personaje, el estilo y el escenario consistentes.
    const styledPrompt = `**Mantén estrictamente el diseño del personaje, el escenario y el estilo artístico de la imagen de referencia.** Crea un NUEVO panel de cómic mostrando esta escena: "${description}". Estilo: arte de cómic con contornos claros y audaces de tinta negra.`;
    
    // editImage ya tiene su propio try-catch ahora.
    const newPanel = await editImage(styledPrompt, referenceImage);
    comicPanels.push(newPanel);
    
    // El panel recién creado se convierte en la referencia para el siguiente en la secuencia.
    referenceImage = newPanel;
  }

  return comicPanels;
};