const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const scriptPath = path.join(__dirname, '..', 'ShanHaiXing-v0.2.2-Selector-Persistence-Test.js')
const source = fs.readFileSync(scriptPath, 'utf8')

function run(proxies, profile) {
  const sandbox = { console: { log() {} } }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'ShanHaiXing-v0.2.2-Selector-Persistence-Test.js' })
  assert.equal(sandbox.VERSION, '0.2.2-selector-persistence-test', '必须加载独立 v0.2.2 测试版')
  const config = {
    proxies: proxies.map((proxy) => ({ ...proxy })),
    'proxy-groups': [],
    rules: ['MATCH,DIRECT']
  }
  if (profile !== undefined) config.profile = profile
  sandbox.main(config)
  return config
}

const config = run([
  { name: '中国香港 节点', type: 'ss', server: 'hk.example.test', port: 443 },
  { name: '日本 节点', type: 'vless', server: 'jp.example.test', port: 443 },
  { name: '新加坡 节点', type: 'trojan', server: 'sg.example.test', port: 443 }
])
const groups = Object.fromEntries(config['proxy-groups'].map((group) => [group.name, group]))

assert.equal(config.profile['store-selected'], true, '必须保存 select 组的人工地区选择')
assert.equal(groups['🌺 代理选择'].type, 'select', '外层代理选择必须保持 select')
assert.deepEqual([...groups['🌺 代理选择'].proxies], ['☁️ 万象节点', '🏮 香江灯影', '🍑 东海桃影', '🪷 南洋莲舟', 'DIRECT'], '外层必须直接提供万象和所有实际存在地区')
assert.equal(groups['☁️ 万象节点'].type, 'url-test', '万象必须保持 URLTest 自动测速')
assert.equal(groups['🏮 香江灯影'].type, 'url-test', '地区组必须保持 URLTest 自动测速')
assert.equal(groups['🍑 东海桃影'].type, 'url-test', '地区组必须保持 URLTest 自动测速')
assert.equal(groups['🪷 南洋莲舟'].type, 'url-test', '地区组必须保持 URLTest 自动测速')
assert.equal(Object.hasOwn(config, 'tun'), false, '测试版不得新增或接管 TUN')
assert.equal(Object.hasOwn(config.dns, 'listen'), false, '测试版不得新增 DNS 监听端口')

const existingProfile = run([{ name: '中国香港 节点', type: 'ss', server: 'hk.example.test', port: 443 }], {
  'store-selected': false,
  'store-fake-ip': true
})
assert.equal(existingProfile.profile['store-selected'], true, '必须覆盖旧的 false，修复手动地区选择回退')
assert.equal(existingProfile.profile['store-fake-ip'], true, '不得改变无关 profile 设置')

console.log('ShanHaiXing v0.2.2 selector persistence tests passed')
