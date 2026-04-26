from openai import OpenAI
import json
import os

SYSTEM_PROMPT = """You are the WaterQuest AI engine for the Netherlands.
Every week you analyse satellite water quality readings from Copernicus Sentinel-2
and citizen reports from Waarneming.nl, then select exactly 2 quest zones where
everyday citizens can do the most impactful cleanup of visible pollution.

POLLUTION SIGNALS (from satellite data JSON):
  ndci_mean       : Chl-a / algae. >0.05 = concern; >0.15 = confirmed bloom
  fdi_max         : Floating debris index. >0.02 = plastic confirmed from space
  turbidity_mean  : B4/B3 ratio. >1.5 = heavy sediment/runoff
  citizen_reports : Number of Waarneming.nl reports in past 14 days
  citizen_confirmed: Boolean — at least 1 photo proves it
  access          : 'high' or 'medium' (public riverbank access)

QUEST SELECTION RULES (all must be satisfied):
  1. Select exactly 2 zones: Quest A and Quest B
  2. Quest A and Quest B must be in DIFFERENT cities / regions
  3. At least one quest must have access = 'high'
  4. Skip zones with water_pixels < 50 (insufficient satellite coverage)
  5. Prioritise zones where pollution is HUMAN-CLEANABLE:
       fdi_max > 0.02 = floating plastic (most cleanable by net/picker)
       ndci_mean > 0.10 = algae scum (can be skimmed from surface)
  6. Boost priority if citizen_confirmed = true (ground-truth verified)
  7. Explain your selection with specific satellite numbers

OUTPUT FORMAT — return ONLY valid JSON, no other text:
{
  "quest_a": {
    "zone": "Zone name",
    "city": "City name",
    "lat": 0.0,
    "lng": 0.0,
    "pollution_type": "floating_plastic|algae_bloom|mixed|turbidity",
    "satellite_evidence": "Specific numbers explaining why selected",
    "what_to_clean": "Exact description for app users — what they will find",
    "urgency": "high|medium",
    "citizen_confirmed": true
  },
  "quest_b": { "zone": "Zone name", "city": "City name", "lat": 0.0, "lng": 0.0,
    "pollution_type": "floating_plastic|algae_bloom|mixed|turbidity",
    "satellite_evidence": "Specific numbers explaining why selected",
    "what_to_clean": "Exact description for app users — what they will find",
    "urgency": "high|medium",
    "citizen_confirmed": true },
  "reasoning": "Full explanation of selection logic with satellite numbers",
  "week_summary": "One sentence for the app push notification"
}"""


def get_client() -> OpenAI:
    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.environ["NVIDIA_API_KEY"],
    )


def analyse_and_select_quests(satellite_data: list) -> dict:
    client        = get_client()
    user_msg      = f"Satellite readings:\n{json.dumps(satellite_data, indent=2)}"
    full_response = ""

    completion = client.chat.completions.create(
        model="deepseek-ai/deepseek-v4-pro",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
        temperature=0.2,
        max_tokens=2048,
        extra_body={"chat_template_kwargs": {
            "thinking":        True,
            "reasoning_effort": "high",
        }},
        stream=True,
    )

    for chunk in completion:
        if not getattr(chunk, "choices", None):
            continue
        c = chunk.choices[0].delta.content
        if c:
            full_response += c

    # Parse the JSON response
    try:
        return json.loads(full_response.strip())
    except json.JSONDecodeError:
        # Extract JSON block if model added extra text
        s = full_response.find("{")
        e = full_response.rfind("}") + 1
        if s >= 0 and e > s:
            return json.loads(full_response[s:e])
        raise ValueError(f"Could not parse AI response as JSON: {full_response[:500]}")
