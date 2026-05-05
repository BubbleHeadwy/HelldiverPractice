# Helldiver Practice

《绝地潜兵 2》战略配备训练器，使用 `Vue 3 + TypeScript + Vite` 构建前端，并预留 `Tauri` 用于 Windows 轻量桌面打包。

## 当前范围

- 只包含正式战略配备
- 包含 wiki 中的 `Current Stratagems` 与 `Mission Stratagems`
- 不包含试用与未上线战略配备
- 只支持键盘输入训练
- 支持本地图标、音效、历史平均耗时与 KPS 统计
- 支持键位重绑定与本地持久化

## 启动开发版

```bash
npm install
npm run dev
```

默认开发地址为 `http://localhost:5173`。

## 构建前端

```bash
npm run build
```

## 预览生产构建

```bash
npm run preview
```

## 和 Wiki 同步战略配备

本项目的战略配备数据与图标来源于 [helldivers.wiki.gg - Stratagems](https://helldivers.wiki.gg/wiki/Stratagems)。

同步脚本位置：

- [scripts/sync-stratagems-from-wiki.mjs](D:/Codex/HelldiverPractice/scripts/sync-stratagems-from-wiki.mjs)

脚本会自动完成这些事情：

- 打开 wiki 页面
- 读取 `Current Stratagems`
- 读取 `Mission Stratagems`
- 下载最新图标到 `public/assets/icons`
- 生成最新数据文件 `public/data/stratagems.json`

同步步骤：

```bash
node scripts/sync-stratagems-from-wiki.mjs
npm run build
```

如果你想先本地查看同步结果，再启动页面，可以继续执行：

```bash
npm run dev
```

同步后建议检查这几项：

- 左侧分类中是否出现新的战略配备
- `舰船支援`、`任务目标`、`其他` 是否正常显示
- 图标是否正常加载
- 指令是否与 wiki 页面一致

## 资源位置

- 战略配备数据：
  - [public/data/stratagems.json](D:/Codex/HelldiverPractice/public/data/stratagems.json)
- 图标资源：
  - `public/assets/icons`
- 音效资源：
  - `public/assets/audio`

## Tauri 桌面壳

仓库已包含 `src-tauri/` 配置，但如果本机未安装 Rust 与 MSVC Build Tools，将无法执行桌面构建。

开发模式：

```bash
npm run tauri:dev
```

Windows 打包：

```bash
npm run tauri:build
```
