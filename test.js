import { getRandomValues } from "./utils/crypto";
import scrypt from "scrypt-js";
import { sha256 as _sha256 } from "sha.js";
import AES, { Counter } from "aes-js";
const bech32 = require("bech32-buffer");
const data = "osmo1g8xqpk0evzykreayg04wsjck8gex0a2dl0ag4y";
const Buffer = require("buffer/").Buffer;
// const testAddress = "osmo1g8xqpk0evzykreayg04wsjck8gex0a2dl0ag4y";
const decode = bech32.decode(data);
// console.log("decode_osmo", decode);
// console.log("encode_cosmos", bech32.encode("cosmos", decode.data));

async function encrypt(text, password) {
  let random = new Uint8Array(32);

  getRandomValues(random);

  const salt = Buffer.from(random).toString("hex");

  const scryptParams = {
    salt,
    dklen: 32,
    n: 131072,
    r: 8,
    p: 1,
  };
  const derivedKey = await scrpyt(password, scryptParams);

  const buf = Buffer.from(text);

  random = new Uint8Array(16);
  getRandomValues(random);
  const iv = Buffer.from(random);

  const counter = new Counter(0);
  counter.setBytes(iv);

  const aesCtr = new AES.ModeOfOperation.ctr(derivedKey, counter);
  const ciphertext = Buffer.from(aesCtr.encrypt(buf));
  // Mac is sha256(last 16 bytes of derived key + ciphertext)
  const mac = sha256(
    Buffer.concat([derivedKey.slice(derivedKey.length / 2), ciphertext])
  );

  return {
    version: "1",
    crypto: {
      cipher: "aes-128-ctr",
      cipherparams: {
        iv: iv.toString("hex"),
      },
      ciphertext: ciphertext.toString("hex"),
      kdf: "scrypt",
      kdfparams: scryptParams,
      mac: mac.toString("hex"),
    },
  };
}

async function scrpyt(text, params) {
  return new Promise(async (resolve, reject) => {
    const buf = Buffer.from(text);
    const getValue = await scrypt.scrypt(
      buf,
      Buffer.from(params.salt, "hex"),
      params.n,
      params.r,
      params.p,
      params.dklen
    );
    resolve(getValue);
  });
}

function sha256(buf) {
  return Buffer.from(new _sha256().update(buf).digest("hex"), "hex");
}

function createPrivateMnemonicKey() {
  const bip39 = require("bip39");
  const mnemonic = bip39.generateMnemonic();

  return mnemonic;
}

async function testAccountCheck() {
  const check = await encrypt(
    "satisfy adjust timber high purchase tuition stool faith fine install that you unaware feed domain license impose boss human eager hat rent enjoy dawn",
    "abcd19283!23"
  );
  //   console.log("check", check);
}

testAccountCheck();
