# 复用资产与依赖

- SVG/GSAP 骨架、姿态、IK、相机、音效与音乐合成来自当前 Stickman Kino 原项目；引擎文件保持原样。遵守仓库 LICENSE / THIRD_PARTY_NOTICES.md。
- 三套 far/mid/fore PNG+SVG 是已采用 B 版/P3 的原创背景复制件。原路径与成片保留；新资产库仅作为可复用来源。每个出片清单记录实际文件 SHA-256。
- 本轮新增通用门/文档合成以及数据适配代码；不包含参考频道或其 YouTube 角色、背景、镜头素材。
- 配音用现有免费本地 Kokoro；背景音乐/音效用项目程序合成，无付费生成 API。
- 仅新增 PocketSphinx 5.0.4（免费、本地、BSD 风格开源许可，英文模型随其发行包安装），用于已知文案强制对齐。requirements-align.txt 固定版本；Python 二进制/模型缓存不进入系统源码 ZIP。
- 系统包依赖已有 Stickman Kino 仓库及其 Node/FFmpeg/Chromium 环境，不是一个另外重建的动画引擎。独立 Skill 调用 production/cli.mjs。

工程验收样本的 door.flac / clock.flac 是从先前云端生成的自有 Kokoro 配音整理的短录音输入，总计小于 0.5 MiB，不是视频或模型缓存。历史来源见各自 .source.json。
