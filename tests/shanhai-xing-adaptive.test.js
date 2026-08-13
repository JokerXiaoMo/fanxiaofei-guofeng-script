const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '..', 'ShanHaiXing-Adaptive.js'), 'utf8')

function buildConfig(names) {
  const sandbox = { console: { log() {} } }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'ShanHaiXing-Adaptive.js' })
  assert.equal(typeof sandbox.main, 'function', '自适应版必须保留 main(config) 覆写入口')

  const config = {
    proxies: names.map((name) => ({ name })),
    'proxy-groups': [{ name: '订阅旧组', type: 'select', proxies: names.slice(0, 1) }],
    rules: ['MATCH,DIRECT']
  }
  sandbox.main(config)
  return config
}

function assertNoMissingGroupReferences(config, label) {
  const groups = config['proxy-groups']
  const names = new Set(groups.map((group) => group.name))
  const validTargets = new Set([...names, 'DIRECT', 'REJECT'])

  assert.equal(groups[0].name, '🌺 代理选择', `${label}：代理选择必须置顶`)
  assert.ok(names.has('☁️ 万象节点'), `${label}：必须保留全节点兜底组`)

  for (const group of groups.filter((item) => item.type === 'select')) {
    for (const target of group.proxies) {
      assert.ok(validTargets.has(target), `${label}：${group.name} 引用了不存在的策略组 ${target}`)
    }
  }
}

// 场景一：地区完整的订阅，应保留原版的全部地区候选能力。
const full = buildConfig([
  '🇭🇰 中国香港 01',
  '🇹🇼 中国台湾 02',
  'Tokyo JP 03',
  'Singapore SG 04',
  'US Los Angeles 05',
  'Germany DE 06'
])
assertNoMissingGroupReferences(full, '完整地区订阅')
const fullNames = new Set(full['proxy-groups'].map((group) => group.name))
for (const name of ['🏮 香江灯影', '🪭 宝岛团扇', '🍑 东海桃影', '🪷 南洋莲舟', '⛵ 北美远航', '⛰️ 四海云游']) {
  assert.ok(fullNames.has(name), `完整地区订阅：必须生成 ${name}`)
}
const fullAi = full['proxy-groups'].find((group) => group.name === '📜 灵枢智算')
for (const name of ['⛵ 北美远航', '🪷 南洋莲舟', '🍑 东海桃影', '☁️ 万象节点']) {
  assert.ok(fullAi.proxies.includes(name), `完整地区订阅：灵枢智算必须保留 ${name}`)
}

// 场景二：地区缺失的订阅，不得引用未生成的新加坡、日本、美国策略组。
const sparse = buildConfig(['🇭🇰 中国香港 01', '🇹🇼 中国台湾 02'])
assertNoMissingGroupReferences(sparse, '地区缺失订阅')
const sparseNames = new Set(sparse['proxy-groups'].map((group) => group.name))
for (const name of ['🪷 南洋莲舟', '🍑 东海桃影', '⛵ 北美远航']) {
  assert.ok(!sparseNames.has(name), `地区缺失订阅：不得空建 ${name}`)
}
const sparseAi = sparse['proxy-groups'].find((group) => group.name === '📜 灵枢智算')
assert.deepEqual([...sparseAi.proxies], ['☁️ 万象节点', 'DIRECT'], '地区缺失订阅：灵枢智算只应使用全节点兜底和 DIRECT')

console.log('ShanHaiXing adaptive tests passed')
