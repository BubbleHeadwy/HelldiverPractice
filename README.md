# Helldiver Practice

《绝地潜兵 2》战略配备训练器，使用 `Vue 3 + TypeScript + Vite` 构建前端，并预留 `Tauri` 用于 Windows 轻量桌面打包。

## 主要功能

- 包含目前版本所有战略配备
- 包含 wiki 中的 `Current Stratagems` 与 `Mission Stratagems`
- 支持自由绑定按键
- 支持历史平均耗时与 KPS 统计
- 可重复进行训练


## 和 Wiki 同步战略配备

本项目的战略配备数据与图标来源于 [helldivers.wiki.gg - Stratagems](https://helldivers.wiki.gg/wiki/Stratagems)。

同步脚本位置：

- [scripts/sync-stratagems-from-wiki.mjs](HelldiverPractice/scripts/sync-stratagems-from-wiki.mjs)

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
  - [public/data/stratagems.json](HelldiverPractice/public/data/stratagems.json)
- 图标资源：
  - `public/assets/icons`
- 音效资源：
  - `public/assets/audio`

## 启动开发版

```bash
npm install
npm run dev
```

默认开发地址为 `http://localhost:5173`。
