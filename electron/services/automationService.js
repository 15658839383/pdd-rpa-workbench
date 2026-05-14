const fs = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");
const { createAutomationError } = require("./browserAutomationShared");
const {
  buildPythonEnv,
  resolvePackagedHelperPath,
  resolvePythonRunner,
  resolveScriptPath
} = require("./externalTooling");

const AUTO_FILL_HELPER_FILE_NAME = "pdd-auto-fill.exe";
const AUTO_FILL_SCRIPT_RELATIVE_PATH = "新店1.py";

function createAutomationService({ workspace, templateStore, backendClient, onEvent } = {}) {
  let currentRun = null;

  function getState() {
    if (!currentRun) {
      return {
        status: "idle",
        running: false
      };
    }

    return {
      status: currentRun.status,
      running: currentRun.status === "running",
      runId: currentRun.runId,
      shopCode: currentRun.shopCode,
      shopName: currentRun.shopName,
      templateId: currentRun.templateId,
      startedAt: currentRun.startedAt
    };
  }

  async function startAutoFill(payload = {}) {
    if (currentRun?.status === "running") {
      return {
        ok: false,
        error: {
          code: "AUTO_FILL_ALREADY_RUNNING",
          message: "已有自动填充任务正在运行，请等待完成后再启动"
        }
      };
    }

    const templateId = String(payload.templateId || "").trim();
    const shopCode = String(payload.shopCode || "").trim();

    if (!templateId) {
      return failure("TEMPLATE_REQUIRED", "请先选择模板，再启动自动填充");
    }

    if (!shopCode) {
      return failure("SHOP_CODE_REQUIRED", "请先选择店铺，再启动自动填充");
    }

    const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    currentRun = {
      runId,
      templateId,
      shopCode,
      shopName: shopCode,
      status: "running",
      startedAt: new Date().toISOString()
    };

    publish("started", {
      runId,
      templateId,
      shopCode,
      message: "正在准备自动填充运行环境..."
    });

    try {
      const shopResult = await backendClient.resolveAutoFillShop({ shopCode });
      if (!shopResult?.ok) {
        throw createAutomationError(
          shopResult?.error?.message || "自动填充启动前解析店铺失败",
          shopResult?.error?.code || "AUTO_FILL_SHOP_RESOLVE_FAILED"
        );
      }

      const shop = shopResult.shop || {};
      currentRun.shopName = shop.shopName || shop.shopCode || shopCode;
      publish("progress", {
        runId,
        shopCode: shop.shopCode || shopCode,
        shopName: currentRun.shopName,
        message: `已确认店铺《${currentRun.shopName}》，正在生成运行快照...`
      });

      const template = await templateStore.loadTemplate(templateId);
      const snapshotPath = await writeRunSnapshot({ runId, template, shop });

      publish("progress", {
        runId,
        shopCode: shop.shopCode || shopCode,
        shopName: currentRun.shopName,
        message: "运行快照已生成，正在使用 Playwright 启动浏览器并注入 cookies..."
      });

      const scriptResult = await runAutoFillScript({
        snapshotPath,
        browserPayload: {
          shopCode: shop.shopCode || shopCode,
          shopName: currentRun.shopName,
          cookie1: shop.cookie1,
          profileRoot: String(
            workspace?.browserProfileAutoFill
            || workspace?.publicPaths?.browserProfileAutoFill
            || path.join(workspace?.root || process.cwd(), "browser-profile-auto-fill")
          ).trim()
        },
        runId
      });

      currentRun.status = "success";
      currentRun.finishedAt = new Date().toISOString();
      publish("completed", {
        runId,
        shopCode: shop.shopCode || shopCode,
        shopName: currentRun.shopName,
        templateId,
        snapshotPath,
        message: scriptResult.message || `店铺《${currentRun.shopName}》自动填充已完成，请在浏览器中人工检查后发布`
      });

      const result = {
        ok: true,
        runId,
        shopCode: shop.shopCode || shopCode,
        shopName: currentRun.shopName,
        snapshotPath,
        message: scriptResult.message || `店铺《${currentRun.shopName}》自动填充已完成，请人工检查`
      };
      currentRun = null;
      return result;
    } catch (error) {
      const normalized = normalizeAutomationError(error);
      const failedRun = currentRun || { runId, shopCode, templateId };
      currentRun = null;
      publish("failed", {
        runId: failedRun.runId,
        shopCode: failedRun.shopCode,
        shopName: failedRun.shopName || failedRun.shopCode,
        templateId: failedRun.templateId,
        message: normalized.message,
        error: normalized
      });
      return {
        ok: false,
        error: normalized
      };
    }
  }

  async function writeRunSnapshot({ runId, template, shop }) {
    const runRoot = path.join(workspace.automationRuns || path.join(workspace.root, "automation-runs"), runId);
    await fs.mkdir(runRoot, { recursive: true });

    const snapshot = buildAutomationSnapshot({ runId, template, shop });
    const snapshotPath = path.join(runRoot, "input.json");
    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), "utf-8");
    return snapshotPath;
  }

  async function runAutoFillScript({ snapshotPath, browserPayload, runId }) {
    const resolvedHelperPath = resolvePackagedHelperPath(AUTO_FILL_HELPER_FILE_NAME);
    const resolvedScriptPath = resolveScriptPath(AUTO_FILL_SCRIPT_RELATIVE_PATH);
    let command = "";
    let args = [];

    if (resolvedHelperPath) {
      command = resolvedHelperPath;
      args = [
        "--input-json",
        snapshotPath
      ];
    } else {
      if (!resolvedScriptPath) {
        throw createAutomationError("未找到自动填充脚本 新店1.py", "AUTO_FILL_SCRIPT_NOT_FOUND");
      }
      const pythonRunner = resolvePythonRunner((message, code) => createAutomationError(message, code));
      command = pythonRunner.command;
      args = [
        ...pythonRunner.args,
        resolvedScriptPath,
        "--input-json",
        snapshotPath
      ];
    }

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: path.dirname(snapshotPath),
        env: buildPythonEnv(),
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"]
      });

      let stdoutBuffer = "";
      let stderrBuffer = "";
      let finalMessage = "";
      let finalErrorMessage = "";
      let settled = false;

      child.stdin.write(JSON.stringify(browserPayload || {}), "utf-8");
      child.stdin.end();

      child.stdout.on("data", (chunk) => {
        const text = chunk.toString("utf-8");
        stdoutBuffer += text;
        const lines = stdoutBuffer.split(/\r?\n/);
        stdoutBuffer = lines.pop() || "";
        lines.forEach((line) => {
          const parsed = parseJsonLine(line);
          if (parsed?.message) {
            if (parsed.type === "error") {
              finalErrorMessage = parsed.message;
            } else {
              finalMessage = parsed.message;
            }
            publish("progress", {
              runId,
              message: parsed.message,
              step: parsed.step || ""
            });

            if (parsed.type === "completed" && !settled) {
              settled = true;
              resolve({
                message: parsed.message || finalMessage || "自动填充脚本执行完成，请人工检查页面"
              });
            }
          }
        });
      });

      child.stderr.on("data", (chunk) => {
        stderrBuffer += chunk.toString("utf-8");
      });

      child.on("error", (error) => {
        if (settled) {
          return;
        }
        settled = true;
        reject(createAutomationError(`自动填充脚本启动失败：${error.message}`, "AUTO_FILL_SPAWN_FAILED", error));
      });

      child.on("close", (code) => {
        if (settled) {
          return;
        }
        settled = true;
        if (code === 0) {
          resolve({
            message: finalMessage || "自动填充脚本执行完成，请人工检查页面"
          });
          return;
        }

        const stderrText = stderrBuffer.trim();
        const stdoutText = stdoutBuffer.trim();
        const detail = [finalErrorMessage, stderrText, stdoutText].filter(Boolean).join("\n").trim();
        reject(createAutomationError(
          detail ? `自动填充脚本执行失败：${detail}` : `自动填充脚本执行失败，退出码 ${code}`,
          "AUTO_FILL_SCRIPT_FAILED"
        ));
      });
    });
  }

  function publish(type, payload = {}) {
    if (typeof onEvent !== "function") {
      return;
    }

    onEvent({
      type,
      timestamp: new Date().toISOString(),
      ...payload
    });
  }

  return {
    getState,
    startAutoFill
  };
}

function buildAutomationSnapshot({ runId, template, shop }) {
  const rawFormData = template?.formData && typeof template.formData === "object" ? template.formData : {};
  const imageRefs = template?.imageRefs && typeof template.imageRefs === "object" ? template.imageRefs : {};
  const skuThumbRefs = Array.isArray(imageRefs.skuThumbs) ? imageRefs.skuThumbs : [];
  const formData = {
    ...rawFormData,
    pddForm_firstShopId: shop.shopCode,
    firstShopId: shop.shopCode
  };

  const skuList = extractSkuList(formData, skuThumbRefs);
  if (skuList.length) {
    formData.skuList = skuList;
  }

  const attributeList = extractAttributeList(
    formData,
    template?.attributeLabels || {},
    template?.attributeMeta || {}
  );
  if (attributeList.length) {
    formData.attributeList = attributeList;
  }

  return {
    runId,
    createdAt: new Date().toISOString(),
    template: {
      id: template?.id || "",
      name: template?.meta?.name || ""
    },
    shop: {
      shopCode: shop.shopCode || "",
      shopName: shop.shopName || shop.shopCode || "",
      currentOperator: shop.currentOperator || "",
      platform: shop.platform || "",
      remark: shop.remark || ""
    },
    formData,
    imageRefs: normalizeImageRefs(imageRefs),
    attributeLabels: template?.attributeLabels || {},
    attributeMeta: template?.attributeMeta || {},
    categoryMeta: template?.categoryMeta || {}
  };
}

const SKU_FIELD_NAMES = ["specName", "groupPrice", "singlePrice", "stock", "outSkuSn"];
const SKU_DETAIL_KEY_REGEX = new RegExp(`^goodsSkuDetail\\[(\\d+)\\]\\[(${SKU_FIELD_NAMES.join("|")})\\]$`);

function extractSkuList(formData, skuThumbRefs = []) {
  if (Array.isArray(formData?.skuList)) {
    return formData.skuList.map((row, index) => ({
      ...row,
      skuThumbAbsolutePath: String(row?.skuThumbAbsolutePath || skuThumbRefs[index]?.absolutePath || "").trim()
    }));
  }

  if (typeof formData?.skuList === "string" && formData.skuList.trim()) {
    try {
      const parsed = JSON.parse(formData.skuList);
      if (Array.isArray(parsed)) {
        return parsed.map((row, index) => ({
          ...row,
          skuThumbAbsolutePath: String(row?.skuThumbAbsolutePath || skuThumbRefs[index]?.absolutePath || "").trim()
        }));
      }
    } catch {
      return [];
    }
  }

  const rows = new Map();
  Object.entries(formData || {}).forEach(([key, value]) => {
    const match = String(key || "").match(SKU_DETAIL_KEY_REGEX);
    if (!match) {
      return;
    }

    const index = Number(match[1]);
    const field = match[2];
    if (!rows.has(index)) {
      rows.set(index, {
        specName: "",
        groupPrice: "",
        singlePrice: "",
        stock: "",
        outSkuSn: "",
        skuThumbAbsolutePath: ""
      });
    }

    rows.get(index)[field] = String(value ?? "").trim();
  });

  return Array.from(rows.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([index, row]) => ({
      ...row,
      skuThumbAbsolutePath: String(skuThumbRefs[index]?.absolutePath || "").trim()
    }))
    .filter((row) => Object.values(row).some((value) => String(value || "").trim()));
}

function extractAttributeList(formData, attributeLabels = {}, attributeMeta = {}) {
  if (Array.isArray(formData?.attributeList)) {
    return formData.attributeList;
  }

  const rows = new Map();
  Object.entries(formData || {}).forEach(([key, value]) => {
    const refPid = extractAttributeRefPidFromKey(key);
    if (!refPid) {
      return;
    }

    const normalizedValue = String(value ?? "").trim();
    if (!rows.has(refPid)) {
      rows.set(refPid, {
        refPid,
        name: String(attributeLabels?.[refPid] || "").trim() || `属性${refPid}`,
        value: normalizedValue
      });
    } else if (!rows.get(refPid).value && normalizedValue) {
      rows.get(refPid).value = normalizedValue;
    }
  });

  return Array.from(rows.values())
    .filter((item) => String(item.value || "").trim())
    .map((item) => {
      const meta = attributeMeta?.[item.refPid] || {};
      return {
        ...item,
        ...(meta.vid ? { vid: String(meta.vid).trim() } : {}),
        ...(meta.unit ? { unit: String(meta.unit).trim() } : {})
      };
    });
}

function extractAttributeRefPidFromKey(key) {
  const normalizedKey = String(key || "").trim();
  const match = normalizedKey.match(/^pddForm_goodsAttribute_(\d+)$/)
    || normalizedKey.match(/^goodsAttribute\[(\d+)\]$/);
  return match?.[1] || "";
}

function normalizeImageRefs(imageRefs = {}) {
  return {
    ...imageRefs,
    mainGallery: normalizeRefArray(imageRefs.mainGallery),
    detailGallery: normalizeRefArray(imageRefs.detailGallery),
    skuThumbs: normalizeRefArray(imageRefs.skuThumbs)
  };
}

function normalizeRefArray(value) {
  return (Array.isArray(value) ? value : [])
    .filter(Boolean)
    .map((item) => ({
      ...item,
      absolutePath: String(item?.absolutePath || "").trim()
    }));
}

function parseJsonLine(line) {
  const text = String(line || "").trim();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeAutomationError(error) {
  return {
    code: error?.code || "AUTO_FILL_FAILED",
    message: error?.message || "自动填充失败，请稍后重试"
  };
}

function failure(code, message) {
  return {
    ok: false,
    error: {
      code,
      message
    }
  };
}

module.exports = {
  createAutomationService
};
