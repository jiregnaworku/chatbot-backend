import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
  })
);

// Helper: Compose prompt from messages
const composePrompt = (messages) => {
  return (
    messages
      .map((m) =>
        m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`
      )
      .join("\n") + "\nAssistant:"
  );
};

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing or invalid messages." });
  }

  const prompt = composePrompt(messages);

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            // add other parameters if you want
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("HuggingFace API error:", data.error);
      return res.status(500).json({ error: data.error });
    }

    const generatedText = data[0]?.generated_text;

    if (!generatedText) {
      return res.status(500).json({ error: "No response from model." });
    }

    // Strip prompt from generated text if repeated
    const answer = generatedText.replace(prompt, "").trim();

    res.json({ choices: [{ message: { content: answer } }] });
  } catch (err) {
    console.error("Error calling HuggingFace API:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
