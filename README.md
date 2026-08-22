# 番小绯·半纸砚花 V0.1

![番小绯主视觉](./assets/shanhai-hero-red.png)

<sub>展示角色：**番小绯**。角色与插画为仓库维护者原创素材，仅获授权用于本项目展示；插画不随本仓库的 MIT 许可授权。</sub>

> **半纸砚花，分明万象。** 《番小绯·半纸砚花 V0.1》是一份面向 FlClash、BettBox 等 Mihomo 客户端的 JavaScript 覆写脚本。它保留中国国风动漫风格的策略组命名，同时用可验证的 Mihomo 规则、地区测速与节点分类实现日常自动分流。

| 项目 | 正式实现 |
|---|---|
| 正式脚本 | `FanXiaoFei-BanZhiYanHua-V0.1.js` |
| 归档脚本 | `ShanHaiXing-Adaptive-DualStackDNS.js`，原样保留且不再迭代 |
| 宿主客户端 | FlClash 与 BettBox 的 JavaScript 覆写功能 |
| 覆写入口 | `function main(config)` |
| 节点处理 | 动态分类中国香港/中国澳门、中国台湾、日本、新加坡、美国、其他节点，以及明确高/低倍率节点 |
| 策略组布局 | `🌺 代理选择` 固定置顶；地区和业务自动测速组按订阅实际节点动态生成 |
| 规则来源 | AdvertisingLite、ChinaMax、Global 三份 Clash Classical 规则 |
| 静态保护 | 常见私有域名、IPv4 私有/回环/链路本地地址与 IPv6 回环/ULA/链路本地地址优先直连；**不新增远程规则下载** |
| 测速方式 | `url-test`，每 600 秒复测，50 ms 容差，按需测速 |

## 一键复制正式覆写链接

在 FlClash 或 BettBox 的「覆写脚本」中导入下方链接。该链接是**唯一正式入口**。

```text
https://raw.githubusercontent.com/JokerXiaoMo/fanxiaofei-guofeng-script/main/FanXiaoFei-BanZhiYanHua-V0.1.js
```

[打开正式 Raw 链接](https://raw.githubusercontent.com/JokerXiaoMo/fanxiaofei-guofeng-script/main/FanXiaoFei-BanZhiYanHua-V0.1.js)

导入后将覆写关联到订阅并刷新。进入「代理」页，确认第一项是 `🌺 代理选择`。你可以选择 `☁️ 万象节点` 让全部节点自动测速，或选择具体地区组以锁定地区、仍由地区内测速自动选择节点。手动地区选择会跨刷新与重启保留；不要在 `url-test` 组中手动固定某个具体节点。

## 策略组与功能对照

| 策略组 | 实际功能 | 工作方式 |
|---|---|---|
| `🌺 代理选择` | 总开关，固定显示在策略组第一位 | 手动选择 `☁️ 万象节点`、地区组或 `DIRECT`；通用海外及最终未命中流量实际经过该选择 |
| `☁️ 万象节点` | 全部有效节点延迟自动池 | `url-test` 直接测试真实节点；低倍率节点排在初始候选前部，失效或延迟较高时自动切换 |
| `🏮 香江灯影` | 中国香港与中国澳门节点组 | `url-test` 自动择优；中国澳门节点归入此组 |
| `🪭 宝岛团扇` | 中国台湾节点组 | `url-test` 自动择优 |
| `🍑 东海桃影` | 日本节点组 | `url-test` 自动择优 |
| `🪷 南洋莲舟` | 新加坡节点组 | `url-test` 自动择优 |
| `⛵ 北美远航` | 美国节点组 | `url-test` 自动择优 |
| `⛰️ 四海云游` | 未识别地区节点组 | `url-test` 自动择优 |
| `🔴 高倍率节点` / `🟢 低倍率节点` | 倍率节点组 | 仅识别带明确倍率标记的节点；节点同时保留在原地区组 |
| `📜 灵枢智算` | AI 服务 | OpenAI、ChatGPT、Claude、Anthropic 与 Google Generative Language |
| `🎭 梨园影音` | 海外视频服务 | YouTube、Google Video、Netflix 的区域自动测速出口 |
| `🖼️ 影画速递` | 图片与社交媒体服务 | Instagram、Pixiv、Telegram、X 等相关域名的节点自动测速出口 |
| `🔭 云台观星` | Google 服务 | Google、Google APIs、GStatic |
| `🧰 百工工坊` | 开发服务 | GitHub、GitHub User Content、GitHub Assets、GitLab |
| `🧧 神州直连` | 中国大陆服务 | ChinaMax、`GEOIP,CN`；`DIRECT` 位于候选首位 |
| `🛡️ 清风拂尘` | 广告规则 | AdvertisingLite；默认 `REJECT`，可手动改为 `DIRECT` |

## 路由顺序与保护边界

Mihomo 从上到下匹配规则。半纸砚花会先处理本地和私有目标，再处理广告、专项服务、中国大陆服务，最后将 Global 与 `MATCH` 真实交给 `🌺 代理选择`。

| 优先级 | 类别 | 出口 |
|---|---|---|
| 1 | `localhost`、`.lan`、`.local`、`home.arpa`、IPv4 私有/回环/链路本地/保留段与 IPv6 回环/ULA/链路本地 | `DIRECT` |
| 2 | AdvertisingLite | `🛡️ 清风拂尘` |
| 3 | AI、影音、影画、Google、开发服务 | 对应专项策略组 |
| 4 | ChinaMax 与中国大陆 IP | `🧧 神州直连` |
| 5 | Global 规则集与未命中流量 | `🌺 代理选择` |

> 本脚本不接管 TUN、端口、Sniffer 或 DNS 劫持；它只能控制进入 Mihomo 的流量和 DNS 路径。系统级或绕过客户端的应用流量不在覆写脚本的控制范围内。

## 山海行归档

旧版山海行自适应双栈 DNS 脚本已归档，文件和链接原样保留，以便旧用户继续使用；它不再作为默认导入入口。

```text
https://raw.githubusercontent.com/JokerXiaoMo/fanxiaofei-guofeng-script/main/ShanHaiXing-Adaptive-DualStackDNS.js
```

[打开山海行归档 Raw 链接](https://raw.githubusercontent.com/JokerXiaoMo/fanxiaofei-guofeng-script/main/ShanHaiXing-Adaptive-DualStackDNS.js)

## 开源致谢与许可边界

半纸砚花以独立 JavaScript 实现策略组、节点识别、倍率识别和规则装配逻辑。运行时从 [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) 请求 AdvertisingLite、ChinaMax、Global 三份 Classical 规则；请遵守其 GPL-2.0 许可与项目声明。[1] FlClash、BettBox 与 Mihomo 是运行宿主或内核参考，仓库不包含、复制或修改其源码。[2] [3]

本仓库的原创脚本与文档采用 [MIT License](./LICENSE)。两张展示插画中的原创角色番小绯及相关插画**不随 MIT 许可授权**；如需任何商用、二次创作或再分发使用，请先取得角色权利人许可。

## 贡献者

| 贡献者 | 角色与贡献 |
|---|---|
| [JokerXiaoMo](https://github.com/JokerXiaoMo) | 项目发起与维护、功能方向与验收、原创角色番小绯及展示插画的权利人。 |

[1]: https://github.com/blackmatrix7/ios_rule_script "blackmatrix7/ios_rule_script"
[2]: https://github.com/chen08209/FlClash "FlClash"
[3]: https://github.com/appshubcc/Bettbox "BettBox"
