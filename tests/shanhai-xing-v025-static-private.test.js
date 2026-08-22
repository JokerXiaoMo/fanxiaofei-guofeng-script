const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const scriptPath = path.join(__dirname, '..', 'ShanHaiXing-v0.2.5-StaticPrivate-Test.js')
const source = fs.readFileSync(scriptPath, 'utf8')
const sandbox = { console: { log() {} } }
vm.createContext(sandbox)
vm.runInContext(source, sandbox, { filename: 'ShanHaiXing-v0.2.5-StaticPrivate-Test.js' })
assert.equal(sandbox.VERSION, '0.2.5-static-private-test', '必须加载独立 v0.2.5 测试版')

const config = {
  proxies: [
    { name: '中国香港 节点', type: 'ss', server: 'hk.example.test', port: 443 },
    { name: '日本 节点', type: 'vless', server: 'jp.example.test', port: 443 },
    { name: '美国 节点', type: 'trojan', server: 'us.example.test', port: 443 }
  ],
  'proxy-groups': [],
  rules: []
}
sandbox.main(config)

const expectedPrivateRules = [
  'DOMAIN,localhost,DIRECT',
  'DOMAIN-SUFFIX,lan,DIRECT',
  'DOMAIN-SUFFIX,local,DIRECT',
  'DOMAIN-SUFFIX,home.arpa,DIRECT',
  'IP-CIDR,10.0.0.0/8,DIRECT,no-resolve',
  'IP-CIDR,100.64.0.0/10,DIRECT,no-resolve',
  'IP-CIDR,127.0.0.0/8,DIRECT,no-resolve',
  'IP-CIDR,169.254.0.0/16,DIRECT,no-resolve',
  'IP-CIDR,172.16.0.0/12,DIRECT,no-resolve',
  'IP-CIDR,192.168.0.0/16,DIRECT,no-resolve',
  'IP-CIDR,224.0.0.0/4,DIRECT,no-resolve',
  'IP-CIDR,240.0.0.0/4,DIRECT,no-resolve',
  'IP-CIDR6,::1/128,DIRECT,no-resolve',
  'IP-CIDR6,fc00::/7,DIRECT,no-resolve',
  'IP-CIDR6,fe80::/10,DIRECT,no-resolve'
]
for (const rule of expectedPrivateRules) {
  assert.ok(config.rules.includes(rule), '缺少静态私有直连规则：' + rule)
}
assert.ok(config.rules.indexOf('IP-CIDR6,fe80::/10,DIRECT,no-resolve') < config.rules.indexOf('RULE-SET,shanhai-ad,🛡️ 清风拂尘'), '私有规则必须早于广告与业务规则')
assert.equal(Object.hasOwn(config['rule-providers'], 'shanhai-private-domain'), false, '不得新增私有域名远程 MRS provider')
assert.equal(Object.hasOwn(config['rule-providers'], 'shanhai-private-ip'), false, '不得新增私有 IP 远程 MRS provider')
assert.equal(Object.keys(config['rule-providers']).length, 3, '规则提供者必须仍仅保留既有三项远程 classical YAML')
assert.ok(config.rules.includes('RULE-SET,shanhai-global,🌺 代理选择'), '全球规则集必须仍经过总开关')
assert.ok(config.rules.includes('MATCH,🌺 代理选择'), 'MATCH 必须仍经过总开关')
assert.equal(config.profile['store-selected'], true, '地区选择必须仍跨刷新保存')
assert.equal(Object.hasOwn(config, 'tun'), false, '不得新增或接管 TUN')
assert.equal(Object.hasOwn(config.dns, 'listen'), false, '不得新增 DNS 监听端口')

console.log('ShanHaiXing v0.2.5 static private rules tests passed')
