const DEFAULT_TIMEOUT_MS = 10000;
const ROOT_CATEGORY_URL = "https://mms.pinduoduo.com/vodka/v2/mms/cat1List";
const CHILD_CATEGORY_URL = "https://mms.pinduoduo.com/vodka/v2/mms/categories";
const ANTI_CONTENT_URL = "http://106.75.215.11:9000/api/0as";

async function listCategoriesByCookie({ cookie1, parentId = "" } = {}) {
  const normalizedCookie = String(cookie1 || "").trim();
  if (!normalizedCookie) {
    return {
      ok: false,
      code: "COOKIE_MISSING",
      message: "该店铺缺少 cookie1，无法加载类目"
    };
  }

  const etagMatch = normalizedCookie.match(/rckk=([^;]+)/);
  if (!etagMatch?.[1]) {
    return {
      ok: false,
      code: "ETAG_MISSING",
      message: "该店铺的 cookie1 中缺少 rckk，无法加载类目"
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
      message: "未获取到 anti-content，无法加载类目",
      payload: antiContentResponse.payload
    };
  }

  const normalizedParentId = String(parentId || "").trim();
  const url = normalizedParentId
    ? `${CHILD_CATEGORY_URL}?parentId=${encodeURIComponent(normalizedParentId)}`
    : ROOT_CATEGORY_URL;

  const response = await requestJson(url, {
    headers: buildHeaders({
      antiContent,
      etag: etagMatch[1],
      cookie1: normalizedCookie
    })
  });

  if (response.payload?.success !== true || !Array.isArray(response.payload?.result)) {
    return {
      ok: false,
      code: "CATEGORY_REQUEST_FAILED",
      message: extractMessage(response.payload) || "加载类目失败",
      payload: response.payload
    };
  }

  return {
    ok: true,
    categories: normalizeCategoryList(response.payload.result, normalizedParentId),
    payload: response.payload
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

function normalizeCategoryList(source, parentId) {
  return (Array.isArray(source) ? source : []).map((item) => {
    const level = Number(item?.level) || (parentId ? 2 : 1);
    const normalizedParentId = String(
      item?.parent_id
      ?? item?.parentId
      ?? parentId
      ?? ""
    ).trim();

    return {
      id: String(item?.id ?? "").trim(),
      name: String(item?.cat_name ?? item?.name ?? "").trim(),
      notice: String(item?.notice ?? "").trim(),
      parentId: normalizedParentId,
      level,
      isLeaf: Boolean(item?.is_leaf ?? item?.leaf ?? false),
      stapleNames: Array.isArray(item?.stapleName) ? item.stapleName.map((value) => String(value || "").trim()).filter(Boolean) : []
    };
  }).filter((item) => item.id && item.name);
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
      throw createError("类目接口请求超时", "TIMEOUT", error);
    }

    throw createError("类目接口请求失败", "NETWORK_ERROR", error);
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
  listCategoriesByCookie
};
