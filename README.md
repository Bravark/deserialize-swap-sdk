# deserialize-swap-sdk



# Swap SDK

The **Swap SDK** is a TypeScript library that simplifies interacting with a Solana swap endpoint. It abstracts away the low-level details of converting between Solana types (e.g., `PublicKey`, `Keypair`) and the API’s JSON formats. Use it to easily construct swap transactions or retrieve underlying instructions for advanced scenarios.

## Features

- **Simple API:**  
  Accepts Solana `PublicKey` objects and numerical amounts while handling all necessary conversions.
- **Transaction Deserialization & Signing:**  
  Automatically converts a base64-encoded transaction from the API into a `VersionedTransaction` and applies signatures.
- **Flexible Usage:**  
  Choose between getting a fully constructed transaction (using `swapTx`) or the raw instructions (using `swapIx`) for manual transaction assembly.
- **Custom Routing Options:**  
  Pass options (e.g., limiting swap hops) to tailor the swap behavior to your needs.

## Installation

Install the package via npm (or yarn):

```bash
npm install swap-sdk
# or
yarn add swap-sdk
```

*Note:* Replace `swap-sdk` with the actual package name when you publish it.

## Usage

Below is a simple example of how to use the SDK in your project:

```typescript
// index.ts
import { SwapSDK } from "@deserialize/swap-sdk";
import { Buffer } from "buffer";
(async () => {
  const deserialize = new SwapSDK();

  const privKey = "PRIVATE_KEY";

  const privateKeyArray = deserialize.base58.decode(privKey);
  const userKeyPair = deserialize.web3.Keypair.fromSecretKey(privateKeyArray);

  const params = {
    tokenB: new deserialize.web3.PublicKey(
      "BeRUj3h7BqkbdfFU7FBNYbodgf8GCHodzKvF9aVjNNfL"
    ),
    tokenA: new deserialize.web3.PublicKey(
      "GU7NS9xCwgNPiAdJ69iusFrRfawjDDPjeMBovhV1d4kn"
    ),
    publicKey: new deserialize.web3.PublicKey(
      "8PE7zNHVmn1zmFqNxPHpgjriDd8MNfTHWadPKenYDQX2"
    ),
    amountIn: 0.0028,
    dexId: "INVARIANT",
    options: {
      reduceToTwoHops: false, //set to true if you always want two hops
    },
  };
  const response = await deserialize.swapTx(params);

  console.log("Instructions:", response);
  //sign and simulate the transaction

  const connection = new deserialize.web3.Connection(
    "https:///eclipse.lgns.net",
    "confirmed"
  );
  const tx = response.transaction;

  const serializedTx = Buffer.from(tx.serialize()).toString("base64");
  console.log("serializedTx: ", serializedTx);

  const { value } = await connection.simulateTransaction(tx);
  console.log("value: ", value);

  tx.sign([userKeyPair]);
  const sign = await connection.sendTransaction(tx, { skipPreflight: false });
  console.log("sign: ", sign);
})();

```

## API Reference

### SwapSDK

#### Constructor

```typescript
new SwapSDK(baseUrl?: string)
```


#### Methods

- **`swapTx(params: SwapRequestParams): Promise<SwapTxResult>`**  
  Sends a swap request and returns a fully constructed, unsigned `VersionedTransaction` along with:
  - `amountOut`: Raw output amount.
  - `amountOutUi`: Human-readable output amount.
  - `routePlan`: An array of route steps (with tokens as `PublicKey`).
  - `lookupAccounts`: Lookup accounts as `PublicKey` objects.
  - `signers`: Signers as `Keypair` objects.

- **`swapIx(params: SwapRequestParams): Promise<SwapIxResult>`**  
  Sends a swap request and returns the underlying instruction groups and additional swap details:
  - `instructionGroups`: Groups of main and cleanup instructions (as `TransactionInstruction` objects).
  - `amountOut`: Raw output amount.
  - `amountOutUi`: Human-readable output amount.
  - `routePlan`: An array of route steps (with tokens as `PublicKey`).
  - `lookupAccounts`: Lookup accounts as `PublicKey` objects.
  - `signers`: Top-level signers as base64-encoded strings.

### Interfaces

#### SwapRequestParams

- **`publicKey`**: User's public key (`PublicKey`).
- **`tokenA`**: Token A's address (`PublicKey`).
- **`tokenB`**: Token B's address (`PublicKey`).
- **`amountIn`**: Amount of token A to swap (number, in human-readable units).
- **`dexId`**: `"INVARIANT"` (string literal).
- **`options?`**: Optional routing options (`RouteOptions`).

#### RouteOptions

- **`reduceToTwoHops`**: `boolean` — if set to `true`, limits the swap to two hops to avoid errors like *TooManyAccountLocks*.

#### SwapTxResult & SwapIxResult

Both results include the output amounts, route plan, and lookup accounts; the key difference is that `SwapTxResult` returns a full transaction (as a `VersionedTransaction`), whereas `SwapIxResult` returns raw instruction groups.

## License

This project is licensed under the [MIT License](LICENSE).

---

Happy swapping!
```

---
# deserialize-swap-sdk
