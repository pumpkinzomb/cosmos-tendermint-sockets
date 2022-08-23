import { osmosis, cosmos, getSigningOsmosisClient } from "osmojs";
import {
  createProtobufRpcClient,
  QueryClient,
  StargateClient,
  createPagination,
} from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";

import express from "express";
import router from "./router/index.js";

export const serverInit = async () => {
  const app = express();
  const port = 9000;

  const TERRA = "https://terra-mainnet-rpc.allthatnode.com:26657/";
  const OSMO = "https://osmosis-mainnet-archive.allthatnode.com:26657/";
  const TGRADE = "https://tgrade-mainnet-archive.allthatnode.com:26657/";
  const STARGAZE = "https://rpc.stargaze.ezstaking.io/";
  const TEST_OSMO = "https://testnet-rpc.osmosis.zone/";

  const tmClient = await Tendermint34Client.connect(OSMO);
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
  // console.log("txQueryClient", txQueryClient);

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

  // export const main = async () => {
  //   const tmClient = await Tendermint34Client.connect(OSMO_RPC_ENDPOINT);
  //   const QueryClientImpl = osmosis.gamm.v1beta1.QueryClientImpl;
  //   const ServiceClientImpl = cosmos.base.tendermint.v1beta1.ServiceClientImpl;
  //   const queryClient = new QueryClient(tmClient);
  //   const rpc = createProtobufRpcClient(queryClient);
  //   const queryService = new QueryClientImpl(rpc);
  //   //   const pools = await queryService.pools({});
  // };

  const terraTmClient = await Tendermint34Client.connect(TERRA);
  const osmoTmClient = await Tendermint34Client.connect(OSMO);
  const tgradeTmClient = await Tendermint34Client.connect(TGRADE);
  const stargazeTmClient = await Tendermint34Client.connect(STARGAZE);
  const osmoTestTmClient = await Tendermint34Client.connect(TEST_OSMO);

  const rpcList = [
    { path: "/osmo", client: osmoTmClient, address: OSMO },
    { path: "/terra", client: terraTmClient, address: TERRA },
    { path: "/tgrade", client: tgradeTmClient, address: TGRADE },
    { path: "/stargaze", client: stargazeTmClient, address: STARGAZE },
    { path: "/osmo_test", client: osmoTestTmClient, address: TEST_OSMO },
  ];

  app.get("/", (req, res) => {
    res.send(`
              <style>
              table, th, td {
                border:1px solid black;
                border-collapse: collapse;
                padding: 0.5rem;
              }
              </style>
              Hello, this is sonar tendermint RPC data parsing server. <br/><br/>
                ${rpcList
                  .map(
                    (item) => `<b>RPC ${item.path}</b> - ${item.address} <br/>`
                  )
                  .join("")}
                  <br/>
                  <h1>API Detail</h1>
                  <table >
                    <tr>
                      <th>APIS</th>
                      <th>Method</th>
                      <th>detail</th>
                    </tr>
                    <tr>
                      <td>/</td>
                      <td>GET</td>
                      <td>query status</td>
                    </tr>
                    <tr>
                      <td>/health</td>
                      <td>GET</td>
                      <td>query health</td>
                    </tr>
                    <tr>
                      <td>/blocks</td>
                      <td>GET</td>
                      <td>query latest block</td>
                    </tr>
                    <tr>
                      <td>/blocks/:height</td>
                      <td>GET</td>
                      <td>query block by height</td>
                    </tr>
                    <tr>
                      <td>/bank/balances/:address</td>
                      <td>GET</td>
                      <td>query bank balances by address</td>
                    </tr>
                    <tr>
                      <td>/accounts/:address</td>
                      <td>GET</td>
                      <td>query accounts by address</td>
                    </tr>
                    <tr>
                      <td>/staking/validators</td>
                      <td>GET</td>
                      <td>query all validator list (staking module)</td>
                    </tr>
                    <tr>
                      <td>/staking/validators/:address</td>
                      <td>GET</td>
                      <td>query single validator's info by address (staking module)</td>
                    </tr>
                    <tr>
                      <td>/txs/:hash</td>
                      <td>GET</td>
                      <td>query transaction by hash</td>
                    </tr>
                    <tr>
                      <td>/txs_event/:events</td>
                      <td>GET</td>
                      <td>query transaction by events</td>
                    </tr>
                    <tr>
                      <td>/validators/:height/:page</td>
                      <td>GET</td>
                      <td>query commited validator by height and page</td>
                    </tr>
                  </table>
                  </br></br>
                  * api 요청할때는 반드시 prefix를 붙여야합니다. </br>
                  ex) /osmo/blocks </br>
                  ex) /tgrade/blocks
            `);
  });

  app.use("/", router(rpcList));

  app.listen(port, () => {
    console.log(`server on port: ${port}`);
  });
};

serverInit();
