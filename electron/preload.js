const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  template: {
    list: () => ipcRenderer.invoke("template:list"),
    load: (templateId) => ipcRenderer.invoke("template:load", templateId),
    create: (payload) => ipcRenderer.invoke("template:create", payload),
    save: (payload) => ipcRenderer.invoke("template:save", payload),
    delete: (templateId) => ipcRenderer.invoke("template:delete", templateId),
    duplicate: (templateId) => ipcRenderer.invoke("template:duplicate", templateId),
    setDefault: (templateId) => ipcRenderer.invoke("template:setDefault", templateId),
    exportToFolder: (templateId) => ipcRenderer.invoke("template:exportToFolder", templateId)
  },
  asset: {
    import: (payload) => ipcRenderer.invoke("asset:import", payload),
    importRemote: (payload) => ipcRenderer.invoke("asset:importRemote", payload),
    writeGeneratedBatch: (payload) => ipcRenderer.invoke("asset:writeGeneratedBatch", payload),
    remove: (payload) => ipcRenderer.invoke("asset:remove", payload),
    list: (payload) => ipcRenderer.invoke("asset:list", payload)
  },
  auth: {
    login: (payload) => ipcRenderer.invoke("auth:login", payload),
    me: () => ipcRenderer.invoke("auth:me"),
    restoreSession: () => ipcRenderer.invoke("auth:restoreSession"),
    logout: () => ipcRenderer.invoke("auth:logout"),
    changePassword: (payload) => ipcRenderer.invoke("auth:changePassword", payload),
    listShops: (payload) => ipcRenderer.invoke("auth:listShops", payload),
    listPublishCategories: (payload) => ipcRenderer.invoke("auth:listPublishCategories", payload),
    listCategoryAttributes: (payload) => ipcRenderer.invoke("auth:listCategoryAttributes", payload),
    listCategorySkuSpecs: (payload) => ipcRenderer.invoke("auth:listCategorySkuSpecs", payload),
    rewriteSkuSpecNames: (payload) => ipcRenderer.invoke("auth:rewriteSkuSpecNames", payload),
    getProductFullDetail: (payload) => ipcRenderer.invoke("auth:getProductFullDetail", payload),
    getShopOverview: (payload) => ipcRenderer.invoke("auth:getShopOverview", payload),
    testProductsData: (payload) => ipcRenderer.invoke("auth:testProductsData", payload),
    quickLoginShop: (payload) => ipcRenderer.invoke("auth:quickLoginShop", payload),
    clearSession: (payload) => ipcRenderer.invoke("auth:clearSession", payload),
    getState: () => ipcRenderer.invoke("auth:getState"),
    onEvent: (callback) => {
      const handler = (_event, payload) => callback(payload);
      ipcRenderer.on("auth:event", handler);
      return () => ipcRenderer.removeListener("auth:event", handler);
    }
  },
  workspace: {
    getPaths: () => ipcRenderer.invoke("workspace:getPaths"),
    openFolder: (key) => ipcRenderer.invoke("workspace:openFolder", key),
    openPath: (targetPath) => ipcRenderer.invoke("workspace:openPath", targetPath),
    exportSalesOverview: (payload) => ipcRenderer.invoke("workspace:exportSalesOverview", payload)
  },
  automation: {
    startAutoFill: (payload) => ipcRenderer.invoke("automation:startAutoFill", payload),
    getState: () => ipcRenderer.invoke("automation:getState"),
    onEvent: (callback) => {
      const handler = (_event, payload) => callback(payload);
      ipcRenderer.on("automation:event", handler);
      return () => ipcRenderer.removeListener("automation:event", handler);
    }
  },
  window: {
    enterQuickLogin: () => ipcRenderer.invoke("window:enterQuickLogin"),
    exitQuickLogin: () => ipcRenderer.invoke("window:exitQuickLogin")
  }
});
