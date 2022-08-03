import {
  toBase64,
  toAscii,
  fromAscii,
  toUtf8,
  fromUtf8,
  fromHex,
  toHex,
} from "@cosmjs/encoding/build/index.js";
import { cosmos, osmosis, ibc } from "osmojs";
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

function decodeMsgs(data) {
  try {
    const decoding = data.map((item) => {
      const findDecoder = get(osmojs, item.typeUrl.slice(1));
      // console.log("findDecoder", item.typeUrl.slice(1), findDecoder);
      if (typeof findDecoder === "object") {
        item.value = findDecoder.decode(item.value);
      }
      return item;
    });
    if (Object.prototype.toString.call(decoding).includes("Uint8Array")) {
      return decoding;
    } else {
      return parsingJSONuint8ToHex(decoding);
    }
  } catch (error) {
    return parsingJSONuint8ToHex(data);
  }
  // return data.map((item) => {
  //   switch (item.typeUrl) {
  //     case "/osmosis.gamm.v1beta1.MsgSwapExactAmountIn":
  //       item.value = osmosis.gamm.v1beta1.MsgSwapExactAmountIn.decode(
  //         item.value
  //       );
  //       break;
  //     case "/osmosis.gamm.v1beta1.MsgSwapExactAmountOut":
  //       item.value = osmosis.gamm.v1beta1.MsgSwapExactAmountOut.decode(
  //         item.value
  //       );
  //       break;
  //     case "/ibc.core.client.v1.MsgUpdateClient":
  //       item.value = ibc.core.client.v1.MsgUpdateClient.decode(item.value);
  //       break;
  //     case "/ibc.core.channel.v1.MsgRecvPacket":
  //       item.value = ibc.core.channel.v1.MsgRecvPacket.decode(item.value);
  //       break;
  //     case "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward":
  //       item.value =
  //         cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward.decode(
  //           item.value
  //         );
  //       break;
  //   }
  //   return item;
  // });
}

const get = (t, path) => path.split(".").reduce((r, k) => r?.[k], t);

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
            } else if (key === "messages") {
              item[1] = decodeMsgs(value);
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
