const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_API_URL = process.env.PDD_AI_SPEC_RENAME_URL || "https://value.apiqik.online/v1/chat/completions";
const DEFAULT_MODEL = process.env.PDD_AI_SPEC_RENAME_MODEL || "gpt-5.4";
const DEFAULT_AUTHORIZATION = process.env.PDD_AI_SPEC_RENAME_AUTHORIZATION
  || process.env.PDD_AI_API_KEY
  || "";

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
      Authorization: DEFAULT_AUTHORIZATION,
      "Content-Type": "application/json"
    },
    json: {
      temperature: 0.7,
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
    "role": "system",
    "content": [
      "你是资深电商 SKU 规格命名师，擅长把原始规格改成更自然的售卖规格别名，用于降低同款比价识别。",
      "任务：根据商品标题、类目和规格类型重写商品规格值，输出统一风格的规格别名。",
      "硬性规则：",
      "1. 按输入 values 的顺序逐项改写，一一对应输出；不得新增或删减规格项。",
      "2. 同一组 values 内的所有规格必须保持完全一致的命名风格和结构，不允许第一个用“经典黑”第二个用“黑色”这种风格混杂。",
      "3. 颜色语义必须保留，但必须重组改写，禁止直接复用原词。可简称化（黑色→黑、白色→白）、可加限定修饰（黑色→经典黑、白色→暖白）、可调序组合。整组颜色必须统一改写手法。",
      "4. 数字、数量、配比、D数、尺码语义必须保留，但必须换表达形式。阿拉伯数字↔中文数字互转均可（6条→六条装，三条→3条装），D数可调位置或换符号（500D→D500/500旦），尺码可换写法（XL→加大码）。关键是换形式，不限定转换方向。",
      "5. 每一项都必须发生实质性文本变化，修改幅度须达到70%以上。不允许任何一项与原始值完全相同，不允许仅加前后缀敷衍了事。",
      "6. 括号非必须：可加可去可替换为 /、- 等普通符号，但整组规格须统一括号策略。",
      "7. 优先使用中文、数字、普通括号、/、-、+；严禁使用 ·、•、・、™、® 等装饰符号。",
      "8. 严禁机械追加“经典款、舒适款、优选款、日常款、基础款”等空泛修饰词；若要加修饰，必须与颜色/数量/材质融合成自然词组。",
      "9. 输出内容须短，适合直接作为商品规格值展示，控制在2-8个字之间。",
      "10. 只输出一个 JSON 对象，格式为 {\"dimensions\":[{\"slot\":0,\"values\":[\"...\"]}]}，不输出任何解释、Markdown 或代码块。",
      "风格一致性示例：",
      "输入：[\"黑色\",\"白色\",\"灰色\"] → 输出：[\"经典黑\",\"雅致白\",\"雾灰\"]",
      "输入：[\"6条\",\"12条\",\"24条\"] → 输出：[\"六条装\",\"十二条装\",\"二十四条装\"]",
      "输入：[\"六条装\",\"十二条装\",\"二十四条装\"] → 输出：[\"6条/包\",\"12条/包\",\"24条/包\"]",
      "输入：[\"黑色 6条\",\"白色 12条\",\"灰色 24条\"] → 输出：[\"黑/六条装\",\"白/十二条装\",\"灰/二十四条装\"]",
      "输入：[\"XL\",\"XXL\",\"XXXL\"] → 输出：[\"加大\",\"双加大\",\"三加大\"]",
      "输入：[\"加大\",\"双加大\",\"三加大\"] → 输出：[\"XL码\",\"XXL码\",\"XXXL码\"]"
    ].join("\n")
  },
    {
      role: "user",
      content: JSON.stringify({
        context,
        dimensions,
        rules: [
          "保持 slot 不变",
          "尽量保持每个 values 数组长度不变；确实无法处理时也不要编造无关规格",
          "保持每个 values 的顺序不变",
          "保留颜色、数量、配比、D数、尺码和适穿范围的语义；数量可以用中文数字或阿拉伯数字表达，如 6条/六条装 都可以，不能用单只",
          "允许改括号和普通符号；没有括号可以加，有括号可以去或替换；允许把颜色改成简称，允许调整顺序",
          "禁止使用特殊点号或装饰符号，例如 ·、•、・；优先使用 /、-、+、普通括号",
          "每一项都必须发生文本变化，不能返回和原始值完全相同的内容",
          "当原始值几乎只有颜色或数量时，按示例风格重构成规格别名，不要简单加形容词",
          "输出内容要短，适合作为商品规格值直接展示"
        ]
      }, null, 2)
    }
  ];
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
