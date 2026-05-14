const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_API_URL = process.env.PDD_AI_SPEC_RENAME_URL || "https://value.apiqik.online/v1/chat/completions";
const DEFAULT_MODEL = process.env.PDD_AI_SPEC_RENAME_MODEL || "gemini-3.1-flash-lite-preview";
const DEFAULT_AUTHORIZATION = process.env.PDD_AI_SPEC_RENAME_AUTHORIZATION
  || process.env.PDD_AI_API_KEY
  || "Bearer sk-f9DDXFBukvjdl970LScHVgVtFwIq0Ib4YVgZBRqTBo7O1Lag";

async function renameSkuSpecsWithAi(payload = {}) {
  const dimensions = normalizeRequestDimensions(payload.dimensions);
  const context = normalizeRenameContext(payload.context);
  if (!dimensions.length) {
    return {
      ok: false,
      code: "SPEC_VALUES_REQUIRED",
      message: "请先配置需要改写的规格值"
    };
  }

  if (!DEFAULT_AUTHORIZATION) {
    return {
      ok: false,
      code: "AI_AUTH_MISSING",
      message: "缺少 AI 接口授权配置，无法改写规格名"
    };
  }

  const response = await requestJson(DEFAULT_API_URL, {
    method: "POST",
    timeoutMs: DEFAULT_TIMEOUT_MS,
    headers: {
      Authorization: normalizeAuthorization(DEFAULT_AUTHORIZATION),
      "Content-Type": "application/json"
    },
    json: {
      temperature: resolveModelTemperature(DEFAULT_MODEL),
      model: DEFAULT_MODEL,
      stream: false,
      messages: buildMessages(dimensions, context)
    }
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    return {
      ok: false,
      code: "AI_REQUEST_FAILED",
      message: extractMessage(response.payload) || `AI 接口请求失败（${response.statusCode}）`,
      payload: response.payload
    };
  }

  const content = String(response.payload?.choices?.[0]?.message?.content || "").trim();
  if (!content) {
    return {
      ok: false,
      code: "AI_EMPTY_RESPONSE",
      message: "AI 未返回规格名结果",
      payload: response.payload
    };
  }

  const parsedContent = parseJsonStrict(content);
  if (!parsedContent.ok) {
    return {
      ok: false,
      code: "AI_INVALID_JSON",
      message: "AI 返回内容不是严格 JSON，未改动规格名",
      rawContent: content
    };
  }

  return {
    ok: true,
    dimensions: normalizeResponseDimensions(parsedContent.value?.dimensions),
    rawContent: content
  };
}

function normalizeRequestDimensions(source) {
  return (Array.isArray(source) ? source : [])
    .map((item) => {
      const slot = Number(item?.slot);
      const label = String(item?.label || item?.name || "").trim();
      const values = (Array.isArray(item?.values) ? item.values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean);

      return {
        slot,
        label,
        values
      };
    })
    .filter((item) => Number.isInteger(item.slot) && item.slot >= 0 && item.slot <= 1 && item.values.length);
}

function normalizeResponseDimensions(source) {
  return (Array.isArray(source) ? source : [])
    .map((item) => {
      return {
        slot: Number(item?.slot),
        values: (Array.isArray(item?.values) ? item.values : []).map((value) => String(value || "").trim())
      };
    })
    .filter((item) => Number.isInteger(item.slot) && item.slot >= 0 && item.slot <= 1);
}

function normalizeRenameContext(source) {
  return {
    productName: String(source?.productName || "").trim(),
    categoryPath: String(source?.categoryPath || "").trim()
  };
}

function buildMessages(dimensions, context = {}) {
  return [
    {
      role: "system",
      content: [
        "你是资深电商 SKU 规格命名师，擅长将原始规格值改写为更自然、更统一、更适合商品展示的规格别名。",
        "任务：根据商品标题、类目、规格类型和上下文，重写商品规格值，在不改变原始规格含义的前提下，输出统一风格、便于消费者理解的规格名称。",
        "必须严格遵守以下规则：",
        "1. 严格按输入 values 的顺序逐项改写，一一对应输出，不得新增、合并、拆分或删减规格项。",
        "2. 同一组 values 内的所有规格必须保持完全一致的命名风格、句式结构和表达粒度，不得出现风格混杂。",
        "3. 每一项都必须发生明显改写，不允许与原始值完全相同，也不允许只做机械性的前后缀增删、同义词硬替换或单字微调。",
        "4. 改写后必须保留原始规格的真实语义，不得虚构或篡改颜色、尺寸、容量、数量、材质、型号、适用对象、功能等关键信息。",
        "5. 如果原始规格较短，可在不改变含义的前提下适度丰富；如果原始规格较长，可在保留关键信息的前提下适度压缩。",
        "6. 同组规格之间必须有清晰区分，避免改写后出现含义重叠、难以分辨或近似重复。",
        "7. 优先使用自然、口语化、商品化的表达，避免生硬、模板化、堆砌式命名。",
        "8. 严禁使用未允许的特殊符号；仅可使用：【】、（）、()、/、\\、+、-、*、%、#。",
        "9. 输出前自行检查：数量一致、顺序一致、风格一致、含义未变、每项均已改写。",
        "10. 只输出一个 JSON 对象，格式为 {\"dimensions\":[{\"slot\":0,\"values\":[\"...\"]}]}，不得输出任何解释、Markdown、代码块或多余文本。"
      ].join("\n")
    },
    {
      role: "user",
      content: JSON.stringify({
        context,
        dimensions
      }, null, 2)
    }
  ];
}

function normalizeAuthorization(value) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return "";
  }

  return /^Bearer\s+/i.test(normalizedValue) ? normalizedValue : `Bearer ${normalizedValue}`;
}

function resolveModelTemperature(model) {
  const normalizedModel = String(model || "").trim().toLowerCase();
  if (normalizedModel.startsWith("moonshot-v1")) {
    return 0.3;
  }

  return 1;
}

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: options.headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
      signal: controller.signal
    });
    const text = await response.text();
    return {
      statusCode: response.status,
      payload: parseJsonSafely(text)
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createError("AI 接口请求超时", "TIMEOUT", error);
    }

    throw createError("AI 接口请求失败", "NETWORK_ERROR", error);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function parseJsonStrict(text) {
  try {
    return {
      ok: true,
      value: JSON.parse(String(text || "").trim())
    };
  } catch {
    return {
      ok: false,
      value: null
    };
  }
}

function parseJsonSafely(text) {
  const normalizedText = String(text || "").trim();
  if (!normalizedText) {
    return null;
  }

  try {
    return JSON.parse(normalizedText);
  } catch {
    return {
      raw: normalizedText
    };
  }
}

function extractMessage(payload) {
  if (!payload) {
    return "";
  }

  if (typeof payload === "string") {
    return payload.trim();
  }

  return [
    payload.error?.message,
    payload.errorMsg,
    payload.error_msg,
    payload.message,
    payload.msg,
    payload.error
  ].find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function createError(message, code, cause = null) {
  const error = new Error(message);
  error.code = code;
  error.cause = cause;
  return error;
}

module.exports = {
  renameSkuSpecsWithAi
};
