# 宜承多多工作台

拼多多商家商品属性填写辅助工具，基于 Electron 构建，当前以内置模板、素材和模板快照导出为主。

## 功能特性

- **模板管理**：支持创建、保存、复制商品属性模板
- **图片导入**：支持批量导入商品白底图、长图、主图和详情图
- **模板快照导出**：支持将模板 JSON 和关联素材一起导出到文件夹，方便后续外部脚本复用

## 项目结构

```text
多多上架RPA/
├── electron/                    # Electron 主进程
│   ├── main.js                  # 应用入口
│   ├── preload.js               # 预加载脚本（桥接前后端）
│   └── services/                # 服务层
│       ├── assetService.js      # 资源管理服务
│       ├── templateStore.js     # 模板存储服务
│       └── workspace.js         # 工作目录服务
├── scripts/                     # 构建辅助脚本
│   └── build-python-helpers.js  # 构建一键登录/在线检查 helper 目录
├── automation/                  # 预留给后续外部脚本集成
│   ├── automation_bridge.py     # Legacy DrissionPage 脚本（仅保留参考）
│   └── requirements.txt         # Legacy DrissionPage 依赖（仅保留参考）
├── dist/                        # 构建输出目录
└── 商家属性填写html.html        # 前端页面
```

## 快速开始

### 环境要求

- Node.js 16+
- Python 3.x
- PyInstaller
- DrissionPage 4.1.1.2
- Windows 10/11
- Google Chrome

### 安装依赖

```bash
npm install
```

### 运行开发版本

```bash
npm run dev
```

## 构建发布版本

```bash
npm run build
```

构建命令会先把 Python helper 脚本打成 onedir 目录，再执行 Electron NSIS 安装版打包。

构建完成后：

- 安装版主产物位于 `dist/宜承多多工作台-<version>-setup.exe`
- 解包目录位于 `dist/win-unpacked/`
- 随包 helper 位于 `dist/win-unpacked/resources/helpers/<helper-name>/`

发布版目标机器不需要预装 Python，但仍需要：

- Windows 10/11 x64
- Google Chrome
- 可访问业务后端和 anti-content 服务

## 使用说明

### 1. 创建模板

首次使用，点击“新建模板”创建商品属性配置，填写：

- 商品标题
- 商品描述
- 满2件折扣
- 市场价
- 商品类型（二手/全新）
- 发货设置
- 上架设置等

### 2. 导入商品图片

在模板中导入所需图片：

- 白底图（主图）
- 长图
- 主图相册（最多 10 张）
- 详情图相册

### 3. 导出模板快照

1. 选择已保存的模板
2. 点击“保存模板到文件夹”
3. 选择导出目录
4. 程序会导出 `template.json` 与关联素材目录
5. 后续可由你自己的 Python Playwright 脚本直接复用该快照
6. 导出的 `formData` 中，SKU 会整理为 `skuList` 数组，不再输出 `goodsSkuDetail[0][specName]` 这类扁平字段；每个 SKU 项会额外带出同索引 SKU 图的 `skuThumbAbsolutePath`
7. 如果当前类目的商品属性已加载，导出的 `formData` 中还会生成 `attributeList`，直接带出属性名、属性值和属性 ID
8. 如果当前已拿到上架类目接口中的 `stapleName`，导出的 `formData` 中还会生成 `categoryStapleNames` 和 `categoryFullPath`

### 4. 模板管理

- **复制模板**：快速创建相似商品模板
- **设为默认**：下次自动加载该模板
- **删除模板**：同时清理关联的图片资源

## 命令行参数

### Electron 主程序

| 参数 | 说明 |
|------|------|
| `--workspace-root` | 指定工作区根目录 |

## 注意事项

1. 当前内置自动填充已移除，建议通过模板快照配合你自己的外部脚本执行自动化。
2. 工作区中的模板、素材和浏览器配置目录会继续保留，方便后续脚本复用。
3. 安装版默认把工作区存放到 `%LOCALAPPDATA%\宜承多多工作台\data`。
4. 首次启动安装版时，如果新工作区还是空的，程序会提示你选择旧便携版的 `data` 目录进行导入。
5. 建议定期备份工作区中的模板和配置文件。

## 开发相关

### Legacy 脚本

- `automation/automation_bridge.py` 与 `automation/requirements.txt` 仅保留作为旧 DrissionPage 实现参考，不再参与当前自动化主流程和构建。
- `tools/店铺一键登录/拼多多cookie一键登录.py` 和 `tools/检查是否登录状态是否正常/检查cookies状态.py` 会在构建时被打包为随应用分发的 helper 目录。

### 查看构建日志

应用运行日志位于工作区的 `logs/` 目录。
