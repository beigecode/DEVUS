/**
 * Pump.fun Token Deployment
 * 
 * Handles token creation and deployment to Pump.fun on Solana.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { DeploymentConfig, DeploymentResult } from './types';

// Pump.fun program constants
const PUMP_FUN_PROGRAM = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
const PUMP_FUN_FEE_RECIPIENT = new PublicKey('CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbsuGZvnKnHMk8');
const GLOBAL_STATE = new PublicKey('4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf');
const MINT_AUTHORITY = new PublicKey('TSLvdd1pWpHVjahSpsvCXUbgwsL3jCGhQjqJn7HkYN9');
const MPL_TOKEN_METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Jito tip accounts for MEV protection
const JITO_TIP_ACCOUNTS = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4bVmkekYrBb3FW2xkG2LZ',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
];

const JITO_BLOCK_ENGINE = 'https://mainnet.block-engine.jito.wtf';

export class PumpFunClient {
  private connection: Connection;
  private deployerKeypair: Keypair;
  private pinataJwtKey?: string;
  private jitoTipLamports: number;

  constructor(
    rpcUrl: string,
    deployerPrivateKey: string,
    pinataJwtKey?: string,
    jitoTipLamports: number = 10000
  ) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.deployerKeypair = Keypair.fromSecretKey(bs58.decode(deployerPrivateKey));
    this.pinataJwtKey = pinataJwtKey;
    this.jitoTipLamports = jitoTipLamports;
  }

  /**
   * Deploy a new token to Pump.fun
   */
  async deployToken(config: DeploymentConfig): Promise<DeploymentResult> {
    console.log(`🚀 Deploying ${config.name} ($${config.ticker}) to Pump.fun...`);

    // Generate new mint keypair
    const mintKeypair = Keypair.generate();
    console.log(`   Mint address: ${mintKeypair.publicKey.toBase58()}`);

    // Upload metadata to IPFS
    let metadataUri: string | undefined;
    if (this.pinataJwtKey) {
      metadataUri = await this.uploadMetadata(config);
      console.log(`   Metadata URI: ${metadataUri}`);
    }

    // Build and send transaction
    const signature = await this.buildAndSendTransaction(
      mintKeypair,
      config,
      metadataUri || `https://pump.fun/coin/${mintKeypair.publicKey.toBase58()}`
    );

    return {
      success: true,
      mintAddress: mintKeypair.publicKey.toBase58(),
      signature,
      pumpFunUrl: `https://pump.fun/coin/${mintKeypair.publicKey.toBase58()}`,
      metadataUri,
    };
  }

  /**
   * Upload token metadata to IPFS via Pinata
   */
  private async uploadMetadata(config: DeploymentConfig): Promise<string | undefined> {
    if (!this.pinataJwtKey) return undefined;

    const metadata = {
      name: config.name,
      symbol: config.ticker,
      description: config.description,
      image: config.imageUrl || '',
      showName: true,
      createdOn: 'https://opusthedev.com',
      twitter: config.twitter || 'https://x.com/Opusthedev',
      website: config.website || 'https://opusthedev.com',
    };

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.pinataJwtKey}`,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataOptions: { cidVersion: 1 },
          pinataMetadata: { name: `${config.ticker}-metadata` },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return `https://ipfs.io/ipfs/${data.IpfsHash}`;
      }
    } catch (error) {
      console.error('Failed to upload metadata:', error);
    }

    return undefined;
  }

  /**
   * Build and send the Pump.fun create transaction
   */
  private async buildAndSendTransaction(
    mintKeypair: Keypair,
    config: DeploymentConfig,
    metadataUri: string
  ): Promise<string> {
    // Derive PDAs
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mintKeypair.publicKey.toBuffer()],
      PUMP_FUN_PROGRAM
    );

    const [metadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        MPL_TOKEN_METADATA_PROGRAM.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      MPL_TOKEN_METADATA_PROGRAM
    );

    // Create instruction data
    const discriminator = Buffer.from([24, 30, 200, 40, 5, 28, 7, 119]); // "create" discriminator
    const nameBuffer = Buffer.alloc(32);
    Buffer.from(config.name).copy(nameBuffer);
    const tickerBuffer = Buffer.alloc(10);
    Buffer.from(config.ticker).copy(tickerBuffer);
    const uriBuffer = Buffer.alloc(200);
    Buffer.from(metadataUri).copy(uriBuffer);

    const instructionData = Buffer.concat([
      discriminator,
      nameBuffer,
      tickerBuffer,
      uriBuffer,
    ]);

    // Build instruction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: MINT_AUTHORITY, isSigner: false, isWritable: false },
        { pubkey: bondingCurve, isSigner: false, isWritable: true },
        { pubkey: GLOBAL_STATE, isSigner: false, isWritable: false },
        { pubkey: MPL_TOKEN_METADATA_PROGRAM, isSigner: false, isWritable: false },
        { pubkey: metadata, isSigner: false, isWritable: true },
        { pubkey: this.deployerKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: PUMP_FUN_FEE_RECIPIENT, isSigner: false, isWritable: true },
      ],
      programId: PUMP_FUN_PROGRAM,
      data: instructionData,
    });

    // Add Jito tip for priority landing
    const tipAccount = new PublicKey(
      JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)]
    );
    const tipInstruction = SystemProgram.transfer({
      fromPubkey: this.deployerKeypair.publicKey,
      toPubkey: tipAccount,
      lamports: this.jitoTipLamports,
    });

    // Build transaction
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: this.deployerKeypair.publicKey,
    });

    transaction.add(instruction);
    transaction.add(tipInstruction);
    transaction.sign(this.deployerKeypair, mintKeypair);

    // Send via RPC (with Jito fallback)
    return await this.sendTransaction(transaction);
  }

  /**
   * Send transaction with Jito fallback
   */
  private async sendTransaction(transaction: Transaction): Promise<string> {
    // Try standard RPC first
    try {
      console.log('   📡 Sending via RPC...');
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        { skipPreflight: false, preflightCommitment: 'confirmed' }
      );

      await this.connection.confirmTransaction(signature, 'confirmed');
      console.log(`   ✅ Transaction confirmed: ${signature}`);
      return signature;
    } catch (error) {
      console.log('   RPC failed, trying Jito...');
    }

    // Fallback to Jito bundle
    try {
      console.log('   🚀 Sending via Jito bundle...');
      const serializedTx = bs58.encode(transaction.serialize());

      const response = await fetch(`${JITO_BLOCK_ENGINE}/api/v1/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sendBundle',
          params: [[serializedTx]],
        }),
      });

      const result = await response.json();

      if (result.result) {
        const signature = bs58.encode(transaction.signature!);
        console.log(`   ✅ Jito bundle submitted: ${result.result}`);

        // Wait for confirmation
        await new Promise(r => setTimeout(r, 3000));
        const status = await this.connection.getSignatureStatus(signature);

        if (status.value?.confirmationStatus) {
          return signature;
        }
      }

      throw new Error(result.error?.message || 'Jito submission failed');
    } catch (error) {
      throw new Error(`Transaction failed: ${error}`);
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.deployerKeypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }
}
