const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const scriptPath = path.join(__dirname, '..', 'ShanHaiXing-v0.2.1-DNS-Hybrid-Test.js')
const source = fs.readFileSync(scriptPath, 'utf8')
const nodes = [
  { name: '中国香港 SS 01', type: 'ss', server: 'hk.example.test', port: 443 },
  { name: '美国 VLESS 02', type: 'vless', server: 'us.example.test', port: 443 }
]

function runWithDns(dns, hosts) {
  const sandbox = { console: { log() {} } }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'ShanHaiXing-v0.2.1-DNS-Hybrid-Test.js' })
  assert.equal(sandbox.VERSION, '0.2.1-dns-hybrid-test', '必须加载独立 DNS 测试版')
  const config = {
    proxies: nodes.map((node) => ({ ...node })),
    'proxy-groups': [],
    rules: ['MATCH,DIRECT']
  }
  if (dns !== undefined) config.dns = dns
  if (hosts !== undefined) config.hosts = hosts
  sandbox.main(config)
  return config
}

const defaults = runWithDns(undefined)
assert.equal(defaults.dns.enable, true, '必须启用 Mihomo DNS 模块')
assert.equal(defaults.dns.ipv6, true, '必须允许 AAAA 解析')
assert.equal(defaults.dns['enhanced-mode'], 'fake-ip', '必须使用 Fake-IP 模式')
assert.equal(defaults.dns['fake-ip-range'], '198.18.0.1/16')
assert.equal(defaults.dns['fake-ip-range6'], 'fdfe:dcba:9876::1/64')
assert.deepEqual([...defaults.dns['default-nameserver']], ['223.5.5.5', '1.1.1.1', '2400:3200::1'], '指定 DNS 必须用于 DNS 上游端点引导解析')
assert.deepEqual([...defaults.dns['proxy-server-nameserver']], ['223.5.5.5', '1.1.1.1', '2400:3200::1'], '指定 DNS 必须用于代理节点域名解析')
assert.deepEqual([...defaults.dns.nameserver], ['https://dns.alidns.com/dns-query', 'https://cloudflare-dns.com/dns-query'], '普通域名查询必须保留加密 DoH 上游')
assert.deepEqual([...defaults.hosts['dns.alidns.com']], ['223.5.5.5', '2400:3200::1'], '阿里 DoH 端点必须由指定 IPv4 与 IPv6 静态引导')
assert.deepEqual([...defaults.hosts['cloudflare-dns.com']], ['1.1.1.1'], 'Cloudflare DoH 端点必须由指定 IPv4 静态引导')
assert.equal(defaults.dns['respect-rules'], true, '配置代理节点专用 DNS 后必须让 DNS 连接遵守规则')
assert.equal(Object.hasOwn(defaults, 'tun'), false, 'DNS 测试版不得新增或接管 TUN')
assert.equal(Object.hasOwn(defaults.dns, 'listen'), false, 'DNS 测试版不得新增监听端口')
assert.equal(Object.hasOwn(defaults.dns, 'direct-nameserver'), false, 'DNS 测试版不得强制为 DIRECT 流量另设上游')
assert.equal(Object.hasOwn(defaults.dns, 'fallback'), false, '不可将 1.1.1.1 误配置为会并发查询的 fallback 并称为严格备用')

const existing = runWithDns({
  enable: true,
  ipv6: false,
  'default-nameserver': ['10.0.0.53'],
  'proxy-server-nameserver': ['https://resolver.example/dns-query'],
  nameserver: ['https://private.example/dns-query'],
  'fake-ip-range': '198.19.0.1/16'
}, {
  'dns.alidns.com': ['203.0.113.8'],
  'custom.example': ['203.0.113.9']
})
assert.deepEqual([...existing.dns['default-nameserver']], ['10.0.0.53'], '不得覆盖用户现有默认 DNS')
assert.deepEqual([...existing.dns['proxy-server-nameserver']], ['https://resolver.example/dns-query'], '不得覆盖用户现有代理节点 DNS')
assert.deepEqual([...existing.dns.nameserver], ['https://private.example/dns-query'], '不得覆盖用户现有查询 DNS')
assert.equal(existing.dns['fake-ip-range'], '198.19.0.1/16', '不得覆盖用户现有 Fake-IP 范围')
assert.equal(existing.dns['fake-ip-range6'], 'fdfe:dcba:9876::1/64', '缺失时应补齐 IPv6 Fake-IP 范围')
assert.equal(existing.dns.ipv6, true, '测试版应启用 IPv6 DNS 解析')
assert.deepEqual([...existing.hosts['dns.alidns.com']], ['203.0.113.8'], '不得覆盖用户已有阿里 DoH hosts 映射')
assert.deepEqual([...existing.hosts['custom.example']], ['203.0.113.9'], '不得覆盖无关用户 hosts 映射')
assert.deepEqual([...existing.hosts['cloudflare-dns.com']], ['1.1.1.1'], '缺失的 Cloudflare DoH 映射必须补齐')

const emptyArrays = runWithDns({
  'default-nameserver': [],
  'proxy-server-nameserver': [],
  nameserver: []
})
assert.deepEqual([...emptyArrays.dns['default-nameserver']], ['223.5.5.5', '1.1.1.1', '2400:3200::1'], '空默认 DNS 数组必须获得测试版默认值')
assert.deepEqual([...emptyArrays.dns['proxy-server-nameserver']], ['223.5.5.5', '1.1.1.1', '2400:3200::1'], '空代理节点 DNS 数组必须获得测试版默认值')
assert.deepEqual([...emptyArrays.dns.nameserver], ['https://dns.alidns.com/dns-query', 'https://cloudflare-dns.com/dns-query'], '空查询 DNS 数组必须获得 DoH 默认值')

console.log('ShanHaiXing v0.2.1 DNS hybrid tests passed')
