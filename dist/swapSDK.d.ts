import web3, { Connection, Keypair, PublicKey, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";
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
export declare class SwapSDK {
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * Calls the bestSwapRoute endpoint with the provided parameters.
     *
     * @param params Swap parameters.
     * @returns The JSON-parsed API response.
     */
    private callSwapEndpoint;
    base58: import("base-x").default.BaseConverter;
    web3: typeof web3;
    /**
     * Calls the swap endpoint and returns a fully constructed Transaction.
     *
     * @param params Swap parameters.
     * @returns A promise that resolves to a SwapTxResult.
     */
    swapTx(params: SwapRequestParams): Promise<SwapTxResult>;
    /**
     * Calls the swap endpoint and returns the raw instructions and related data.
     *
     * @param params Swap parameters.
     * @returns A promise that resolves to a SwapIxResult.
     */
    swapIx(params: SwapRequestParams): Promise<SwapIxResult>;
    /**
     * Calls the /tokenList endpoint and returns an array of tokens.
     *
     * @returns A promise that resolves to an array of Token objects.
     */
    tokenList(): Promise<Token[]>;
    /**
     * Calls the /tokenPrice/{tokenAddress} endpoint and returns the token price.
     *
     * @param tokenAddress The token's public key.
     * @returns A promise that resolves to the token's price (number).
     */
    tokenPrice(tokenAddress: PublicKey): Promise<number>;
    /**
     * Simulates a transaction.
     * @param connection The connection to use.
     * @param transaction The transaction to simulate.
     * @returns The simulation result.
     * @throws If the simulation fails. with the simulation error
     */
    simulateTransaction(connection: Connection, transaction: VersionedTransaction): Promise<web3.SimulatedTransactionResponse>;
    /**
     * Converts an API instruction (in plain JSON format) to a TransactionInstruction.
     *
     * @param apiInst The API instruction.
     * @returns A TransactionInstruction.
     */
    private convertAPIInstruction;
}
export declare const BASE_URL = "http://170.75.162.89:3333/";
