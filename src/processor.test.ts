import { TestProcessorServer, firstCounterValue } from '@sentio/sdk/testing'
import { mockTransferSingleLog } from '@sentio/sdk/eth/builtin/erc1155'

describe('Test Processor', () => {
  const service = new TestProcessorServer(() => import('./processor.js'))

  beforeAll(async () => {
    await service.start()
  })

  test('has valid config', async () => {
    const config = await service.getConfig({})
    expect(config.contractConfigs.length > 0).toBeTruthy()
  })

  test('check transfer event handling', async () => {
    const resp = await service.eth.testLog(
      mockTransferSingleLog('0x2e6ff2a374844ed25E4523da53292a89B93e8905', {
        from: '0x0000000000000000000000000000000000000000',
        to: '0xb329e39ebefd16f40d38f07643652ce17ca5bac1',
        id: BigInt(0),
        value: 10n ** 18n * 10n,
        operator: '0xb329e39ebefd16f40d38f07643652ce17ca5bac1'
      })
    )

    const tokenCounter = firstCounterValue(resp.result, 'token')
    expect(tokenCounter).toEqual(10n)
  })
})
