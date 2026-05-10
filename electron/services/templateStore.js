const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

function buildEmptyImageRefs() {
  return {
    mainGallery: [],
    detailGallery: [],
    whiteImage: null,
    longImage: null,
    skuThumbs: [],
    logoBatches: {
      mainGallery: null,
      skuThumbs: null
    }
  };
}

function sanitizeFileName(value, fallback = "template") {
  const normalized = String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");

  return normalized || fallback;
}

function normalizeRelativePath(relativePath) {
  return relativePath.split(path.sep).join("/");
}

const EXPORT_FORM_DATA_KEY_LABELS = new Map([
  ["pddForm_categoryId1", "一级类目ID"],
  ["categoryId1", "一级类目ID"],
  ["pddForm_categoryId2", "二级类目ID"],
  ["categoryId2", "二级类目ID"],
  ["pddForm_categoryId3", "三级类目ID"],
  ["categoryId3", "三级类目ID"],
  ["pddForm_leafCategoryId", "末级类目ID"],
  ["leafCategoryId", "末级类目ID"],
  ["pddForm_costTemplateId", "运费模板ID"],
  ["costTemplateId", "运费模板ID"],
  ["pddForm_shipmentLimitSecond", "发货时限秒"],
  ["shipmentLimitSecond", "发货时限秒"],
  ["pddForm_shipmentLimitSecondCustom", "发货时限秒(自定义)"],
  ["shipmentLimitSecondCustom", "发货时限秒(自定义)"],
  ["pddForm_sendAddress", "发货地"],
  ["sendAddress", "发货地"],
  ["pddForm_marketPrice", "商品市场价"],
  ["marketPrice", "商品市场价"],
  ["pddForm_styleCode", "满2件折扣"],
  ["styleCode", "满2件折扣"]
]);

const OMITTED_EXPORT_FORM_DATA_KEYS = new Set([
  "pddForm_shortDesc",
  "shortDesc",
  "pddForm_shareDesc",
  "shareDesc",
  "pddForm_outGoodsSn",
  "outGoodsSn"
]);

function isBlankExportValue(value) {
  return value === undefined || value === null || value === "";
}

function splitCategoryPath(value) {
  return String(value || "")
    .split(">")
    .map((item) => item.trim())
    .filter(Boolean);
}

const EXPORT_SKU_FIELD_NAMES = ["specName", "groupPrice", "singlePrice", "stock", "outSkuSn"];
const SKU_DETAIL_KEY_REGEX = new RegExp(`^goodsSkuDetail\\[(\\d+)\\]\\[(${EXPORT_SKU_FIELD_NAMES.join("|")})\\]$`);

function isSkuDetailFormKey(key) {
  return SKU_DETAIL_KEY_REGEX.test(String(key || "").trim());
}

function extractAttributeRefPidFromKey(key) {
  const normalizedKey = String(key || "").trim();
  const match = normalizedKey.match(/^pddForm_goodsAttribute_(\d+)$/) || normalizedKey.match(/^goodsAttribute\[(\d+)\]$/);
  return match?.[1] || "";
}

function isAttributeFormKey(key) {
  return Boolean(extractAttributeRefPidFromKey(key));
}

function buildBlankExportSkuRow() {
  const row = {};
  EXPORT_SKU_FIELD_NAMES.forEach((field) => {
    row[field] = "";
  });
  row.skuThumbAbsolutePath = "";
  return row;
}

function normalizeExportSkuRow(row = {}, skuThumbRef = null) {
  const normalized = {};
  EXPORT_SKU_FIELD_NAMES.forEach((field) => {
    normalized[field] = String(row?.[field] || "").trim();
  });
  normalized.skuThumbAbsolutePath = String(skuThumbRef?.absolutePath || "").trim();
  return normalized;
}

function extractExportSkuList(formData, skuThumbRefs = []) {
  const groupedRows = new Map();

  Object.entries(formData || {}).forEach(([key, value]) => {
    const match = String(key || "").trim().match(SKU_DETAIL_KEY_REGEX);
    if (!match) {
      return;
    }

    const index = Number(match[1]);
    const field = match[2];
    if (!groupedRows.has(index)) {
      groupedRows.set(index, buildBlankExportSkuRow());
    }

    groupedRows.get(index)[field] = String(value ?? "").trim();
  });

  return Array.from(groupedRows.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([index, row]) => normalizeExportSkuRow(row, Array.isArray(skuThumbRefs) ? skuThumbRefs[index] : null))
    .filter((row) => Object.values(row).some((value) => value !== ""));
}

function extractExportAttributeList(formData, attributeLabels = {}, attributeMeta = {}) {
  const groupedAttributes = new Map();

  Object.entries(formData || {}).forEach(([key, value]) => {
    const refPid = extractAttributeRefPidFromKey(key);
    if (!refPid) {
      return;
    }

    const normalizedValue = String(value ?? "").trim();
    if (!groupedAttributes.has(refPid)) {
      groupedAttributes.set(refPid, {
        refPid,
        name: String(attributeLabels?.[refPid] || "").trim() || `属性${refPid}`,
        value: normalizedValue
      });
      return;
    }

    const current = groupedAttributes.get(refPid);
    if (isBlankExportValue(current.value) && !isBlankExportValue(normalizedValue)) {
      current.value = normalizedValue;
    }
  });

  return Array.from(groupedAttributes.values())
    .filter((item) => !isBlankExportValue(item.value))
    .map((item) => {
      const meta = attributeMeta?.[item.refPid] || {};
      const enriched = { ...item };
      const vid = String(meta.vid || "").trim();
      const unit = String(meta.unit || "").trim();
      if (vid) {
        enriched.vid = vid;
      }
      if (unit) {
        enriched.unit = unit;
      }
      return enriched;
    });
}

function localizeExportFormData(formData, attributeLabels = {}, imageRefs = {}, categoryMeta = {}, attributeMeta = {}) {
  const source = formData && typeof formData === "object" ? formData : {};
  const skuList = extractExportSkuList(source, Array.isArray(imageRefs?.skuThumbs) ? imageRefs.skuThumbs : []);
  const attributeList = extractExportAttributeList(source, attributeLabels, attributeMeta);
  const stapleNames = (Array.isArray(categoryMeta?.stapleNames) ? categoryMeta.stapleNames : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const categoryPath = splitCategoryPath(source.pddForm_categoryData ?? source.categoryData ?? "");
  const fullCategoryPath = stapleNames.length
    ? [...stapleNames, ...categoryPath].filter(Boolean).join(" > ")
    : "";

  const result = Object.entries(source).reduce((result, [key, value]) => {
    if (OMITTED_EXPORT_FORM_DATA_KEYS.has(key)) {
      return result;
    }

    if (isSkuDetailFormKey(key)) {
      return result;
    }

    if (isAttributeFormKey(key)) {
      return result;
    }

    const exportKey = EXPORT_FORM_DATA_KEY_LABELS.get(key) || key;
    const hasExistingValue = Object.prototype.hasOwnProperty.call(result, exportKey);

    if (!hasExistingValue || (isBlankExportValue(result[exportKey]) && !isBlankExportValue(value))) {
      result[exportKey] = value;
    }

    return result;
  }, {});

  if (skuList.length) {
    result.skuList = skuList;
  }

  if (attributeList.length) {
    result.attributeList = attributeList;
  }

  if (stapleNames.length) {
    result.categoryStapleNames = stapleNames;
  }

  if (fullCategoryPath) {
    result.categoryFullPath = fullCategoryPath;
  }

  return result;
}

function createTemplateStore(workspace) {
  async function readConfig() {
    return JSON.parse(await fs.readFile(workspace.configPath, "utf-8"));
  }

  async function writeConfig(nextConfig) {
    const payload = {
      ...nextConfig,
      updatedAt: new Date().toISOString()
    };
    await fs.writeFile(workspace.configPath, JSON.stringify(payload, null, 2), "utf-8");
    return payload;
  }

  function getTemplatePath(templateId) {
    return path.join(workspace.templates, `${templateId}.json`);
  }

  async function readTemplateFile(templatePath) {
    return JSON.parse(await fs.readFile(templatePath, "utf-8"));
  }

  async function listTemplateFiles() {
    const entries = await fs.readdir(workspace.templates, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => path.join(workspace.templates, entry.name));
  }

  async function listTemplates() {
    const config = await readConfig();
    const templateFiles = await listTemplateFiles();
    const templates = await Promise.all(templateFiles.map(readTemplateFile));

    templates.sort((left, right) => {
      return new Date(right.meta.updatedAt).getTime() - new Date(left.meta.updatedAt).getTime();
    });

    return {
      templates: templates.map((template) => ({
        id: template.id,
        meta: {
          ...template.meta,
          isDefault: config.defaultTemplateId === template.id
        }
      })),
      currentTemplateId: config.currentTemplateId,
      defaultTemplateId: config.defaultTemplateId
    };
  }

  async function loadTemplate(templateId) {
    const template = await readTemplateFile(getTemplatePath(templateId));
    const config = await readConfig();
    return {
      ...template,
      meta: {
        ...template.meta,
        isDefault: config.defaultTemplateId === template.id
      }
    };
  }

  async function createTemplate(payload = {}) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const template = {
      id,
      meta: {
        name: payload.name || "未命名模板",
        createdAt: now,
        updatedAt: now,
        lastRunResult: payload.meta?.lastRunResult || null
      },
      formData: payload.formData || {},
      imageRefs: payload.imageRefs || buildEmptyImageRefs(),
      attributeLabels: payload.attributeLabels || {},
      attributeMeta: payload.attributeMeta || {},
      categoryMeta: payload.categoryMeta || {}
    };

    await fs.writeFile(getTemplatePath(id), JSON.stringify(template, null, 2), "utf-8");

    const config = await readConfig();
    await writeConfig({
      ...config,
      currentTemplateId: id,
      defaultTemplateId: config.defaultTemplateId || id
    });

    return loadTemplate(id);
  }

  async function saveTemplate(payload) {
    const current = await loadTemplate(payload.id);
    const nextTemplate = {
      ...current,
      meta: {
        ...current.meta,
        ...payload.meta,
        name: payload.name || current.meta.name,
        updatedAt: new Date().toISOString()
      },
      formData: payload.formData || current.formData,
      imageRefs: payload.imageRefs || current.imageRefs,
      attributeLabels: payload.attributeLabels ?? current.attributeLabels ?? {},
      attributeMeta: payload.attributeMeta ?? current.attributeMeta ?? {},
      categoryMeta: payload.categoryMeta ?? current.categoryMeta ?? {}
    };

    await fs.writeFile(getTemplatePath(payload.id), JSON.stringify(nextTemplate, null, 2), "utf-8");

    const config = await readConfig();
    await writeConfig({
      ...config,
      currentTemplateId: payload.id
    });

    return loadTemplate(payload.id);
  }

  async function deleteTemplate(templateId) {
    await fs.rm(getTemplatePath(templateId), { force: true });

    const snapshot = await listTemplates();
    const fallbackTemplateId = snapshot.templates[0]?.id || null;
    const nextCurrentId = snapshot.currentTemplateId === templateId ? fallbackTemplateId : snapshot.currentTemplateId;
    const nextDefaultId = snapshot.defaultTemplateId === templateId ? fallbackTemplateId : snapshot.defaultTemplateId;

    await writeConfig({
      currentTemplateId: nextCurrentId,
      defaultTemplateId: nextDefaultId
    });

    return {
      deleted: true,
      currentTemplateId: nextCurrentId,
      defaultTemplateId: nextDefaultId
    };
  }

  async function setDefaultTemplate(templateId) {
    const config = await readConfig();
    await writeConfig({
      ...config,
      currentTemplateId: templateId,
      defaultTemplateId: templateId
    });
    return loadTemplate(templateId);
  }

  async function ensureBootstrapTemplate() {
    if ((await listTemplateFiles()).length === 0) {
      await createTemplate({ name: "默认模板" });
    }
  }

  async function copyAssetRefForExport(ref, exportRoot, usedPaths) {
    if (!ref || typeof ref !== "object") {
      return ref ?? null;
    }

    const sourcePath = ref.absolutePath || (ref.relativePath ? path.join(workspace.root, ref.relativePath) : null);
    if (!sourcePath) {
      return ref;
    }

    const zoneFolder = sanitizeFileName(ref.zone || "assets", "assets");
    const extension = path.extname(sourcePath);
    const baseName = sanitizeFileName(path.basename(sourcePath, extension), "asset");
    const assetFolder = path.join(exportRoot, "assets", zoneFolder);
    await fs.mkdir(assetFolder, { recursive: true });

    let candidateName = `${baseName}${extension}`;
    let counter = 1;
    while (usedPaths.has(path.join(assetFolder, candidateName).toLowerCase())) {
      candidateName = `${baseName}-${counter}${extension}`;
      counter += 1;
    }

    const targetPath = path.join(assetFolder, candidateName);
    usedPaths.add(targetPath.toLowerCase());
    await fs.copyFile(sourcePath, targetPath);

    return {
      ...ref,
      absolutePath: targetPath,
      relativePath: normalizeRelativePath(path.relative(exportRoot, targetPath)),
      fileUrl: pathToFileURL(targetPath).href
    };
  }

  async function exportImageRefsWithCount(value, exportRoot, usedPaths) {
    if (Array.isArray(value)) {
      const results = await Promise.all(
        value.map((item) => exportImageRefsWithCount(item, exportRoot, usedPaths))
      );
      return {
        value: results.map((result) => result.value),
        count: results.reduce((sum, result) => sum + result.count, 0)
      };
    }

    if (!value || typeof value !== "object") {
      return { value: value ?? null, count: 0 };
    }

    if (value.absolutePath || value.relativePath) {
      return {
        value: await copyAssetRefForExport(value, exportRoot, usedPaths),
        count: 1
      };
    }

    const nextEntries = await Promise.all(
      Object.entries(value).map(async ([key, nestedValue]) => {
        const result = await exportImageRefsWithCount(nestedValue, exportRoot, usedPaths);
        return [key, result];
      })
    );

    return {
      value: Object.fromEntries(nextEntries.map(([key, result]) => [key, result.value])),
      count: nextEntries.reduce((sum, [, result]) => sum + result.count, 0)
    };
  }

  async function exportTemplate(templateId, selectedDirectory) {
    const template = await loadTemplate(templateId);
    const folderName = `${sanitizeFileName(template.meta.name, template.id)}-${new Date().toISOString().slice(0, 10)}`;
    const exportRoot = path.join(selectedDirectory, folderName);
    const usedPaths = new Set();

    await fs.mkdir(exportRoot, { recursive: true });
    const { value: imageRefs, count: assetCount } = await exportImageRefsWithCount(
      template.imageRefs || buildEmptyImageRefs(),
      exportRoot,
      usedPaths
    );
    const rawFormData = template.formData || {};
    const exportedTemplate = {
      ...template,
      formData: localizeExportFormData(
        rawFormData,
        template.attributeLabels || {},
        imageRefs,
        template.categoryMeta || {},
        template.attributeMeta || {}
      ),
      imageRefs
    };

    const templatePath = path.join(exportRoot, "template.json");
    await fs.writeFile(templatePath, JSON.stringify(exportedTemplate, null, 2), "utf-8");

    return {
      exportRoot,
      templatePath,
      assetCount,
      templateName: template.meta.name
    };
  }

  return {
    buildEmptyImageRefs,
    ensureBootstrapTemplate,
    listTemplates,
    loadTemplate,
    createTemplate,
    saveTemplate,
    deleteTemplate,
    setDefaultTemplate,
    getTemplatePath,
    exportTemplate
  };
}

module.exports = {
  createTemplateStore
};
