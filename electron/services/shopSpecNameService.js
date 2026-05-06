const DEFAULT_TIMEOUT_MS = 10000;
const SPEC_NAME_LIST_URL = "https://mms.pinduoduo.com/glide/v2/mms/query/spec/name/list";
const ANTI_CONTENT_URL = "http://106.75.215.11:9000/api/0as";

async function listSpecNamesByCookie({ cookie1, catId } = {}) {
  const normalizedCookie = String(cookie1 || "").trim();
  const normalizedCatId = String(catId || "").trim();

  if (!normalizedCookie) {
    return {
      ok: false,
      code: "COOKIE_MISSING",
      message: "该店铺缺少 cookie1，无法加载商品规格"
    };
  }

  if (!normalizedCatId) {
    return {
      ok: false,
      code: "CAT_ID_REQUIRED",
      message: "缺少三级类目 ID，无法加载商品规格"
    };
  }

  const etagMatch = normalizedCookie.match(/rckk=([^;]+)/);
  if (!etagMatch?.[1]) {
    return {
      ok: false,
      code: "ETAG_MISSING",
      message: "该店铺的 cookie1 中缺少 rckk，无法加载商品规格"
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
      message: "未获取到 anti-content，无法加载商品规格",
      payload: antiContentResponse.payload
    };
  }

  const response = await requestJson(SPEC_NAME_LIST_URL, {
    method: "POST",
    headers: buildHeaders({
      antiContent,
      etag: etagMatch[1],
      cookie1: normalizedCookie
    }),
    json: {
      cat_id: Number.isFinite(Number(normalizedCatId)) ? Number(normalizedCatId) : normalizedCatId
    }
  });

  const payload = response.payload;
  if (payload?.success !== true || !Array.isArray(payload?.result)) {
    return {
      ok: false,
      code: "SPEC_NAME_REQUEST_FAILED",
      message: extractMessage(payload) || "加载商品规格失败",
      payload
    };
  }

  return {
    ok: true,
    specOptions: normalizeSpecOptions(payload.result),
    payload
  };
}

function buildHeaders({ antiContent, etag, cookie1 }) {
  return {
    accept: "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "anti-content": String(antiContent || ""),
    "cache-control": "max-age=0",
    "content-type": "application/json",
    etag: String(etag || ""),
    origin: "https://mms.pinduoduo.com",
    priority: "u=1, i",
    referer: "https://mms.pinduoduo.com/goods/goods_add/index",
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

function normalizeSpecOptions(source) {
  const sortedOptions = (Array.isArray(source) ? source : [])
    .map((item) => {
      return {
        id: String(item?.id ?? "").trim(),
        key: String(item?.key ?? "").trim(),
        label: String(item?.label ?? item?.value ?? item?.name ?? "").trim(),
        value: String(item?.value ?? item?.label ?? item?.name ?? "").trim(),
        isRecommended: Boolean(item?.is_recommended)
      };
    })
    .filter((item) => item.id && item.label)
    .sort((left, right) => {
      if (left.isRecommended !== right.isRecommended) {
        return left.isRecommended ? -1 : 1;
      }
      return left.label.localeCompare(right.label, "zh-CN");
    });

  const seenLabels = new Set();
  return sortedOptions.filter((item) => {
    if (!item.label || seenLabels.has(item.label)) {
      return false;
    }

    seenLabels.add(item.label);
    return true;
  });
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
      throw createError("商品规格接口请求超时", "TIMEOUT", error);
    }

    throw createError("商品规格接口请求失败", "NETWORK_ERROR", error);
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
  listSpecNamesByCookie
};
