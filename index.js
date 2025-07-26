import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "https://jiregnaworku.github.io",
  })
);

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages) {
    return res.status(400).json({ error: "Missing messages in request body." });
  }

  const userPrompt =
    messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n") + "\nAssistant:";

  try {
    const headers = {
      Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
    };

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        version:
          "5c7c1b7d8f46ec92491fc1f86d1ff4d52d598b2782d7f9b645fe2aaca5f8bf45", // meta/llama-2-7b-chat
        input: {
          prompt: userPrompt,
          temperature: 0.75,
          top_p: 1,
          max_new_tokens: 500,
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("❌ Replicate API error:", data.error);
      return res.status(500).json({ error: data.error });
    }

    // Polling for output
    let output = data;
    while (output.status === "starting" || output.status === "processing") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const pollRes = await fetch(
        `https://api.replicate.com/v1/predictions/${output.id}`,
        { headers }
      );
      output = await pollRes.json();
    }

    if (output.status === "succeeded") {
      res.json({ choices: [{ message: { content: output.output } }] });
    } else {
      console.error("❌ Generation failed:", output.error || output.status);
      res
        .status(500)
        .json({ error: output.error || "Failed to get a valid response." });
    }
  } catch (err) {
    console.error("❌ Error communicating with Replicate:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
