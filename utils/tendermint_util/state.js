import * as _m0 from "protobufjs/minimal";
const _helpers = require("@osmonauts/helpers");
const _validator = require("osmojs/main/proto/tendermint/types/validator");
const _abci = require("osmojs/main/proto/tendermint/abci/types");
const _params = require("osmojs/main/proto/tendermint/types/params");

/** 
// 참고
// https://github.com/tendermint/tendermint/blob/main/proto/tendermint/state/types.proto
*/

// ValidatorsInfo represents the latest validator set, or the last height it changed
// message ValidatorsInfo {
//   tendermint.types.ValidatorSet validator_set       = 1;
//   int64                         last_height_changed = 2;
// }

function createBaseValidatorsInfo() {
  return {
    validators: [],
    lastHeightChanged: _helpers.Long.ZERO,
  };
}

var ValidatorsInfo = {
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBaseValidatorsInfo();

    while (reader.pos < end) {
      var tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.validators.push(
            _validator.ValidatorSet.decode(reader, reader.uint32())
          );
          break;

        case 2:
          message.lastHeightChanged = reader.int64();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
};

exports.ValidatorsInfo = ValidatorsInfo;

// ABCIResponses retains the responses
// of the various ABCI calls during block processing.
// It is persisted to disk for each height before calling Commit.

// message ABCIResponses {
//   repeated tendermint.abci.ResponseDeliverTx deliver_txs = 1;
//   tendermint.abci.ResponseEndBlock           end_block   = 2;
//   tendermint.abci.ResponseBeginBlock         begin_block = 3;
// }

function createBaseABCIResponses() {
  return {
    deliverTxs: [],
    endBlock: {
      validatorUpdates: [],
      consensusParamUpdates: undefined,
      events: [],
    },
    beginBlock: {
      events: [],
    },
  };
}

var ABCIResponses = {
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBaseABCIResponses();

    while (reader.pos < end) {
      var tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.deliverTxs.push(
            _abci.ResponseDeliverTx.decode(reader, reader.uint32())
          );
          break;

        case 2:
          message.endBlock = _abci.ResponseEndBlock.decode(
            reader,
            reader.uint32()
          );
          break;

        case 3:
          message.beginBlock = _abci.ResponseBeginBlock.decode(
            reader,
            reader.uint32()
          );
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
};

exports.ABCIResponses = ABCIResponses;

// ConsensusParamsInfo represents the latest consensus params, or the last height it changed
// message ConsensusParamsInfo {
//   tendermint.types.ConsensusParams consensus_params    = 1 [(gogoproto.nullable) = false];
//   int64                            last_height_changed = 2;
// }

function createBaseConsensusParamsInfo() {
  return {
    consensusParams: {
      block: undefined,
      evidence: undefined,
      validator: undefined,
      version: undefined,
    },
    lastHeightChanged: _helpers.Long.ZERO,
  };
}

var ConsensusParamsInfo = {
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBaseConsensusParamsInfo();

    while (reader.pos < end) {
      var tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.consensusParams = _params.ConsensusParams.decode(
            reader,
            reader.uint32()
          );
          break;

        case 2:
          message.lastHeightChanged = reader.int64();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
};

exports.ConsensusParamsInfo = ConsensusParamsInfo;
