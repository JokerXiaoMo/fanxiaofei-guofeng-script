// Mihomo 覆写脚本：番小绯·半纸砚花 V0.1
// 适用：FlClash v0.8.85+ 与支持 main(config) 的 BettBox 等 Mihomo 客户端
// 设计：完整订阅保留全部地区候选；缺少地区节点时仅引用实际生成的策略组。
// 正式版：保留总开关实际路由与选择保存，并以静态规则补齐常见私有目标直连；不新增远程规则下载。

var VERSION = '番小绯·半纸砚花 V0.1'
var TEST_URL = 'https://www.gstatic.com/generate_204'
var TEST_INTERVAL = 600
var TEST_TOLERANCE = 50

// 参考 Mihomo 官方 DNS 文档与高星开源配置：IPv4 纯 IP 负责 DNS 上游引导；
// DoH 域名端点支持按当前网络的 IPv4/IPv6 可用路径建立连接。
var DNS_DEFAULT_NAMESERVER = ['119.29.29.29', '180.184.1.1']
var DNS_PROXY_SERVER_NAMESERVER = ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query']
var DNS_NAMESERVER = ['https://dns.google/dns-query', 'https://dns.cloudflare.com/dns-query']
var DNS_FAKE_IP_RANGE = '198.18.0.1/16'
var DNS_FAKE_IP_RANGE6 = 'fdfe:dcba:9876::1/64'

var NAME = {
  MAIN: '🌺 代理选择',
  ALL: '☁️ 万象节点',
  HK: '🏮 香江灯影',
  TW: '🪭 宝岛团扇',
  JP: '🍑 东海桃影',
  SG: '🪷 南洋莲舟',
  US: '⛵ 北美远航',
  OTHER: '⛰️ 四海云游',
  HIGH_RATE: '🔴 高倍率节点',
  LOW_RATE: '🟢 低倍率节点',
  AI: '📜 灵枢智算',
  MEDIA: '🎭 梨园影音',
  IMAGE: '🖼️ 影画速递',
  GOOGLE: '🔭 云台观星',
  DEV: '🧰 百工工坊',
  GLOBAL: '🗺️ 山海行旅',
  CN: '🧧 神州直连',
  FINAL: '🌺 桃源归途',
  AD: '🛡️ 清风拂尘'
}

var RESERVED_GROUP_NAMES = [
  NAME.MAIN, NAME.ALL, NAME.HK, NAME.TW, NAME.JP, NAME.SG, NAME.US, NAME.OTHER,
  NAME.HIGH_RATE, NAME.LOW_RATE, NAME.AI, NAME.MEDIA, NAME.IMAGE, NAME.GOOGLE, NAME.DEV, NAME.GLOBAL,
  NAME.CN, NAME.FINAL, NAME.AD
]

var REGIONS = [
  { key: 'HK', name: NAME.HK, pattern: /香港|澳门|澳門|hong\s?-?\s?kong|maca[ou]|\bhkg?\b|\bmo[\s_#-]*\d/i },
  { key: 'TW', name: NAME.TW, pattern: /台湾|台北|taiwan|taipei|\btwn?\b/i },
  { key: 'JP', name: NAME.JP, pattern: /日本|东京|大阪|japan|tokyo|osaka|\bjpn?\b/i },
  { key: 'SG', name: NAME.SG, pattern: /新加坡|singapore|\bsgp?\b/i },
  { key: 'US', name: NAME.US, pattern: /美国|洛杉矶|西雅图|纽约|united\s+states|america|usa|los\s+angeles|seattle|new\s+york|\bus\b/i }
]

var INFO_NODE = /剩余|流量|到期|重置|官网|订阅|网址|套餐|邮箱|\b(?:total|used|expire|email|website|channel)\b/i

// 只识别带明确倍率标记的数值，避免节点中的普通编号、端口或自然语言造成误判。
var MULTIPLIER_SUFFIX = /(?:^|[^0-9.])(\d+(?:\.\d+)?)\s*(?:倍|[xX*×✕✖⨉])(?=$|[^A-Za-z0-9])/g
var MULTIPLIER_PREFIX = /(?:倍率\s*[:：=]?\s*|[xX*×✕✖⨉]\s*)(\d+(?:\.\d+)?)(?=$|[^A-Za-z0-9])/g

function log(message) {
  if (typeof console !== 'undefined' && console.log) console.log('[山海行自适应 ' + VERSION + '] ' + message)
}

function unique(list) {
  var output = []
  var seen = {}
  for (var i = 0; i < list.length; i += 1) {
    var item = list[i]
    if (!item || seen[item]) continue
    seen[item] = true
    output.push(item)
  }
  return output
}

function ensureArray(object, key) {
  if (!Array.isArray(object[key])) object[key] = []
  return object[key]
}

function replaceArray(target, values) {
  target.splice(0, target.length)
  for (var i = 0; i < values.length; i += 1) target.push(values[i])
}

function newUrlTest(name, proxies) {
  return {
    name: name,
    type: 'url-test',
    url: TEST_URL,
    interval: TEST_INTERVAL,
    tolerance: TEST_TOLERANCE,
    lazy: true,
    proxies: proxies.slice()
  }
}

function newSelect(name, proxies) {
  return { name: name, type: 'select', proxies: unique(proxies) }
}

function detectRegion(nodeName) {
  for (var i = 0; i < REGIONS.length; i += 1) {
    if (REGIONS[i].pattern.test(nodeName)) return REGIONS[i].key
  }
  return 'OTHER'
}

function isReservedGroupName(name) {
  return RESERVED_GROUP_NAMES.indexOf(name) !== -1
}

function detectRateTier(nodeName) {
  var patterns = [MULTIPLIER_SUFFIX, MULTIPLIER_PREFIX]
  var hasHighRate = false
  var hasLowRate = false

  for (var i = 0; i < patterns.length; i += 1) {
    patterns[i].lastIndex = 0
    var match
    while ((match = patterns[i].exec(nodeName)) !== null) {
      var value = parseFloat(match[1])
      if (!isFinite(value) || value <= 0) continue
      if (value >= 2) hasHighRate = true
      else if (value <= 0.5) hasLowRate = true
    }
  }

  // 一个名称如同时含多个倍率，以高倍率优先，避免同一节点落入两个成本组。
  if (hasHighRate) return 'HIGH_RATE'
  if (hasLowRate) return 'LOW_RATE'
  return null
}

function collectNodes(proxies) {
  var buckets = { ALL: [], HK: [], TW: [], JP: [], SG: [], US: [], OTHER: [], HIGH_RATE: [], LOW_RATE: [] }
  for (var i = 0; i < proxies.length; i += 1) {
    var proxy = proxies[i]
    if (!proxy || typeof proxy !== 'object' || !proxy.name) continue
    var nodeName = String(proxy.name)
    if (INFO_NODE.test(nodeName)) continue
    // Mihomo 禁止代理节点和策略组同名；跳过该罕见冲突节点，保障整份配置可加载。
    if (isReservedGroupName(nodeName)) {
      log('跳过与内置策略组重名的节点：' + nodeName)
      continue
    }
    buckets.ALL.push(nodeName)
    buckets[detectRegion(nodeName)].push(nodeName)
    var rateTier = detectRateTier(nodeName)
    if (rateTier) buckets[rateTier].push(nodeName)
  }
  return buckets
}

function activeRegionNames(buckets) {
  var names = [NAME.ALL]
  for (var i = 0; i < REGIONS.length; i += 1) {
    if (buckets[REGIONS[i].key].length > 0) names.push(REGIONS[i].name)
  }
  if (buckets.OTHER.length > 0) names.push(NAME.OTHER)
  return names
}

function selectCandidates(regions, directFirst) {
  var choices = regions.slice()
  if (directFirst) choices.unshift('DIRECT')
  else choices.push('DIRECT')
  return choices
}

// 只返回当前订阅中已经创建的策略组名称，禁止业务组引用空地区组。
function availableRegionNames(buckets, keys) {
  var names = []
  for (var i = 0; i < keys.length; i += 1) {
    var key = keys[i]
    if (key === 'ALL' && buckets.ALL.length > 0) names.push(NAME.ALL)
    else if (key === 'OTHER' && buckets.OTHER.length > 0) names.push(NAME.OTHER)
    else if (buckets[key] && buckets[key].length > 0 && NAME[key]) names.push(NAME[key])
  }
  return names
}

function buildGroups(buckets) {
  var regions = activeRegionNames(buckets)
  // 总开关置顶，便于在 FlClash 代理页首项直接切换。
  var groups = [newSelect(NAME.MAIN, selectCandidates(regions, false))]
  // 万象节点只直接测速真实节点，不嵌套低倍率策略组。
  // 真实内核验证表明，嵌套 url-test 只会跟随子组当前选择，无法把子组延迟与其他节点持续公平比较。
  // 低倍率节点排在前面作为初始成本偏好；所有候选仍由同一个 url-test 按实际延迟持续择优。
  var allCandidates = buckets.LOW_RATE.slice()
  for (var allIndex = 0; allIndex < buckets.ALL.length; allIndex += 1) {
    if (buckets.LOW_RATE.indexOf(buckets.ALL[allIndex]) === -1) allCandidates.push(buckets.ALL[allIndex])
  }
  groups.push(newUrlTest(NAME.ALL, allCandidates))

  for (var i = 0; i < REGIONS.length; i += 1) {
    var region = REGIONS[i]
    if (buckets[region.key].length > 0) groups.push(newUrlTest(region.name, buckets[region.key]))
  }
  if (buckets.OTHER.length > 0) groups.push(newUrlTest(NAME.OTHER, buckets.OTHER))

  // 倍率是与地区正交的节点属性：命中节点会同时保留在原地区组和倍率组。
  if (buckets.HIGH_RATE.length > 0) groups.push(newUrlTest(NAME.HIGH_RATE, buckets.HIGH_RATE))
  if (buckets.LOW_RATE.length > 0) groups.push(newUrlTest(NAME.LOW_RATE, buckets.LOW_RATE))

  var aiCandidates = availableRegionNames(buckets, ['US', 'SG', 'JP', 'ALL'])
  // 影音服务嵌套既有区域测速组，再以 url-test 自动选择最佳区域出口。
  var mediaCandidates = availableRegionNames(buckets, ['HK', 'TW', 'JP', 'US', 'SG', 'ALL'])
  var imageNodes = unique(
    buckets.JP.concat(buckets.SG, buckets.US, buckets.HK, buckets.TW, buckets.OTHER)
  )
  var globalCandidates = availableRegionNames(buckets, ['US', 'JP', 'SG', 'ALL'])

  groups.push(newSelect(NAME.AI, selectCandidates(aiCandidates, false)))
  groups.push(newUrlTest(NAME.MEDIA, mediaCandidates))
  groups.push(newUrlTest(NAME.IMAGE, imageNodes))
  groups.push(newSelect(NAME.GOOGLE, selectCandidates(globalCandidates, false)))
  groups.push(newSelect(NAME.DEV, selectCandidates(globalCandidates, false)))
  groups.push(newSelect(NAME.GLOBAL, selectCandidates(regions, false)))
  groups.push(newSelect(NAME.CN, selectCandidates(regions, true)))
  groups.push(newSelect(NAME.FINAL, selectCandidates(regions, false)))
  groups.push(newSelect(NAME.AD, ['REJECT', 'DIRECT']))
  return groups
}

function provider(path, localPath) {
  return {
    type: 'http',
    behavior: 'classical',
    format: 'yaml',
    url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/' + path,
    path: './ruleset/shanhai-xing/' + localPath,
    interval: 86400
  }
}

function installRules(config) {
  config['rule-providers'] = {
    'shanhai-ad': provider('rule/Clash/AdvertisingLite/AdvertisingLite_Classical.yaml', 'advertising-lite.yaml'),
    'shanhai-cn': provider('rule/Clash/ChinaMax/ChinaMax_Classical.yaml', 'china-max.yaml'),
    'shanhai-global': provider('rule/Clash/Global/Global_Classical.yaml', 'global.yaml')
  }

  var rules = [
    // 常见私有域名与网络地址优先直连，避免 loopback、链路本地或局域网目标误进广告或代理规则。
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
    'IP-CIDR6,fe80::/10,DIRECT,no-resolve',
    'RULE-SET,shanhai-ad,' + NAME.AD,
    'DOMAIN-SUFFIX,openai.com,' + NAME.AI,
    'DOMAIN-SUFFIX,chatgpt.com,' + NAME.AI,
    'DOMAIN-SUFFIX,claude.ai,' + NAME.AI,
    'DOMAIN-SUFFIX,anthropic.com,' + NAME.AI,
    'DOMAIN-SUFFIX,generativelanguage.googleapis.com,' + NAME.AI,
    'DOMAIN-SUFFIX,youtube.com,' + NAME.MEDIA,
    'DOMAIN-SUFFIX,googlevideo.com,' + NAME.MEDIA,
    'DOMAIN-SUFFIX,netflix.com,' + NAME.MEDIA,
    'DOMAIN-SUFFIX,nflxvideo.net,' + NAME.MEDIA,
    // 海外社交平台的图片、视频、动图与媒体 CDN 交由独立测速组自动选择节点。
    'DOMAIN-SUFFIX,instagram.com,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,cdninstagram.com,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,fbcdn.net,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,pixiv.net,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,pximg.net,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,pixivision.net,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,pixivsketch.net,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,telegram.org,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,t.me,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,telegram.me,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,telegra.ph,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,telesco.pe,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,telegram-cdn.org,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,x.com,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,twitter.com,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,twimg.com,' + NAME.IMAGE,
    'DOMAIN-SUFFIX,google.com,' + NAME.GOOGLE,
    'DOMAIN-SUFFIX,googleapis.com,' + NAME.GOOGLE,
    'DOMAIN-SUFFIX,gstatic.com,' + NAME.GOOGLE,
    'DOMAIN-SUFFIX,github.com,' + NAME.DEV,
    'DOMAIN-SUFFIX,githubusercontent.com,' + NAME.DEV,
    'DOMAIN-SUFFIX,githubassets.com,' + NAME.DEV,
    'DOMAIN-SUFFIX,gitlab.com,' + NAME.DEV,
    'RULE-SET,shanhai-cn,' + NAME.CN,
    'GEOIP,CN,' + NAME.CN + ',no-resolve',
    // 总开关必须位于真实规则出口；否则 BettBox 虽能高亮地区卡片，通用流量仍走独立默认组。
    'RULE-SET,shanhai-global,' + NAME.MAIN,
    'MATCH,' + NAME.MAIN
  ]
  replaceArray(ensureArray(config, 'rules'), rules)
}

function hasNonEmptyStrings(value) {
  return Array.isArray(value) && value.some(function (item) {
    return typeof item === 'string' && item.trim().length > 0
  })
}

function installDnsDefaults(dns, key, values) {
  if (!hasNonEmptyStrings(dns[key])) dns[key] = values.slice()
}

function applySafeDefaults(config) {
  config['unified-delay'] = true
  config['tcp-concurrent'] = true
  config.ipv6 = true

  if (!config.dns || typeof config.dns !== 'object' || Array.isArray(config.dns)) config.dns = {}
  config.dns.enable = true
  config.dns.ipv6 = true
  if (!config.dns['enhanced-mode']) config.dns['enhanced-mode'] = 'fake-ip'
  if (!config.dns['fake-ip-range']) config.dns['fake-ip-range'] = DNS_FAKE_IP_RANGE
  if (!config.dns['fake-ip-range6']) config.dns['fake-ip-range6'] = DNS_FAKE_IP_RANGE6

  // 仅在订阅没有指定 DNS 时补齐双栈可回退的上游，避免覆盖用户已有的私有 DNS。
  installDnsDefaults(config.dns, 'default-nameserver', DNS_DEFAULT_NAMESERVER)
  installDnsDefaults(config.dns, 'proxy-server-nameserver', DNS_PROXY_SERVER_NAMESERVER)
  installDnsDefaults(config.dns, 'nameserver', DNS_NAMESERVER)

  // 已补齐 proxy-server-nameserver，respect-rules 的内核前置条件现在成立。
  config.dns['respect-rules'] = true

  if (!config.profile || typeof config.profile !== 'object' || Array.isArray(config.profile)) config.profile = {}
  // 保留 select 组的人工地区选择，避免 BettBox 刷新覆写或 Mihomo 重启后回到首项“☁️ 万象节点”。
  // URLTest 组仍按自身测速逻辑更新最优节点；本测试版不对 URLTest 写入固定选择。
  config.profile['store-selected'] = true
}

function main(config) {
  try {
    if (!config || typeof config !== 'object') return config
    if (!Array.isArray(config.proxies) || config.proxies.length === 0) {
      log('未发现可用节点，跳过覆写。')
      return config
    }

    var nodes = collectNodes(config.proxies)
    if (nodes.ALL.length === 0) {
      log('节点均为订阅信息行，跳过覆写。')
      return config
    }

    applySafeDefaults(config)
    replaceArray(ensureArray(config, 'proxy-groups'), buildGroups(nodes))
    installRules(config)

    log('完成：' + nodes.ALL.length + ' 个节点，' + config['proxy-groups'].length + ' 个策略组，' + config.rules.length + ' 条规则。')
    return config
  } catch (error) {
    log('发生错误，保留原配置：' + String(error))
    return config
  }
}

// FlClash、BettBox 等兼容客户端以 main(config) 作为覆写脚本入口。
