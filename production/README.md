# 自定义故事生产模块（原引擎不变）

**当前能力：已审核事件配置 → 固定模板编排 → 原 Stickman Kino 渲染与技术质检。** Codex 仍需逐镜头规划剧情/动作/背景等 JSON；这里没有任意英文稿的独立语义理解或不同时代的场景生成器。

先读 [工程审计](docs/ENGINEERING-AUDIT.md)、[复现报告](docs/TEST_REPORT.md) 和 [运行说明](docs/RUN.md)。原 engine/、lib/、bin/ 保持上游代码。

## 云端重建与统一入口

```bash
# 在本仓库新克隆中；不需要旧视频目录或临时缓存
bash production/bootstrap.sh
node --test production/test/*.test.mjs
node production/cli.mjs run production/test/fixtures/door.job.json
node production/cli.mjs run production/test/fixtures/clock.job.json
```

两条命令完全相同，只换 JOB.json。随仓库的小 FLAC 录音无需重新合成，也不调用付费 API；对齐模型随免费 PocketSphinx wheel 安装。可选 TTS 需 `bash production/bootstrap.sh --with-tts`，下载地址须符合云环境网络策略。

第一次 run 返回 review_required。Codex/制作方实际看 snapshots/contact-sheet*.jpg 后，执行 record-review；再次 run 才渲染。该过程不是无人值守视觉验收。

```bash
node production/cli.mjs record-review production/test/fixtures/door.job.json "实际看图得到的具体结论"
node production/cli.mjs run production/test/fixtures/door.job.json
```

不支持的复杂动作会阻断。新图解结构、对象类别或时代美术可能需要共享组件/资产扩展；不能用不符剧情的模板替代。

## 输入分离

- story.txt：英文叙述，一空行一个已规划叙事单元，数字拼写为单词。
- audio：云端录音或免费本地 TTS；已知文案强制对齐不等于内容识别。
- events.json：Codex 编写并审核的逐镜头目的、地点、身份、对象、动作与情绪意图。
- characters/actions/cameras/backgrounds/policy.json：独立注册表；源数据不是专用动画代码。
- output：明确的 1920×1080、30fps 和 videos/ 子目录；不支持参数会报错。

`schema/` 提供编辑契约，运行时校验实现在 common/planner 中，尚未接入完整 JSON Schema 校验库。生成 scenes.js 包含数据快照，共享 runtime.js 不含故事 ID 分支。

独立 Skill：`skills/story-production/SKILL.md`；真实启动器 `scripts/produce.mjs`。它指导 Codex 进行语义配置，并调用本目录代码。

3 分钟和 10 分钟只有规划配置测试，未完成稳定长片验证。永久保存的是 GitHub 分支中的代码/输入/必要资产/证据；大 MP4 和模型缓存不进入 Git。
