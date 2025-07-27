import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI client configured for Hugging Face OpenRouter
const openai = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HUGGINGFACE_API_KEY, // Your HuggingFace token in .env as HF_TOKEN
});

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*", // restrict this in prod
  })
);

// No need to compose prompt manually; pass messages directly as chat completion expects
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing or invalid messages." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1", // Your chosen model on HF OpenRouter
      messages,
      // Optional parameters:
      max_tokens: 500,
      temperature: 0.7,
    });

    // Send back the content in a shape similar to OpenAI's completion response
    res.json({ choices: [completion.choices[0]] });
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
