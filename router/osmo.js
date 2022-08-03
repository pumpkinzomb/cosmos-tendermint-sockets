const express = require("express");
import {
  fromHexString,
  toHexString,
  parsingJSONuint8ToHex,
} from "../utils/convert.js";
import {
  createProtobufRpcClient,
  QueryClient,
  createPagination,
} from "@cosmjs/stargate";
import { cosmos } from "osmojs";

const router = express.Router();

const tmRouter = (tmClient) => {
  const queryClient = new QueryClient(tmClient);
  const rpc = createProtobufRpcClient(queryClient);
  const stakingQueryClientImpl = cosmos.staking.v1beta1.QueryClientImpl;
  const stakingQueryClient = new stakingQueryClientImpl(rpc);
  const authQueryClientImpl = cosmos.auth.v1beta1.QueryClientImpl;
  const authQueryClient = new authQueryClientImpl(rpc);
  const bankQueryClientImpl = cosmos.bank.v1beta1.QueryClientImpl;
  const bankQueryClient = new bankQueryClientImpl(rpc);
  const txQueryClientImpl = cosmos.tx.v1beta1.ServiceClientImpl;
  const txQueryClient = new txQueryClientImpl(rpc);

  router.get("/", async (req, res) => {
    try {
      const status = await tmClient.status();
      return res.json(parsingJSONuint8ToHex(status));
    } catch (error) {
      // console.log(error);
      console.error(error.name + ": " + error.message);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  router.get("/health", async (req, res) => {
    try {
      const health = await tmClient.health();
      return res.json(parsingJSONuint8ToHex(health));
    } catch (error) {
      // console.log(error);
      console.error(error.name + ": " + error.message);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  router.get("/bank/balances/:address", async (req, res) => {
    try {
      const address = req.params.address;
      const responseAddressBalances = await bankQueryClient.allBalances({
        address,
        pagination: createPagination(),
      });
      return res.json(parsingJSONuint8ToHex(responseAddressBalances));
    } catch (error) {
      // console.log(error);
      console.error(error.name + ": " + error.message);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  router.get(`/blocks`, async (req, res) => {
    try {
      const latestBlock = await tmClient.block();
      return res.json(parsingJSONuint8ToHex(latestBlock));
    } catch (error) {
      // console.log(error);
      console.error(error.name + ": " + error.message);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  router.get(`/blocks/:height`, async (req, res) => {
    try {
      const height = req.params.height && Number(req.params.height);
      const responseBlock = await tmClient.block(height);
      return res.json(parsingJSONuint8ToHex(responseBlock));
    } catch (error) {
      // console.log(error);
      console.error(error.name + ": " + error.message);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  router.get(`/accounts/:address`, async (req, res) => {
    try {
      const address = req.params.address;
      const responseAddress = await authQueryClient.account({
        address,
      });
      return res.json(parsingJSONuint8ToHex(responseAddress));
    } catch (error) {
      // console.log(error);
      console.error(error.name + ": " + error.message);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  router.get(`/staking/validators`, async (req, res) => {
    try {
      const responseValidator = await stakingQueryClient.validators({
        status: "",
        pagination: createPagination(),
      });
      return res.json(parsingJSONuint8ToHex(responseValidator));
    } catch (error) {
      // console.log(error);
      console.error(error.name + ": " + error.message);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  router.get(`/staking/validators/:address`, async (req, res) => {
    try {
      const validatorAddr = req.params.address;

      const responseValidator = await osmoQueryClient.validator({
        validatorAddr,
      });
      return res.json(parsingJSONuint8ToHex(responseValidator));
    } catch (error) {
      // console.log(error);
      console.error(error.name + ": " + error.message);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  router.get(`/txs/:hash`, async (req, res) => {
    const hash = req.params.hash && fromHexString(req.params.hash);
    try {
      const responseTx = await tmClient.tx({
        hash,
      });
      return res.json(parsingJSONuint8ToHex(responseTx));
    } catch (error) {
      // console.log(error);
      console.error(error.name + ": " + error.message);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  router.get(`/txs_event/:events`, async (req, res) => {
    const events = req.params.events.split("&");
    try {
      const responseEvents = await txQueryClient.getTxsEvent({
        events,
        pagination: createPagination(),
        orderBy: 1,
      });
      return res.json(parsingJSONuint8ToHex(responseEvents));
    } catch (error) {
      // console.log(error);
      console.error(error.name + ": " + error.message);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  router.get(`/validators/:height/:page`, async (req, res) => {
    try {
      const height = req.params.height && Number(req.params.height);
      const page = req.params.page && Number(req.params.page);
      const responseValidators = await tmClient.validators({
        height,
        page,
        per_page: 100, // server max limit
      });
      return res.json(parsingJSONuint8ToHex(responseValidators));
    } catch (error) {
      // console.log(error);
      console.error(error.name + ": " + error.message);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  return router;
};

export default tmRouter;
