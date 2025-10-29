import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Connection,
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { useMobileWallet } from "../providers/MobileWalletProvider";
import { Buffer } from "buffer";
import { blake3 } from "@noble/hashes/blake3";
import {
  generateNote,
  saveNote,
  updateNote,
  formatAmount,
  calculateFee,
  type CloakNote,
} from "../lib/note-manager";
import { indexerClient, type MerkleProof } from "../lib/indexer-client";
import { useSP1Prover } from "../hooks/use-sp1-prover";

const LAMPORTS_PER_SOL = 1_000_000_000;
const RELAY_URL = "http://localhost:3002";
const INDEXER_URL = "http://localhost:3001";
const SOLANA_RPC_URL = "https://api.devnet.solana.com";

export default function TransactionScreen() {
  const { connected, publicKey, sendTransaction, deauthorize } =
    useMobileWallet();
  const connection = useMemo(
    () => new Connection(SOLANA_RPC_URL, "confirmed"),
    []
  );

  const [amount, setAmount] = useState("");
  const [outputs, setOutputs] = useState<
    Array<{ address: string; amount: string }>
  >([{ address: "", amount: "" }]);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parsedAmountLamports = useMemo(
    () => parseSolToLamports(amount),
    [amount]
  );
  const feeLamports =
    parsedAmountLamports !== null ? calculateFee(parsedAmountLamports) : 0;
  const distributableLamports =
    parsedAmountLamports !== null ? parsedAmountLamports - feeLamports : 0;

  const parsedOutputs = outputs.map((entry) => {
    const address = entry.address.trim();
    const amountLamportsValue =
      entry.amount.trim() === "" ? null : parseSolToLamports(entry.amount);
    const addressValid = address ? isValidSolanaAddress(address) : false;
    const amountValid =
      amountLamportsValue !== null &&
      Number.isFinite(amountLamportsValue) &&
      amountLamportsValue >= 0;
    return {
      address,
      amountLamports: amountLamportsValue,
      addressValid,
      amountValid,
    };
  });

  const totalAssignedLamports = parsedOutputs.reduce(
    (sum, o) => sum + (o.amountLamports ?? 0),
    0
  );
  const remainingLamports = distributableLamports - totalAssignedLamports;
  const isSingleRecipient = parsedOutputs.length === 1;
  const allocationMismatch = Math.abs(remainingLamports) > 1;
  const shouldCheckAllocation = !isSingleRecipient && allocationMismatch;
  const allAddressesProvided = parsedOutputs.every((o) => o.address.length > 0);
  const allAddressesValid = parsedOutputs.every(
    (o) => !o.address || o.addressValid
  );
  const allAmountsProvided = parsedOutputs.every(
    (o) => o.amountLamports !== null && o.amountLamports !== undefined
  );
  const allAmountsPositive = parsedOutputs.every(
    (o) => (o.amountLamports ?? 0) > 0
  );
  const outputsValid =
    parsedAmountLamports !== null &&
    parsedAmountLamports > 0 &&
    distributableLamports > 0 &&
    parsedOutputs.length > 0 &&
    allAddressesProvided &&
    allAddressesValid &&
    allAmountsProvided &&
    allAmountsPositive &&
    !shouldCheckAllocation;

  useEffect(() => {
    if (connected && publicKey) {
      connection
        .getBalance(publicKey)
        .then(setBalance)
        .catch(() => setBalance(null));
    } else {
      setBalance(null);
    }
  }, [connected, publicKey, connection]);

  const prover = useSP1Prover({
    onStart: () => {},
    onSuccess: () => {},
    onError: (e) => Alert.alert("Proof generation failed", String(e)),
  });

  const handleSendTokens = async () => {
    if (!connected || !publicKey) return Alert.alert("Connect your wallet");
    if (!amount || parsedAmountLamports === null || parsedAmountLamports <= 0)
      return Alert.alert("Enter a valid amount");
    if (!outputsValid) return Alert.alert("Fix recipients or amounts");

    const fee = calculateFee(parsedAmountLamports);
    const totalAssignedWithFee = totalAssignedLamports + fee;
    const amountMismatch = Math.abs(
      totalAssignedWithFee - parsedAmountLamports
    );
    let preparedOutputs: Array<{ address: string; amountLamports: number }> =
      [];
    if (isSingleRecipient && amountMismatch > 1) {
      preparedOutputs = parsedOutputs.map((o, i) => ({
        address: o.address,
        amountLamports: i === 0 ? distributableLamports : o.amountLamports ?? 0,
      }));
    } else if (amountMismatch > 1) {
      return Alert.alert(
        "Amount mismatch",
        `Adjust by ${formatAmount(amountMismatch)} SOL`
      );
    } else {
      preparedOutputs = parsedOutputs.map((o) => ({
        address: o.address,
        amountLamports: o.amountLamports ?? 0,
      }));
    }

    setIsLoading(true);
    try {
      const note = generateNote(parsedAmountLamports, "devnet");
      saveNote(note);

      const PROGRAM_ID =
        process.env.NEXT_PUBLIC_PROGRAM_ID ||
        "c1oak6tetxYnNfvXKFkpn1d98FxtK7B68vBQLYQpWKp";
      const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS as string;
      const COMMITMENTS_ADDRESS = process.env
        .NEXT_PUBLIC_COMMITMENTS_ADDRESS as string;
      if (!POOL_ADDRESS || !COMMITMENTS_ADDRESS)
        throw new Error("Missing on-chain program addresses");

      const programId = new PublicKey(PROGRAM_ID);
      const poolPubkey = new PublicKey(POOL_ADDRESS);
      const commitmentsPubkey = new PublicKey(COMMITMENTS_ADDRESS);

      const [poolAccount, commitmentsAccount] = await Promise.all([
        connection.getAccountInfo(poolPubkey),
        connection.getAccountInfo(commitmentsPubkey),
      ]);
      if (!poolAccount) throw new Error("Pool account not initialized");
      if (!commitmentsAccount)
        throw new Error("Commitments account not initialized");

      const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200_000,
      });
      const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1_000,
      });

      const commitmentBytes = Buffer.from(note.commitment, "hex");
      if (commitmentBytes.length !== 32)
        throw new Error(`Invalid commitment length: ${commitmentBytes.length}`);

      const depositIx = createDepositInstruction({
        programId,
        payer: publicKey,
        pool: poolPubkey,
        commitments: commitmentsPubkey,
        amount: note.amount,
        commitment: commitmentBytes,
      });
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const tx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(computeUnitPriceIx, computeUnitLimitIx, depositIx);

      const simulation = await connection.simulateTransaction(tx);
      if (simulation.value.err) {
        const logs = simulation.value.logs?.join("\n") || "No logs";
        throw new Error(
          `Simulation failed: ${JSON.stringify(
            simulation.value.err
          )}\nLogs:\n${logs}`
        );
      }

      const signature = await sendTransaction(tx, connection);

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });
      if (confirmation.value.err)
        throw new Error(
          `Confirmation failed: ${JSON.stringify(confirmation.value.err)}`
        );

      // Indexer submit
      const encryptedOutput = Buffer.from(
        JSON.stringify({
          amount: note.amount,
          r: note.r,
          sk_spend: note.sk_spend,
        }),
        "utf8"
      ).toString("base64");
      const depositResponse = await fetch(`${INDEXER_URL}/api/v1/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaf_commit: note.commitment,
          encrypted_output: encryptedOutput,
          tx_signature: signature,
          slot: confirmation?.context?.slot || 0,
        }),
      });
      if (!depositResponse.ok) throw new Error(await depositResponse.text());
      const depositData = await depositResponse.json();
      const leafIndex = depositData.leafIndex ?? depositData.leaf_index;
      const historicalRoot = depositData.root;

      const merkleProofResponse = await fetch(
        `${INDEXER_URL}/api/v1/merkle/proof/${leafIndex}`
      );
      if (!merkleProofResponse.ok)
        throw new Error(
          `Failed to fetch Merkle proof: ${merkleProofResponse.statusText}`
        );
      const merkleProofData = await merkleProofResponse.json();
      const historicalMerkleProof = {
        pathElements:
          merkleProofData.pathElements ?? merkleProofData.path_elements,
        pathIndices:
          merkleProofData.pathIndices ?? merkleProofData.path_indices,
      };

      updateNote(note.commitment, {
        depositSignature: signature,
        depositSlot: confirmation?.context?.slot,
        leafIndex,
        root: historicalRoot,
        merkleProof: historicalMerkleProof,
      });

      await performWithdraw(
        { ...note, root: historicalRoot, merkleProof: historicalMerkleProof },
        leafIndex,
        preparedOutputs,
        connection,
        prover.generateProof
      );
      Alert.alert("Success", "Transaction completed");
    } catch (e: any) {
      Alert.alert("Transaction failed", String(e?.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Send Tokens Privately</Text>
        <TouchableOpacity onPress={deauthorize}>
          <Text style={styles.disconnect}>{connected ? "Disconnect" : ""}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Amount (SOL)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="0.0"
          value={amount}
          onChangeText={setAmount}
        />
        <Text style={styles.help}>
          Available:{" "}
          <Text style={styles.bold}>
            {connected && balance !== null
              ? `${formatAmount(balance)} SOL`
              : connected
              ? "Loading..."
              : "Connect wallet"}
          </Text>
        </Text>

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Recipients</Text>
          <TouchableOpacity
            onPress={() =>
              setOutputs((prev) => [...prev, { address: "", amount: "" }])
            }
          >
            <Text style={styles.link}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={outputs}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <View style={styles.recipient}>
              <Text style={styles.recipientTitle}>Recipient #{index + 1}</Text>
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={item.address}
                onChangeText={(v) =>
                  setOutputs((prev) =>
                    prev.map((e, i) => (i === index ? { ...e, address: v } : e))
                  )
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Amount (SOL)"
                keyboardType="decimal-pad"
                value={item.amount}
                onChangeText={(v) =>
                  setOutputs((prev) =>
                    prev.map((e, i) => (i === index ? { ...e, amount: v } : e))
                  )
                }
              />
              {outputs.length > 1 && (
                <TouchableOpacity
                  onPress={() =>
                    setOutputs((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />

        <TouchableOpacity
          disabled={!connected || !amount || !outputsValid || isLoading}
          onPress={handleSendTokens}
          style={[
            styles.primaryBtn,
            (!connected || !amount || !outputsValid || isLoading) && {
              opacity: 0.5,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Send Privately</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function createDepositInstruction(params: {
  programId: PublicKey;
  payer: PublicKey;
  pool: PublicKey;
  commitments: PublicKey;
  amount: number;
  commitment: Uint8Array;
}): TransactionInstruction {
  const discriminant = new Uint8Array([0x00]);
  const amountBytes = new Uint8Array(8);
  new DataView(amountBytes.buffer).setBigUint64(0, BigInt(params.amount), true);
  const data = new Uint8Array(
    1 + amountBytes.length + params.commitment.length
  );
  data.set(discriminant, 0);
  data.set(amountBytes, 1);
  data.set(params.commitment, 1 + amountBytes.length);
  return new TransactionInstruction({
    programId: params.programId,
    keys: [
      { pubkey: params.payer, isSigner: true, isWritable: true },
      { pubkey: params.pool, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: params.commitments, isSigner: false, isWritable: true },
    ],
    data: Buffer.from(data),
  });
}

function parseSolToLamports(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{0,9})?$/.test(trimmed)) return null;
  const [wholePart, fractionalPart = ""] = trimmed.split(".");
  const whole = Number(wholePart);
  if (!Number.isFinite(whole)) return null;
  const paddedFraction = (fractionalPart + "000000000").slice(0, 9);
  const fraction = Number(paddedFraction);
  if (!Number.isFinite(fraction)) return null;
  return whole * LAMPORTS_PER_SOL + fraction;
}

function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

function blake3HashMany(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return blake3(combined);
}

async function performWithdraw(
  note: CloakNote,
  leafIndex: number,
  outputsForWithdraw: Array<{ address: string; amountLamports: number }>,
  connection: Connection,
  generateProof: (inputs: any) => Promise<any>
) {
  const fee = calculateFee(note.amount);
  const totalOutputs = outputsForWithdraw.reduce(
    (sum, o) => sum + o.amountLamports,
    0
  );
  const totalWithFee = totalOutputs + fee;
  if (Math.abs(totalWithFee - note.amount) > 1)
    throw new Error("Amount conservation failed");

  const skSpend = Buffer.from(note.sk_spend, "hex");
  const leafIndexBytes = new Uint8Array(4);
  new DataView(leafIndexBytes.buffer).setUint32(0, leafIndex, true);
  const nullifierBytes = blake3HashMany([skSpend, leafIndexBytes]);
  const nullifierHex = Buffer.from(nullifierBytes).toString("hex");

  const hashChunks: Uint8Array[] = [];
  const preparedOutputs = outputsForWithdraw.map((entry) => {
    const pubkey = new PublicKey(entry.address);
    const pubkeyBytes = pubkey.toBytes();
    const amountBytes = new Uint8Array(8);
    new DataView(amountBytes.buffer).setBigUint64(
      0,
      BigInt(entry.amountLamports),
      true
    );
    hashChunks.push(pubkeyBytes);
    hashChunks.push(amountBytes);
    return {
      pubkey,
      amountLamports: entry.amountLamports,
      hex: Buffer.from(pubkeyBytes).toString("hex"),
    };
  });
  const outputsHashBytes = blake3HashMany(hashChunks);
  const outputsHashHex = Buffer.from(outputsHashBytes).toString("hex");

  const proofInputs = {
    privateInputs: {
      amount: note.amount,
      r: note.r,
      sk_spend: note.sk_spend,
      leaf_index: leafIndex,
      merkle_path: {
        path_elements: note.merkleProof!.pathElements,
        path_indices: note.merkleProof!.pathIndices,
      },
    },
    publicInputs: {
      root: note.root!,
      nf: nullifierHex,
      outputs_hash: outputsHashHex,
      amount: note.amount,
    },
    outputs: preparedOutputs.map((e) => ({
      address: e.hex,
      amount: e.amountLamports,
    })),
  } as any;
  const proofResult = await generateProof(proofInputs);
  if (
    !proofResult?.success ||
    !proofResult?.proof ||
    !proofResult?.publicInputs
  )
    throw new Error("Proof generation failed");

  const withdrawSig = await submitWithdrawViaRelay({
    proof: proofResult.proof,
    publicInputs: {
      root: note.root!,
      nf: nullifierHex,
      outputs_hash: outputsHashHex,
      amount: note.amount,
    },
    outputs: outputsForWithdraw.map((e) => ({
      recipient: e.address,
      amount: e.amountLamports,
    })),
    feeBps: Math.ceil((fee * 10_000) / note.amount),
  });
  return withdrawSig;
}

async function submitWithdrawViaRelay(params: {
  proof: string;
  publicInputs: {
    root: string;
    nf: string;
    outputs_hash: string;
    amount: number;
  };
  outputs: Array<{ recipient: string; amount: number }>;
  feeBps: number;
}) {
  const proofBytes = hexToBytes(params.proof);
  const proofBase64 = Buffer.from(proofBytes).toString("base64");
  const response = await fetch(`${RELAY_URL}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      outputs: params.outputs,
      policy: { fee_bps: params.feeBps },
      public_inputs: {
        root: params.publicInputs.root,
        nf: params.publicInputs.nf,
        amount: params.publicInputs.amount,
        fee_bps: params.feeBps,
        outputs_hash: params.publicInputs.outputs_hash,
      },
      proof_bytes: proofBase64,
    }),
  });
  if (!response.ok) throw new Error(await response.text());
  const json = await response.json();
  const requestId: string | undefined = json.data?.request_id;
  if (!requestId) throw new Error("Relay response missing request_id");
  for (let attempts = 0; attempts < 120; attempts++) {
    await sleep(5000);
    const statusResp = await fetch(`${RELAY_URL}/status/${requestId}`);
    if (!statusResp.ok) continue;
    const statusJson = await statusResp.json();
    const status: string | undefined = statusJson.data?.status;
    if (status === "completed") {
      const txId: string | undefined = statusJson.data?.tx_id;
      if (!txId) throw new Error("Relay completed without tx_id");
      return txId;
    }
    if (status === "failed")
      throw new Error(statusJson.data?.error || "Relay job failed");
  }
  throw new Error("Relay withdraw timed out");
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error("Hex must have even length");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2)
    out[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  return out;
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0f" },
  header: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  disconnect: { color: "#9aa0a6" },
  card: {
    flex: 1,
    margin: 16,
    padding: 16,
    backgroundColor: "#121218",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#23232b",
  },
  label: { color: "#c9c9d1", fontSize: 12, fontWeight: "700", marginBottom: 6 },
  help: { color: "#9aa0a6", fontSize: 12, marginTop: 6 },
  bold: { color: "#fff", fontWeight: "700" },
  input: {
    backgroundColor: "#0b0b0f",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#23232b",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  link: { color: "#7c3aed", fontWeight: "700" },
  recipient: {
    backgroundColor: "#0b0b0f",
    borderWidth: 1,
    borderColor: "#23232b",
    borderRadius: 12,
    padding: 12,
  },
  recipientTitle: { color: "#9aa0a6", fontSize: 12, marginBottom: 6 },
  remove: { color: "#ef4444", fontWeight: "600" },
  primaryBtn: {
    backgroundColor: "#7c3aed",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
