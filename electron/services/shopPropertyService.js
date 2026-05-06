const DEFAULT_TIMEOUT_MS = 10000;
const PROPERTY_TEMPLATE_URL = "https://mms.pinduoduo.com/draco-ms/mms/template/mall";
const ANTI_CONTENT_URL = "http://106.75.215.11:9000/api/0as";

async function listPropertiesByCookie({ cookie1, catId } = {}) {
  const normalizedCookie = String(cookie1 || "").trim();
  const normalizedCatId = String(catId || "").trim();

  if (!normalizedCookie) {
    return {
      ok: false,
      code: "COOKIE_MISSING",
      message: "该店铺缺少 cookie1，无法加载商品属性"
    };
  }

  if (!normalizedCatId) {
    return {
      ok: false,
      code: "CAT_ID_REQUIRED",
      message: "缺少三级类目 ID，无法加载商品属性"
    };
  }

  const etagMatch = normalizedCookie.match(/rckk=([^;]+)/);
  if (!etagMatch?.[1]) {
    return {
      ok: false,
      code: "ETAG_MISSING",
      message: "该店铺的 cookie1 中缺少 rckk，无法加载商品属性"
    };
  }

  const antiContentResponse = await requestJson(ANTI_CONTENT_URL, {
    headers: {
      accept: "application/json"
    }
  });
  const antiContent = antiContentResponse.payload?.data;

  if (!antiContent) {
    return {
      ok: false,
      code: "ANTI_CONTENT_MISSING",
      message: "未获取到 anti-content，无法加载商品属性"
    };
  }

  const url = `${PROPERTY_TEMPLATE_URL}?catId=${encodeURIComponent(normalizedCatId)}&pageType=1`;
  const response = await requestJson(url, {
    headers: buildHeaders({
      antiContent,
      etag: etagMatch[1],
      cookie1: normalizedCookie
    })
  });

  const payload = response.payload;
  if (payload?.success !== true || !payload?.result) {
    return {
      ok: false,
      code: "PROPERTY_REQUEST_FAILED",
      message: extractMessage(payload) || "加载商品属性失败",
      payload
    };
  }

  return {
    ok: true,
    attributes: normalizePropertyModules(payload.result?.modules),
    payload
  };
}

function buildHeaders({ antiContent, etag, cookie1 }) {
  return {
    accept: "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "anti-content": String(antiContent || ""),
    "cache-control": "max-age=0",
    etag: String(etag || ""),
    priority: "u=1, i",
    referer: "https://mms.pinduoduo.com/goods/category?msfrom=mms_sidenav",
    "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    cookie: String(cookie1 || "")
  };
}

function normalizePropertyModules(modules) {
  const source = Array.isArray(modules) ? modules : [];

  return source
    .flatMap((module) => Array.isArray(module?.propertys) ? module.propertys : [])
    .map((property) => {
      const refPid = String(property?.ref_pid ?? property?.pid ?? "").trim();
      const options = Array.isArray(property?.values?.content)
        ? property.values.content.map((item) => {
            return {
              id: String(item?.vid ?? item?.id ?? "").trim(),
              label: String(item?.value ?? "").trim()
            };
          }).filter((item) => item.id && item.label)
        : [];

      return {
        id: String(property?.id ?? refPid).trim(),
        pid: String(property?.pid ?? "").trim(),
        refPid,
        label: String(property?.name_alias ?? property?.name ?? "").trim(),
        required: Boolean(property?.required),
        important: Boolean(property?.is_important),
        controlType: Number(property?.control_type) || 0,
        chooseMaxNum: Number(property?.choose_max_num) || 0,
        maxValue: String(property?.max_value ?? "").trim(),
        minValue: String(property?.min_value ?? "").trim(),
        topTip: String(property?.top_tip ?? "").trim(),
        bottomTip: String(property?.bottom_tip ?? "").trim(),
        valueUnit: String(property?.value_unit ?? "").trim(),
        options,
        sortOrder: Number(property?.sort_order) || 0
      };
    })
    .filter((property) => property.refPid && property.label)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: options.headers,
      signal: controller.signal
    });
    const text = await response.text();
    return {
      statusCode: response.status,
      payload: parseJsonSafely(text)
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createError("商品属性接口请求超时", "TIMEOUT", error);
    }

    throw createError("商品属性接口请求失败", "NETWORK_ERROR", error);
  } finally {
    clearTimeout(timeoutHandle);
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
  listPropertiesByCookie
};
