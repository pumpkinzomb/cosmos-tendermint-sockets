import { cosmos } from "osmojs";
import moment from "moment";
import {
  createPagination,
  createProtobufRpcClient,
  QueryClient,
} from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import {
  generate_mnemonic,
  getAddressId,
  generateWalletFromMnemonic,
} from "./test2";
const xlsx = require("xlsx");
const path = require("path");

const COSMOS_RPC = "https://cosmos-mainnet-rpc.allthatnode.com:26657/";
const GENERATE_COUNTS = 1500;

class TendermintQueryClient {
  bankQueryClient = null;
  constructor(rpc_endpoint) {
    this.rpc = rpc_endpoint;
  }

  async init() {
    console.log("check", this.rpc);
    const bankQueryClientImpl = cosmos.bank.v1beta1.QueryClientImpl;
    const tmClient = await Tendermint34Client.connect(this.rpc);
    const queryClient = new QueryClient(tmClient);
    const rpc = createProtobufRpcClient(queryClient);
    const bankQueryClient = new bankQueryClientImpl(rpc);
    this.bankQueryClient = bankQueryClient;
    return {
      bankQueryClient,
    };
  }
}

const _TendermintQueryClient = (async function () {
  return await new TendermintQueryClient(COSMOS_RPC).init();
})();

const makeAccounts = async (counts = GENERATE_COUNTS) => {
  let accountList = Array.from(Array(counts).keys());

  accountList = await Promise.all(
    accountList.map(async (item) => {
      const mnemonic = await generate_mnemonic();
      //   console.log("mnemonic?:", mnemonic);
      const accoundId = await getAddressId(mnemonic);
      //   console.log("accoundId?:", accoundId);
      const walletAddress = accoundId[0]?.address || "-";
      const privateKey = await generateWalletFromMnemonic(mnemonic);
      const balances = await getBalance(walletAddress);
      return {
        balances,
        walletAddress,
        privateKey: Buffer.from(privateKey).toString("hex"),
        mnemonic,
      };
    })
  );

  return accountList;
};

const getBalance = async (address) => {
  const { bankQueryClient } = await _TendermintQueryClient;
  const responseAddressBalances = await bankQueryClient.allBalances({
    address,
    pagination: createPagination(),
  });
  return responseAddressBalances?.balances || [];
};

// const run = async () => {
//   const accountList = await makeAccounts();
//   console.log("run", accountList);
// };

// run();

let count = 0;
let timeout;
const startCountDown = () => {
  timeout = setTimeout(() => {
    count++;
    startCountDown();
  }, 1000);
};

const stopCountDown = () => {
  clearTimeout(timeout);
  count = 0;
};

const makeIt = async (index = 1) => {
  console.log(`generate ${GENERATE_COUNTS} cosmos account started!!!!`);

  try {
    const accountList = await makeAccounts(GENERATE_COUNTS);
    //   console.log("accountList", accountList);
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(accountList);

    xlsx.utils.book_append_sheet(workbook, worksheet, "sheet1");
    xlsx.writeFile(
      workbook,
      path.join(
        __dirname,
        `excels/${moment(new Date()).format("YYYY-MM-DD hA")}_${index}.xlsx`
      )
    );
    console.log(`finished!!!!`);
  } catch (error) {
    console.log("something wrong!!!");
    console.log("error: ", error);
  }
};

const start = async () => {
  startCountDown();
  console.log("work start!!!");
  try {
    await Promise.all(
      Array.from(Array(2).keys()).map(async (item, index) => {
        await makeIt(index + 1);
        return index;
      })
    );
    console.log(`work finished!!!! It tooks ${count} secs`);
    stopCountDown();
  } catch (error) {
    stopCountDown();
    console.log("error: ", error);
  }
};

start();
