
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GeneratedImage } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const imageModel = 'gemini-2.5-flash-image';
const textModel = 'gemini-3-flash-preview';

function processImageResponse(response: GenerateContentResponse): GeneratedImage {
  const parts = response.candidates?.[0]?.content?.parts;

  if (!parts) {
    console.error("Invalid response from image generation model:", JSON.stringify(response, null, 2));
    throw new Error("Image generation failed. The response did not contain image data, possibly due to safety filters or an API error.");
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
  throw new Error("No image data found in response");
}

export const generateImage = async (prompt: string): Promise<GeneratedImage> => {
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
};

export const editImage = async (prompt: string, originalImage: GeneratedImage): Promise<GeneratedImage> => {
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
};

export const generateComicPanels = async (baseImage: GeneratedImage): Promise<GeneratedImage[]> => {
  const storyPrompt = `You are a creative comic book writer. Based on the provided image, invent a simple, coherent 4-panel story about a little girl.
The story must be consistent, with a clear beginning, middle, and end.
For each of the 4 panels, write a short, clear, and vivid visual description that an AI image generator can use to create the panel.
The first panel should be inspired by the user's original image, establishing the little girl and the setting.
Ensure the descriptions for all panels maintain the same character (the little girl) and the same setting.`;

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
              description: 'A visual description for a comic book panel.'
            }
          }
        },
        required: ['panels']
      },
    },
  });

  const responseText = storyResponse.text.trim();
  const panelDescriptions = JSON.parse(responseText).panels;
  
  if (!Array.isArray(panelDescriptions) || panelDescriptions.length !== 4) {
      throw new Error("AI failed to return 4 comic panel descriptions.");
  }

  const comicPanels: GeneratedImage[] = [];
  // Use the user's original image as the reference for the first panel.
  let referenceImage = baseImage;

  for (const description of panelDescriptions) {
    // This prompt instructs the AI to create a *new* panel, but using the `referenceImage`
    // to keep the character, style, and setting consistent.
    const styledPrompt = `**Strictly maintain the character design, setting, and art style from the reference image.** Create a NEW comic panel showing this scene: "${description}". Style: comic book art with clear, bold black ink outlines.`;
    
    // We use a function similar to 'editImage' that sends an image and a text prompt.
    const newPanel = await editImage(styledPrompt, referenceImage);
    comicPanels.push(newPanel);
    
    // The newly created panel becomes the reference for the next one in the sequence.
    referenceImage = newPanel;
  }

  return comicPanels;
};
