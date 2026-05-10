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
    const resolvedSlotIndex = payload.slotIndex === null || payload.slotIndex === undefined
      ? null
      : payload.slotIndex + offset;
    const targetPath = buildAssetTargetPath({
      templateId: payload.templateId,
      zone: payload.zone,
      slotIndex: resolvedSlotIndex,
      extension,
      offset
    });

    await ensureDirectory(path.dirname(targetPath));
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

  function buildAssetTargetPath({
    templateId,
    zone,
    slotIndex = null,
    extension = ".png",
    offset = 0,
    fileNameHint = ""
  }) {
    const assetFolder = path.join(workspace.assets, templateId, zone);
    const slotLabel = slotIndex === null || slotIndex === undefined ? "single" : `slot-${slotIndex}`;
    const normalizedHint = String(fileNameHint || "")
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const suffix = normalizedHint ? `-${normalizedHint}` : "";
    return path.join(assetFolder, `${slotLabel}-${Date.now()}-${offset}${suffix}${extension}`);
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

      const resolvedSlotIndex = payload.slotIndex === null || payload.slotIndex === undefined
        ? null
        : payload.slotIndex + offset;
      const extension = resolveRemoteExtension(url, response.headers.get("content-type"));
      const targetPath = buildAssetTargetPath({
        templateId: payload.templateId,
        zone: payload.zone,
        slotIndex: resolvedSlotIndex,
        extension,
        offset
      });

      await ensureDirectory(path.dirname(targetPath));
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

  function resolveDataUrlExtension(dataUrl) {
    const prefix = String(dataUrl || "").slice(0, 64).toLowerCase();
    if (prefix.includes("image/jpeg")) {
      return ".jpg";
    }
    if (prefix.includes("image/webp")) {
      return ".webp";
    }
    return ".png";
  }

  function decodeDataUrlToBuffer(dataUrl) {
    const match = String(dataUrl || "").match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i);
    if (!match?.[2]) {
      throw new Error("生成图片数据无效");
    }
    return Buffer.from(match[2], "base64");
  }

  async function writeGeneratedBatch(payload = {}) {
    const templateId = String(payload.templateId || "").trim();
    const zone = String(payload.zone || "").trim();
    const items = Array.isArray(payload.items) ? payload.items : [];

    if (!templateId || !zone || !items.length) {
      return [];
    }

    const writtenRefs = [];
    try {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index] || {};
        const slotIndex = Number.isFinite(Number(item.slotIndex)) ? Number(item.slotIndex) : null;
        const dataUrl = String(item.dataUrl || "").trim();
        if (!dataUrl) {
          throw new Error("生成图片数据为空");
        }
        const extension = resolveDataUrlExtension(dataUrl);
        const targetPath = buildAssetTargetPath({
          templateId,
          zone,
          slotIndex,
          extension,
          offset: index,
          fileNameHint: item.fileNameHint || ""
        });
        await ensureDirectory(path.dirname(targetPath));
        await fs.writeFile(targetPath, decodeDataUrlToBuffer(dataUrl));
        writtenRefs.push(makeAssetRef(targetPath, { zone, slotIndex }));
      }
      return writtenRefs;
    } catch (error) {
      await Promise.all(
        writtenRefs.map((ref) => fs.rm(ref.absolutePath, { force: true }).catch(() => undefined))
      );
      throw error;
    }
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
    writeGeneratedBatch,
    removeAsset,
    cloneImageRefs,
    removeTemplateAssets,
    listAssets
  };
}

module.exports = {
  createAssetService
};
