# Packing Workspace

这个目录是 `Helldiver Practice` 的桌面版打包工作台。

设计原则：
- 只在 `D:\Codex\HelldiverPractice\packing` 内新增或改动文件
- 读取项目根目录现有源码、`src-tauri` 配置和图标资源
- 默认生成 Windows `NSIS` 安装包

## 目录结构

- `doctor.ps1`：环境检测脚本
- `build-desktop.ps1`：打包入口脚本
- `vite.pack.config.mjs`：前端打包配置，输出到 `packing\.artifacts\web`
- `tauri.override.json`：Tauri 覆盖配置
- `.artifacts\cargo-target`：Rust 构建缓存
- `.artifacts\cargo-target\.tauri`：Tauri 本地工具缓存（如 NSIS）
- `.artifacts\web`：前端静态资源
- `release`：最终发布安装包
- `logs`：环境检测、前端构建和 Tauri 打包日志

## 依赖要求

打包前需要具备以下工具：
- Node.js / npm
- `npx tauri`
- Rust (`rustc` / `cargo`)
- Visual Studio Build Tools（包含 MSBuild、MSVC、Windows SDK、CMake）
- WebView2 Runtime

如果你刚安装完 Rust 或 Build Tools，当前终端可能还没刷新 PATH。此时建议关闭并重新打开终端后再执行脚本。

## 标准流程

在项目根目录执行：

```powershell
.\packing\build-desktop.ps1
```

如需清理旧产物再打包：

```powershell
.\packing\build-desktop.ps1 -Clean
```

如需覆盖本次发布版本：

```powershell
.\packing\build-desktop.ps1 -Version 0.1.1
```

## 输出位置

- 最终安装包位于 `packing\release`
- 预检和构建日志位于 `packing\logs`

安装包命名格式：

```text
Helldiver-Practice-v<version>-windows-x64-nsis.exe
```

## 常见问题

### 环境检测失败

先执行：

```powershell
.\packing\doctor.ps1
```

如果看到某些命令“不可见”但脚本也提示已安装在固定目录，通常是 PATH 还没刷新。重开终端后再试一次。

### 打包失败

优先查看：
- `packing\logs\doctor.log`
- `packing\logs\typecheck.log`
- `packing\logs\vite-build.log`
- `packing\logs\tauri-build.log`

### 为什么不直接用仓库根目录的 `dist`

这套工作台会把前端产物输出到 `packing\.artifacts\web`，避免把发布流程写回到仓库根目录的默认构建位置。

### 首次打包为什么更慢

首次执行时会发生两类冷启动成本：

- Rust 依赖首次编译
- Tauri 首次下载并缓存打包工具

当前配置已启用 `bundle.useLocalToolsDir = true`，相关工具会缓存到 `packing\.artifacts\cargo-target\.tauri`，后续打包会更快。
