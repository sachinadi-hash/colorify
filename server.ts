import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  console.log("Starting server with NODE_ENV:", process.env.NODE_ENV);

  // Middleware to parse large image payloads
  app.use(express.json({ limit: '10mb' }));

  // API Endpoint for image conversion
  app.post("/api/convert", async (req, res) => {
    console.log("Received conversion request");
    try {
      const { image, thicknessDesc } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("GEMINI_API_KEY is missing");
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please add it to your environment variables." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1] || 'image/png';

      console.log("Calling Gemini API with model: gemini-2.5-flash-image");
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
      console.log(`Received ${parts.length} parts from Gemini`);

      for (const part of parts) {
        if (part.inlineData) {
          resultImage = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!resultImage) {
        console.error("No image part found in Gemini response");
        return res.status(422).json({ error: "AI failed to generate an image part. The subject might be too complex or the image quality too low." });
      }

      console.log("Successfully generated coloring page");
      res.json({ result: resultImage });
    } catch (error: any) {
      console.error("Gemini API Error details:", error);
      const message = error.message || "Internal Server Error";
      res.status(500).json({ error: `AI Error: ${message}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
