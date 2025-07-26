# Chatbot Backend

This is a minimal Express backend that proxies requests to the OpenAI API.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. Start the server:
   ```bash
   npm start
   ```

The server will run on port 3001 by default.

## Endpoint

- **POST** `/api/chat`
  - Body: `{ "messages": [ ... ], "model": "gpt-3.5-turbo" }`
  - Forwards the request to OpenAI and returns the response.

## Deployment

You can deploy this backend to services like Render, Vercel, or Heroku. Make sure to set the `OPENAI_API_KEY` environment variable in your deployment settings. 