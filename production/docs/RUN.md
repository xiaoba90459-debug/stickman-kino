# 从新云端环境重建

环境范围：Linux x86_64、Node 22/24、Python 3.12。先克隆本 PR 分支；命令在仓库根目录执行。所有软件与模型都免费，不依赖原工作区目录。

```bash
bash production/bootstrap.sh
npm test
node --test production/test/*.test.mjs
node production/cli.mjs run production/test/fixtures/door.job.json
node production/cli.mjs run production/test/fixtures/clock.job.json
```

bootstrap 使用上游安装流程、CPU ONNX 官方开关以及固定 PocketSphinx wheel。原始 npm ci 的 CUDA 下载在本云环境因安装器未使用代理而失败；CPU-only 安装已实际成功，不通过移除代理绕过网络策略。

此阶段两条 run 应返回 review_required，并产出对齐、计划、原影片 JSON、快照与逐帧检查。实际看图后执行：

```bash
node production/cli.mjs record-review production/test/fixtures/door.job.json "门/报纸可见；字幕分区；街景是示意，不能当作1912美术"
node production/cli.mjs run production/test/fixtures/door.job.json
node production/cli.mjs record-review production/test/fixtures/clock.job.json "人物造型一致；指向钟表；近景裁切有意；字幕无冲突"
node production/cli.mjs run production/test/fixtures/clock.job.json
```

输出为 videos/acceptance-door/renders/acceptance-door.mp4 与 videos/acceptance-clock/renders/acceptance-clock.mp4。这是 10s/14s 回归片，未重新制作长视频。MP4 与 videos/ 全部 git-ignored。

## 标准作业输入

```json
{
  "version": 1,
  "id": "my-story",
  "title": "My original story",
  "story": "story.txt",
  "events": "events.json",
  "audio": { "mode": "recording", "file": "narration.flac" },
  "config": { "characters": "characters.json" },
  "targetSeconds": 60,
  "format": "16:9",
  "output": {
    "directory": "videos/my-story",
    "width": 1920, "height": 1080, "fps": 30
  }
}
```

输入文件路径相对于 JOB.json；输出目录相对于仓库，必须位于 videos/ 下。config 省略时使用 production/config 注册表。不在当前已验证范围的几何/格式参数会报错，不会静默忽略。时长不足/超预算同样阻断。

events.json 是必要的语义导演输入，Codex Skill 会阅读文案来编写它；suggest 只给 reviewed=false 的草稿，不独立理解故事。record-review 是制作方声明，程序不能证明操作者看过图片。

音频模式为 recording 或 tts。录音默认本地已知文案强制对齐；可选 alignment 词时间轴也会校验。TTS 安装另用 `bash production/bootstrap.sh --with-tts`，这条完整新模型下载流程本轮未验证，需允许相应模型下载主机。禁止付费 API 回退。

Skill 的可执行入口：

```bash
node skills/story-production/scripts/produce.mjs run production/test/fixtures/door.job.json
```

## 阶段与失败

prepare / check / record-review / render / qa / status 可独立调用。源代码、配置、旁白与背景变更会使旧检查失效。重新 prepare 后 check、看图并记录，再渲染。同一 job 有进程锁；没有帧级断点续渲。

work/failure.json 和阶段日志用于排错，stage.json 记录准备/检查/渲染/完成状态。日志、缓存和所有渲染不进入 Git。3/10 分钟是未实渲染路径；默认渲染超时45分钟，不能把时长配置成功当稳定量产。

## CI

新增 production-acceptance workflow 在 PR 中从新 runner 安装并运行两条相同入口（停在看图门槛，不自动伪造复核、不渲染长片）。原上游 workflow 保留。以 GitHub 实际运行结果为准，不把新增 YAML 视作 CI 已成功。
