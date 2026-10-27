# 本分支复现测试（2026-10-27）

本轮仅工程验收，没有制作新长片。历史 80s Every Door 和 14s Clock 的完成记录见 evidence/2026-10-27，属于旧代码版本，不能冒充本分支重跑记录。

## 新工作树实际执行

- 从 GitHub main 上游提交创建独立工作树，复制源码后删除 Python 缓存；重新 npm ci 和安装 PocketSphinx 5.0.4 wheel。
- 原始 npm ci 的自动 CUDA 下载未成功；使用依赖官方 ONNXRUNTIME_NODE_INSTALL_CUDA=skip 后成功，未移除代理。模型/运行库未从旧 node_modules 复制。
- 新克隆没有浏览器注册配置，第一次渲染失败；注册云端系统 Chromium 后重跑成功。重建脚本现在自动检测系统浏览器。不是全新 VM 的实际部署证明。
- 15 项自定义测试和 16 项上游测试通过。
- 两个短故事使用提交的小 FLAC 录音，走相同 run 入口；没有新 TTS 调用，没有新剧情专用 JS。
- 首次 run 返回 review_required；实际打开快照并 record-review 后，再次调用同一个 run 完成原引擎渲染与媒体 QA。

| 输入 | 输出 | 媒体结果 |
|---|---|---|
| production/test/fixtures/door.job.json | 10s / 2 shots / 300 frames | passed |
| production/test/fixtures/clock.job.json | 14s / 3 shots / 420 frames | passed |

两项共享核心代码 SHA-256：

`2a65b183a271a9d48bfe165546fdcd7c02c36e59098944d3905e925a836d37a5`

两项共享动画适配器 SHA-256：

`e201ee601bd0d0e5a469dad9e6f877a43dc8cec9fb978414c5cb33b857c317f0`

详细计划、源录音哈希、角色、动作、字幕、数学接触/变换检查、全片解码/音轨与近全黑检测见 ../evidence/engineering-acceptance/。MP4 留在忽略的 videos/ 目录，不进入 Git。

## 验证范围

同命令、不同输入、同共享代码已验证；不代表程序能从原始文案独立生成正确的事件配置。门样本为既有故事的两镜头短摘录；钟表样本为既有另一故事。两者不是新的频道作品。角色和故事事件已由 Codex 事先配置，源码中没有为此次验收添加剧情分支。

文字年份、身份 ID 和动作标签仍属于输入数据。不能把 1912 标签 + 现代街景判为历史场景生成通过。本轮“视觉智能化”仍应判未实现，详见 ENGINEERING-AUDIT.md。

CI 文件已提供，远端是否通过以 GitHub 实际运行结果为准。长时、任意声音、全部动作组合和新 VM 的可用性未验证。安装/运行步骤可按 RUN.md 重建，不能将一台云主机的新工作树测试夸大为所有云镜像保证。
