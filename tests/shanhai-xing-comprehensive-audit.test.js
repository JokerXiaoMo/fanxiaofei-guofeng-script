const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const scriptPath = path.join(__dirname, '..', 'ShanHaiXing-Adaptive-DualStackDNS.js')
const source = fs.readFileSync(scriptPath, 'utf8')

const regionFixtures = [
  { key: 'HK', name: '中国香港 01', group: '🏮 香江灯影' },
  { key: 'TW', name: '中国台湾 01', group: '🪭 宝岛团扇' },
  { key: 'JP', name: '日本 东京 01', group: '🍑 东海桃影' },
  { key: 'SG', name: '新加坡 01', group: '🪷 南洋莲舟' },
  { key: 'US', name: 'US Los Angeles 01', group: '⛵ 北美远航' },
  { key: 'OTHER', name: '德国 Frankfurt 01', group: '⛰️ 四海云游' }
]

const imageDomains = [
  'instagram.com', 'cdninstagram.com', 'fbcdn.net',
  'pixiv.net', 'pximg.net', 'pixivision.net', 'pixivsketch.net',
  'telegram.org', 't.me', 'telegram.me', 'telegra.ph', 'telesco.pe', 'telegram-cdn.org',
  'x.com', 'twitter.com', 'twimg.com'
]

const mediaDomains = ['youtube.com', 'googlevideo.com', 'netflix.com', 'nflxvideo.net']

function execute(proxies, dns) {
  const sandbox = { console: { log() {} } }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'ShanHaiXing-Adaptive-DualStackDNS.js' })
  assert.equal(typeof sandbox.main, 'function', '必须保留 main(config) 覆写入口')
  const config = { proxies: proxies.map((name) => ({ name })), 'proxy-groups': [], rules: [] }
  if (dns !== undefined) config.dns = dns
  return sandbox.main(config)
}

function targetOf(rule) {
  const parts = rule.split(',')
  if (parts[0] === 'MATCH') return parts[1]
  if (parts[0] === 'IP-CIDR' || parts[0] === 'GEOIP') return parts[2]
  return parts[2]
}

function hasCycle(edges) {
  const visiting = new Set()
  const visited = new Set()
  function visit(name) {
    if (visiting.has(name)) return true
    if (visited.has(name)) return false
    visiting.add(name)
    for (const child of edges.get(name) || []) {
      if (visit(child)) return true
    }
    visiting.delete(name)
    visited.add(name)
    return false
  }
  return [...edges.keys()].some(visit)
}

function validateGeneratedConfig(config, nodeNames) {
  const groups = config['proxy-groups']
  assert.ok(Array.isArray(groups) && groups.length > 0, '必须生成策略组')
  assert.equal(groups[0].name, '🌺 代理选择', '代理选择必须固定在策略组第一位')

  const names = groups.map((group) => group.name)
  assert.equal(new Set(names).size, names.length, '策略组名称不得重复')
  const groupNames = new Set(names)
  const nodeSet = new Set(nodeNames)
  const edges = new Map()

  for (const group of groups) {
    assert.ok(['select', 'url-test', 'fallback'].includes(group.type), '策略组类型必须受支持：' + group.name)
    assert.ok(Array.isArray(group.proxies) && group.proxies.length > 0, '策略组候选不得为空：' + group.name)
    assert.equal(new Set(group.proxies).size, group.proxies.length, '策略组候选不得重复：' + group.name)
    if (group.type === 'url-test' || group.type === 'fallback') {
      assert.ok(typeof group.url === 'string' && group.url.length > 0, '自动策略组必须有测速地址：' + group.name)
      assert.ok(Number.isInteger(group.interval) && group.interval > 0, '自动策略组必须有正数测速间隔：' + group.name)
      assert.equal(group.proxies.includes('DIRECT'), false, '自动策略组不得把 DIRECT 当作测速候选：' + group.name)
      assert.equal(group.proxies.includes('REJECT'), false, '自动策略组不得把 REJECT 当作测速候选：' + group.name)
    }
    const childGroups = group.proxies.filter((name) => groupNames.has(name))
    edges.set(group.name, childGroups)
    for (const proxy of group.proxies) {
      assert.ok(
        nodeSet.has(proxy) || groupNames.has(proxy) || proxy === 'DIRECT' || proxy === 'REJECT',
        '策略组引用了不存在的候选：' + group.name + ' -> ' + proxy
      )
    }
  }
  assert.equal(hasCycle(edges), false, '策略组引用不得形成循环')

  const all = groups.find((group) => group.name === '☁️ 万象节点')
  assert.ok(all && all.type === 'fallback', '万象节点必须为可回退的自动策略组')
  assert.equal(all.proxies.includes('☁️ 万象节点'), false, '万象节点不得自我引用')

  const media = groups.find((group) => group.name === '🎭 梨园影音')
  assert.ok(media && media.type === 'url-test', '梨园影音必须为自动测速策略组')
  assert.equal(media.proxies.includes('DIRECT'), false, '梨园影音不得要求用户手动切换到 DIRECT')
  for (const candidate of media.proxies) {
    assert.ok(groupNames.has(candidate), '梨园影音必须只嵌套已生成区域策略组')
  }

  const image = groups.find((group) => group.name === '🖼️ 影画速递')
  assert.ok(image && image.type === 'url-test', '影画速递必须为独立自动测速策略组')
  for (const candidate of image.proxies) {
    assert.ok(nodeSet.has(candidate), '影画速递必须只测试实际节点')
  }

  assert.equal(new Set(config.rules).size, config.rules.length, '生成规则不得重复')
  const allowedTargets = new Set([...groupNames, 'DIRECT', 'REJECT'])
  for (const rule of config.rules) {
    assert.equal(typeof rule, 'string', '规则必须是字符串')
    assert.ok(allowedTargets.has(targetOf(rule)), '规则引用了不存在的策略目标：' + rule)
  }

  const indexOf = (rule) => config.rules.indexOf(rule)
  const adIndex = indexOf('RULE-SET,shanhai-ad,🛡️ 清风拂尘')
  const cnIndex = indexOf('RULE-SET,shanhai-cn,🧧 神州直连')
  const globalIndex = indexOf('RULE-SET,shanhai-global,🗺️ 山海行旅')
  const matchIndex = indexOf('MATCH,🌺 桃源归途')
  assert.ok(adIndex >= 0 && adIndex < cnIndex && cnIndex < globalIndex && globalIndex < matchIndex, '广告、国内、通用和最终规则顺序必须稳定')

  for (const domain of mediaDomains) {
    const rule = 'DOMAIN-SUFFIX,' + domain + ',🎭 梨园影音'
    assert.ok(config.rules.includes(rule), '影音域名必须命中梨园影音：' + domain)
    assert.ok(indexOf(rule) < cnIndex, '影音域名必须优先于国内规则：' + domain)
  }
  for (const domain of imageDomains) {
    const rule = 'DOMAIN-SUFFIX,' + domain + ',🖼️ 影画速递'
    assert.ok(config.rules.includes(rule), '图片社交域名必须命中影画速递：' + domain)
    assert.ok(indexOf(rule) < cnIndex, '图片社交域名必须优先于国内规则：' + domain)
    assert.equal(config.rules.includes('DOMAIN-SUFFIX,' + domain + ',🎭 梨园影音'), false, '图片社交域名不得被梨园影音重复接管：' + domain)
  }

  assert.deepEqual([...config.dns['proxy-server-nameserver']], ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'], 'respect-rules 前置的代理域名服务器必须存在')
  assert.equal(config.dns['respect-rules'], true, '必须启用 respect-rules')
  assert.equal(config.dns.ipv6, true, '必须启用 IPv6 DNS')
  assert.equal(config.dns['fake-ip-range6'], 'fdfe:dcba:9876::1/64', '必须保留 IPv6 Fake-IP 范围')
}

for (let mask = 1; mask < (1 << regionFixtures.length); mask += 1) {
  const names = regionFixtures.filter((_, index) => mask & (1 << index)).map((item) => item.name)
  validateGeneratedConfig(execute(names), names)
}

const preservedDns = {
  'default-nameserver': ['10.0.0.53'],
  'proxy-server-nameserver': ['https://resolver.example/dns-query'],
  nameserver: ['https://private.example/dns-query']
}
const allNames = regionFixtures.map((item) => item.name)
const preserved = execute(allNames, preservedDns)
assert.deepEqual([...preserved.dns['default-nameserver']], ['10.0.0.53'], '不得覆盖用户已有默认 DNS')
assert.deepEqual([...preserved.dns['proxy-server-nameserver']], ['https://resolver.example/dns-query'], '不得覆盖用户已有代理 DNS')
assert.deepEqual([...preserved.dns.nameserver], ['https://private.example/dns-query'], '不得覆盖用户已有 DNS 上游')

const reservedNameCollision = execute(['🎭 梨园影音', '日本 东京 02'])
validateGeneratedConfig(reservedNameCollision, ['日本 东京 02'])
const collisionAllGroup = reservedNameCollision['proxy-groups'].find((group) => group.name === '☁️ 万象节点')
assert.deepEqual([...collisionAllGroup.proxies], ['日本 东京 02'], '与策略组重名的订阅节点必须被排除，避免 Mihomo 重名错误')
const collisionImageGroup = reservedNameCollision['proxy-groups'].find((group) => group.name === '🖼️ 影画速递')
assert.equal(collisionImageGroup.proxies.includes('🎭 梨园影音'), false, '影画速递不得引用与策略组重名的节点')

const empty = execute([])
assert.deepEqual(empty['proxy-groups'], [], '无节点时不得写入策略组')
assert.deepEqual(empty.rules, [], '无节点时不得写入规则')

const infoOnly = execute(['剩余流量 1024 GB', '到期时间 2099-01-01'])
assert.deepEqual(infoOnly['proxy-groups'], [], '仅信息行时不得写入策略组')
assert.deepEqual(infoOnly.rules, [], '仅信息行时不得写入规则')

console.log('ShanHaiXing comprehensive configuration audit passed: 63 region combinations')
