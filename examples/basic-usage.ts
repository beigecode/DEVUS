/**
 * DEVUS SDK - Basic Usage Example
 * 
 * This example demonstrates:
 * 1. Fetching news headlines
 * 2. Generating token concepts with Claude AI
 * 3. Deploying a token to Pump.fun
 * 
 * Run with: npx ts-node examples/basic-usage.ts
 */

import 'dotenv/config';
import { DevusSDK } from '../src';

async function main() {
  // Initialize SDK
  const sdk = new DevusSDK({
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY!,
    pinataJwtKey: process.env.PINATA_JWT_KEY,
  });

  console.log('='.repeat(50));
  console.log('DEVUS SDK - Basic Usage Example');
  console.log('='.repeat(50));

  // Check wallet balance
  const balance = await sdk.getWalletBalance();
  console.log(`\n💰 Wallet balance: ${balance.toFixed(4)} SOL\n`);

  if (balance < 0.01) {
    console.log('⚠️  Low balance! Add SOL to deploy tokens.');
    return;
  }

  // Example 1: Generate concept from custom headline
  console.log('📰 Example 1: Generate concept from headline\n');
  
  const customHeadline = "Apple announces groundbreaking AI partnership with Google";
  console.log(`Headline: "${customHeadline}"`);
  
  const concept = await sdk.generateTokenConcept(customHeadline);
  console.log('\nGenerated concept:');
  console.log(`  Name: ${concept.name}`);
  console.log(`  Ticker: $${concept.ticker}`);
  console.log(`  Description: ${concept.description}`);
  console.log(`  Reasoning: ${concept.reasoning}`);
  console.log(`  Viral Score: ${concept.viralScore}/10`);

  // Example 2: Fetch real news headlines
  console.log('\n' + '='.repeat(50));
  console.log('📰 Example 2: Fetch real news headlines\n');
  
  const headlines = await sdk.fetchNewsHeadlines(5);
  console.log(`Found ${headlines.length} headlines:\n`);
  
  headlines.forEach((h, i) => {
    console.log(`${i + 1}. [${h.source}] ${h.title.slice(0, 60)}...`);
    console.log(`   URL: ${h.url.slice(0, 50)}...`);
    console.log('');
  });

  // Example 3: Analyze and rank headlines
  console.log('='.repeat(50));
  console.log('🤖 Example 3: Analyze headlines with Claude\n');

  const concepts = await sdk.analyzeHeadlines(headlines.map(h => h.title));
  console.log('Ranked concepts by viral potential:\n');

  concepts.forEach((c, i) => {
    console.log(`${i + 1}. ${c.name} ($${c.ticker}) - Score: ${c.viralScore}/10`);
    console.log(`   ${c.description.slice(0, 60)}...`);
    console.log('');
  });

  // Example 4: Deploy token (uncomment to actually deploy)
  console.log('='.repeat(50));
  console.log('🚀 Example 4: Deploy token to Pump.fun\n');
  console.log('⚠️  Deployment is commented out by default.');
  console.log('    Uncomment the code below to deploy.\n');

  /*
  // Uncomment to deploy:
  const topConcept = concepts[0];
  const result = await sdk.deployToken({
    name: topConcept.name,
    ticker: topConcept.ticker,
    description: topConcept.description,
    website: headlines[0]?.url,
  });

  console.log('✅ Token deployed!');
  console.log(`   Mint: ${result.mintAddress}`);
  console.log(`   Signature: ${result.signature}`);
  console.log(`   Pump.fun: ${result.pumpFunUrl}`);
  */

  console.log('='.repeat(50));
  console.log('Done! Check the code for more examples.');
}

main().catch(console.error);
