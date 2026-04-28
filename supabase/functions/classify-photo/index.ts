import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPT = `Analyse this photo for water or riverbank pollution in the Netherlands.
A citizen submitted this photo claiming it shows pollution near a cleanup quest zone.

Return ONLY valid JSON, no other text:
{
  "is_valid_pollution": true or false,
  "litter_type": "plastic_bottles|plastic_bags|foam|rope|organic|mixed|algae_bloom|none",
  "severity": "low|medium|high",
  "item_count_estimate": integer 0-100,
  "is_water_surface": true or false,
  "confidence": 0.0 to 1.0,
  "rejection_reason": null or "not_water|no_litter|blurry|indoor|irrelevant|fake"
}

Rules:
- is_valid_pollution = false if no visible pollution, clearly not near water, or photo is fake/irrelevant
- Reject indoor photos, selfies, food, unrelated objects
- severity based on amount and impact of pollution visible`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("No image provided");

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            { type: "text", text: PROMPT },
          ],
        }],
        temperature: 0.1,
        max_tokens:  300,
      }),
    });

    const groqData = await resp.json();
    if (!resp.ok) throw new Error(groqData.error?.message || "Groq API error");

    const raw = groqData.choices[0].message.content
      .trim()
      .replace(/```json\n?|\n?```/g, "")
      .trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      result = m ? JSON.parse(m[0]) : { is_valid_pollution: false, rejection_reason: "parse_error" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ is_valid_pollution: false, rejection_reason: "api_error", error: err.message }), {
      status: 200, // return 200 so frontend can read the body
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
