#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API_URL = "https://agents.devnads.com/v1/verify";
const CONTRACT_NAME = "src/UniskyPassRegistry.sol:UniskyPassRegistry";
const COMPILER_VERSION = "v0.8.28+commit.7893614a";
const SOURCIFY_URL = "https://sourcify-api-monad.blockvision.org/";
const SUPPORTED_CHAIN_IDS = new Set([143, 10143]);
const RPC_URLS = new Map([
  [143, "https://rpc.monad.xyz"],
  [10143, "https://testnet-rpc.monad.xyz"],
]);

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const contractsRoot = join(repositoryRoot, "contracts");
const artifactPath = join(
  contractsRoot,
  "out",
  "UniskyPassRegistry.sol",
  "UniskyPassRegistry.json",
);

function printUsage() {
  console.error(
    "Usage: node scripts/verify-contract.mjs --address 0x... --chain-id <10143|143>",
  );
}

function parseArguments(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--address" || argument === "--chain-id") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${argument}`);
      }
      options[argument.slice(2)] = value;
      index += 1;
      continue;
    }

    if (argument.startsWith("--address=")) {
      options.address = argument.slice("--address=".length);
      continue;
    }

    if (argument.startsWith("--chain-id=")) {
      options["chain-id"] = argument.slice("--chain-id=".length);
      continue;
    }

    if (argument === "--help" || argument === "-h") {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  const chainId = Number(options["chain-id"]);
  if (!/^0x[0-9a-fA-F]{40}$/.test(options.address ?? "")) {
    throw new Error("--address must be a 20-byte 0x-prefixed contract address");
  }
  if (!Number.isInteger(chainId) || !SUPPORTED_CHAIN_IDS.has(chainId)) {
    throw new Error("--chain-id must be 10143 (testnet) or 143 (mainnet)");
  }

  return { address: options.address, chainId };
}

function runForge(arguments_, label) {
  const executable = process.platform === "win32" ? "forge.exe" : "forge";
  const result = spawnSync(executable, arguments_, {
    cwd: contractsRoot,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    shell: false,
  });

  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new Error(
        "Foundry is not installed or forge is not on PATH. Install Foundry, then rerun this helper.",
      );
    }
    throw result.error;
  }

  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || "Unknown forge error").trim();
    throw new Error(`${label} failed:\n${details}`);
  }

  return result.stdout.trim();
}

function parseStandardJson(rawOutput) {
  try {
    return JSON.parse(rawOutput);
  } catch {
    const firstBrace = rawOutput.indexOf("{");
    const lastBrace = rawOutput.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(rawOutput.slice(firstBrace, lastBrace + 1));
      } catch {
        // Fall through to the actionable error below.
      }
    }
  }

  throw new Error(
    "forge returned an invalid standard JSON input. Run `forge build` in contracts/ and retry.",
  );
}

function readFoundryMetadata() {
  let artifact;
  try {
    artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read Foundry artifact at ${artifactPath}: ${error.message}`);
  }

  if (artifact.metadata === undefined) {
    throw new Error(`Foundry artifact at ${artifactPath} does not contain metadata`);
  }

  const parsedMetadata =
    typeof artifact.metadata === "string"
      ? JSON.parse(artifact.metadata)
      : artifact.metadata;
  const compiledVersion = parsedMetadata?.compiler?.version;
  if (compiledVersion && `v${compiledVersion}` !== COMPILER_VERSION) {
    throw new Error(
      `Artifact compiler v${compiledVersion} does not match required ${COMPILER_VERSION}`,
    );
  }

  return artifact.metadata;
}

function printFallback(address, chainId) {
  console.error("\nVerification API failed. Fallback only:");
  console.error(
    `cd contracts && forge verify-contract ${address} ${CONTRACT_NAME} --chain ${chainId} --verifier sourcify --verifier-url "${SOURCIFY_URL}"`,
  );
}

async function assertContractCode(address, chainId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(RPC_URLS.get(chainId), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getCode",
        params: [address, "latest"],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Monad RPC returned HTTP ${response.status}`);
    }

    const body = await response.json();
    if (body.error) {
      throw new Error(`Monad RPC error: ${JSON.stringify(body.error)}`);
    }
    if (typeof body.result !== "string" || /^0x0*$/.test(body.result)) {
      throw new Error(
        `No contract bytecode found at ${address} on chain ${chainId}; check the address and network`,
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function submitVerification(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const responseText = await response.text();
    let responseBody = responseText;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      // Keep non-JSON API responses readable for diagnostics.
    }

    if (!response.ok) {
      const details =
        typeof responseBody === "string"
          ? responseBody
          : JSON.stringify(responseBody, null, 2);
      throw new Error(`Monad verification API returned HTTP ${response.status}: ${details}`);
    }

    return responseBody;
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  let address;
  let chainId;
  let verificationApiAttempted = false;

  try {
    ({ address, chainId } = parseArguments(process.argv.slice(2)));

    console.log("Building Foundry artifacts...");
    runForge(["build"], "forge build");

    console.log(`Checking deployed bytecode on chain ${chainId}...`);
    await assertContractCode(address, chainId);

    console.log("Generating standard JSON compiler input...");
    const standardJsonInput = parseStandardJson(
      runForge(
        [
          "verify-contract",
          address,
          CONTRACT_NAME,
          "--chain",
          String(chainId),
          "--show-standard-json-input",
        ],
        "forge verify-contract --show-standard-json-input",
      ),
    );

    const payload = {
      chainId,
      contractAddress: address,
      contractName: CONTRACT_NAME,
      compilerVersion: COMPILER_VERSION,
      standardJsonInput,
      foundryMetadata: readFoundryMetadata(),
    };

    console.log(`Submitting ${address} on chain ${chainId} to Monad verification API...`);
    verificationApiAttempted = true;
    const result = await submitVerification(payload);
    console.log("Verification request accepted:");
    console.log(
      typeof result === "string" ? result : JSON.stringify(result, null, 2),
    );
  } catch (error) {
    console.error(`Verification failed: ${error.message}`);
    if (verificationApiAttempted) {
      printFallback(address, chainId);
    } else if (!address || !chainId) {
      printUsage();
    }
    process.exitCode = 1;
  }
}

await main();
