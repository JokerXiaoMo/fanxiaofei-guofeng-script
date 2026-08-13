const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '..', 'ShanHaiXing-Compat.js'), 'utf8')
const sandbox = { console: { log() {} } }
vm.createContext(sandbox)
vm.runInContext(source, sandbox, { filename: 'ShanHaiXing-Compat.js' })

assert.equal(typeof sandbox.main, 'function', '兼容测试脚本必须保留 main(config) 覆写入口')

// 模拟截图场景：订阅只有中国香港、中国台湾节点，没有新加坡、日本、美国节点。
const config = {
  proxies: [
    { name: '🇭🇰 中国香港 01' },
    { name: '🇹🇼 中国台湾 02' }
  ],
  'proxy-groups': [],
  rules: []
}

sandbox.main(config)

const groups = config['proxy-groups']
const names = new Set(groups.map((group) => group.name))
const selectableTargets = new Set([...names, 'DIRECT', 'REJECT'])
const byName = new Map(groups.map((group) => [group.name, group]))

assert.ok(names.has('🌺 代理选择'), '总开关必须存在')
assert.ok(names.has('☁️ 万象节点'), '全节点组必须存在')
assert.ok(names.has('🏮 香江灯影'), '中国香港节点组必须存在')
assert.ok(names.has('🪭 宝岛团扇'), '中国台湾节点组必须存在')
assert.ok(!names.has('🪷 南洋莲舟'), '无新加坡节点时不得生成南洋莲舟')
assert.ok(!names.has('🍑 东海桃影'), '无日本节点时不得生成东海桃影')
assert.ok(!names.has('⛵ 北美远航'), '无美国节点时不得生成北美远航')

for (const group of groups.filter((item) => item.type === 'select')) {
  for (const target of group.proxies) {
    assert.ok(selectableTargets.has(target), `${group.name} 不得引用不存在的策略组：${target}`)
  }
}

const ai = byName.get('📜 灵枢智算')
assert.ok(ai.proxies.includes('☁️ 万象节点'), '灵枢智算必须保留全节点兜底')
assert.ok(!ai.proxies.includes('🪷 南洋莲舟'), '灵枢智算不得引用未生成的南洋莲舟')
assert.ok(!ai.proxies.includes('🍑 东海桃影'), '灵枢智算不得引用未生成的东海桃影')
assert.ok(!ai.proxies.includes('⛵ 北美远航'), '灵枢智算不得引用未生成的北美远航')

console.log('ShanHaiXing compatibility tests passed')
