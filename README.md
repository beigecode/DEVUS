# DEVUS SDK

A TypeScript SDK for AI-powered token creation on Pump.fun using Claude (Anthropic).

## Features

- 🤖 **Claude AI Integration** - Generate creative token concepts from news headlines
- 🚀 **Pump.fun Deployment** - Deploy tokens directly to Pump.fun
- 📰 **News Feed Integration** - Fetch real-time headlines from RSS feeds
- ⚡ **Jito Bundle Support** - Fast transaction landing with MEV protection

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-api03-...
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
DEPLOYER_PRIVATE_KEY=your-base58-private-key

# Optional
PINATA_JWT_KEY=your-pinata-jwt-for-ipfs
JITO_TIP_LAMPORTS=10000
```

## Quick Start

```typescript
import { DevusSDK } from './src';

const sdk = new DevusSDK({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  solanaRpcUrl: process.env.SOLANA_RPC_URL!,
  deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY!,
});

// Generate token idea from news
const concept = await sdk.generateTokenConcept("Apple partners with Google for AI");

// Deploy to Pump.fun
const result = await sdk.deployToken(concept);
console.log(`Token live at: https://pump.fun/coin/${result.mintAddress}`);
```

## API Reference

### `generateTokenConcept(headline: string)`

Uses Claude to analyze a headline and generate a creative token concept.

```typescript
const concept = await sdk.generateTokenConcept(
  "Elon Musk announces new AI breakthrough"
);

// Returns:
// {
//   name: "Musk AI",
//   ticker: "MUSKAI",
//   description: "...",
//   reasoning: "...",
//   viralScore: 9
// }
```

### `fetchNewsHeadlines(count?: number)`

Fetches real-time news headlines from RSS feeds.

```typescript
const headlines = await sdk.fetchNewsHeadlines(10);
// Returns array of { title, source, url, imageUrl }
```

### `deployToken(concept: TokenConcept)`

Deploys a token to Pump.fun.

```typescript
const result = await sdk.deployToken({
  name: "My Token",
  ticker: "MYTKN",
  description: "A cool token",
  imageUrl: "https://...",
  website: "https://...",
  twitter: "https://x.com/...",
});

// Returns:
// {
//   success: true,
//   mintAddress: "...",
//   signature: "...",
//   pumpFunUrl: "https://pump.fun/coin/..."
// }
```

## Architecture

```
DEVUS-SDK/
├── src/
│   ├── index.ts          # Main SDK export
│   ├── claude.ts         # Anthropic API integration
│   ├── pumpfun.ts        # Pump.fun deployment
│   ├── news.ts           # RSS feed fetching
│   └── types.ts          # TypeScript interfaces
├── examples/
│   └── basic-usage.ts    # Example usage
├── package.json
└── README.md
```

## Example: News-to-Token Pipeline

```typescript
import { DevusSDK } from './src';

async function main() {
  const sdk = new DevusSDK({
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    solanaRpcUrl: process.env.SOLANA_RPC_URL!,
    deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY!,
  });

  // 1. Fetch latest news
  const headlines = await sdk.fetchNewsHeadlines(5);
  console.log(`Found ${headlines.length} headlines`);

  // 2. Pick the most interesting one
  const topHeadline = headlines[0];
  console.log(`Analyzing: ${topHeadline.title}`);

  // 3. Generate token concept with Claude
  const concept = await sdk.generateTokenConcept(topHeadline.title);
  console.log(`Generated: ${concept.name} ($${concept.ticker})`);

  // 4. Deploy to Pump.fun
  const result = await sdk.deployToken({
    ...concept,
    website: topHeadline.url,
  });

  console.log(`🚀 Token live: ${result.pumpFunUrl}`);
}

main();
```

## Devus Wallet

All tokens are deployed from the official Devus wallet:

**[`9nVDGbbguVegQwpw4Unic4mgPpR3UwWTm71nFgMjwaeG`](https://solscan.io/account/9nVDGbbguVegQwpw4Unic4mgPpR3UwWTm71nFgMjwaeG)**

## License

MIT

## Links

- [Pump.fun](https://pump.fun)
- [Anthropic Claude](https://anthropic.com)
- [Twitter/X](https://x.com/Opusthedev)
- [Devus Wallet on Solscan](https://solscan.io/account/9nVDGbbguVegQwpw4Unic4mgPpR3UwWTm71nFgMjwaeG)
