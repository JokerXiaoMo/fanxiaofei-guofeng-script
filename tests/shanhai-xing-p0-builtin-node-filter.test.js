const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const scriptPath = path.join(__dirname, '..', 'ShanHaiXing-v0.2.0-P0-Test.js')
const source = fs.readFileSync(scriptPath, 'utf8')

function execute(proxies) {
  const sandbox = { console: { log() {} } }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'ShanHaiXing-v0.2.0-P0-Test.js' })
  const config = { proxies, 'proxy-groups': [], rules: [] }
  return sandbox.main(config)
}

function findGroup(config, name) {
  const group = config['proxy-groups'].find((item) => item.name === name)
  assert.ok(group, '必须生成策略组：' + name)
  return group
}

const remoteNodes = [
  { name: '日本 0.5x Hysteria2', type: 'hysteria2', server: 'jp.example.test', port: 443 },
  { name: '中国香港 1.5x Shadowsocks', type: 'ss', server: 'hk.example.test', port: 443 },
  { name: '美国 2x VLESS', type: 'vless', server: 'us.example.test', port: 443 },
  { name: '德国 Trojan', type: 'trojan', server: 'de.example.test', port: 443 },
  { name: '新加坡 AnyTLS', type: 'anytls', server: 'sg.example.test', port: 443 },
  { name: '中国台湾 VMess', type: 'vmess', server: 'tw.example.test', port: 443 },
  { name: '日本 WireGuard', type: 'wireguard', server: 'wg.example.test', port: 51820 }
]

const builtinNodes = [
  { name: '内置 DIRECT', type: 'direct' },
  { name: '内置 REJECT', type: 'reject' },
  { name: '内置 REJECT-DROP', type: 'reject-drop' },
  { name: '内置 PASS', type: 'pass' },
  { name: '内置 REMATCH', type: 'rematch' },
  { name: '内置 SELECT', type: 'select' },
  { name: '内置 SELECTOR', type: 'selector' },
  { name: '内置 URLTEST', type: 'url-test' },
  { name: '内置 FALLBACK', type: 'fallback' },
  { name: '内置 LOADBALANCE', type: 'load-balance' },
  { name: '内置 RELAY', type: 'relay' },
  { name: '内置 COMPATIBLE', type: 'compatible' }
]

const config = execute(remoteNodes.concat(builtinNodes))
const remoteNames = remoteNodes.map((item) => item.name)
const builtinNames = builtinNodes.map((item) => item.name)
const all = findGroup(config, '☁️ 万象节点')
const image = findGroup(config, '🖼️ 影画速递')

assert.equal(config.proxies.length, remoteNodes.length + builtinNodes.length, '覆写不得删除原始订阅条目')
assert.deepEqual([...all.proxies], [remoteNodes[0].name].concat(remoteNames.slice(1)), '万象节点应低倍率优先并包含全部真实远端节点')
assert.deepEqual([...image.proxies].sort(), remoteNames.slice().sort(), '影画速递应只包含全部真实远端节点')

for (const group of config['proxy-groups']) {
  for (const builtinName of builtinNames) {
    assert.equal(group.proxies.includes(builtinName), false, '内置非远端节点不得进入策略组：' + group.name + ' -> ' + builtinName)
  }
}

assert.ok(findGroup(config, '🟢 低倍率节点').proxies.includes(remoteNodes[0].name), '低倍率真实节点必须保留')
assert.ok(findGroup(config, '🔴 高倍率节点').proxies.includes(remoteNodes[2].name), '高倍率真实节点必须保留')
assert.ok(findGroup(config, '🏮 香江灯影').proxies.includes(remoteNodes[1].name), '中国香港真实节点必须保留')
assert.ok(findGroup(config, '🍑 东海桃影').proxies.includes(remoteNodes[0].name), '日本真实节点必须保留')
assert.ok(findGroup(config, '⛵ 北美远航').proxies.includes(remoteNodes[2].name), '美国真实节点必须保留')
assert.ok(findGroup(config, '⛰️ 四海云游').proxies.includes(remoteNodes[3].name), '其他地区真实节点必须保留')

const onlyBuiltin = execute(builtinNodes)
assert.deepEqual(onlyBuiltin['proxy-groups'], [], '仅内置非远端节点时不得生成策略组')
assert.deepEqual(onlyBuiltin.rules, [], '仅内置非远端节点时不得写入规则')

console.log('ShanHaiXing P0 builtin non-remote node filter test passed')
