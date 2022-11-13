import { osmosis, cosmos, getSigningOsmosisClient, tendermint } from "osmojs";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import * as _m0 from "protobufjs/minimal";
import {
  StargateClient,
  createPagination,
  QueryClient,
  createProtobufRpcClient,
} from "@cosmjs/stargate";
import Long from "long";
import express from "express";
import { validatorDB, abciResponseDB, consensusParamsDB } from "./test_file";
import {
  ValidatorsInfo,
  ABCIResponses,
  ConsensusParamsInfo,
} from "./utils/tendermint_util/state";
import { parsingJSONuint8ToHex } from "./utils/convert";

const OSMOS_RPC = "http://osmosis-mainnet-archive-node.allthatnode.com:26657/";

export const serverInit = async () => {
  const app = express();
  const port = 9000;
  const tmClient = await Tendermint34Client.connect(OSMOS_RPC);
  const queryClient = new QueryClient(tmClient);
  const rpc = createProtobufRpcClient(queryClient);
  const stakingQueryClientImpl = cosmos.staking.v1beta1.QueryClientImpl;
  const stakingQueryClient = new stakingQueryClientImpl(rpc);

  app.get("/state/block", async (req, res) => {
    const converter = ValidatorsInfo.decode;
    const check1 = new _m0.Reader(validatorDB);
    res.json(parsingJSONuint8ToHex(converter(check1)));
  });

  app.get("/state/abci", async (req, res) => {
    const converter = ABCIResponses.decode;
    const check1 = new _m0.Reader(abciResponseDB);
    res.json(parsingJSONuint8ToHex(converter(check1)));
  });

  app.get("/state/params", async (req, res) => {
    const converter = ConsensusParamsInfo.decode;
    const check1 = new _m0.Reader(consensusParamsDB);
    res.json(parsingJSONuint8ToHex(converter(check1)));
  });

  app.get("/validators", async (req, res) => {
    // console.log("stakingQueryClient", stakingQueryClient.validators());
    const response = await stakingQueryClient.validators({
      status: "",
      pagination: createPagination(),
    });
    res.json(response);
  });

  app.get("/history_validator/:height", async (req, res) => {
    const height = req.params.height || 1;
    const response = await stakingQueryClient.historicalInfo({
      height: new Long(height),
    });
    res.json(response);
  });

  app.listen(port, () => {
    console.log(`server on port: ${port}`);
  });
};

serverInit();
