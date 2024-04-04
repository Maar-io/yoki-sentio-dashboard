// Sentio processor for coinbase's staking token cbETH
import { YokiOriginsContext, YokiOriginsProcessor, TransferSingleEvent, MintDailyOmaEvent } from './types/eth/yokiorigins.js'
import { getERC1155Contract } from '@sentio/sdk/eth/builtin/erc1155'
import { Counter, Gauge } from "@sentio/sdk"
import { EthChainId } from "@sentio/sdk/eth";
import { YOKI_PROXY } from "./constant.js"


const DECIMAL = 18;

// commonly used option for Gauge
// set sparse to true
// and aggregation interval to 60 min
export const volOptions = {
    sparse: true,
    aggregationConfig: {
        intervalInMinutes: [60],
    }
}

const mintOMA = Gauge.register("mint_oma", volOptions)
const mintOMAAcc = Counter.register("mint_oma_acc")
const mintDailyOmaAcc = Counter.register("mint_daily_oma_acc")
const mintDailyOma = Gauge.register("mint_daily_oma", volOptions)
const burnOMA = Gauge.register("spent_oma", volOptions)
const burnOMAAcc = Counter.register("spent_oma_acc")
const liveOmaAcc = Counter.register("unused_oma_acc")
const capsule = Gauge.register("mint_capsule", volOptions)
const capsuleAcc = Counter.register("mint_capsule_acc")
const capsuleBurn = Gauge.register("used_capsule", volOptions)
const capsuleBurnAcc = Counter.register("used_capsule_acc")
const capsuleTransfer = Gauge.register("TransferCapsule", volOptions)
const capsuleTransferAcc = Counter.register("TransferCapsuleAcc")
const liveCapsuleAcc = Counter.register("live_capsule_acc")
const baseYoki = Gauge.register("base_yoki", volOptions)
const baseYokiAcc = Counter.register("base_yoki_acc")
const baseYokiTransferred = Gauge.register("TransferBaseYoki", volOptions)
const baseYokiTransferredAcc = Counter.register("TransferBaseYokiAcc")
const burnYoki = Gauge.register("fused_yoki", volOptions)
const burnYokiAcc = Counter.register("fused_yoki_acc")
const liveYokiAcc = Counter.register("live_yoki_acc")
const evolved = Gauge.register("evolved_yoki", volOptions)
const evolvedAcc = Counter.register("evolved_yoki_acc")
const omaTransfer = Gauge.register("TransferOma", volOptions)
const omaTransferAcc = Counter.register("TransferOmaAcc")
const bigOmaTxAcc = Counter.register("bigOmaTxAcc")
const omaTxTransfersAcc = Counter.register("omaTxTransfers")
const totalMintsAcc = Counter.register("total_token_acc")


const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const mintDailyOmaHandler = async function (event: MintDailyOmaEvent, ctx: YokiOriginsContext) {
    const quantity = event.args.quantity
    mintDailyOma.record(ctx, quantity, { token: "MintDailyOma" })
    mintDailyOmaAcc.add(ctx, quantity, { token: "MintDailyOmaAcc" })
}

const mintEventHandler = async function (event: TransferSingleEvent, ctx: YokiOriginsContext) {
    // const tokenInfo = getERC1155Contract(EthChainId.ASTAR_ZKEVM, ctx.contract.address)
    // const amount = event.args.value.scaleDown(DECIMAL)
    const val = event.args.value;
    if (event.args.from === ZERO_ADDRESS) {
        totalMintsAcc.add(ctx, val, { token: "TotalMints" })
    }

    if (event.args.id === BigInt(0)) {
        if (event.args.to === ZERO_ADDRESS) {
            burnOMA.record(ctx, val, { token: "OMABurn" })
            burnOMAAcc.add(ctx, val, { token: "OMABurnCnt" })
            liveOmaAcc.sub(ctx, val, { token: "LiveOmaCnt" })

        }
        else if (event.args.from === ZERO_ADDRESS) {
            mintOMA.record(ctx, val, { token: "OMA" })
            mintOMAAcc.add(ctx, val, { token: "OMAcnt" })
            liveOmaAcc.add(ctx, val, { token: "LiveOmaCnt" })
        }
        else {
            omaTransfer.record(ctx, val, { token: "OMATransfer" })
            omaTransferAcc.add(ctx, val, { token: "OMATransferCAnt" })
            omaTxTransfersAcc.add(ctx, 1, { token: "OMATxTransfers" })
            if (val > BigInt(30)) {
                bigOmaTxAcc.add(ctx, 1, { token: "bigOmaTxAcc" })
            }
        }
    }

    if (event.args.id > BigInt(0) && event.args.id < BigInt(20)) {
        if (event.args.to === ZERO_ADDRESS) {
            capsuleBurn.record(ctx, val, { token: "CapsuleBurn" })
            capsuleBurnAcc.add(ctx, val, { token: "CapsuleBurnCnt" })
            liveCapsuleAcc.sub(ctx, val, { token: "LiveCapsuleCnt" })
        }
        else if (event.args.from === ZERO_ADDRESS) {
            capsule.record(ctx, val, { token: "Capsule" })
            capsuleAcc.add(ctx, val, { token: "CapsuleCnt" })
            liveCapsuleAcc.add(ctx, val, { token: "LiveCapsuleCnt" })
        }
        else {
            capsuleTransfer.record(ctx, val, { token: "CapsuleTransfer" })
            capsuleTransferAcc.add(ctx, val, { token: "CapsuleTransferCnt" })
        }
    }

    if (event.args.id > BigInt(99) && event.args.id % BigInt(100) === BigInt(0)) {
        if (event.args.to === ZERO_ADDRESS) {
            burnYoki.record(ctx, val, { token: "BaseYokiBurn" })
            burnYokiAcc.add(ctx, val, { token: "BaseYokiBurnCnt" })
            liveYokiAcc.sub(ctx, val, { token: "LiveYokiCnt" })
        }
        else if (event.args.from === ZERO_ADDRESS) {
            baseYoki.record(ctx, val, { token: "BaseYoki" })
            baseYokiAcc.add(ctx, val, { token: "BaseYokiCnt" })
            liveYokiAcc.add(ctx, val, { token: "LiveYokiCnt" })
        }
        else {
            baseYokiTransferred.record(ctx, val, { token: "BaseYokiTransferred" })
            baseYokiTransferredAcc.add(ctx, val, { token: "BaseYokiTransferredCnt" })
        }
    }

    if (event.args.id > BigInt(99) && !(event.args.id % BigInt(100) === BigInt(0))) {
        if (event.args.from === ZERO_ADDRESS) {
            evolved.record(ctx, val, { token: "EvolvedYoki" })
            evolvedAcc.add(ctx, val, { token: "EvolvedYokiCnt" })
        }
    }

    ctx.eventLogger.emit("YokiOrigins Transfer", {
        distinctId: event.args.to,
        token: "YokiOrigins",
        amount: val.toString(),
        id: event.args.id.toString(),
        to: event.args.to,
        message: `Transferred ${val.toString()} YokiOrigins id=${event.args.id.toString()} to ${event.args.to}`
    })
}

// processor binding logic to bind the right contract address and attach right event and block handlers
YokiOriginsProcessor.bind({ address: YOKI_PROXY, network: EthChainId.ASTAR_ZKEVM })
    .onEventTransferSingle(mintEventHandler)
    .onEventMintDailyOma(mintDailyOmaHandler)