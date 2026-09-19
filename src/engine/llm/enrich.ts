export function clarifyPrompt(ideaText: string): string {
  return `Clarify this vibe-coding product idea into JSON with keys:
who, pain, artifact, why_now, one_liner (≤160 chars), assumptions (≤5 strings), low_specificity (boolean).

Idea:
"""
${ideaText}
"""`;
}

export function scoreHintsPrompt(ideaText: string, clarifiedJson: string): string {
  return `Score this vibe-coding idea. Return JSON:
{
  "demand_signals": {
    "demand"|"pain"|"competition"|"funding"|"urgency"|"distribution": {
      "score": 0-100 or null,
      "confidence": 0-100,
      "note": string
    }
  },
  "dimensions": {
    "Pain"|"Urgency"|"Differentiation"|"Buildability"|"Distribution"|"Willingness"|"Competition"|"FounderFit": 0-100
  },
  "next_actions": [exactly 3 short actionable strings]
}

Clarified:
${clarifiedJson}

Idea:
"""
${ideaText}
"""`;
}
