const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '..', 'ShanHaiXing-Adaptive-DualStackDNS.js'), 'utf8')

function run(names) {
  const sandbox = { console: { log() {} } }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'ShanHaiXing-Adaptive-DualStackDNS.js' })
  const config = {
    proxies: names.map((name) => ({ name })),
    'proxy-groups': [],
    rules: []
  }
  sandbox.main(config)
  return config
}

function group(config, name) {
  return config['proxy-groups'].find((item) => item.name === name)
}

const names = [
  '日本 东京 0.5x 省流',
  '中国香港 0.3× 省流',
  'US Los Angeles x2 高倍率',
  '新加坡 2倍 标准',
  '德国 倍率: 2.75',
  '中国台湾 x0.5 节省',
  '日本 1.5x 正常',
  'US 0.51x 正常',
  '香港 2x + 0.5x 混合',
  '日本 01',
  'US 2024-01',
  '日本 低倍 文本',
  '中国香港 高倍率 文本',
  '剩余流量 0.3x',
  '套餐 3倍',
  '新加坡 0x 无效'
]

const config = run(names)
const high = group(config, '🧧 高倍率节点')
const low = group(config, '🍃 低倍率节点')

assert.ok(high, '存在高倍率节点时必须生成高倍率节点组')
assert.ok(low, '存在低倍率节点时必须生成低倍率节点组')
assert.equal(high.type, 'url-test', '高倍率节点组必须自动测速')
assert.equal(low.type, 'url-test', '低倍率节点组必须自动测速')
assert.equal(high.proxies.includes('DIRECT'), false, '高倍率节点组不可测速 DIRECT')
assert.equal(low.proxies.includes('DIRECT'), false, '低倍率节点组不可测速 DIRECT')

assert.deepEqual([...high.proxies], [
  'US Los Angeles x2 高倍率',
  '新加坡 2倍 标准',
  '德国 倍率: 2.75',
  '香港 2x + 0.5x 混合'
], '高倍率组必须识别 >= 2 的明确倍率写法，并以高倍率优先')

assert.deepEqual([...low.proxies], [
  '日本 东京 0.5x 省流',
  '中国香港 0.3× 省流',
  '中国台湾 x0.5 节省'
], '低倍率组必须识别 > 0 且 <= 0.5 的明确倍率写法')

assert.equal(high.proxies.includes('香港 2x + 0.5x 混合'), true, '混合倍率名称必须只进入高倍率组')
assert.equal(low.proxies.includes('香港 2x + 0.5x 混合'), false, '混合倍率名称不可同时进入低倍率组')

const jp = group(config, '🍑 东海桃影')
const hk = group(config, '🏮 香江灯影')
assert.ok(jp.proxies.includes('日本 东京 0.5x 省流'), '低倍率节点必须同时保留在原日本地区组')
assert.ok(hk.proxies.includes('中国香港 0.3× 省流'), '低倍率节点必须同时保留在原中国香港地区组')
assert.ok(hk.proxies.includes('香港 2x + 0.5x 混合'), '高倍率节点必须同时保留在原中国香港地区组')

for (const falsePositive of [
  '日本 1.5x 正常',
  'US 0.51x 正常',
  '日本 01',
  'US 2024-01',
  '日本 低倍 文本',
  '中国香港 高倍率 文本',
  '剩余流量 0.3x',
  '套餐 3倍',
  '新加坡 0x 无效'
]) {
  assert.equal(high.proxies.includes(falsePositive), false, '不得错误归入高倍率组：' + falsePositive)
  assert.equal(low.proxies.includes(falsePositive), false, '不得错误归入低倍率组：' + falsePositive)
}

const noRate = run(['日本 东京 01', 'US Los Angeles 01'])
assert.equal(Boolean(group(noRate, '🧧 高倍率节点')), false, '没有高倍率节点时不可生成空高倍率组')
assert.equal(Boolean(group(noRate, '🍃 低倍率节点')), false, '没有低倍率节点时不可生成空低倍率组')

console.log('ShanHaiXing rate group tests passed')
