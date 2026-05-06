const path = require("path");
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");

const {
  ensureWorkspace,
  getWorkspacePreflight,
  markWorkspaceMigrationState,
  migrateLegacyWorkspace
} = require("./services/workspace");
const { createTemplateStore } = require("./services/templateStore");
const { createAssetService } = require("./services/assetService");
const { createSessionStore } = require("./services/sessionStore");
const { createCredentialStore } = require("./services/credentialStore");
const { createShopCatalogStore } = require("./services/shopCatalogStore");
const { createBackendClient, DEFAULT_BASE_URL } = require("./services/backendClient");
const { createSalesOverviewExportService } = require("./services/salesOverviewExportService");

let mainWindow;
let services;

async function bootstrap() {
  const workspacePreflight = await getWorkspacePreflight(app);
  await maybeRunWorkspaceMigration(workspacePreflight);
  const workspace = await ensureWorkspace(app, {
    cliWorkspaceRoot: workspacePreflight.cliWorkspaceRoot
  });
  const templateStore = createTemplateStore(workspace);
  const assetService = createAssetService(workspace);
  const sessionStore = createSessionStore(workspace);
  const credentialStore = createCredentialStore(workspace);
  const shopCatalogStore = createShopCatalogStore(workspace);
  const salesOverviewExportService = createSalesOverviewExportService(workspace);
  const backendClient = createBackendClient({
    defaultBaseUrl: DEFAULT_BASE_URL,
    credentialStore,
    shopCatalogStore,
    sessionStore,
    onSessionInvalidated: publishAuthEvent,
    workspace
  });

  services = {
    workspace,
    templateStore,
    assetService,
    sessionStore,
    credentialStore,
    shopCatalogStore,
    salesOverviewExportService,
    backendClient
  };

  registerIpcHandlers();
  await templateStore.ensureBootstrapTemplate();
  await createMainWindow();
}

async function maybeRunWorkspaceMigration(preflight) {
  if (!preflight?.shouldPromptForMigration) {
    return;
  }

  while (true) {
    const choice = await dialog.showMessageBox({
      type: "question",
      buttons: ["选择旧 data 目录", "跳过迁移"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
      title: "导入旧便携版数据",
      message: "检测到当前安装版工作区还是空的，是否导入旧便携版的 data 目录？",
      detail: [
        "选择“选择旧 data 目录”后，程序会把旧便携版 data 中的模板、素材、登录态和浏览器资料复制到当前安装版工作区。",
        "原便携版 data 目录会保留不动。"
      ].join("\n\n")
    });

    if (choice.response !== 0) {
      await markWorkspaceMigrationState(preflight.root, {
        skipped: true
      });
      return;
    }

    const selectedRoot = await promptForLegacyWorkspaceRoot();
    if (!selectedRoot) {
      const retryChoice = await dialog.showMessageBox({
        type: "question",
        buttons: ["重新选择", "跳过迁移"],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
        title: "未选择目录",
        message: "还没有选择旧便携版的 data 目录。",
        detail: "如果暂时不需要导入旧数据，可以直接跳过迁移。"
      });

      if (retryChoice.response !== 0) {
        await markWorkspaceMigrationState(preflight.root, {
          skipped: true
        });
        return;
      }

      continue;
    }

    try {
      await migrateLegacyWorkspace({
        sourceRoot: selectedRoot,
        targetRoot: preflight.root
      });
      await markWorkspaceMigrationState(preflight.root, {
        completed: true,
        sourceRoot: selectedRoot
      });
      await dialog.showMessageBox({
        type: "info",
        buttons: ["确定"],
        defaultId: 0,
        noLink: true,
        title: "导入完成",
        message: "旧便携版数据已复制到安装版工作区。"
      });
      return;
    } catch (error) {
      const retryChoice = await dialog.showMessageBox({
        type: "error",
        buttons: ["重新选择", "跳过迁移"],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
        title: "导入失败",
        message: error?.message || "旧数据导入失败",
        detail: "你可以重新选择旧便携版的 data 目录，或先跳过迁移，后续再手工处理。"
      });

      if (retryChoice.response !== 0) {
        await markWorkspaceMigrationState(preflight.root, {
          skipped: true
        });
        return;
      }
    }
  }
}

async function promptForLegacyWorkspaceRoot() {
  const result = await dialog.showOpenDialog({
    title: "选择旧便携版 data 目录",
    properties: ["openDirectory"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return "";
  }

  return result.filePaths[0] || "";
}

async function createMainWindow() {
  const windowIconPath = path.join(__dirname, "..", "ico.png");

  mainWindow = new BrowserWindow({
    width: 1680,
    height: 1040,
    minWidth: 1220,
    minHeight: 860,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#fffefb",
    title: "宜承多多工作台",
    icon: windowIconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    mainWindow.maximize();
    mainWindow.show();
  });

  await loadRendererEntry(mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function publishAuthEvent(event) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send("auth:event", {
    timestamp: new Date().toISOString(),
    ...event
  });
}

async function loadRendererEntry(window) {
  const explicitRendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (explicitRendererUrl) {
    await window.loadURL(explicitRendererUrl);
    return;
  }

  const devServerUrl = "http://127.0.0.1:5173";
  if (!app.isPackaged && await isRendererServerAvailable(devServerUrl)) {
    await window.loadURL(devServerUrl);
    return;
  }

  await window.loadFile(path.join(__dirname, "..", "商家属性填写html.html"));
}

async function isRendererServerAvailable(url) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function createIpcErrorResult(error, defaultMessage) {
  return {
    ok: false,
    canceled: false,
    error: {
      message: error?.message || defaultMessage
    }
  };
}

function registerIpcHandlers() {
  ipcMain.handle("workspace:getPaths", async () => services.workspace.publicPaths);

  ipcMain.handle("workspace:openFolder", async (_event, key = "root") => {
    const targetPath = services.workspace.publicPaths[key] || services.workspace.publicPaths.root;
    return shell.openPath(targetPath);
  });

  ipcMain.handle("workspace:openPath", async (_event, targetPath) => {
    if (!targetPath) {
      return "";
    }
    return shell.openPath(targetPath);
  });

  ipcMain.handle("workspace:exportSalesOverview", async (event, payload) => {
    try {
      const senderWindow = BrowserWindow.fromWebContents(event.sender);
      const defaultPath = services.salesOverviewExportService.buildDefaultPath(payload?.meta);
      const result = await dialog.showSaveDialog(senderWindow, {
        title: "导出经营总览",
        defaultPath,
        filters: [
          {
            name: "Excel 工作簿",
            extensions: ["xlsx"]
          }
        ]
      });

      if (result.canceled || !result.filePath) {
        return {
          ok: false,
          canceled: true
        };
      }

      return services.salesOverviewExportService.exportWorkbook(payload, result.filePath);
    } catch (error) {
      return createIpcErrorResult(error, "导出经营总览失败");
    }
  });

  const templateHandlers = {
    "template:list": () => services.templateStore.listTemplates(),
    "template:load": (_event, templateId) => services.templateStore.loadTemplate(templateId),
    "template:create": (_event, payload) => services.templateStore.createTemplate(payload),
    "template:save": (_event, payload) => services.templateStore.saveTemplate(payload),
    "template:setDefault": (_event, templateId) => services.templateStore.setDefaultTemplate(templateId)
  };

  Object.entries(templateHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });

  ipcMain.handle("template:exportToFolder", async (event, templateId) => {
    try {
      const senderWindow = BrowserWindow.fromWebContents(event.sender);
      const result = await dialog.showOpenDialog(senderWindow, {
        title: "选择模板导出目录",
        properties: ["openDirectory", "createDirectory"]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { ok: false, canceled: true };
      }

      const exported = await services.templateStore.exportTemplate(templateId, result.filePaths[0]);
      return {
        ok: true,
        canceled: false,
        ...exported
      };
    } catch (error) {
      return createIpcErrorResult(error, "导出模板失败");
    }
  });

  ipcMain.handle("template:delete", async (_event, templateId) => {
    await services.assetService.removeTemplateAssets(templateId);
    return services.templateStore.deleteTemplate(templateId);
  });

  ipcMain.handle("template:duplicate", async (_event, templateId) => {
    const source = await services.templateStore.loadTemplate(templateId);
    const duplicate = await services.templateStore.createTemplate({
      name: `${source.meta.name} 副本`,
      formData: source.formData,
      imageRefs: services.templateStore.buildEmptyImageRefs(),
      attributeLabels: source.attributeLabels || {},
      categoryMeta: source.categoryMeta || {},
      meta: {
        lastRunResult: source.meta.lastRunResult || null,
      },
    });

    const clonedImageRefs = await services.assetService.cloneImageRefs(source.imageRefs, duplicate.id);

    return services.templateStore.saveTemplate({
      id: duplicate.id,
      name: duplicate.meta.name,
      formData: duplicate.formData,
      imageRefs: clonedImageRefs,
      attributeLabels: duplicate.attributeLabels || source.attributeLabels || {},
      categoryMeta: duplicate.categoryMeta || source.categoryMeta || {},
      meta: {
        lastRunResult: duplicate.meta.lastRunResult || null,
      },
    });
  });

  ipcMain.handle("asset:import", async (event, payload) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    return services.assetService.importAsset(senderWindow, payload);
  });

  ipcMain.handle("asset:importRemote", async (_event, payload) => {
    return services.assetService.importRemoteAsset(payload);
  });
  const simpleAssetHandlers = {
    "asset:remove": (_event, payload) => services.assetService.removeAsset(payload),
    "asset:list": (_event, payload) => services.assetService.listAssets(payload)
  };

  Object.entries(simpleAssetHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });

  const simpleAuthHandlers = {
    "auth:login": (_event, payload) => services.backendClient.login(payload),
    "auth:me": () => services.backendClient.me(),
    "auth:restoreSession": () => services.backendClient.restoreSession(),
    "auth:logout": () => services.backendClient.logout(),
    "auth:changePassword": (_event, payload) => services.backendClient.changePassword(payload),
    "auth:listShops": (_event, payload) => services.backendClient.listShops(payload),
    "auth:listPublishCategories": (_event, payload) => services.backendClient.listPublishCategories(payload),
    "auth:listCategoryAttributes": (_event, payload) => services.backendClient.listCategoryAttributes(payload),
    "auth:listCategorySkuSpecs": (_event, payload) => services.backendClient.listCategorySkuSpecs(payload),
    "auth:getProductFullDetail": (_event, payload) => services.backendClient.getProductFullDetail(payload),
    "auth:getShopOverview": (_event, payload) => services.backendClient.getShopOverview(payload),
    "auth:testProductsData": (_event, payload) => services.backendClient.testProductsData(payload),
    "auth:quickLoginShop": (_event, payload) => services.backendClient.quickLoginShop(payload),
    "auth:getState": () => services.backendClient.getState()
  };

  Object.entries(simpleAuthHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });

  ipcMain.handle("auth:clearSession", async (_event, payload) => {
    return services.backendClient.clearSession({
      preserveBaseUrl: payload?.preserveBaseUrl !== false,
      notify: false
    });
  });
}

app.whenReady().then(bootstrap);

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
