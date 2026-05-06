
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 项目概述

宜承多多工作台 — 一个基于 Electron 的拼多多商家上架辅助桌面工具。负责模板管理、素材导入、模板快照导出，以及调用业务后端 / Playwright / Python helper exe 完成店铺登录态、类目、属性、SKU 等数据获取。当前自动填充逻辑已下线，自动化由用户外部脚本基于导出的模板快照执行。

# 常用命令

| 场景 | 命令 |
|------|------|
| 启动开发版（无需打包 helper exe） | `npm run dev` 或 `npm start` |
| 仅打包在线检查 Python helper exe | `npm run build:helpers` |
| 打 NSIS 安装版（含在线检查 helper） | `npm run build` |
| 仅 electron-builder 打 dir 包 | `npm run pack` |
| 渲染端调试时强制走开发服务器 | 设置环境变量 `ELECTRON_RENDERER_URL=http://...` |
| 用自定义工作区目录启动 | `electron . --workspace-root <绝对路径>` 或 `--workspace-root=<路径>` |

仓库目前没有自动化测试套件、lint 配置和 npm test 脚本，**不要**自行新增 lint/test 命令并声称「已通过验证」；改完代码请用 `npm run dev` 启动 Electron 在浏览器化的渲染端实际点一遍受影响的功能。

构建依赖：Node.js 16+、Python 3、PyInstaller、Playwright Core、Windows 10/11、Google Chrome（`scripts/build-python-helpers.js` 主动检查 `process.platform === "win32"` 并直接抛错）。

# 架构总览

## 三段式分层

1. **Electron 主进程** (`electron/main.js`)
   - `bootstrap()` 顺序：preflight 工作区 → 可选迁移旧便携版 data → `ensureWorkspace` → 初始化各 service → `registerIpcHandlers` → 创建 BrowserWindow。
   - 单一 BrowserWindow（`商家属性填写html.html`），开发模式下若检测到 `http://127.0.0.1:5173` 可达则优先加载该 URL，否则加载本地 HTML 文件。
   - **所有渲染端能力都通过 IPC 暴露**，不要让渲染端绕过 preload 直接做 Node 操作（`contextIsolation: true`，`nodeIntegration: false`）。

2. **Preload 桥** (`electron/preload.js`)
   - 通过 `contextBridge.exposeInMainWorld("desktopBridge", ...)` 暴露 `template / asset / auth / workspace` 四个命名空间。
   - 渲染端只允许通过 `window.desktopBridge.*` 调用主进程；新增 IPC 通道时必须在 preload 中显式映射。

3. **渲染端**：根目录的 `商家属性填写html.html` + `商家属性填写.js`（≈7500 行）+ `商家属性填写.css` + `zapier-refresh.css`。**单文件渲染端，没有打包器、没有模块系统**。修改前先用 `Grep` 定位 `buildInitial*State` / 顶层注册函数，避免引入 ES module 语法或 import。

## 服务层 (`electron/services/`)

服务统一以 `create*(workspace, deps)` 工厂函数形式暴露，方便注入。重要边界：

- `workspace.js`：唯一负责 **工作区路径解析、迁移和 preflight** 的模块。优先级：`--workspace-root` CLI > 便携版 `PORTABLE_EXECUTABLE_DIR`/`PORTABLE_EXECUTABLE_FILE` 同级 `data/` > 安装版 `%LOCALAPPDATA%\宜承多多工作台\data` > 开发态 `<repo>/data`。`buildWorkspacePaths()` 同时产出私有路径和供渲染端用的 `publicPaths`，**新增工作区子目录请加入 `ensureWorkspace` 的 `Promise.all` 列表**。
- `templateStore.js` / `assetService.js` / `sessionStore.js` / `credentialStore.js` / `shopCatalogStore.js`：基于 `workspace` 路径做 JSON / 文件级持久化，导出模板时 `templateStore.exportTemplate` 会展开 `formData`、生成 `skuList`、`attributeList`、`categoryStapleNames`、`categoryFullPath` 等结构化字段供外部脚本消费。
- `backendClient.js`：与业务后端 `http://106.75.215.11:8080` 交互的核心。维护 `currentUser / shopCatalog / cookieJar / categoryCache / attributeCache / skuSpecCache` 等内存态；登录、店铺/类目/属性/SKU 拉取、一键登录、店铺总览全部经由它。会话失效会通过 `onSessionInvalidated` 回调把 `auth:event` 推到渲染端。
- `shopCategoryService / shopPropertyService / shopSpecNameService / shopGoodsDetailService / shopQuickLoginService / shopOverviewService / shopOnlineChecker`：基于 cookie 直连拼多多接口的客户端，由 `backendClient` 组合调用。
- `externalTooling.js`：解析 helper exe 路径（当前主要服务在线检查 helper；新增 helper 时需同时改 `scripts/build-python-helpers.js` 的 `HELPERS` 列表和 `package.json` 的 `extraResources`）。
- `salesOverviewExportService.js`：用 `exceljs` 把渲染端组装好的 payload 写成 xlsx，由主进程 `workspace:exportSalesOverview` IPC 触发 `dialog.showSaveDialog`。

## IPC 通道命名约定

`<namespace>:<verb>`，已注册：`workspace:* / template:* / asset:* / auth:*`。新增通道时务必同时改：
1. `electron/main.js` 的 `registerIpcHandlers`
2. `electron/preload.js` 暴露给渲染端的方法
3. 渲染端 `商家属性填写.js` 中调用 `window.desktopBridge.*` 的位置

## Python helper / 外部脚本

- `electron/services/shopQuickLoginService.js`：当前一键登录实现，直接在 Electron 主进程里调用 `playwright-core` + 本机 Chrome 打开持久化浏览器并注入 cookies。
- `tools/检查是否登录状态是否正常/检查cookies状态.py` 是 **构建时打包成 exe** 的 helper（产物名 `shop-online-check.exe`，由 `scripts/build-python-helpers.js` 产出到 `.build/python-helpers/` 后被 `extraResources` 拷到 `resources/helpers/`）。
- `tools/` 下其他子目录（`按商品ID填充之属性 / 获取上架类目 / 经营总览脚本 / 商品规格可选` 等）是 **业务接口的 reference 实现**，正常构建不打包，仅作为参考。
- `automation/automation_bridge.py` 是 **legacy DrissionPage 实现**，仅供参考，不参与当前流程。
- `drission_example_profile/` 是历史浏览器画像目录，构建时不参与；运行时实际画像走工作区下的 `browser-profile-playwright/` 与 `browser-profile-cookie-login/`。

## 工作区数据布局

`<workspace-root>/`
- `templates/`：模板 JSON
- `assets/`：模板关联素材（白底 / 长图 / 主图相册 / 详情图 / SKU 缩略）
- `browser-profile-playwright/`、`browser-profile-cookie-login/`：浏览器画像
- `logs/`、`config.json`、`login-credentials.json`、`auth-session.json`、`.workspace-migration.json`

安装版首启会在工作区为空且未标记迁移时弹出「导入旧便携版 data」流程；这部分逻辑在 `main.js#maybeRunWorkspaceMigration` 和 `workspace.js#migrateLegacyWorkspace`。如果调整迁移检测，需要同时维护 `MIGRATION_HINT_NAMES` 列表和 `markWorkspaceMigrationState` 写入。

# 注意事项

1. 渲染端是 **单巨型 JS 文件**，没有模块/构建系统；不要在其中使用 `import` / `require`，新增逻辑沿用现有的全局函数 + `buildInitial*State` 模式。
2. 接触模板导出 (`templateStore.exportTemplate`) 时务必同步阅读 README 第 3 节，避免破坏 `skuList / attributeList / categoryStapleNames / categoryFullPath` 这些下游脚本依赖的字段。
3. 业务后端默认地址 `http://106.75.215.11:8080` 在 `backendClient.js` 中作为 `DEFAULT_BASE_URL` 硬编码，UI 上允许修改，但代码层不要随意散落硬编码。
4. 改 helper / 脚本路径前请确认 `extraResources` 与 `externalTooling.resolvePackagedHelperPath` 的候选列表都覆盖到，否则安装版和开发版会出现行为差异。
5. 一键登录当前依赖本机 Chrome；如果调整 `shopQuickLoginService.js` 的浏览器发现逻辑，务必同时验证开发态和安装版。
6. 受限角色控制（`canUseShopQuickLogin / canViewAllShops` 等）写在 `backendClient.js` 顶部，新增功能权限时优先复用这些 helper 而不是再起一套判断。
