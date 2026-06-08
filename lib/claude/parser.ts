import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ParsedBet {
  condition: string;
  amount: number;
  confidence: number;
}

export async function parseBetInput(rawInput: string): Promise<ParsedBet> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a bet parsing assistant. Extract the bet condition and wager amount from natural language.

Return ONLY valid JSON (no markdown, no explanation), in this exact format:
{
  "condition": "clear description of the bet condition",
  "amount": numeric wager amount,
  "confidence": 0-1 score of parsing confidence
}

Examples:
- "I bet $20 the Warriors win tonight" → {"condition": "Warriors win tonight", "amount": 20, "confidence": 0.95}
- "$50 says it rains tomorrow" → {"condition": "It rains tomorrow", "amount": 50, "confidence": 0.90}
- "Biden wins re-election, hundred bucks" → {"condition": "Biden wins re-election", "amount": 100, "confidence": 0.85}

Now parse this bet: ${rawInput}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Remove markdown code blocks if present
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/```json\n?/, '').replace(/```\n?$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/```\n?/, '').replace(/```\n?$/, '');
  }

  let parsed: ParsedBet;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (error) {
    throw new Error('Failed to parse bet. Please use format: "I bet $X that Y happens"');
  }

  if (parsed.confidence < 0.7) {
    throw new Error(
      'Unable to parse bet with high confidence. Please rephrase your bet more clearly.'
    );
  }

  if (!parsed.condition || typeof parsed.amount !== 'number' || parsed.amount <= 0) {
    throw new Error('Invalid bet format. Please include both a condition and a dollar amount.');
  }

  return parsed;
}
