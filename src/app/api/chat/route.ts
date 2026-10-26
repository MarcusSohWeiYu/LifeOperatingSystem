import { getOpenAIClient } from "@/lib/openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const SYSTEM_PROMPT = `You are a nutrition assistant. The user will send you photos of food or describe what they ate, and you estimate the macronutrients.

When you identify food items, ALWAYS include a JSON code block with the food items array. Use this exact format:

\`\`\`json
[
  {
    "name": "Chicken Rice",
    "brand": "",
    "servingSize": "1 plate",
    "servings": 1,
    "calories": 607,
    "proteinG": 30,
    "carbsG": 75,
    "fatG": 18
  }
]
\`\`\`

Rules:
- All values are per serving
- Use specific serving sizes (e.g. "1 plate", "1 bowl", "2 pieces") not vague ones
- For Singapore/Asian foods, use typical local portion sizes
- calories is in kcal, protein/carbs/fat in grams
- brand can be empty string if unknown
- servings should default to 1
- Round calories to nearest whole number, macros to 1 decimal place
- If you cannot identify the food or the image is unclear, say so — do not guess wildly
- You may answer follow-up nutrition questions without a JSON block`;

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
};

function buildOpenAIMessages(messages: IncomingMessage[]): ChatCompletionMessageParam[] {
  const recent = messages.slice(-20);

  return recent.map((msg): ChatCompletionMessageParam => {
    if (msg.role === "assistant") {
      return { role: "assistant", content: msg.content };
    }

    if (msg.imageDataUrl) {
      return {
        role: "user",
        content: [
          ...(msg.content ? [{ type: "text" as const, text: msg.content }] : []),
          {
            type: "image_url" as const,
            image_url: { url: msg.imageDataUrl, detail: "low" as const },
          },
        ],
      };
    }

    return { role: "user", content: msg.content };
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: IncomingMessage[] };
    const messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages array required" }, { status: 400 });
    }

    const client = getOpenAIClient();

    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...buildOpenAIMessages(messages),
      ],
      max_tokens: 1024,
      stream: true,
    });

    // Convert OpenAI stream to a ReadableStream of text chunks
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI analysis failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
