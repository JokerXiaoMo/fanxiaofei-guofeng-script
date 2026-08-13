# 发布前验证记录

| 项目 | 结果 | 备注 |
|---|---|---|
| 页面结构 | 通过 | 本地 `index.html` 已成功加载，检测到导航、覆写链接、一键复制按钮和文档入口。 |
| 复制按钮浏览器点击 | 待发布后复核 | 本地 `file://` 页面在交互快照阶段跳转为 `about:blank`，无法可靠模拟浏览器剪贴板权限；页面包含 Clipboard API 和 `execCommand('copy')` 后备逻辑。 |
| 脚本语法与夹具 | 待本次页面更新后一并复测 | 使用 `node --check` 与 `tests/shanhai-xing.test.js`。 |

发布后应通过 HTTPS 的 GitHub Pages 页面点击「一键复制覆写链接」，确认提示“已复制”并能在 FlClash 的“导入 URL”粘贴。
