import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface SentimentResult {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: string[];
  intent: 'complaint' | 'praise' | 'question' | 'other';
  topics: string[];
  urgency: 'low' | 'medium' | 'high';
  actionRequired: boolean;
}

export async function analyzeSentiment(text: string, brandName: string): Promise<SentimentResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze the sentiment of this social media post about the brand "${brandName}".

Post: "${text}"

Respond with a JSON object containing:
{
  "score": number from -1 (very negative) to 1 (very positive),
  "label": "positive" | "negative" | "neutral",
  "confidence": number from 0 to 1,
  "emotions": array of emotions detected (e.g., ["joy", "frustration", "anger"]),
  "intent": "complaint" | "praise" | "question" | "other",
  "topics": array of topics mentioned (e.g., ["customer service", "product quality"]),
  "urgency": "low" | "medium" | "high",
  "actionRequired": boolean - true if this needs immediate attention
}

Consider:
- Sarcasm and irony (detect when praise is actually criticism)
- Emojis and their sentiment
- Context of the brand being mentioned
- Whether this could be a PR issue

Return ONLY the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(-1, Math.min(1, parsed.score || 0)),
        label: parsed.label || 'neutral',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        emotions: parsed.emotions || [],
        intent: parsed.intent || 'other',
        topics: parsed.topics || [],
        urgency: parsed.urgency || 'low',
        actionRequired: parsed.actionRequired || false,
      };
    }
  } catch (error) {
    console.error('Sentiment analysis error:', error);
  }

  // Default result if AI fails
  return getDefaultSentiment(text);
}

function getDefaultSentiment(text: string): SentimentResult {
  // Simple keyword-based fallback
  const positiveWords = ['love', 'great', 'amazing', 'excellent', 'best', 'awesome', 'thank'];
  const negativeWords = ['hate', 'bad', 'terrible', 'worst', 'awful', 'disappointed', 'angry'];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

  let score = (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount);
  let label: 'positive' | 'negative' | 'neutral' = 'neutral';

  if (score > 0.2) label = 'positive';
  else if (score < -0.2) label = 'negative';

  return {
    score,
    label,
    confidence: 0.5,
    emotions: [],
    intent: 'other',
    topics: [],
    urgency: 'low',
    actionRequired: false,
  };
}

export async function batchAnalyzeSentiment(
  posts: Array<{ id: string; text: string }>,
  brandName: string
): Promise<Map<string, SentimentResult>> {
  const results = new Map<string, SentimentResult>();

  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const promises = batch.map(post => analyzeSentiment(post.text, brandName));
    const batchResults = await Promise.all(promises);

    batch.forEach((post, idx) => {
      results.set(post.id, batchResults[idx]);
    });

    // Small delay between batches
    if (i + batchSize < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

export default analyzeSentiment;
