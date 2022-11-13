// test about get an address from pubkey
import { osmosis, cosmos, getSigningOsmosisClient } from "osmojs";
import moment from "moment/moment";
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
import Long from "long";
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

const extractAddressFromPubkey = (pubKey) => {
  let address = CryptoJS.SHA256(
    CryptoJS.lib.WordArray.create(fromHex(pubKey))
  ).toString();
  address = CryptoJS.RIPEMD160(CryptoJS.enc.Hex.parse(address)).toString();
  address = new Uint8Array(Buffer.from(address, "hex"));
  const expectedSigner = bech32.encode("osmo", address);
  // console.log("account", expectedSigner);
  return expectedSigner;
};

// let data = "osmovaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4ep88n0y4";
// let decode = bech32.decode(data);
// console.log("decode_address_valcons", decode);
// console.log("encode_valopers: ", bech32.encode("osmovalcons", decode.data));
// console.log(
//   "Expected value: ",
//   "osmovalcons1eddx8wg73a8w3kunt9pvhcjhy33kg70qqrwjct"
// );

// data = "osmovalcons1eddx8wg73a8w3kunt9pvhcjhy33kg70qqrwjct";
// decode = bech32.decode(data);
// console.log("decode_address_valcons", decode);
// let address = new Uint8Array(
//   Buffer.from(
//     "e8dcf4f58187cf05b18dccc6d0884ae08bf4a98d88717d0fff92a2b6f4574d47",
//     "hex"
//   )
// );
// console.log("pubkey :", address);

// SumTruncated returns the first 20 bytes of SHA256 of the bz.
const SumTruncated = (bz) => {
  let hash = CryptoJS.SHA256(
    CryptoJS.lib.WordArray.create(new Uint8Array(Buffer.from(bz, "hex")))
  )
    .toString()
    .slice(0, 40);
  return hash;
};

const extractValconsAddressFromPubkey = (pubKey) => {
  // ed25519 pubkey에서 osmovalcons address 계산
  let address = SumTruncated(pubKey);
  address = bech32.encode(
    "osmovalcons",
    new Uint8Array(Buffer.from(address, "hex"))
  );
  return address;
};

const test_val = (pubKey) => {
  // pubkey는 cosmos.crypto.ed25519.PubKey 형식이어야함
  let address = CryptoJS.SHA256(
    CryptoJS.lib.WordArray.create(fromHex(pubKey))
  ).toString();
  return address.slice(0, 40); // for 20byte
};

const validator1 = {
  pubKey: "02647063f76a3d20570d8fd83bf86e3e89222279ec5e6d21fb0338391c108af6", //ed25519
  moniker: "Larry Engineer",
};
let val1_consAddress = test_val(validator1.pubKey);
val1_consAddress = bech32.encode(
  "osmovalcons",
  new Uint8Array(Buffer.from(val1_consAddress, "hex"))
);

console.log(`Larry's validatorcons address -`);
console.log("val1_consAddress :", val1_consAddress);

// console.log(
//   "what?",
//   bech32.decode("osmovalcons1eddx8wg73a8w3kunt9pvhcjhy33kg70qqrwjct")
// );
// console.log(
//   "expect value :",
//   "osmovalcons1eddx8wg73a8w3kunt9pvhcjhy33kg70qqrwjct"
// );
// console.log(
//   "step 1:",
//   SumTruncated(
//     "e8dcf4f58187cf05b18dccc6d0884ae08bf4a98d88717d0fff92a2b6f4574d47"
//   )
// );
// console.log(
//   "step 2:",
//   new Uint8Array(Buffer.from("cb5a63b91e8f4ee8db935942cbe25724636479e0", "hex"))
// );
// console.log(
//   "step 3: ",
//   bech32.encode(
//     "osmovalcons",
//     new Uint8Array([
//       203, 90, 99, 185, 30, 143, 78, 232, 219, 147, 89, 66, 203, 226, 87, 36,
//       99, 100, 121, 224,
//     ])
//   )
// );
// console.log(
//   "equal ?:",
//   bech32.encode(
//     "osmovalcons",
//     new Uint8Array([
//       203, 90, 99, 185, 30, 143, 78, 232, 219, 147, 89, 66, 203, 226, 87, 36,
//       99, 100, 121, 224,
//     ])
//   ) === "osmovalcons1eddx8wg73a8w3kunt9pvhcjhy33kg70qqrwjct"
// );

const extractValAddressFromPubkey = (pubKey) => {
  // ed25519 way
  let address = CryptoJS.SHA256(
    CryptoJS.lib.WordArray.create(fromHex(pubKey))
  ).toString();
  return address.slice(0, 40);
  console.log("check original VAl: ", address);
  console.log("checkVAl slice 40: ", address.slice(0, 40).toUpperCase());
};

// extractValAddressFromPubkey();

const parsingTxMessageData = (msgs) => {
  return msgs.map((item) => {
    const splitTypeUrl = item.typeUrl.slice(1).split(".");
    const Module = `${splitTypeUrl[0]} ${splitTypeUrl[1]}`;
    const Type = splitTypeUrl[splitTypeUrl.length - 1];
    const returnValue = {
      Module,
      Type,
      Attributes: Object.entries(item.value).map((item) => {
        return [item[0], item[1]];
      }),
    };
    if (item?.TxHash !== undefined) {
      returnValue.TxHash = item?.TxHash;
    }
    if (item?.Success !== undefined) {
      returnValue.Success = item?.Success;
    }
    return returnValue;
  });
};

const mappingBlockTxsData = (data) => {
  if (data.length === 0) {
    return {
      TotalFee: [],
      TotalTxs: 0,
      TotalMsgs: 0,
      WantedGas: 0,
    };
  } else {
    let TotalFee = new Map();
    let TotalTxs = data.length;
    let TotalMsgs = 0;
    let WantedGas = 0;

    data.forEach((item, index) => {
      (item?.authInfo?.fee?.amount || []).forEach((item) => {
        if (item.denom && TotalFee.has(item?.denom)) {
          const amount = !isNaN(Number(item.amount))
            ? TotalFee.get(item.denom) + Number(item.amount)
            : 0;
          TotalFee.set(item.denom, amount);
        } else {
          const amount = !isNaN(Number(item.amount)) ? Number(item.amount) : 0;
          TotalFee.set(item.denom, amount);
        }
      });
      TotalMsgs += item?.body?.messages?.length || 0;
      WantedGas += item?.authInfo?.fee?.gasLimit?.low || 0;
    });
    return {
      TotalFee: Array.from(TotalFee),
      TotalTxs,
      TotalMsgs,
      WantedGas,
    };
  }
};

export const serverInit = async () => {
  const app = express();
  const port = 9000;
  const tmClient = await Tendermint34Client.connect(OSMOS_RPC);
  const queryClient = new QueryClient(tmClient);
  const rpc = createProtobufRpcClient(queryClient);
  const txQueryClientImpl = cosmos.tx.v1beta1.ServiceClientImpl;
  const txQueryClient = new txQueryClientImpl(rpc);
  const blockQueryClientImpl = cosmos.base.tendermint.v1beta1.ServiceClientImpl;
  const blockQueryClient = new blockQueryClientImpl(rpc);
  const stakingQueryClientImpl = cosmos.staking.v1beta1.QueryClientImpl;
  const stakingQueryClient = new stakingQueryClientImpl(rpc);
  const epochQueryClientImp1 = osmosis.epochs.v1beta1.QueryClientImpl;
  const epochQueryClient = new epochQueryClientImp1(rpc);
  const mintQueryClientImp1 = osmosis.mint.v1beta1.QueryClientImpl;
  const mintQueryClient = new mintQueryClientImp1(rpc);

  const getAllValidators = (nextKey) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await stakingQueryClient.validators({
          status: "",
          pagination: createPagination(nextKey ? fromHex(nextKey) : undefined),
        });
        let decoded = parsingJSONuint8ToHex(response);
        if (decoded?.pagination?.nextKey) {
          const moreVal = await getAllValidators(decoded?.pagination?.nextKey);
          resolve((decoded?.validators || []).concat(moreVal));
        } else {
          resolve(decoded?.validators || []);
        }
      } catch (error) {
        console.log("error", error.message);
        reject([]);
      }
    });
  };

  const allValidators = await getAllValidators();
  // console.log("check", allValidators);
  const findMoniker = async (proposerAddress) => {
    try {
      let moniker = null;
      for (let i = 0; i < allValidators.length; i++) {
        // console.log("check", validators[i]);
        if (allValidators[i]?.consensusPubkey?.value?.key) {
          if (
            extractValAddressFromPubkey(
              allValidators[i]?.consensusPubkey?.value?.key
            ) === proposerAddress
          ) {
            moniker = allValidators[i]?.description?.moniker;

            break;
          }
        } else {
          return null;
        }
      }
      return moniker;
    } catch (error) {
      console.log("error", error.message);
      return null;
    }
  };
  const findValidatorInfo = async (proposerAddress) => {
    try {
      let validator = null;
      for (let i = 0; i < allValidators.length; i++) {
        // console.log("check", validators[i]);
        if (allValidators[i]?.consensusPubkey?.value?.key) {
          if (
            extractValAddressFromPubkey(
              allValidators[i]?.consensusPubkey?.value?.key
            ) === proposerAddress
          ) {
            validator = allValidators[i];
            break;
          }
        } else {
          return null;
        }
      }
      return validator;
    } catch (error) {
      console.log("error", error.message);
      return null;
    }
  };

  const calcBlockRewards = async (timestamp) => {
    try {
      let response = await epochQueryClient.epochInfos();
      let decoded = parsingJSONuint8ToHex(response);
      const currentEpochTimes = moment(timestamp).diff(
        moment(decoded?.epochs[0]?.startTime),
        "days"
      );
      const nowadayEpochTimes = moment(new Date()).diff(
        moment(decoded?.epochs[0]?.startTime),
        "days"
      );
      const currentHeight =
        decoded?.epochs[0]?.currentEpochStartHeight?.low || null;
      const reductionCount = parseInt(currentEpochTimes / 365);
      response = await mintQueryClient.params();
      decoded = parsingJSONuint8ToHex(response);
      const genesisMinting =
        Number(decoded?.params?.genesisEpochProvisions) || 0;
      const reductionRate = Number(decoded?.params?.reductionFactor) || 0;
      const stakingRate =
        Number(decoded?.params?.distributionProportions?.staking) || 0;
      if (
        genesisMinting === 0 ||
        reductionRate === 0 ||
        stakingRate === 0 ||
        currentHeight === null
      ) {
        return null;
      } else {
        const epochMinting =
          (genesisMinting / 10 ** 18) *
          (reductionCount === 0
            ? 1
            : (reductionRate / 10 ** 18) * reductionCount);
        const blockStakingReward = Number(
          (epochMinting / (currentHeight / nowadayEpochTimes)) *
            (stakingRate / 10 ** 18)
        );
        return blockStakingReward;
      }
    } catch (error) {
      console.log("error: ", error.message);
      return null;
    }
  };

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
    const responseTx = await txQueryClient.getTx({
      hash,
    });
    const decoded = parsingJSONuint8ToHex(responseTx);
    res.json(decoded);
  });

  app.get("/block/:height", async (req, res) => {
    const height = req.params.height && new Long(req.params.height);
    const response = await blockQueryClient.getBlockByHeight({
      height,
    });

    const decoded = parsingJSONuint8ToHex(response);
    res.json(decoded);
  });

  app.get("/epoch", async (req, res) => {
    const response = await epochQueryClient.epochInfos();
    const decoded = parsingJSONuint8ToHex(response);
    // console.log(
    //   "check diff days:",
    //   moment("2022-06-19T17:00:00.000Z").diff(
    //     moment(decoded?.epochs[0]?.startTime),
    //     "days"
    //   )
    // );
    res.json(decoded);
  });

  app.get("/validators", async (req, res) => {
    res.json(allValidators);
  });

  app.get("/sonar_block/:height", async (req, res) => {
    const height = req.params.height && new Long(req.params.height);
    try {
      const response = await blockQueryClient.getBlockByHeight({
        height,
      });
      const decoded = parsingJSONuint8ToHex(response);
      const { TotalFee, TotalTxs, TotalMsgs, WantedGas } = mappingBlockTxsData(
        decoded?.block?.data?.txs || []
      );

      const Moniker =
        (decoded?.block?.header?.proposerAddress &&
          (await findMoniker(decoded?.block?.header?.proposerAddress))) ||
        null;

      const Reward = decoded?.block?.header?.time
        ? await calcBlockRewards(decoded?.block?.header?.time)
        : null;

      const responseData = {
        Height: decoded?.block?.header?.height?.low || null,
        ChainID: decoded?.block?.header?.chainId || null,
        Timestamp: decoded?.block?.header?.time || null,
        Proposer: decoded?.block?.header?.proposerAddress || null,
        Moniker,
        Round:
          decoded?.block?.lastCommit?.round === undefined
            ? null
            : decoded?.block?.lastCommit?.round,
        Candidates: null, // 값이 없음
        BlockHash: decoded?.blockId?.hash || null,
        Reward,
        TotalFee,
        TotalTxs,
        TotalMsgs,
        UsedGas: null, // 값이 없음
        WantedGas,
      };
      res.json(responseData);
    } catch (error) {
      res.status(500).json({
        error: true,
        message: error?.message || "something broken.",
      });
    }
  });

  app.get("/sonar_block/:height/messages", async (req, res) => {
    const height = req.params.height && new Long(req.params.height);
    // const {
    //   success_only = false,
    //   failure_only = false,
    //   page = 1,
    //   per_page = 20,
    // } = req.query;
    try {
      const response = await blockQueryClient.getBlockByHeight({
        height,
      });
      const decoded = parsingJSONuint8ToHex(response);
      const Txs = decoded?.block?.data?.txs.map((item) => item?.body?.txHash);
      let TotalSuccessMsgs = 0;
      let TotalFailureMsgs = 0;
      const Msgs = await Txs.reduce(async (acc, cur) => {
        const responseTx = await txQueryClient.getTx({
          hash: cur,
        });
        const decoded = parsingJSONuint8ToHex(responseTx);
        let result = await acc;
        result = result.concat(
          decoded?.tx?.body?.messages.map((item) => {
            item.TxHash = cur;
            item.Success = decoded?.txResponse?.code === 0 ? true : false;
            if (item.Success === true) {
              TotalSuccessMsgs++;
            } else if (item.Success === false) {
              TotalFailureMsgs++;
            }
            return item;
          })
        );
        return result;
      }, []);
      // rpc data로 가져오는 것이기 때문에 페이지네이션이 무의미함. frontend에서 처리해야할듯
      const responseData = {
        TotalMsgs: Msgs?.length || 0,
        TotalSuccessMsgs,
        TotalFailureMsgs,
        // Page: 1,
        // PerPage: 20,
        // SuccessOnly: false,
        // FailureOnly: false,
        Messages: parsingTxMessageData(Msgs),
      };
      res.json(responseData);
    } catch (error) {
      res.status(500).json({
        error: true,
        message: error?.message || "something broken.",
      });
    }
  });

  app.get("/sonar_block/:height/transactions", async (req, res) => {
    const height = req.params.height && new Long(req.params.height);
    // const {
    //   success_only = false,
    //   failure_only = false,
    //   page = 1,
    //   per_page = 20,
    // } = req.query;
    try {
      const response = await blockQueryClient.getBlockByHeight({
        height,
      });
      const decoded = parsingJSONuint8ToHex(response);
      const TxsHash = decoded?.block?.data?.txs.map(
        (item) => item?.body?.txHash
      );
      let TotalSuccessTxs = 0;
      let TotalFailureTxs = 0;
      const Txs = await Promise.all(
        TxsHash.map(async (item) => {
          const responseTx = await txQueryClient.getTx({
            hash: item,
          });
          const decoded = parsingJSONuint8ToHex(responseTx);
          if (decoded?.txResponse?.code === 0) {
            TotalSuccessTxs++;
          } else {
            TotalFailureTxs++;
          }
          const responseData = {
            TxHash: decoded?.txResponse?.txhash || null,
            Success: decoded?.txResponse?.code === 0 || null,
            ErrorStr:
              decoded?.txResponse?.code !== 0
                ? decoded?.txResponse?.rawLog
                : "",
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
          return responseData;
        })
      );
      // rpc data로 가져오는 것이기 때문에 페이지네이션이 무의미함. frontend에서 처리해야할듯
      const responseData = {
        TotalTxs: Txs.length || 0,
        TotalSuccessTxs,
        TotalFailureTxs,
        // Page: 1,
        // PerPage: 20,
        // SuccessOnly: false,
        // FailureOnly: false,
        Txs,
      };
      res.json(responseData);
    } catch (error) {
      res.status(500).json({
        error: true,
        message: error?.message || "something broken.",
      });
    }
  });

  app.get("/sonar_block/:height/validators", async (req, res) => {
    const height = req.params.height && new Long(req.params.height);
    try {
      const response = await blockQueryClient.getValidatorSetByHeight({
        height,
      });
      const decoded = parsingJSONuint8ToHex(response);
      const TotalVals = decoded?.pagination?.total?.low || null;
      let VotedVals = 0;
      let NonvotedVals = 0;
      let TotalPower = 0;
      const responseBlock = await blockQueryClient.getBlockByHeight({
        height: height.add(1),
      });
      const decodedBlock = parsingJSONuint8ToHex(responseBlock);
      const signatures = decodedBlock?.block?.lastCommit?.signatures || [];

      const Validators = await Promise.all(
        decoded?.validators.map(async (item) => {
          const pubKey = item?.pubKey?.value?.key || null;
          const proposerAddress = extractValAddressFromPubkey(pubKey);
          const findValidator = await findValidatorInfo(proposerAddress);
          TotalPower += item?.votingPower?.low || 0;
          const find = signatures.find(
            (item) => item.validatorAddress === proposerAddress
          );
          const Voted = find ? (find?.blockIdFlag === 2 ? true : false) : false;
          if (Voted === true) {
            VotedVals++;
          } else {
            NonvotedVals++;
          }
          return {
            Moniker: findValidator?.description?.moniker || null,
            Address: findValidator?.operatorAddress || null,
            Power: item?.votingPower?.low || 0,
            Voted,
          };
        })
      );
      const responseData = {
        TotalVals,
        VotedVals,
        NonvotedVals,
        TotalPower,
        Validators,
      };
      res.json(responseData);
    } catch (error) {
      res.status(500).json({
        error: true,
        message: error?.message || "something broken.",
      });
    }
  });

  app.get("/block_tm/:height", async (req, res) => {
    const height = req.params.height && Number(req.params.height);
    const response = await tmClient.block(height);
    const decoded = parsingJSONuint8ToHex(response);
    res.json(decoded);
  });

  app.get("/validators/:height", async (req, res) => {
    if (req.params.height === "latest") {
      const response = await blockQueryClient.getLatestValidatorSet({
        pagination: createPagination(),
      });
      console.log("check", response);

      const decoded = parsingJSONuint8ToHex(response);
      decoded.validators = decoded.validators.map((item) => {
        const pubKey = item?.pubKey?.value?.key;
        const proposerAddress = pubKey
          ? extractValAddressFromPubkey(pubKey)
          : null;
        item.proposerAddress = proposerAddress;
        return item;
      });

      res.json(decoded);
    }
    const height = req.params.height && new Long(req.params.height);
    const response = await blockQueryClient.getValidatorSetByHeight({
      height,
      pagination: createPagination(),
    });

    console.log("check", response);

    const decoded = parsingJSONuint8ToHex(response);
    decoded.validators = decoded.validators.map((item) => {
      const pubKey = item?.pubKey?.value?.key;
      const proposerAddress = pubKey
        ? extractValAddressFromPubkey(pubKey)
        : null;
      item.proposerAddress = proposerAddress;
      return item;
    });

    res.json(decoded);
  });

  app.get("/validators", async (req, res) => {
    const response = await stakingQueryClient.validators({
      status: "",
      pagination: createPagination(),
    });
    const decoded = parsingJSONuint8ToHex(response);
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
