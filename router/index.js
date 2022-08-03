import osmo from "./osmo";

const express = require("express");
const router = express.Router();
const routerInterseptor = (list) => {
  for (let item of list) {
    router.use(`/`, osmo(item.path, item.client));
  }
  return router;
};

export default routerInterseptor;
