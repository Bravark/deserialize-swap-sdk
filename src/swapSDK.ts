// SwapSDK.ts
import web3, {
  Connection,
  Keypair,
  PublicKey,
  SimulateTransactionConfig,
  Transaction,
  TransactionInstruction,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import base58 from "bs58";
import { handleSimulationError } from "./errors";

/**
 * Parameters to request a swap.
 */
export interface SwapRequestParams {
  /** User’s public key */
  publicKey: PublicKey;
  /** Token A’s address */
  tokenA: PublicKey;
  /** Token B’s address */
  tokenB: PublicKey;
  /** Amount of Token A to swap (in human-readable units) */
  amountIn: number;
  /** DEX identifier – currently only "INVARIANT" is supported */
  dexId: string;
  /**
   * This is used to set options like limit the swap to just two hops to
   * prevent errors like TooManyAccountLocks
   */
  options?: RouteOptions;
}

export interface RouteOptions {
  reduceToTwoHops: boolean;
}

/**
 * Result from the swapTx method.
 */
export interface SwapTxResult {
  /** The unsigned Transaction object ready to be signed and submitted */
  transaction: VersionedTransaction;
  /** The raw output amount (in the smallest denomination) */
  amountOut: number;
  /** The human-readable output amount (after adjusting decimals) */
  amountOutUi: number;
  /** The swap route plan with tokens converted to PublicKey objects */
  routePlan: {
    tokenA: PublicKey;
    tokenB: PublicKey;
    dexId: string;
  }[];
  /** Lookup accounts converted to PublicKey objects */
  lookupAccounts: PublicKey[];
  /** Any signers returned (encoded as base64 strings) */
  signers: Keypair[];
}

/**
 * Structure representing a group of instructions from the API.
 */
export interface InstructionGroup {
  /** The main instructions (converted to TransactionInstruction objects) */
  instructions: TransactionInstruction[];
  /** Any cleanup instructions (converted to TransactionInstruction objects) */
  cleanupInstructions: TransactionInstruction[];
  /** Signers associated with this group (as base64 encoded strings) */
  signers: string[];
}

/**
 * Result from the swapIx method.
 */
export interface SwapIxResult {
  /** The instruction groups as returned from the API (with instructions converted) */
  instructionGroups: InstructionGroup[];
  /** The raw output amount (in the smallest denomination) */
  amountOut: number;
  /** The human-readable output amount (after adjusting decimals) */
  amountOutUi: number;
  /** The swap route plan with tokens converted to PublicKey objects */
  routePlan: {
    tokenA: PublicKey;
    tokenB: PublicKey;
    dexId: string;
  }[];
  /** Lookup accounts converted to PublicKey objects */
  lookupAccounts: PublicKey[];
  /** Any top-level signers returned (as base64 encoded strings) */
  signers: string[];
}

/**
 * Token details returned from the /tokenList endpoint.
 */
export interface Token {
  name: string;
  symbol: string;
  address: PublicKey;
  chainId: number;
  decimals: number;
  logoURL: string;
}

/**
 * SwapSDK simplifies calling the swap endpoint as well as token-related endpoints.
 *
 * Usage:
 * ```ts
 * import { SwapSDK } from "./SwapSDK";
 * import { PublicKey } from "@solana/web3.js";
 *
 * const sdk = new SwapSDK("http://localhost:3333");
 *
 * async function runSwap() {
 *   const params = {
 *     publicKey: new PublicKey("UserPublicKeyInBase58"),
 *     tokenA: new PublicKey("GU7NS9xCwgNPiAdJ69iusFrRfawjDDPjeMBovhV1d4kn"),
 *     tokenB: new PublicKey("CEBP3CqAbW4zdZA57H2wfaSG1QNdzQ72GiQEbQXyW9Tm"),
 *     amountIn: 10.0,
 *     dexId: "INVARIANT",
 *   };
 *
 *   // To get the full transaction:
 *   const txResult = await sdk.swapTx(params);
 *   console.log("Transaction:", txResult.transaction);
 *
 *   // Or, to get the underlying instructions and additional data:
 *   const ixResult = await sdk.swapIx(params);
 *   console.log("Instructions:", ixResult.instructionGroups);
 *
 *   // Fetch token list:
 *   const tokens = await sdk.tokenList();
 *   console.log("Tokens:", tokens);
 *
 *   // Fetch token price:
 *   const price = await sdk.tokenPrice(new PublicKey("So11111111111111111111111111111111111111112"));
 *   console.log("Token Price:", price);
 * }
 *
 * runSwap();
 * ```
 */
export class SwapSDK {
  private baseUrl: string;
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BASE_URL;
  }

  /**
   * Calls the bestSwapRoute endpoint with the provided parameters.
   *
   * @param params Swap parameters.
   * @returns The JSON-parsed API response.
   */
  private async callSwapEndpoint(params: SwapRequestParams): Promise<any> {
    // Prepare the payload by converting PublicKeys to base58 strings
    const body = {
      publicKey: params.publicKey.toBase58(),
      tokenA: params.tokenA.toBase58(),
      tokenB: params.tokenB.toBase58(),
      amountIn: params.amountIn.toString(),
      dexId: params.dexId,
      options: params.options,
    };

    const response = await fetch(`${this.baseUrl}/bestSwapRoute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  base58 = base58;
  web3 = web3;

  /**
   * Calls the swap endpoint and returns a fully constructed Transaction.
   *
   * @param params Swap parameters.
   * @returns A promise that resolves to a SwapTxResult.
   */
  async swapTx(params: SwapRequestParams): Promise<SwapTxResult> {
    const data = await this.callSwapEndpoint(params);

    // Convert the base64-encoded transaction into a VersionedTransaction.
    const txBuffer = Buffer.from(data.transaction, "base64");
    const transaction = VersionedTransaction.deserialize(txBuffer);

    // Convert lookup accounts from strings to PublicKey objects.
    const lookupAccounts: PublicKey[] = (data.lookUpAccounts || []).map(
      (addr: string) => new PublicKey(addr)
    );

    // Convert the route plan tokens into PublicKey objects.
    const routePlan = (data.routePlan || []).map((rp: any) => ({
      tokenA: new PublicKey(rp.tokenA),
      tokenB: new PublicKey(rp.tokenB),
      dexId: rp.dexId,
    }));

    // Convert each base64-encoded signer secret into a Keypair.
    const signers = data.signers.map((s: string) =>
      Keypair.fromSecretKey(base58.decode(s))
    );
    transaction.sign(signers);
    return {
      transaction,
      amountOut: Number(data.amountOut),
      amountOutUi: Number(data.amountOutUi),
      routePlan,
      lookupAccounts,
      signers,
    };
  }

  /**
   * Calls the swap endpoint and returns the raw instructions and related data.
   *
   * @param params Swap parameters.
   * @returns A promise that resolves to a SwapIxResult.
   */
  async swapIx(params: SwapRequestParams): Promise<SwapIxResult> {
    const data = await this.callSwapEndpoint(params);

    // Convert lookup accounts from strings to PublicKey objects.
    const lookupAccounts: PublicKey[] = (data.lookUpAccounts || []).map(
      (addr: string) => new PublicKey(addr)
    );

    // Convert the route plan tokens into PublicKey objects.
    const routePlan = (data.routePlan || []).map((rp: any) => ({
      tokenA: new PublicKey(rp.tokenA),
      tokenB: new PublicKey(rp.tokenB),
      dexId: rp.dexId,
    }));

    // Convert each API instruction group into properly formatted objects.
    const instructionGroups: InstructionGroup[] = (data.inXs || []).map(
      (group: any) => ({
        instructions: (group.instructions || []).map((inst: any) =>
          this.convertAPIInstruction(inst)
        ),
        cleanupInstructions: (group.cleanupInstructions || []).map(
          (inst: any) => this.convertAPIInstruction(inst)
        ),
        signers: group.signers || [],
      })
    );

    return {
      instructionGroups,
      amountOut: Number(data.amountOut),
      amountOutUi: Number(data.amountOutUi),
      routePlan,
      lookupAccounts,
      signers: data.signers,
    };
  }

  /**
   * Calls the /tokenList endpoint and returns an array of tokens.
   *
   * @returns A promise that resolves to an array of Token objects.
   */
  async tokenList(): Promise<Token[]> {
    const response = await fetch(`${this.baseUrl}/tokenList`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.map((token: any) => ({
      name: token.name,
      symbol: token.symbol,
      address: new PublicKey(token.address),
      chainId: token.chainId,
      decimals: token.decimals,
      logoURL: token.logoURL,
    }));
  }

  /**
   * Calls the /tokenPrice/{tokenAddress} endpoint and returns the token price.
   *
   * @param tokenAddress The token's public key.
   * @returns A promise that resolves to the token's price (number).
   */
  async tokenPrice(tokenAddress: PublicKey): Promise<number> {
    const response = await fetch(
      `${this.baseUrl}/tokenPrice/${tokenAddress.toBase58()}`
    );
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    const data = await response.json();
    return Number(data.price);
  }
  /**
   * Simulates a transaction.
   * @param connection The connection to use.
   * @param transaction The transaction to simulate.
   * @returns The simulation result.
   * @throws If the simulation fails. with the simulation error
   */
  async simulateTransaction(
    connection: Connection,
    transaction: VersionedTransaction
  ) {
    const config: SimulateTransactionConfig = { commitment: "confirmed" };
    const { value } = await connection.simulateTransaction(transaction, config);
    if (value.err) {
      handleSimulationError(value.err);
    }
    return value;
  }

  /**
   * Converts an API instruction (in plain JSON format) to a TransactionInstruction.
   *
   * @param apiInst The API instruction.
   * @returns A TransactionInstruction.
   */
  private convertAPIInstruction(apiInst: any): TransactionInstruction {
    return new TransactionInstruction({
      keys: (apiInst.keys || []).map((key: any) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
      })),
      programId: new PublicKey(apiInst.programId),
      data: Buffer.from(apiInst.data),
    });
  }
}

export const BASE_URL = "http://170.75.162.89:3333/";
