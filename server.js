import { osmosis, cosmos, getSigningOsmosisClient } from "osmojs";
import {
  createProtobufRpcClient,
  QueryClient,
  StargateClient,
  createPagination,
} from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";

import express from "express";
import { osmo, terra, tgrade } from "./router/index.js";

const app = express();
const port = 9000;

const OSMO_RPC_ENDPOINT =
  "http://ec2-35-72-249-55.ap-northeast-1.compute.amazonaws.com:26657/";
const TERRA_RPC_ENDPOINT = "https://terra-mainnet-rpc.allthatnode.com:26657/";
const OSMO_A_1 = "https://osmosis-mainnet-archive.allthatnode.com:26657/";
const TGRADE_A_1 = "https://tgrade-mainnet-archive.allthatnode.com:26657/";

const tmClient = await Tendermint34Client.connect(OSMO_A_1);
const QueryClientImpl = osmosis.gamm.v1beta1.QueryClientImpl;
const queryClient = new QueryClient(tmClient);
const rpc = createProtobufRpcClient(queryClient);
// const queryService = new QueryClientImpl(rpc);
// const stakingQueryClientImpl = cosmos.staking.v1beta1.QueryClientImpl;
// const stakingQueryClient = new stakingQueryClientImpl(rpc);
// const authQueryClientImpl = cosmos.auth.v1beta1.QueryClientImpl;
// const authQueryClient = new authQueryClientImpl(rpc);
const txQueryClientImpl = cosmos.tx.v1beta1.ServiceClientImpl;
const txQueryClient = new txQueryClientImpl(rpc);
console.log("txQueryClient", txQueryClient);

// message.sender='osmo1clpqr4nrk4khgkxj78fcwwh6dl3uw4epasmvnj'
// message.action='vote'
// const txs = await txQueryClient.getTxsEvent({
//   events: [
//     "message.sender='osmovaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4ep88n0y4'",
//     "message.action='edit_validator'",
//   ],
//   pagination: createPagination(),
//   orderBy: -1,
// });
// console.log("txs", txs);
// const account = await authQueryClient.account({
//   address: "osmo1clpqr4nrk4khgkxj78fcwwh6dl3uw4epasmvnj",
// });

// console.log("address", account);

const terraTmClient = await Tendermint34Client.connect(TERRA_RPC_ENDPOINT);
const osmoTmClient = await Tendermint34Client.connect(OSMO_A_1);
const tgradeTmClient = await Tendermint34Client.connect(TGRADE_A_1);

app.get("/", (req, res) => {
  res.send(`
  Hello, this is simple tendermint server. <br/><br/>
  <b>OSMO RPC:</b> ${OSMO_A_1}
  `);
});

app.use("/osmo", osmo(osmoTmClient));
app.use("/terra", terra(terraTmClient));
app.use("/tgrade", tgrade(tgradeTmClient));

app.listen(port, () => {
  console.log(`server on port: ${port}`);
});

// export const main = async () => {
//   const tmClient = await Tendermint34Client.connect(OSMO_RPC_ENDPOINT);
//   const QueryClientImpl = osmosis.gamm.v1beta1.QueryClientImpl;
//   const ServiceClientImpl = cosmos.base.tendermint.v1beta1.ServiceClientImpl;
//   const queryClient = new QueryClient(tmClient);
//   const rpc = createProtobufRpcClient(queryClient);
//   const queryService = new QueryClientImpl(rpc);
//   //   const pools = await queryService.pools({});
// };
