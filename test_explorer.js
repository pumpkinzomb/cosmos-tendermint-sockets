// test about get an address from pubkey
import { osmosis, cosmos, getSigningOsmosisClient } from "osmojs";
import CryptoJS from "crypto-js";
import express from "express";
import {
  toBase64,
  toAscii,
  fromAscii,
  toUtf8,
  fromUtf8,
  fromHex,
  toHex,
} from "@cosmjs/encoding/build/index.js";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import {
  StargateClient,
  createPagination,
  QueryClient,
  createProtobufRpcClient,
} from "@cosmjs/stargate";
import { parsingJSONuint8ToHex } from "./utils/convert";
const bech32 = require("bech32-buffer");
const OSMOS_RPC = "https://osmosis-mainnet-archive.allthatnode.com:26657/";

const extractAddressFromPubkey = async (pubKey) => {
  let address = CryptoJS.SHA256(
    CryptoJS.lib.WordArray.create(fromHex(pubKey))
  ).toString();
  address = CryptoJS.RIPEMD160(CryptoJS.enc.Hex.parse(address)).toString();
  address = new Uint8Array(Buffer.from(address, "hex"));
  const expectedSigner = bech32.encode("osmo", address);
  console.log("account", expectedSigner);
  return expectedSigner;
};

const parsingTxMessageData = (msgs) => {
  return msgs.map((item) => {
    const splitTypeUrl = item.typeUrl.slice(1).split(".");
    const Module = `${splitTypeUrl[0]} ${splitTypeUrl[1]}`;
    const Type = splitTypeUrl[splitTypeUrl.length - 1];
    return {
      Module,
      Type,
      Attributes: Object.entries(item.value).map((item) => {
        return [item[0], item[1]];
      }),
    };
  });
};

export const serverInit = async () => {
  const app = express();
  const port = 9000;
  const tmClient = await Tendermint34Client.connect(OSMOS_RPC);
  const queryClient = new QueryClient(tmClient);
  const rpc = createProtobufRpcClient(queryClient);
  const txQueryClientImpl = cosmos.tx.v1beta1.ServiceClientImpl;
  const txQueryClient = new txQueryClientImpl(rpc);

  app.get("/", (req, res) => {
    res.send(`
    <style>
      table, th, td {
        border:1px solid black;
        border-collapse: collapse;
        padding: 0.5rem;
      }
    </style>
    <h1>Similar API Test Server with RPCNODE</h1>
    <h2>API Detail</h1>
    <table >
      <tr>
        <th>APIS</th>
        <th>Method</th>
        <th>detail</th>
      </tr>
      <tr>
        <td>/tx/:txhash</td>
        <td>GET</td>
        <td>decoding original lcd raw data</td>
      </tr>
      <tr>
        <td>/sonar_tx/:txhash</td>
        <td>GET</td>
        <td>similar response sonar-api</td>
      </tr>
    </table>`);
  });

  app.get("/tx/:hash", async (req, res) => {
    const hash = req.params.hash;
    // const responseTx = await tmClient.tx({
    //   hash: fromHex(hash),
    // });
    const responseTx = await txQueryClient.getTx({
      hash,
    });
    const decoded = parsingJSONuint8ToHex(responseTx);
    res.json(decoded);
  });

  app.get("/sonar_tx/:hash", async (req, res) => {
    const hash = req.params.hash;
    try {
      const responseTx = await txQueryClient.getTx({
        hash,
      });
      const decoded = parsingJSONuint8ToHex(responseTx);
      const responseData = {
        TxHash: decoded?.txResponse?.txhash || null,
        Success: decoded?.txResponse?.code === 0 || null,
        ErrorStr:
          decoded?.txResponse?.code !== 0 ? decoded?.txResponse?.rawLog : "",
        Height: decoded?.txResponse?.height?.low || null,
        Timestamp: decoded?.txResponse?.timestamp || null,
        Sender:
          (await extractAddressFromPubkey(
            decoded?.tx?.authInfo?.signerInfos[0]?.publicKey?.value?.key
          )) || null,
        MessageCount: decoded?.tx?.body?.messages?.length || null,
        UsedGas: decoded?.txResponse?.gasUsed?.low || null,
        WantedGas: decoded?.txResponse?.gasWanted?.low || null,
        Fee: decoded?.tx?.authInfo?.fee?.amount || null,
        Memo: decoded?.tx?.body?.memo || null,
        Messages: parsingTxMessageData(decoded?.tx?.body?.messages) || null,
      };
      // console.log("response", responseData);
      res.status(200).json(responseData);
    } catch (error) {
      // console.log("error", error);
      res.status(500).json({
        error: true,
        message: error?.message || "something broken.",
      });
    }
  });

  app.listen(port, () => {
    console.log(`server on port: ${port}`);
  });
};

serverInit();

// checkFunction(
//   "03f845cd3c9a72b0c7cb09fa7e0052f52a37a51cb094db33a8cd21485e82ef5e00"
// );
