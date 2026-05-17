import { GoogleGenAI } from '@google/genai';

export async function interpretVoiceCommand(text: string, mode: 'finance' | 'time', categories?: string[]) {
  if (!process.env.GEMINI_API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const prompt = `
    Analyze this user command: "${text}"
    The app mode is: ${mode}
    ${mode === 'finance' && categories ? `Categorize using these options if applicable: ${categories.join(', ')}` : ''}
    Context: Today is ${new Date().toLocaleDateString()}.
    
    If mode is 'finance', output a JSON with:
    {
      "type": "income" | "expense" | "future_income" | "future_expense" | "goal",
      "title": "string" (or "name" if goal),
      "amount": number (or "target_amount" if goal),
      "category": "string",
      "payment_method": "debit" | "credit" | "pix" | "cash",
      "is_recurring": boolean,
      "day": number (if recurring),
      "due_date": "YYYY-MM-DD" (if unique future),
      "deadline": "YYYY-MM-DD" (if goal)
    }

    If mode is 'time', output a JSON with:
    {
      "type": "task",
      "title": "string",
      "description": "string",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "is_recurring": boolean
    }

    ONLY output the JSON. No explanations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonStr = response.text || '{}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error interpreting command:', error);
    return null;
  }
}
