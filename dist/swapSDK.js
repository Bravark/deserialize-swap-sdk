"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_URL = exports.SwapSDK = void 0;
// SwapSDK.ts
const web3_js_1 = __importStar(require("@solana/web3.js"));
const bs58_1 = __importDefault(require("bs58"));
const errors_1 = require("./errors");
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
class SwapSDK {
    constructor(baseUrl) {
        this.base58 = bs58_1.default;
        this.web3 = web3_js_1.default;
        this.baseUrl = baseUrl || exports.BASE_URL;
    }
    /**
     * Calls the bestSwapRoute endpoint with the provided parameters.
     *
     * @param params Swap parameters.
     * @returns The JSON-parsed API response.
     */
    async callSwapEndpoint(params) {
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
    /**
     * Calls the swap endpoint and returns a fully constructed Transaction.
     *
     * @param params Swap parameters.
     * @returns A promise that resolves to a SwapTxResult.
     */
    async swapTx(params) {
        const data = await this.callSwapEndpoint(params);
        // Convert the base64-encoded transaction into a VersionedTransaction.
        const txBuffer = Buffer.from(data.transaction, "base64");
        const transaction = web3_js_1.VersionedTransaction.deserialize(txBuffer);
        // Convert lookup accounts from strings to PublicKey objects.
        const lookupAccounts = (data.lookUpAccounts || []).map((addr) => new web3_js_1.PublicKey(addr));
        // Convert the route plan tokens into PublicKey objects.
        const routePlan = (data.routePlan || []).map((rp) => ({
            tokenA: new web3_js_1.PublicKey(rp.tokenA),
            tokenB: new web3_js_1.PublicKey(rp.tokenB),
            dexId: rp.dexId,
        }));
        // Convert each base64-encoded signer secret into a Keypair.
        const signers = data.signers.map((s) => web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(s)));
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
    async swapIx(params) {
        const data = await this.callSwapEndpoint(params);
        // Convert lookup accounts from strings to PublicKey objects.
        const lookupAccounts = (data.lookUpAccounts || []).map((addr) => new web3_js_1.PublicKey(addr));
        // Convert the route plan tokens into PublicKey objects.
        const routePlan = (data.routePlan || []).map((rp) => ({
            tokenA: new web3_js_1.PublicKey(rp.tokenA),
            tokenB: new web3_js_1.PublicKey(rp.tokenB),
            dexId: rp.dexId,
        }));
        // Convert each API instruction group into properly formatted objects.
        const instructionGroups = (data.inXs || []).map((group) => ({
            instructions: (group.instructions || []).map((inst) => this.convertAPIInstruction(inst)),
            cleanupInstructions: (group.cleanupInstructions || []).map((inst) => this.convertAPIInstruction(inst)),
            signers: group.signers || [],
        }));
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
    async tokenList() {
        const response = await fetch(`${this.baseUrl}/tokenList`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.map((token) => ({
            name: token.name,
            symbol: token.symbol,
            address: new web3_js_1.PublicKey(token.address),
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
    async tokenPrice(tokenAddress) {
        const response = await fetch(`${this.baseUrl}/tokenPrice/${tokenAddress.toBase58()}`);
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
    async simulateTransaction(connection, transaction) {
        const config = { commitment: "confirmed" };
        const { value } = await connection.simulateTransaction(transaction, config);
        if (value.err) {
            (0, errors_1.handleSimulationError)(value.err);
        }
        return value;
    }
    /**
     * Converts an API instruction (in plain JSON format) to a TransactionInstruction.
     *
     * @param apiInst The API instruction.
     * @returns A TransactionInstruction.
     */
    convertAPIInstruction(apiInst) {
        return new web3_js_1.TransactionInstruction({
            keys: (apiInst.keys || []).map((key) => ({
                pubkey: new web3_js_1.PublicKey(key.pubkey),
                isSigner: key.isSigner,
                isWritable: key.isWritable,
            })),
            programId: new web3_js_1.PublicKey(apiInst.programId),
            data: Buffer.from(apiInst.data),
        });
    }
}
exports.SwapSDK = SwapSDK;
exports.BASE_URL = "http://170.75.162.89:3333/";
//# sourceMappingURL=swapSDK.js.map