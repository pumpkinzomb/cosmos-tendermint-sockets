import {
  toBase64,
  toAscii,
  fromAscii,
  toUtf8,
  fromUtf8,
  fromHex,
  toHex,
} from "@cosmjs/encoding/build/index.js";
import { cosmos, osmosis, ibc, cosmwasm } from "osmojs";
import * as osmojs from "osmojs";

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

function parsingInMsgs(data) {
  if (typeof data === "object" && data !== null) {
    if (
      Object.keys(data).indexOf("typeUrl") > -1 &&
      Object.keys(data).indexOf("value") > -1
    ) {
      return decodeMsgs(data);
    } else {
      return Object.fromEntries(
        Object.entries(data).map((item, index) => {
          let [key, value] = item;
          if (typeof value === "object") {
            if (Object.prototype.toString.call(value).includes("Uint8Array")) {
              item[1] = decodingBinary(value);
            } else {
              item[1] = parsingInMsgs(value);
            }
          }
          return item;
        })
      );
    }
  } else {
    return data;
  }
}

function decodeMsgs(data) {
  try {
    if (Array.isArray(data)) {
      const decoding = data.map((item) => {
        if (item.typeUrl.slice(1).includes("cosmwasm")) {
          const findDecoder = get(osmojs, item.typeUrl.slice(1));
          if (typeof findDecoder === "object") {
            item.value = findDecoder.decode(item.value);
          }
          return item;
        } else {
          const findDecoder = get(osmojs, item.typeUrl.slice(1));
          if (typeof findDecoder === "object") {
            item.value = findDecoder.decode(item.value);
          }
          return item;
        }
      });
      return parsingJSONuint8ToHex(decoding);
    } else {
      return parsingInMsgs(decoding);
    }
  } catch (error) {
    console.log("decodeMsgs error: ", error);
    return parsingJSONuint8ToHex(data);
  }
}

function decodeMsg(data) {
  try {
    if (data.typeUrl.slice(1).includes("cosmwasm")) {
      const findDecoder = get(
        osmojs,
        data.typeUrl.slice(1).replace("cosmwasm.wasm.v1", "cosmwasm.wasm.v1.tx")
      );
      // console.log("findDecoder", item.typeUrl.slice(1), findDecoder);
      if (typeof findDecoder === "object") {
        data.value = findDecoder.decode(data.value);
      }
    } else {
      const findDecoder = get(osmojs, data.typeUrl.slice(1));
      // console.log("findDecoder", item.typeUrl.slice(1), findDecoder);
      if (typeof findDecoder === "object") {
        data.value = findDecoder.decode(data.value);
      }
    }

    if (Object.prototype.toString.call(data).includes("Uint8Array")) {
      return data;
    } else {
      return parsingInMsgs(data);
    }
  } catch (error) {
    console.log("decodeMsg error: ", error);
    return parsingJSONuint8ToHex(data);
  }
}

const get = (t, path) => path.split(".").reduce((r, k) => r?.[k], t);

function decodingAccountData(data, typeUrl) {
  const findDecoder = get(osmojs, typeUrl.slice(1));
  const decodedAccount = findDecoder.decode(data);
  return decodedAccount;
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
  let typeUrl;
  const parsedData = Object.fromEntries(
    Object.entries(data).map((item) => {
      let [key, value] = item;
      if (key === "typeUrl") {
        typeUrl = value;
      }
      if (key === "value") {
        item[1] = decodingAccountData(value, typeUrl);
      }
      return item;
    })
  );
  return parsedData;
}

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

const decodingTendermint = (data, typeUrl) => {
  const findDecoder = get(osmojs, typeUrl.slice(1));
  const decodedAccount = findDecoder.decode(data);
  return parsingJSONuint8ToHex(decodedAccount);
};

export const parsingJSONuint8ToHex = (data) => {
  if (typeof data === "object" && data !== null) {
    if (typeof data === "object" && !Array.isArray(data)) {
      return Object.fromEntries(
        Object.entries(data).map((item) => {
          let [key, value] = item;
          if (typeof value === "object" && value?.typeUrl && value?.value) {
            // console.log("check 1: ", key);
            item[1].value = decodingTendermint(value.value, value.typeUrl);
          } else if (typeof value === "object") {
            if (Object.prototype.toString.call(value).includes("Uint8Array")) {
              // console.log("Gotcha!!!", key, value);
              if (key === "tx") {
                item[1] = txData(value);
              } else {
                item[1] = decodingBinary(value);
              }
            } else if (
              Object.prototype.toString.call(value) !== "[object Date]"
            ) {
              // console.log("check 2: ", key);
              if (key === "txs") {
                item[1] = txsData(value);
              } else if (key === "tx") {
                item[1] = txData(value);
              } else if (key === "account") {
                item[1] = accountData(value);
              } else if (key === "messages") {
                item[1] = decodeMsgs(value);
              } else if (key === "header") {
                console.log("check", key, value);
                if (typeof value === "object" && value?.typeUrl) {
                  item[1] = decodeMsg(value);
                } else {
                  item[1] = parsingJSONuint8ToHex(value);
                }
              } else {
                item[1] = parsingJSONuint8ToHex(value);
              }
            }
          }
          //   console.log("item", item);
          return item;
        })
      );
    } else if (typeof data === "object" && Array.isArray(data)) {
      return data.map((item) => {
        if (Object.prototype.toString.call(item).includes("Uint8Array")) {
          return decodingBinary(item);
        }
        return parsingJSONuint8ToHex(item);
      });
    }
  } else {
    return data;
  }
};
