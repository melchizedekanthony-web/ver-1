import OpenAI from 'openai';

// Initialize OpenAI only if API key is available
let openai = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.emergent.team/v1',
    });
  }
} catch (error) {
  console.warn('OpenAI initialization skipped:', error.message);
}

export default openai;