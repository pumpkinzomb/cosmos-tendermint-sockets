import { Secp256k1, Keccak256 } from "@cosmjs/crypto";
import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { toHex, toAscii } from "@cosmjs/encoding";
const bech32 = require("bech32-buffer");

const generatekey = async () => {
  const wallet = await Secp256k1HdWallet.generate();
  console.log("Mnemonic:", wallet.mnemonic);
  const address = await wallet.getAccounts();
  console.log("Address:", address);
};

// Mnemonic: struggle exotic cousin tower goddess near indoor rescue change pizza then gentle
// Address: [
//   {
//     algo: 'secp256k1',
// pubkey: Uint8Array(33) [
//     3,  93, 152, 134,  36, 202, 153, 193,
//   248, 239, 190,  46,  87, 171, 129, 104,
//   245, 227,  98,  77,  98, 117,  92,  47,
//    27,  60, 200,   0, 118, 142,  62, 164,
//   230
// ],
//     address: 'cosmos1ylvptvxx0fp0f2e08nl4p93yhr2r2qk4llgtd5'
//   }
// ]
const pubkeyBuffer = new Uint8Array([
  3, 93, 152, 134, 36, 202, 153, 193, 248, 239, 190, 46, 87, 171, 129, 104, 245,
  227, 98, 77, 98, 117, 92, 47, 27, 60, 200, 0, 118, 142, 62, 164, 230,
]);

// https://github.com/cosmos/cosmjs/issues/1044
// 1. Uncompress the secp256k1 pubkey
// 2. Create a Keccak256 hash of the 64 bytes after the leaxing 0x04 byte and cut the last 20 bytes (as done here)
// 3. Hex encode the 20 byte result of 2. and prefix with 0x
// 4. (optional) Implement the upper/lower case checksum from EIP-55

export const generateEthAddressFromPubkey = (pubkey) => {
  const step1 = new Keccak256(pubkeyBuffer.slice(1)).digest();
  const step2 = step1.slice(-20);
  const step3 = "0x" + toHex(step2);
  const step4 = toChecksummedAddress(step3);
  return step4;
};

console.log("eth address:", generateEthAddressFromPubkey(pubkeyBuffer));

export function toChecksummedAddress(address) {
  // 40 low hex characters
  let addressLower = "";

  if (typeof address === "string") {
    if (!isValidEthAddress(address)) {
      throw new Error("Input is not a valid Ethereum address");
    }
    addressLower = address.toLowerCase().replace("0x", "");
  } else {
    if (address.length !== 20) {
      throw new Error("Invalid Ethereum address length. Must be 20 bytes.");
    }
    addressLower = toHex(address);
  }

  const addressHash = toHex(new Keccak256(toAscii(addressLower)).digest());
  let checksumAddress = "0x";
  for (let i = 0; i < 40; i++) {
    checksumAddress +=
      parseInt(addressHash[i], 16) > 7
        ? addressLower[i].toUpperCase()
        : addressLower[i];
  }
  return checksumAddress;
}

export function isValidEthAddress(address) {
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return false;
  }

  const isChecksummed = !address.match(/^0x[a-f0-9]{40}$/);
  if (isChecksummed) {
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-55.md
    const addressLower = address.toLowerCase().replace("0x", "");
    const addressHash = toHex(new Keccak256(toAscii(addressLower)).digest());
    for (let i = 0; i < 40; i++) {
      if (
        (parseInt(addressHash[i], 16) > 7 &&
          addressLower[i].toUpperCase() !== address[i + 2]) ||
        (parseInt(addressHash[i], 16) <= 7 &&
          addressLower[i] !== address[i + 2])
      ) {
        return false;
      }
    }
    return true;
  } else {
    return true;
  }
}
