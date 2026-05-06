const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");
const { dialog } = require("electron");

function normalizeRelativePath(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function createAssetService(workspace) {
  async function ensureDirectory(targetPath) {
    await fs.mkdir(targetPath, { recursive: true });
  }

  function makeAssetRef(targetPath, payload) {
    return {
      assetId: crypto.randomUUID(),
      zone: payload.zone,
      slotIndex: payload.slotIndex ?? null,
      fileName: path.basename(targetPath),
      absolutePath: targetPath,
      relativePath: normalizeRelativePath(path.relative(workspace.root, targetPath)),
      fileUrl: pathToFileURL(targetPath).href,
      importedAt: new Date().toISOString()
    };
  }

  async function copyAssetFile(sourcePath, payload, offset = 0) {
    const extension = path.extname(sourcePath);
    const assetFolder = path.join(workspace.assets, payload.templateId, payload.zone);
    const resolvedSlotIndex = payload.slotIndex === null || payload.slotIndex === undefined
      ? null
      : payload.slotIndex + offset;
    const slotLabel = resolvedSlotIndex === null ? "single" : `slot-${resolvedSlotIndex}`;
    const targetPath = path.join(assetFolder, `${slotLabel}-${Date.now()}-${offset}${extension}`);

    await ensureDirectory(assetFolder);
    await fs.copyFile(sourcePath, targetPath);

    return makeAssetRef(targetPath, {
      ...payload,
      slotIndex: resolvedSlotIndex
    });
  }

  function resolveRemoteExtension(url, contentType = "") {
    const pathname = safeParseUrl(url)?.pathname || "";
    const rawExtension = path.extname(pathname).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"].includes(rawExtension)) {
      return rawExtension;
    }

    const normalizedContentType = String(contentType || "").toLowerCase();
    if (normalizedContentType.includes("png")) {
      return ".png";
    }
    if (normalizedContentType.includes("webp")) {
      return ".webp";
    }
    if (normalizedContentType.includes("bmp")) {
      return ".bmp";
    }
    if (normalizedContentType.includes("gif")) {
      return ".gif";
    }

    return ".jpg";
  }

  function safeParseUrl(value) {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  }

  async function downloadRemoteAsset(url, payload, offset = 0) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "image/*,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
        }
      });

      if (!response.ok) {
        throw new Error(`下载失败，状态码 ${response.status}`);
      }

      const assetFolder = path.join(workspace.assets, payload.templateId, payload.zone);
      const resolvedSlotIndex = payload.slotIndex === null || payload.slotIndex === undefined
        ? null
        : payload.slotIndex + offset;
      const slotLabel = resolvedSlotIndex === null ? "single" : `slot-${resolvedSlotIndex}`;
      const extension = resolveRemoteExtension(url, response.headers.get("content-type"));
      const targetPath = path.join(assetFolder, `${slotLabel}-${Date.now()}-${offset}${extension}`);

      await ensureDirectory(assetFolder);
      const arrayBuffer = await response.arrayBuffer();
      await fs.writeFile(targetPath, Buffer.from(arrayBuffer));

      return makeAssetRef(targetPath, {
        ...payload,
        slotIndex: resolvedSlotIndex
      });
    } catch (error) {
      const suffix = error?.name === "AbortError" ? "请求超时" : error?.message || "未知错误";
      throw new Error(`远程图片下载失败：${suffix}`);
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  async function importAsset(browserWindow, payload) {
    const result = await dialog.showOpenDialog(browserWindow, {
      title: "选择图片素材",
      properties: payload.multiple ? ["openFile", "multiSelections"] : ["openFile"],
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "bmp"] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return payload.multiple ? [] : null;
    }

    const maxCount = Number.isFinite(payload.maxCount) ? payload.maxCount : result.filePaths.length;
    const selectedPaths = result.filePaths.slice(0, Math.max(maxCount, 0));
    const importedRefs = await Promise.all(
      selectedPaths.map((sourcePath, index) => copyAssetFile(sourcePath, payload, index))
    );

    return payload.multiple ? importedRefs : importedRefs[0] || null;
  }

  async function importRemoteAsset(payload = {}) {
    const urls = (Array.isArray(payload.urls) ? payload.urls : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    if (!payload?.templateId || !payload?.zone || !urls.length) {
      return [];
    }

    const maxCount = Number.isFinite(Number(payload.maxCount))
      ? Math.max(Number(payload.maxCount), 0)
      : urls.length;
    const selectedUrls = urls.slice(0, maxCount);
    const importedRefs = [];

    try {
      for (let index = 0; index < selectedUrls.length; index += 1) {
        const importedRef = await downloadRemoteAsset(selectedUrls[index], payload, index);
        importedRefs.push(importedRef);
      }

      return importedRefs;
    } catch (error) {
      await Promise.all(importedRefs.map((ref) => {
        return fs.rm(ref.absolutePath, { force: true }).catch(() => undefined);
      }));
      throw error;
    }
  }

  async function removeAsset(payload) {
    if (!payload?.ref) {
      return { removed: false };
    }

    const assetPath = payload.ref.absolutePath || path.join(workspace.root, payload.ref.relativePath || "");
    await fs.rm(assetPath, { force: true });
    return { removed: true };
  }

  async function cloneRef(ref, targetTemplateId) {
    if (!ref) {
      return null;
    }

    const sourcePath = ref.absolutePath || path.join(workspace.root, ref.relativePath);
    const extension = path.extname(sourcePath);
    const tempFolder = path.join(workspace.assets, targetTemplateId, ref.zone);
    const slotLabel = ref.slotIndex === null || ref.slotIndex === undefined
      ? "single"
      : `slot-${ref.slotIndex}`;
    const targetPath = path.join(tempFolder, `${slotLabel}-${Date.now()}${extension}`);

    await ensureDirectory(tempFolder);
    await fs.copyFile(sourcePath, targetPath);
    return makeAssetRef(targetPath, {
      zone: ref.zone,
      slotIndex: ref.slotIndex ?? null
    });
  }

  async function cloneImageRefs(imageRefs, targetTemplateId) {
    async function cloneValue(value) {
      if (Array.isArray(value)) {
        return Promise.all(value.map((item) => cloneValue(item)));
      }

      if (!value || typeof value !== "object") {
        return value ?? null;
      }

      if (value.relativePath || value.absolutePath) {
        return cloneRef(value, targetTemplateId);
      }

      const nextEntries = await Promise.all(
        Object.entries(value).map(async ([key, nestedValue]) => [key, await cloneValue(nestedValue)])
      );

      return Object.fromEntries(nextEntries);
    }

    return cloneValue(imageRefs);
  }

  async function removeTemplateAssets(templateId) {
    await fs.rm(path.join(workspace.assets, templateId), { recursive: true, force: true });
  }

  async function listAssets(payload) {
    const targetFolder = path.join(workspace.assets, payload.templateId || "");
    try {
      const entries = await fs.readdir(targetFolder, { recursive: true, withFileTypes: true });
      return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
    } catch {
      return [];
    }
  }

  return {
    importAsset,
    importRemoteAsset,
    removeAsset,
    cloneImageRefs,
    removeTemplateAssets,
    listAssets
  };
}

module.exports = {
  createAssetService
};
