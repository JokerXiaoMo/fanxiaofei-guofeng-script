const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const scriptPath = path.join(__dirname, '..', 'ShanHaiXing-v0.2.3-MainRoute-Selector-Test.js')
const source = fs.readFileSync(scriptPath, 'utf8')

const sandbox = { console: { log() {} } }
vm.createContext(sandbox)
vm.runInContext(source, sandbox, { filename: 'ShanHaiXing-v0.2.3-MainRoute-Selector-Test.js' })
assert.equal(sandbox.VERSION, '0.2.3-main-route-selector-test', '必须加载独立 v0.2.3 测试版')

const config = {
  proxies: [
    { name: '中国香港 节点', type: 'ss', server: 'hk.example.test', port: 443 },
    { name: '中国台湾 节点', type: 'vless', server: 'tw.example.test', port: 443 },
    { name: '日本 节点', type: 'trojan', server: 'jp.example.test', port: 443 },
    { name: '新加坡 节点', type: 'hysteria2', server: 'sg.example.test', port: 443 },
    { name: '美国 节点', type: 'anytls', server: 'us.example.test', port: 443 },
    { name: '德国 节点', type: 'vmess', server: 'de.example.test', port: 443 }
  ],
  'proxy-groups': [],
  rules: []
}
sandbox.main(config)

const groups = Object.fromEntries(config['proxy-groups'].map((group) => [group.name, group]))
assert.equal(config.profile['store-selected'], true, '手动地区选择必须跨刷新保存')
assert.deepEqual([...groups['🌺 代理选择'].proxies], [
  '☁️ 万象节点', '🏮 香江灯影', '🪭 宝岛团扇', '🍑 东海桃影', '🪷 南洋莲舟', '⛵ 北美远航', '⛰️ 四海云游', 'DIRECT'
], '总开关必须直接提供所有实际地区和万象')
for (const name of ['☁️ 万象节点', '🏮 香江灯影', '🪭 宝岛团扇', '🍑 东海桃影', '🪷 南洋莲舟', '⛵ 北美远航', '⛰️ 四海云游']) {
  assert.equal(groups[name].type, 'url-test', name + ' 必须保持自动测速组')
}
assert.ok(config.rules.includes('RULE-SET,shanhai-global,🌺 代理选择'), '全球规则集必须经过总开关')
assert.ok(config.rules.includes('MATCH,🌺 代理选择'), '最终匹配流量必须经过总开关')
assert.equal(config.rules.includes('RULE-SET,shanhai-global,🗺️ 山海行旅'), false, '全球规则集不得再绕开总开关')
assert.equal(config.rules.includes('MATCH,🌺 桃源归途'), false, 'MATCH 不得再绕开总开关')
assert.ok(config.rules.includes('RULE-SET,shanhai-cn,🧧 神州直连'), '中国规则必须保持独立直连策略')
assert.ok(config.rules.includes('DOMAIN-SUFFIX,openai.com,📜 灵枢智算'), 'AI 专项规则必须保持独立策略')
assert.ok(config.rules.includes('DOMAIN-SUFFIX,youtube.com,🎭 梨园影音'), '影音专项规则必须保持独立策略')
assert.equal(Object.hasOwn(config, 'tun'), false, '测试版不得新增或接管 TUN')
assert.equal(Object.hasOwn(config.dns, 'listen'), false, '测试版不得新增 DNS 监听端口')

console.log('ShanHaiXing v0.2.3 main route selector tests passed')
