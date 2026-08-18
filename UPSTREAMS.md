# 番小绯的国风脚本 · 上游参考核验记录

> 最近核验日期：2026-08-18（GMT+8）。本文为项目说明撰写的事实记录，不构成法律意见。

| 项目 | 山海行中的关系 | 核验到的公开定位 | 许可证/注意事项 |
|---|---|---|---|
| [chen08209/FlClash](https://github.com/chen08209/FlClash) | 宿主客户端；山海行以其 JavaScript 覆写入口运行 | 跨平台 ClashMeta/Mihomo 代理客户端 | GPL-3.0。山海行不包含或复制 FlClash 源码。 |
| [appshubcc/Bettbox](https://github.com/appshubcc/Bettbox) | 已核验的另一运行宿主；其 QuickJS 运行时调用 `main(config)` | 支持 Mihomo 与 JavaScript 覆写的客户端 | GPL-3.0。山海行不包含或复制 BettBox 源码。 |
| [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) | 运行时远程引用 AdvertisingLite、ChinaMax、Global 三份 Classical 规则 | 分流规则、重写规则及脚本仓库 | GPL-2.0。上游 README 另含资源转载限制；山海行不打包这些规则文件，只在运行时引用其公开地址。 |
| [IvanSolis1989/Smart-Config-Kit](https://github.com/IvanSolis1989/Smart-Config-Kit) | 架构参考：动态节点分类、区域 url-test 组、业务策略组与规则提供者分层 | 面向多客户端的分流配置与覆写脚本项目 | GitHub API 未显示许可证信息；山海行仅参考功能组织方式，不复制其脚本或规则清单。 |
| [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo) | FlClash、BettBox 所用 Mihomo 配置语义的上游背景 | 本文仅作为配置兼容性背景提及 | 不作为山海行代码或规则的直接来源。 |
| [AIsouler/MyClash](https://github.com/AIsouler/MyClash) | 倍率为地区正交属性、匹配非空才生成高低倍率组的功能需求参考 | Mihomo 覆写脚本与配置项目 | GitHub API 未显示许可证信息。山海行不复制其代码、正则表达式、规则表或素材，仅基于公开行为独立实现。 |
| [dahaha-365/YaNet](https://github.com/dahaha-365/YaNet) | 参考单次遍历分类、明确数值阈值比较、非空测速组生成的设计方向 | Mihomo 全局脚本与配置项目 | BSD-3-Clause。山海行不复制其代码；倍率解析采用独立实现。 |

## 归因边界

本仓库的原创文件包括 `ShanHaiXing-Adaptive-DualStackDNS.js`、测试夹具和项目说明。项目内不包含上述上游项目的源代码，也不重新分发 `blackmatrix7/ios_rule_script` 的规则内容。规则文件会由 FlClash、BettBox 等 Mihomo 客户端根据脚本中的 URL 在用户设备运行时获取。

## 素材边界

`assets/` 中的插画展示仓库维护者原创角色 **番小绯**，由角色权利人授权用于项目展示。它们不随本仓库源代码的 MIT 许可授权；如需使用角色形象或插画，请先联系权利人取得许可。
