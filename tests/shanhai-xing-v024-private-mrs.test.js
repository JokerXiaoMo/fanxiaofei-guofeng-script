const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const scriptPath = path.join(__dirname, '..', 'ShanHaiXing-v0.2.4-PrivateMRS-Test.js')
const source = fs.readFileSync(scriptPath, 'utf8')
const sandbox = { console: { log() {} } }
vm.createContext(sandbox)
vm.runInContext(source, sandbox, { filename: 'ShanHaiXing-v0.2.4-PrivateMRS-Test.js' })
assert.equal(sandbox.VERSION, '0.2.4-private-mrs-test', '必须加载独立 v0.2.4 测试版')

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

const providers = config['rule-providers']
assert.deepEqual({ ...providers['shanhai-private-domain'] }, {
  type: 'http',
  behavior: 'domain',
  format: 'mrs',
  url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/private.mrs',
  path: './ruleset/shanhai-xing/private-domain.mrs',
  interval: 86400
}, '私有域名 MRS 提供者必须使用官方 domain/MRS 语义')
assert.deepEqual({ ...providers['shanhai-private-ip'] }, {
  type: 'http',
  behavior: 'ipcidr',
  format: 'mrs',
  url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/private.mrs',
  path: './ruleset/shanhai-xing/private-ip.mrs',
  interval: 86400
}, '私有 IP MRS 提供者必须使用官方 ipcidr/MRS 语义')

const domainRule = 'RULE-SET,shanhai-private-domain,DIRECT'
const ipRule = 'RULE-SET,shanhai-private-ip,DIRECT,no-resolve'
const adRule = 'RULE-SET,shanhai-ad,🛡️ 清风拂尘'
assert.ok(config.rules.includes(domainRule), '必须优先直连私有域名')
assert.ok(config.rules.includes(ipRule), '必须优先直连私有 IP，且禁止为此额外解析域名')
assert.ok(config.rules.indexOf(domainRule) < config.rules.indexOf(adRule), '私有域名规则必须早于广告和业务规则')
assert.ok(config.rules.indexOf(ipRule) < config.rules.indexOf(adRule), '私有 IP 规则必须早于广告和业务规则')
assert.ok(config.rules.includes('RULE-SET,shanhai-global,🌺 代理选择'), '全球规则集必须仍经过总开关')
assert.ok(config.rules.includes('MATCH,🌺 代理选择'), 'MATCH 必须仍经过总开关')
assert.equal(config.profile['store-selected'], true, '地区选择必须仍跨刷新保存')
assert.equal(Object.hasOwn(config, 'tun'), false, '测试版不得新增或接管 TUN')
assert.equal(Object.hasOwn(config.dns, 'listen'), false, '测试版不得新增 DNS 监听端口')

console.log('ShanHaiXing v0.2.4 private MRS tests passed')
