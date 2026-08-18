const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '..', 'ShanHaiXing-Adaptive-DualStackDNS.js'), 'utf8')
const nodes = [{ name: '🇭🇰 中国香港 01' }, { name: 'US Los Angeles 02' }]

function runWithDns(dns, inputNodes = nodes) {
  const sandbox = { console: { log() {} } }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'ShanHaiXing-Adaptive-DualStackDNS.js' })
  assert.equal(typeof sandbox.main, 'function', '双栈 DNS 版必须保留 main(config) 覆写入口')

  const config = {
    proxies: inputNodes.map((node) => ({ ...node })),
    'proxy-groups': [],
    rules: ['MATCH,DIRECT']
  }
  if (dns !== undefined) config.dns = dns
  sandbox.main(config)
  return config
}

// IPv4-only 网络仍可使用域名型 DoH 端点：它们会通过可用的 IPv4 路径建立连接。
const defaults = runWithDns(undefined)
assert.equal(defaults.ipv6, true, '双栈版必须启用内核 IPv6')
assert.equal(defaults.dns.enable, true, '双栈版必须启用 DNS')
assert.equal(defaults.dns.ipv6, true, '双栈版必须解析 AAAA 记录')
assert.equal(defaults.dns['enhanced-mode'], 'fake-ip', '双栈版必须使用 fake-ip 模式')
assert.equal(defaults.dns['fake-ip-range'], '198.18.0.1/16', '必须设置 IPv4 假 IP 范围')
assert.equal(defaults.dns['fake-ip-range6'], 'fdfe:dcba:9876::1/64', '必须设置 IPv6 假 IP 范围')
assert.deepEqual([...defaults.dns['default-nameserver']], ['119.29.29.29', '180.184.1.1'])
assert.deepEqual([...defaults.dns['proxy-server-nameserver']], ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'])
assert.deepEqual([...defaults.dns.nameserver], ['https://dns.google/dns-query', 'https://dns.cloudflare.com/dns-query'])
assert.equal(defaults.dns['respect-rules'], true, '补齐代理域名服务器后必须允许 DNS 遵守规则')
assert.equal(defaults.profile['store-selected'], false, '自动策略不得持久化旧的手动选中状态')

const mediaGroup = defaults['proxy-groups'].find((group) => group.name === '🎭 梨园影音')
assert.ok(mediaGroup, '必须生成梨园影音策略组')
assert.equal(mediaGroup.type, 'url-test', '梨园影音必须自动测速选择区域出口')
assert.deepEqual([...mediaGroup.proxies], ['🏮 香江灯影', '⛵ 北美远航', '☁️ 万象节点'], '梨园影音只能嵌套已生成地区测速组与全节点组')
assert.equal(mediaGroup.proxies.includes('DIRECT'), false, '影音自动测速组不可将 DIRECT 作为候选')

const imageGroup = defaults['proxy-groups'].find((group) => group.name === '🖼️ 影画速递')
assert.ok(imageGroup, '必须生成独立影画速递策略组')
assert.equal(imageGroup.type, 'url-test', '影画速递必须自动测速选取节点')
assert.deepEqual([...imageGroup.proxies], ['US Los Angeles 02', '🇭🇰 中国香港 01'], '影画速递应只包含实际节点且优先汇总日新美港台地区节点')
assert.equal(imageGroup.proxies.includes('DIRECT'), false, '自动测速组不可将 DIRECT 当作测速节点')

const expectedImageRules = [
  'DOMAIN-SUFFIX,instagram.com,🖼️ 影画速递',
  'DOMAIN-SUFFIX,cdninstagram.com,🖼️ 影画速递',
  'DOMAIN-SUFFIX,pximg.net,🖼️ 影画速递',
  'DOMAIN-SUFFIX,telegram.org,🖼️ 影画速递',
  'DOMAIN-SUFFIX,telegram-cdn.org,🖼️ 影画速递',
  'DOMAIN-SUFFIX,x.com,🖼️ 影画速递',
  'DOMAIN-SUFFIX,twimg.com,🖼️ 影画速递'
]
for (const rule of expectedImageRules) {
  assert.ok(defaults.rules.includes(rule), '必须包含影画速递自动分流规则：' + rule)
}
assert.equal(defaults.rules.includes('DOMAIN-SUFFIX,instagram.com,🎭 梨园影音'), false, 'Instagram 不得再由梨园影音接管')

// 仅有日本节点时，影画速递必须仅测速存在的日本节点。
const sparse = runWithDns(undefined, [{ name: '日本 东京 01' }])
const sparseImageGroup = sparse['proxy-groups'].find((group) => group.name === '🖼️ 影画速递')
assert.ok(sparseImageGroup, '缺失地区节点时也必须保留影画速递策略组')
assert.equal(sparseImageGroup.type, 'url-test', '缺失地区节点时仍必须自动测速')
assert.deepEqual([...sparseImageGroup.proxies], ['日本 东京 01'], '缺失地区节点时影画速递只能保留实际存在的节点')

const sparseMediaGroup = sparse['proxy-groups'].find((group) => group.name === '🎭 梨园影音')
assert.ok(sparseMediaGroup, '缺失地区节点时也必须保留梨园影音策略组')
assert.equal(sparseMediaGroup.type, 'url-test', '缺失地区节点时梨园影音仍必须自动测速')
assert.deepEqual([...sparseMediaGroup.proxies], ['🍑 东海桃影', '☁️ 万象节点'], '缺失地区节点时梨园影音只能嵌套存在的日本和全节点策略组')

// 用户已有私有 DNS 时不可覆盖其上游，只补齐 IPv6 与缺失的假 IP v6 范围。
const existing = runWithDns({
  enable: true,
  ipv6: false,
  'respect-rules': false,
  'default-nameserver': ['10.0.0.53'],
  'proxy-server-nameserver': ['https://resolver.example/dns-query'],
  nameserver: ['https://private.example/dns-query'],
  'fake-ip-range': '198.19.0.1/16'
})
assert.equal(existing.dns.ipv6, true, '已有配置也应启用 IPv6 DNS')
assert.deepEqual([...existing.dns['default-nameserver']], ['10.0.0.53'], '不得覆盖已有默认域名服务器')
assert.deepEqual([...existing.dns['proxy-server-nameserver']], ['https://resolver.example/dns-query'], '不得覆盖已有代理域名服务器')
assert.deepEqual([...existing.dns.nameserver], ['https://private.example/dns-query'], '不得覆盖已有域名服务器')
assert.equal(existing.dns['fake-ip-range'], '198.19.0.1/16', '不得覆盖已有 IPv4 假 IP 范围')
assert.equal(existing.dns['fake-ip-range6'], 'fdfe:dcba:9876::1/64', '缺失时必须补齐 IPv6 假 IP 范围')
assert.equal(existing.dns['respect-rules'], true, '已有代理域名服务器时可安全开启 respect-rules')

console.log('ShanHaiXing adaptive dual-stack DNS and automatic image routing tests passed')
