import { NextResponse } from 'next/server';
import openai from '@/lib/openai';

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Valid messages array is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Dummy response for phase 2 if key isn't set
      return NextResponse.json({
        message: "I am your WannaGo Virtual Assistant! I can help you find partners, answer questions about activities, and guide you through the app. (Note: OpenAI API key is missing. This is a simulated response.)"
      });
    }

    const systemPrompt = {
      role: 'system',
      content: `You are the friendly, helpful AI Virtual Assistant for the "WannaGo" app. 
WannaGo is a social activity app that connects people based on shared interests (athletic and non-athletic). 
You help users figure out how to use the app, suggest activities, give motivational tips, and encourage them to connect with others.
Keep responses concise, friendly, and engaging. Use emojis appropriately. 
Do not mention a "store" or any purchases, as that functionality does not exist in WannaGo.`
    };

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [systemPrompt, ...messages],
      temperature: 0.7,
      max_tokens: 300,
    });


    const reply = completion.choices[0].message.content;

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with AI model' },
      { status: 500 }
    );
  }
}
