import { NextRequest, NextResponse } from "next/server";
import {
  generateGemmaChat,
  generateGemmaResponse,
  streamGemmaResponse,
  resolveModelName,
  GemmaMessage,
} from "@/lib/gemma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      messages,
      model,
      temperature = 0.7,
      systemInstruction,
      stream = true,
    } = body;

    const targetModel = resolveModelName(model);

    if (!prompt && (!messages || messages.length === 0)) {
      return NextResponse.json(
        { error: "Either 'prompt' or non-empty 'messages' array is required." },
        { status: 400 }
      );
    }

    const payload: string | GemmaMessage[] =
      messages && messages.length > 0 ? messages : prompt;

    // Stream response using Server-Sent Events (SSE)
    if (stream) {
      const textEncoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            const generator = streamGemmaResponse(payload, {
              model: targetModel,
              temperature,
              systemInstruction,
              enableFallback: true,
            });

            let activeModelUsed = targetModel;

            for await (const item of generator) {
              activeModelUsed = item.model;
              const payloadData = JSON.stringify({
                chunk: item.chunk,
                model: item.model,
              });
              controller.enqueue(textEncoder.encode(`data: ${payloadData}\n\n`));
            }

            controller.enqueue(
              textEncoder.encode(
                `data: ${JSON.stringify({
                  done: true,
                  model: activeModelUsed,
                  fallbackUsed: activeModelUsed !== targetModel,
                })}\n\n`
              )
            );
            controller.close();
          } catch (err: any) {
            console.error("Stream generation error:", err);
            const errorPayload = JSON.stringify({
              error: err?.message || "Generation error",
              done: true,
            });
            controller.enqueue(textEncoder.encode(`data: ${errorPayload}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    let result: { text: string; model: string; fallbackUsed?: boolean };
    if (Array.isArray(payload)) {
      result = await generateGemmaChat(payload, {
        model: targetModel,
        temperature,
        systemInstruction,
        enableFallback: true,
      });
    } else {
      result = await generateGemmaResponse(payload, {
        model: targetModel,
        temperature,
        systemInstruction,
        enableFallback: true,
      });
    }

    return NextResponse.json({
      ok: true,
      text: result.text,
      model: result.model,
      fallbackUsed: result.fallbackUsed || false,
    });
  } catch (error: any) {
    console.error("Gemma API Route Error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Internal server error occurred while processing Gemma request.",
      },
      { status: 500 }
    );
  }
}
