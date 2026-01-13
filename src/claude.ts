/**
 * Claude (Anthropic) API Integration
 * 
 * Uses Claude to analyze news headlines and generate creative token concepts.
 */

import { TokenConcept, ClaudeResponse } from './types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export class ClaudeClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate a token concept from a news headline using Claude
   */
  async generateTokenConcept(headline: string): Promise<TokenConcept> {
    const systemPrompt = `You are a creative crypto token analyst. Your job is to analyze news headlines and generate viral memecoin concepts.

For each headline, create a token with:
- A catchy, memorable name (2-3 words max)
- A short ticker symbol (3-5 characters)
- A fun description (1-2 sentences)
- Your reasoning for why this could go viral
- A viral score from 1-10

Respond ONLY with valid JSON in this exact format:
{
  "name": "Token Name",
  "ticker": "TICKER",
  "description": "Brief description",
  "reasoning": "Why this could be viral",
  "viralScore": 8
}`;

    const userPrompt = `Analyze this headline and create a memecoin concept:

"${headline}"

Generate a creative, viral-worthy token concept. Be creative and memetic!`;

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (!content) {
        throw new Error('Claude returned empty response');
      }

      // Parse JSON from response (handle markdown code blocks)
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.split('```json')[1].split('```')[0];
      } else if (content.includes('```')) {
        jsonStr = content.split('```')[1].split('```')[0];
      }

      const parsed: ClaudeResponse = JSON.parse(jsonStr.trim());

      return {
        name: parsed.name,
        ticker: parsed.ticker.toUpperCase(),
        description: parsed.description,
        reasoning: parsed.reasoning,
        viralScore: Math.min(10, Math.max(1, parsed.viralScore)),
        headline,
      };
    } catch (error) {
      console.error('Claude generation failed:', error);
      
      // Fallback: Generate basic concept without AI
      return this.generateFallbackConcept(headline);
    }
  }

  /**
   * Analyze multiple headlines and rank them by viral potential
   */
  async analyzeHeadlines(headlines: string[]): Promise<TokenConcept[]> {
    const concepts: TokenConcept[] = [];

    for (const headline of headlines) {
      const concept = await this.generateTokenConcept(headline);
      concepts.push(concept);
    }

    // Sort by viral score descending
    return concepts.sort((a, b) => b.viralScore - a.viralScore);
  }

  /**
   * Fallback concept generation (no AI)
   */
  private generateFallbackConcept(headline: string): TokenConcept {
    const words = headline.split(' ')
      .filter(w => w.length > 3)
      .map(w => w.replace(/[^a-zA-Z]/g, ''));

    const keyWord = words[0] || 'News';
    const suffixes = ['Coin', 'Moon', 'AI', 'Token'];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return {
      name: `${keyWord} ${suffix}`,
      ticker: keyWord.slice(0, 4).toUpperCase(),
      description: `Inspired by: "${headline.slice(0, 50)}..."`,
      reasoning: 'Trending news topic with viral potential',
      viralScore: 6,
      headline,
    };
  }
}
