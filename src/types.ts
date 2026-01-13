/**
 * DEVUS SDK Type Definitions
 */

export interface SDKConfig {
  /** Anthropic API key for Claude */
  anthropicApiKey: string;
  /** Solana RPC URL */
  solanaRpcUrl: string;
  /** Deployer wallet private key (base58) */
  deployerPrivateKey: string;
  /** Pinata JWT for IPFS uploads (optional) */
  pinataJwtKey?: string;
  /** Jito tip amount in lamports (default: 10000) */
  jitoTipLamports?: number;
}

export interface NewsHeadline {
  /** Article title */
  title: string;
  /** News source name */
  source: string;
  /** Direct URL to article */
  url: string;
  /** Image URL if available */
  imageUrl?: string;
  /** Publication date */
  pubDate?: string;
}

export interface TokenConcept {
  /** Token name (e.g., "Moon Coin") */
  name: string;
  /** Token ticker symbol (e.g., "MOON") */
  ticker: string;
  /** Token description */
  description: string;
  /** AI reasoning for this concept */
  reasoning: string;
  /** Viral potential score (1-10) */
  viralScore: number;
  /** Original headline that inspired this token */
  headline?: string;
  /** Source article URL */
  sourceUrl?: string;
}

export interface DeploymentConfig {
  /** Token name */
  name: string;
  /** Token ticker */
  ticker: string;
  /** Token description */
  description: string;
  /** Token image URL (IPFS preferred) */
  imageUrl?: string;
  /** Website URL */
  website?: string;
  /** Twitter URL */
  twitter?: string;
}

export interface DeploymentResult {
  /** Whether deployment succeeded */
  success: boolean;
  /** Token mint address */
  mintAddress: string;
  /** Transaction signature */
  signature: string;
  /** Pump.fun URL */
  pumpFunUrl: string;
  /** Metadata URI on IPFS */
  metadataUri?: string;
}

export interface ClaudeResponse {
  name: string;
  ticker: string;
  description: string;
  reasoning: string;
  viralScore: number;
}
