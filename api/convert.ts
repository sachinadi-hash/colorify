import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image, thicknessDesc } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please add it to your Vercel Environment Variables." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1] || 'image/png';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Transform this image into a clean, high-contrast coloring book page. Use only solid black outlines on a pure white background. Use ${thicknessDesc}. Remove all shading, textures, colors, and gradients. Keep only the essential structural lines. The output should be a single image part.`,
          },
        ],
      },
    });

    let resultImage = null;
    const parts = response.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData) {
        resultImage = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!resultImage) {
      return res.status(422).json({ error: "AI failed to generate an image part. The subject might be too complex or the image quality too low." });
    }

    res.status(200).json({ result: resultImage });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const message = error.message || "Internal Server Error";
    res.status(500).json({ error: `AI Error: ${message}` });
  }
}
