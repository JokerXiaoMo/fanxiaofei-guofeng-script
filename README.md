# 番小绯的国风脚本 · 山海行

![山海行主视觉：原创角色番小绯](./assets/shanhai-hero-red.png)

<sub>展示角色：**番小绯**。原创角色与插画由仓库维护者提供，并授权用于「番小绯的国风脚本」项目展示。</sub>

> **让代理策略像山海长卷一样清晰。** 「番小绯的国风脚本」的核心覆写为山海行：一份面向 FlClash、BettBox 等 Mihomo 客户端的 JavaScript 脚本，以国风动漫的可读命名呈现节点、服务与路由策略，同时保留明确、可验证的 Mihomo 分流逻辑。

| 项目 | 当前实现 |
|---|---|
| 宿主客户端 | FlClash 与 BettBox 的 JavaScript 覆写功能 |
| 覆写入口 | `function main(config)` |
| 节点处理 | 动态分类中国香港/中国澳门、中国台湾、日本、新加坡、美国、其他节点及明确高/低倍率节点 |
| 策略组布局 | `🌺 代理选择` 固定置顶，随后是区域、倍率测速组与自动/手动业务策略组 |
| 远程规则 | AdvertisingLite、ChinaMax、Global 三份 Clash Classical 规则 |
| 测速方式 | `url-test`，每 600 秒复测，50 ms 容差，按需测速 |
| DNS 能力 | 正式版启用 IPv4/IPv6 双栈 DNS、IPv6 Fake IP 范围与 DNS 上游回退 |
| 适用场景 | 单订阅或已经聚合为 Mihomo 配置的订阅 |

## 为什么叫「山海行」

「山海」指向不同地域节点的选择与切换，「行」代表流量按照明确路线前进。国风名称只是界面表达，**每一个名称都对应可解释的技术功能**；脚本不会因为美化名称而隐藏实际路由语义。

![山海行角色展示：原创角色番小绯](./assets/shanhai-character-red.png)

<sub>番小绯 · 山海行展示插画</sub>

## 国风名称与实际功能对照

下面的表格是本项目最重要的阅读入口。导入后，在 FlClash 或 BettBox 的「代理」页看到的每个名称都可以按此表理解。

| 策略组 | 实际功能 | 节点或服务范围 | 工作方式 |
|---|---|---|---|
| `🌺 代理选择` | 全局总开关，**始终显示在第一位** | 全部已生成区域组与 `DIRECT` | 手动选择；用于快速指定默认出口 |
| `☁️ 万象节点` | 低倍率偏好的全节点延迟自动池 | 先引用 `🟢 低倍率节点`，再引用全部非低倍率有效节点 | `url-test` 持续比较全部候选延迟；低倍率组在延迟接近时优先保留，若高延迟或失效会自动切换到更低延迟节点 |
| `🏮 香江灯影` | 中国香港与中国澳门节点测速池 | 中国香港、中国澳门及常见中英文节点别名与编号 | `url-test` 自动择优；中国澳门节点并入此组 |
| `🪭 宝岛团扇` | 中国台湾节点测速池 | 中国台湾及常见中英文节点别名与编号 | `url-test` 自动择优 |
| `🍑 东海桃影` | 日本节点测速池 | 日本、东京、大阪、Japan、Tokyo、Osaka、JPN 等命名 | `url-test` 自动择优 |
| `🪷 南洋莲舟` | 新加坡节点测速池 | 新加坡、Singapore、SG/SGP 等命名 | `url-test` 自动择优 |
| `⛵ 北美远航` | 美国节点测速池 | 美国、洛杉矶、西雅图、纽约、USA、US 等命名 | `url-test` 自动择优 |
| `⛰️ 四海云游` | 未识别地区节点池 | 不能被上述地区规则识别的有效节点 | `url-test` 自动择优 |
| `🔴 高倍率节点` | 高倍率节点自动测速池 | 名称中带明确倍率标记且数值 **≥ 2** 的有效节点，例如 `2x`、`x2`、`2倍`、`倍率: 2.5` | `url-test` 自动择优；同时保留在其原地区组，不改变业务分流 |
| `🟢 低倍率节点` | 低倍率节点自动测速池 | 名称中带明确倍率标记且数值 **> 0 且 ≤ 0.5** 的有效节点，例如 `0.5x`、`x0.3`、`0.5倍` | `url-test` 自动择优；同时保留在其原地区组，不改变业务分流 |
| `📜 灵枢智算` | AI 服务策略 | ChatGPT、OpenAI、Claude、Anthropic、Google Generative Language | 手动选择，优先提供美/新/日/全节点 |
| `🎭 梨园影音` | 海外视频服务自动策略 | YouTube、Google Video、Netflix、Netflix Video | `url-test` 自动在中国香港、中国台湾、日本、美国、新加坡及全节点区域组间择优；无需用户手动切换 |
| `🖼️ 影画速递` | 海外图片与社交媒体自动策略 | Instagram/Meta CDN、Pixiv/pximg、Telegram 网页与 CDN、X/Twitter/twimg | `url-test` 直接测试订阅内有效节点，自动选择适合图片、动图和视频媒体的出口；不与梨园影音重复接管域名 |
| `🔭 云台观星` | Google 服务策略 | Google、Google APIs、GStatic | 手动选择，优先提供美/日/新/全节点 |
| `🧰 百工工坊` | 开发者服务策略 | GitHub、GitHub User Content、GitHub Assets、GitLab | 手动选择，优先提供美/日/新/全节点 |
| `🗺️ 山海行旅` | 通用海外服务策略 | Global 规则集中命中的常用海外站点 | 手动选择，默认按区域组选择 |
| `🧧 神州直连` | 中国大陆服务策略 | ChinaMax 规则、`GEOIP,CN` | 默认把直连放在候选首位 |
| `🌺 桃源归途` | 最终兜底策略 | 未被任何前置规则命中的流量 | 手动选择，默认按区域组选择 |
| `🛡️ 清风拂尘` | 广告拦截策略 | AdvertisingLite 规则集 | 默认 `REJECT`，可手动改为 `DIRECT` |

## 分流顺序：流量会去哪里

山海行将规则按优先级写入 `config.rules`。Mihomo 从上到下匹配，因此较具体的服务规则会先于通用规则和最终兜底生效。

| 优先级 | 规则类别 | 实际路由目标 |
|---|---|---|
| 1 | 局域网与本地域名/IP | `DIRECT` |
| 2 | AdvertisingLite | `🛡️ 清风拂尘` |
| 3 | OpenAI、ChatGPT、Claude、Anthropic、Google AI | `📜 灵枢智算` |
| 4 | YouTube、Netflix 及其视频媒体域名 | `🎭 梨园影音` |
| 5 | Instagram、Pixiv、Telegram、X 及其图片/媒体域名 | `🖼️ 影画速递` |
| 6 | Google 域名与 API | `🔭 云台观星` |
| 7 | GitHub、GitLab 等开发平台 | `🧰 百工工坊` |
| 8 | ChinaMax 与中国大陆 IP | `🧧 神州直连` |
| 9 | Global 规则集 | `🗺️ 山海行旅` |
| 10 | 未命中流量 | `🌺 桃源归途` |

## 节点测速与延迟表现

区域组采用 Mihomo 的 `url-test`。测试地址为 `https://www.gstatic.com/generate_204`，脚本设置 `interval: 600`、`tolerance: 50`、`lazy: true`。这意味着每个区域节点池会在实际需要时开始测试，并定期复测；延迟较优且可用的节点会成为自动选择的候选。`☁️ 万象节点` 同样使用 `url-test`：`🟢 低倍率节点` 是首个候选，但它会持续比较低倍率组与所有非低倍率节点的真实延迟；当低倍率组高延迟或失效时，会自动切换到更低延迟的候选，而不是串行回退。`🎭 梨园影音` 会在已经生成的区域测速组之间自动择优，`🖼️ 影画速递` 则直接测试其覆盖的有效节点；二者均不要求客户手动切换。`🔴 高倍率节点` 与 `🟢 低倍率节点` 也会直接测速各自的节点集合，并且只在识别到对应节点时显示。

> **请区分“测速机制可用”与“你的节点延迟”。** 本仓库已验证测试地址可返回 HTTP 204，也对脚本的 `url-test` 参数、节点分类与策略生成进行了夹具测试。但真实延迟仍取决于订阅节点、当地网络、运营商和设备；请以 FlClash 代理页中实际显示的节点延迟为准。
>
> **倍率识别边界：** 脚本只识别带明确倍率标记的数字，如 `0.3x`、`x2`、`2倍`、`倍率: 2.5`。普通编号、日期、端口，以及单独出现的“高倍率”“低倍”等文字不会触发倍率分组；信息行会在识别前排除。若一个名称同时写有高低两种倍率，优先归入高倍率组。

## 一键复制订阅链接

在 FlClash 中进入「配置 → 覆写脚本」，创建脚本后点击编辑器右上角的下载箭头，选择「导入 URL」。下方是当前唯一的**山海行自适应双栈 DNS 正式版**；它会根据订阅中实际生成的地区组动态构建业务策略候选，并提供 IPv4/IPv6 双栈 DNS 支持。

> **复制提示：** GitHub 会为下方代码块提供内置的复制功能；在手机端请点击代码块后使用浏览器的“复制”操作。若代码块横向显示不完整，可点击下方的 Raw 链接打开完整地址后复制。

```text
https://raw.githubusercontent.com/JokerXiaoMo/fanxiaofei-guofeng-script/main/ShanHaiXing-Adaptive-DualStackDNS.js
```

[打开完整 Raw 链接](https://raw.githubusercontent.com/JokerXiaoMo/fanxiaofei-guofeng-script/main/ShanHaiXing-Adaptive-DualStackDNS.js)

导入完成后，点击顶部的「未命名」并填写 `番小绯的国风脚本`，再点击保存。返回订阅卡片的「更多 → 覆写」，关联山海行脚本并刷新订阅。之后进入「代理」页，确认第一项为 `🌺 代理选择`，并检查 `🏮 香江灯影` 是否包含你的中国香港和中国澳门节点。若需要截获应用直接发往 53 端口的 DNS 查询，请在 FlClash 的 TUN 页面手动启用 DNS 劫持；脚本不会擅自接管 TUN。

## 快速验证

| 检查项 | 预期结果 |
|---|---|
| 覆写入口 | FlClash 成功保存并加载脚本，无 JavaScript 语法报错 |
| 首页策略组 | `🌺 代理选择` 位于第一项 |
| 万象延迟感知 | 有低倍率节点时，`☁️ 万象节点` 的第一候选为 `🟢 低倍率节点`，但会持续比较全量候选；高延迟或失效时自动切换 |
| 中国澳门识别 | 名称包含 `中国澳门` 或中国澳门地区编号的节点出现在 `🏮 香江灯影` |
| 规则提供者 | 出现 `shanhai-ad`、`shanhai-cn`、`shanhai-global` 三项 |
| AI 分流 | OpenAI/Claude 类服务命中 `📜 灵枢智算` |
| 影音自动分流 | YouTube、Netflix 命中 `🎭 梨园影音`，且该组以 `url-test` 自动择优区域出口 |
| 影画自动分流 | Instagram、Pixiv、Telegram、X 相关域名命中 `🖼️ 影画速递`，且该组以 `url-test` 自动测试有效节点 |
| 倍率识别 | 含 `2x`、`x2`、`2倍` 的节点进入 `🔴 高倍率节点`；含 `0.5x`、`x0.3`、`0.5倍` 的节点进入 `🟢 低倍率节点` |
| 倍率地区并列 | 已识别倍率节点仍同时位于其原中国香港/中国澳门、中国台湾、日本、新加坡、美国或其他地区组 |
| 延迟测试 | `🏮 香江灯影` 内可看到中国香港/中国澳门节点的实际延迟 |

## 架构参考与开源致谢

山海行并不是对某个上游项目的复制品。它以独立 JavaScript 编写策略组、节点识别和规则装配逻辑；下表说明实际参考关系，避免把“运行宿主”“规则来源”和“架构灵感”混为一谈。

| 开源项目 | 山海行如何使用或参考 | 归因边界 |
|---|---|---|
| [FlClash](https://github.com/chen08209/FlClash) | 作为跨平台 Mihomo 客户端与 JavaScript 覆写脚本的运行宿主 | 不包含、复制或修改 FlClash 源码；其仓库采用 GPL-3.0。[1] |
| [BettBox](https://github.com/appshubcc/Bettbox) | 作为另一个已核验的 Mihomo JavaScript 覆写宿主 | 不包含、复制或修改 BettBox 源码；其仓库采用 GPL-3.0。[5] |
| [ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) | 运行时从公开 URL 请求 AdvertisingLite、ChinaMax、Global 三份 Classical 规则 | 不打包、不再分发上游规则文件；使用前请阅读上游 GPL-2.0 许可及项目声明。[2] |
| [Smart-Config-Kit](https://github.com/IvanSolis1989/Smart-Config-Kit) | 参考“动态节点分类、区域测速组、业务策略组、规则提供者”的功能分层思路 | 未复制其代码或规则清单；GitHub 当前未显示许可证信息，故只作架构性致谢。[3] |
| [Mihomo](https://github.com/MetaCubeX/mihomo) | 为 `proxy-groups`、`url-test`、`rule-providers` 等配置语义提供内核背景 | 不作为山海行的代码或规则直接来源。[4] |
| [MyClash](https://github.com/AIsouler/MyClash) | 参考“倍率作为与地区正交的节点属性、非空才生成倍率组”的功能需求 | 仓库未声明许可证；山海行未复制其代码、正则或规则表，倍率解析为独立实现。[6] |
| [YaNet](https://github.com/dahaha-365/YaNet) | 参考单次遍历分类、明确数值比较与非空测速组生成的设计方向 | 山海行未复制其实现；其仓库采用 BSD-3-Clause。[7] |

完整核验记录参见 [`UPSTREAMS.md`](./UPSTREAMS.md)。

## 开源许可与素材说明

> 我不是律师；以下为仓库的许可边界说明，不构成正式法律意见。公开发布或再分发前，如涉及商业用途、第三方规则或素材权利，请自行核验并在必要时咨询专业人士。

本仓库的原创脚本、测试与文档使用 [MIT License](./LICENSE)。该许可**只覆盖本仓库中由本项目原创的文本与代码文件**，不授予第三方项目、远程规则文件或展示插画的任何权利。

两张展示插画中的角色为仓库维护者原创角色 **番小绯**，并由角色权利人授权用于「番小绯的国风脚本」项目展示，文件位于 `assets/` 目录。插画**不随 MIT 许可授权**，也不因仓库公开而获得默认的商用、二次创作或再分发授权；如需使用，请先联系权利人取得许可。

## 贡献者

| 贡献者 | 角色与贡献 |
|---|---|
| [JokerXiaoMo](https://github.com/JokerXiaoMo) | 项目发起与维护、功能方向与验收、原创角色**番小绯**及展示插画的权利人和授权人。 |

完整贡献者名单见 [`CONTRIBUTORS.md`](./CONTRIBUTORS.md)。上游项目的作者和维护者在「架构参考与开源致谢」中单独列出；他们是重要的上游致谢对象，但不是本仓库的直接提交贡献者。

## 贡献与反馈

欢迎提交节点命名兼容性、规则误分流、文档改进与测试用例。提交问题时，请提供脱敏后的节点名称、命中的策略组、预期策略组以及 FlClash 或 BettBox 版本；不要公开订阅链接、节点地址、令牌或个人信息。

## References

[1]: https://github.com/chen08209/FlClash "FlClash 官方仓库"
[2]: https://github.com/blackmatrix7/ios_rule_script "blackmatrix7/ios_rule_script"
[3]: https://github.com/IvanSolis1989/Smart-Config-Kit "Smart-Config-Kit"
[4]: https://github.com/MetaCubeX/mihomo "Mihomo"
[5]: https://github.com/appshubcc/Bettbox "BettBox"
[6]: https://github.com/AIsouler/MyClash "MyClash"
[7]: https://github.com/dahaha-365/YaNet "YaNet"
