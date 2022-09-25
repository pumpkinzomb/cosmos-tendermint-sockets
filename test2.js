import {
  AminoSignResponse,
  BroadcastMode,
  makeCosmoshubPath,
  OfflineSigner,
  Secp256k1HdWallet,
  StdSignature,
  StdSignDoc,
} from "@cosmjs/launchpad";
import { getRandomValues } from "./utils/crypto";

const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const { BIP32Factory } = require("bip32");
// You must wrap a tiny-secp256k1 compatible implementation
const bip32 = BIP32Factory(ecc);

export async function getAddressId(mnemonic) {
  const cosmJsKeys = await (
    await Secp256k1HdWallet.fromMnemonic(
      mnemonic,
      makeCosmoshubPath(0),
      "cosmos"
    )
  ).getAccounts();

  //   console.log("cosmJsKeys", cosmJsKeys);
  return cosmJsKeys;
}

export async function generateWalletFromMnemonic(
  mnemonic,
  path = `m/44'/118'/0'/0/0`,
  password = ""
) {
  const seed = bip39.mnemonicToSeedSync(mnemonic, password);
  const masterSeed = bip32.fromSeed(seed);
  const hd = masterSeed.derivePath(path);

  const privateKey = hd.privateKey;
  if (!privateKey) {
    throw new Error("null hd key");
  }
  //   console.log("privateKey", Buffer.from(privateKey).toString("hex"));
  return privateKey;
}

async function generateSeed(rng, strength = 128) {
  if (strength % 32 !== 0) {
    throw new TypeError("invalid entropy");
  }
  let bytes = new Uint8Array(strength / 8);
  bytes = await rng(bytes);
  return bip39.entropyToMnemonic(Buffer.from(bytes).toString("hex"));
}

export async function generate_mnemonic() {
  const rng = (array) => {
    return Promise.resolve(getRandomValues(array));
  };
  //   const generate_mnemonic = await generateSeed(rng, 256); // 24WORDS
  const generate_mnemonic = await generateSeed(rng, 128); // 12WORDS
  //   console.log("generate_mnemonic", generate_mnemonic);
  return generate_mnemonic;
}
