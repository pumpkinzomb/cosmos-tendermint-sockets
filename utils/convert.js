import {
  toBase64,
  toAscii,
  fromAscii,
  toUtf8,
  fromUtf8,
  fromHex,
  toHex,
} from "@cosmjs/encoding/build/index.js";
import { cosmos } from "osmojs";

export const fromHexString = fromHex;
export const toHexString = toHex;

function txData(data) {
  if (Object.prototype.toString.call(data).includes("Uint8Array")) {
    const decodeTx = cosmos.tx.v1beta1.Tx.decode(data);
    return parsingJSONuint8ToHex(decodeTx);
  } else {
    return Object.fromEntries(
      Object.entries(data).map((item) => {
        let [key, value] = item;
        if (key === "value") {
          item[1] = txData(value);
        } else {
          item[1] = parsingJSONuint8ToHex(value);
        }
        return item;
      })
    );
  }
}

function txRawData(data) {
  const decodeTx = cosmos.tx.v1beta1.TxRaw.decode(data);
  return parsingJSONuint8ToHex(decodeTx);
}

function decodeTxBody(data) {
  return cosmos.tx.v1beta1.TxBody.decode(data);
}

function decodingData(data) {
  let hex = "";
  let answer = "";
  for (const byte of data) {
    if (byte < 0x20 || byte > 0x7e) {
      answer += "[" + ("0" + byte.toString(16)).slice(-2) + "]"; // to Hex
    } else {
      answer += String.fromCharCode(byte); // convert ascii
    }
    hex += ("0" + byte.toString(16)).slice(-2);
  }
  return {
    hex,
    base64: toBase64(data),
    decodingValue: answer,
  };
}

function txsData(data) {
  return Object.fromEntries(
    Object.entries(data).map((item) => {
      let [key, value] = item;
      item[1] = txData(value);
      return item;
    })
  );
}

function accountData(data) {
  return Object.fromEntries(
    Object.entries(data).map((item) => {
      let [key, value] = item;
      if (key === "value") {
        item[1] = decodingData(value);
      }
      return item;
    })
  );
}

// export const buf2hex = (buffer) => {
//   // buffer is an ArrayBuffer
//   // ex) console.log("blockId-1", buf2hex(blocks.blockId.hash.buffer));
//   return [...new Uint8Array(buffer)]
//     .map((x) => x.toString(16).padStart(2, "0"))
//     .join("");
// };

// export const fromHexString = (hexString) =>
//   Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

// export const toHexString = (bytes) =>
//   bytes
//     .reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "")
//     .toUpperCase();

// export const _toAscii = (bytes) => {
//   return bytes.reduce((str, byte) => str + String.fromCharCode(byte), "");
// };

const decodingBinary = (data) => {
  let done = 0;
  let answer;
  while (done !== 10) {
    try {
      if (done === 0) {
        answer = fromUtf8(data);
      } else if (done === 1) {
        answer = fromAscii(data);
      } else {
        answer = toHex(data);
      }
      done = 10;
    } catch (error) {
      done++;
    }
  }
  return answer;
};

export const parsingJSONuint8ToHex = (data) => {
  if (typeof data === "object" && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map((item) => {
        let [key, value] = item;
        if (typeof value === "object") {
          if (Object.prototype.toString.call(value).includes("Uint8Array")) {
            // console.log("Gotcha!!!", key, value);
            // if (key === "key" || key === "value") {
            //   try {
            //     item[1] = fromAscii(value);
            //   } catch (error) {
            //     item[1] = toHex(value);
            //   }
            // } else if (key === "data") {
            //   try {
            //     item[1] = fromUtf8(value);
            //   } catch (error) {
            //     item[1] = toHex(value);
            //   }
            // } else if (key === "tx") {
            //   item[1] = toBase64(value);
            // } else {
            //   item[1] = toHex(value);
            // }
            if (key === "tx") {
              item[1] = txData(value);
            } else {
              item[1] = decodingBinary(value);
            }
          } else if (
            Object.prototype.toString.call(value) !== "[object Date]"
          ) {
            if (key === "txs") {
              item[1] = txsData(value);
            } else if (key === "tx") {
              item[1] = txData(value);
            } else if (key === "account") {
              item[1] = accountData(value);
            } else {
              item[1] = parsingJSONuint8ToHex(value);
            }
          }
        }
        //   console.log("item", item);
        return item;
      })
    );
  } else {
    return data;
  }
};
