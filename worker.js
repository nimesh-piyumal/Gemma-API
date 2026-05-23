export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          success: true,
          creator: "Nimesh Piyumal",
          website: "https://ceylonnet.com"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add this BEFORE the /v1/chat/completions route
    if (url.pathname === "/debug" && request.method === "GET") {
      try {
        const testResponse = await env.AI.run('@cf/google/gemma-4-26b-a4b-it', {
          messages: [{ role: "user", content: "Say hello" }],
          stream: false,
        });
        return new Response(JSON.stringify({
          raw: testResponse,
          keys: Object.keys(testResponse),
          type: typeof testResponse,
          response_field: testResponse?.response,
          result_field: testResponse?.result,
        }, null, 2), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    if (url.pathname === "/v1/chat/completions" && request.method === "POST") {
      try {
        const body = await request.json();
        const messages = body.messages || [];
        const isStream = body.stream || false;

        const aiModel = '@cf/google/gemma-4-26b-a4b-it';

        const aiResponse = await env.AI.run(aiModel, {
          messages: messages,
          stream: isStream,
        });

        if (!isStream) {
          const content = aiResponse?.choices?.[0]?.message?.content ?? "";

          return new Response(JSON.stringify({
            id: `chatcmpl-${crypto.randomUUID()}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: "gemma-4-26b-a4b-it",
            choices: [{
              index: 0,
              message: { role: "assistant", content },
              finish_reason: "stop"
            }]
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Streaming
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let buffer = "";

        const transformStream = new TransformStream({
          transform(chunk, controller) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const data = JSON.parse(line.slice(6));
                  const token = data?.choices?.[0]?.delta?.content
                              ?? data?.choices?.[0]?.message?.content
                              ?? data?.response
                              ?? "";
                  if (token) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      id: `chatcmpl-${crypto.randomUUID()}`,
                      object: "chat.completion.chunk",
                      created: Math.floor(Date.now() / 1000),
                      model: "gemma-4-26b-a4b-it",
                      choices: [{ index: 0, delta: { content: token }, finish_reason: null }]
                    })}\n\n`));
                  }
                } catch (e) {}
              } else if (line === "data: [DONE]") {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  id: `chatcmpl-${crypto.randomUUID()}`,
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: "gemma-4-26b-a4b-it",
                  choices: [{ index: 0, delta: {}, finish_reason: "stop" }]
                })}\n\n`));
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            }
          }
        });

        return new Response(aiResponse.pipeThrough(transformStream), {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};
