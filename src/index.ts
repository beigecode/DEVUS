/**
 * DEVUS SDK
 * 
 * AI-powered token creation on Pump.fun using Claude.
 * 
 * @example
 * ```typescript
 * import { DevusSDK } from 'devus-sdk';
 * 
 * const sdk = new DevusSDK({
 *   anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
 *   solanaRpcUrl: process.env.SOLANA_RPC_URL!,
 *   deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY!,
 * });
 * 
 * const concept = await sdk.generateTokenConcept("Breaking news headline");
 * const result = await sdk.deployToken(concept);
 * console.log(`Token live: ${result.pumpFunUrl}`);
 * ```
 */

import { ClaudeClient } from './claude';
import { NewsClient } from './news';
import { PumpFunClient } from './pumpfun';
import {
  SDKConfig,
  TokenConcept,
  NewsHeadline,
  DeploymentConfig,
  DeploymentResult,
} from './types';

export class DevusSDK {
  private claude: ClaudeClient;
  private news: NewsClient;
  private pumpfun: PumpFunClient;

  constructor(config: SDKConfig) {
    this.claude = new ClaudeClient(config.anthropicApiKey);
    this.news = new NewsClient();
    this.pumpfun = new PumpFunClient(
      config.solanaRpcUrl,
      config.deployerPrivateKey,
      config.pinataJwtKey,
      config.jitoTipLamports || 10000
    );
  }

  /**
   * Generate a token concept from a news headline using Claude AI
   */
  async generateTokenConcept(headline: string): Promise<TokenConcept> {
    return this.claude.generateTokenConcept(headline);
  }

  /**
   * Analyze multiple headlines and rank by viral potential
   */
  async analyzeHeadlines(headlines: string[]): Promise<TokenConcept[]> {
    return this.claude.analyzeHeadlines(headlines);
  }

  /**
   * Fetch real-time news headlines from RSS feeds
   */
  async fetchNewsHeadlines(count: number = 10): Promise<NewsHeadline[]> {
    return this.news.fetchHeadlines(count);
  }

  /**
   * Deploy a token to Pump.fun
   */
  async deployToken(config: DeploymentConfig): Promise<DeploymentResult> {
    return this.pumpfun.deployToken(config);
  }

  /**
   * Get deployer wallet balance in SOL
   */
  async getWalletBalance(): Promise<number> {
    return this.pumpfun.getBalance();
  }

  /**
   * Full pipeline: Fetch news → Generate concept → Deploy token
   */
  async autoDeployFromNews(): Promise<DeploymentResult> {
    console.log('📰 Fetching latest news...');
    const headlines = await this.fetchNewsHeadlines(5);

    if (headlines.length === 0) {
      throw new Error('No news headlines available');
    }

    console.log(`🤖 Analyzing ${headlines.length} headlines with Claude...`);
    const concepts = await this.analyzeHeadlines(headlines.map(h => h.title));

    // Pick the highest scoring concept
    const bestConcept = concepts[0];
    const matchingHeadline = headlines.find(h =>
      h.title.toLowerCase().includes(bestConcept.headline?.toLowerCase().slice(0, 20) || '')
    );

    console.log(`⭐ Selected: ${bestConcept.name} ($${bestConcept.ticker}) - Score: ${bestConcept.viralScore}/10`);

    console.log('🚀 Deploying to Pump.fun...');
    const result = await this.deployToken({
      name: bestConcept.name,
      ticker: bestConcept.ticker,
      description: bestConcept.description,
      website: matchingHeadline?.url,
      imageUrl: matchingHeadline?.imageUrl,
    });

    console.log(`✅ Token live: ${result.pumpFunUrl}`);
    return result;
  }
}

// Export types
export * from './types';
export { ClaudeClient } from './claude';
export { NewsClient } from './news';
export { PumpFunClient } from './pumpfun';
