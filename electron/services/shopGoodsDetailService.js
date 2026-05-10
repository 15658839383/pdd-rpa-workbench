const DEFAULT_TIMEOUT_MS = 10000;
const GOODS_DETAIL_URL = "https://mms.pinduoduo.com/glide/v2/mms/query/commit/on_shop/detail";
const GOODS_PROPERTY_URL = "https://mms.pinduoduo.com/draco-ms/mms/query-goods-property";
const ANTI_CONTENT_URL = "http://106.75.215.11:9000/api/0as";

async function getGoodsDetailByCookie({ cookie1, goodsId } = {}) {
  const normalizedCookie = String(cookie1 || "").trim();
  const normalizedGoodsId = String(goodsId || "").trim();

  if (!normalizedCookie) {
    return {
      ok: false,
      code: "COOKIE_MISSING",
      message: "该店铺缺少 cookie1，无法获取商品详情"
    };
  }

  if (!normalizedGoodsId) {
    return {
      ok: false,
      code: "GOODS_ID_REQUIRED",
      message: "缺少商品ID，无法获取商品详情"
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
      message: "未获取到 anti-content，无法获取商品详情",
      payload: antiContentResponse.payload
    };
  }

  const response = await requestJson(GOODS_DETAIL_URL, {
    method: "POST",
    headers: buildHeaders({
      antiContent,
      cookie1: normalizedCookie,
      goodsId: normalizedGoodsId
    }),
    json: {
      goods_id: Number.isFinite(Number(normalizedGoodsId)) ? Number(normalizedGoodsId) : normalizedGoodsId
    }
  });

  const payload = response.payload;
  if (payload?.success !== true || !payload?.result) {
    return {
      ok: false,
      code: "GOODS_DETAIL_REQUEST_FAILED",
      message: extractMessage(payload) || "获取商品详情失败",
      payload
    };
  }

  const propertyResponse = await getGoodsPropertiesByCookie({
    cookie1: normalizedCookie,
    goodsId: normalizedGoodsId
  }).catch(() => null);

  const queriedAttributes = propertyResponse?.ok ? propertyResponse.attributes : null;

  return {
    ok: true,
    detail: normalizeGoodsDetail(payload.result, {
      attributes: queriedAttributes
    }),
    payload
  };
}

async function getGoodsPropertiesByCookie({ cookie1, goodsId } = {}) {
  const normalizedCookie = String(cookie1 || "").trim();
  const normalizedGoodsId = String(goodsId || "").trim();

  if (!normalizedCookie || !normalizedGoodsId) {
    return {
      ok: false,
      code: "GOODS_PROPERTY_REQUEST_INVALID",
      message: "缺少 cookie1 或商品ID，无法获取商品属性"
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
      message: "未获取到 anti-content，无法获取商品属性",
      payload: antiContentResponse.payload
    };
  }

  const response = await requestJson(GOODS_PROPERTY_URL, {
    method: "POST",
    headers: buildGoodsPropertyHeaders({
      antiContent,
      cookie1: normalizedCookie,
      goodsId: normalizedGoodsId
    }),
    json: {
      goods_id: Number.isFinite(Number(normalizedGoodsId)) ? Number(normalizedGoodsId) : normalizedGoodsId
    }
  });

  const payload = response.payload;
  if (payload?.success !== true || !payload?.result) {
    return {
      ok: false,
      code: "GOODS_PROPERTY_REQUEST_FAILED",
      message: extractMessage(payload) || "获取商品属性失败",
      payload
    };
  }

  return {
    ok: true,
    attributes: normalizeQueriedGoodsPropertyList(payload.result?.goods_properties),
    payload
  };
}

function buildHeaders({ antiContent, cookie1, goodsId }) {
  return {
    accept: "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "anti-content": String(antiContent || ""),
    "cache-control": "max-age=0",
    "content-type": "application/json",
    origin: "https://mms.pinduoduo.com",
    priority: "u=1, i",
    referer: `https://mms.pinduoduo.com/goods/goods_detail?goods_id=${encodeURIComponent(String(goodsId || ""))}`,
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

function buildGoodsPropertyHeaders({ antiContent, cookie1, goodsId }) {
  return {
    accept: "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "anti-content": String(antiContent || ""),
    "cache-control": "max-age=0",
    "content-type": "application/json",
    origin: "https://mms.pinduoduo.com",
    priority: "u=1, i",
    referer: `https://mms.pinduoduo.com/goods/goods_detail?goods_id=${encodeURIComponent(String(goodsId || ""))}`,
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

function normalizeGoodsDetail(result, options = {}) {
  const normalizedResult = result && typeof result === "object" ? result : {};
  const cats = collectCategoryPathSegments(normalizedResult.cats);
  const categoryIds = extractCategoryIds(normalizedResult);
  const normalizedSkus = normalizeSkuList(normalizedResult.skus);
  const normalizedAttributes = mergeGoodsPropertyAttributes(
    options.attributes,
    normalizeGoodsPropertyList(normalizedResult.goods_property_list)
  );

  return {
    productId: String(normalizedResult.goods_id ?? "").trim(),
    categoryId: String(normalizedResult.cat_id ?? normalizedResult.cat_id_3 ?? "").trim(),
    categoryIds,
    categoryPath: cats.join(" > "),
    productName: String(normalizedResult.goods_name ?? "").trim(),
    marketPrice: normalizePriceFen(normalizedResult.market_price ?? normalizedResult.marketPrice),
    twoPiecesDiscount: normalizeNumberValue(
      normalizedResult.two_pieces_discount ?? normalizedResult.twoPiecesDiscount
    ),
    costTemplateId: String(normalizedResult.cost_template_id ?? "").trim(),
    shipmentLimitSecond: normalizeNumberValue(normalizedResult.shipment_limit_second),
    sendAddress: String(normalizedResult.send_address ?? "").trim(),
    carouselImages: normalizeGalleryUrls(normalizedResult.carousel_gallery, {
      typeFilter: 1,
      fallback: [normalizedResult.hd_thumb_url, normalizedResult.thumb_url]
    }),
    detailImages: normalizeGalleryUrls(normalizedResult.detail_gallery, {
      typeFilter: 2
    }),
    attributes: normalizedAttributes,
    skus: normalizedSkus,
    specDimensions: normalizeSpecDimensions(normalizedSkus)
  };
}

function collectCategoryPathSegments(source) {
  const segments = [];
  if (!Array.isArray(source)) {
    return segments;
  }

  for (const item of source) {
    if (item === null || item === undefined) {
      break;
    }
    const trimmed = String(item).trim();
    if (!trimmed) {
      break;
    }
    segments.push(trimmed);
  }

  return segments;
}

function extractCategoryIds(result) {
  const pickId = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return "";
    }
    return String(numeric);
  };

  return {
    level1Id: pickId(result?.cat_id_1),
    level2Id: pickId(result?.cat_id_2),
    level3Id: pickId(result?.cat_id_3),
    level4Id: pickId(result?.cat_id_4)
  };
}

function normalizeGalleryUrls(source, options = {}) {
  const { typeFilter = null, fallback = [] } = options;
  const seen = new Set();
  const result = [];

  const pushUnique = (rawUrl) => {
    const url = String(rawUrl ?? "").trim();
    if (!url || seen.has(url)) {
      return;
    }
    seen.add(url);
    result.push(url);
  };

  (Array.isArray(source) ? source : []).forEach((item) => {
    if (item === null || item === undefined) {
      return;
    }
    if (typeFilter !== null && typeof item === "object") {
      const itemType = Number(item?.type);
      if (Number.isFinite(itemType) && itemType !== typeFilter) {
        return;
      }
    }
    pushUnique(typeof item === "object" ? item?.url : item);
  });

  if (result.length === 0) {
    (Array.isArray(fallback) ? fallback : []).forEach(pushUnique);
  }

  return result;
}

function normalizeGoodsPropertyList(source) {
  return (Array.isArray(source) ? source : [])
    .map((item) => {
      const refPid = String(item?.ref_pid ?? item?.refPid ?? item?.pid ?? item?.property_id ?? "").trim();
      const rawValue = String(
        item?.value_name
        ?? item?.display_value
        ?? item?.value
        ?? item?.property_value
        ?? ""
      ).trim();

      return {
        refPid,
        name: String(item?.name ?? item?.property_name ?? "").trim(),
        values: rawValue
          ? [{
              vid: String(item?.vid ?? item?.value_id ?? "").trim(),
              value: rawValue,
              rawValue,
              unit: String(item?.unit ?? "").trim()
            }]
          : []
      };
    })
    .filter((item) => item.refPid && item.values.length);
}

function normalizeQueriedGoodsPropertyList(source) {
  return (Array.isArray(source) ? source : [])
    .map((item) => {
      return {
        refPid: String(item?.ref_pid ?? item?.refPid ?? item?.pid ?? "").trim(),
        name: String(item?.name ?? item?.label ?? "").trim(),
        values: (Array.isArray(item?.values) ? item.values : [])
          .map((value) => {
            const rawValue = String(
              value?.raw_value
              ?? value?.rawValue
              ?? value?.value
              ?? ""
            ).trim();

            return {
              vid: String(value?.vid ?? value?.id ?? "").trim(),
              value: String(value?.value ?? rawValue).trim(),
              rawValue,
              unit: String(value?.unit ?? "").trim()
            };
          })
          .filter((value) => value.value || value.rawValue)
      };
    })
    .filter((item) => item.refPid && item.values.length);
}

function mergeGoodsPropertyAttributes(primary, fallback) {
  const merged = [];
  const seen = new Set();

  [primary, fallback].forEach((list) => {
    (Array.isArray(list) ? list : []).forEach((item) => {
      const refPid = String(item?.refPid || "").trim();
      if (!refPid || seen.has(refPid)) {
        return;
      }

      seen.add(refPid);
      merged.push(item);
    });
  });

  return merged;
}

function normalizeSkuList(source) {
  return (Array.isArray(source) ? source : [])
    .map((item) => {
      const outSkuSn = String(item?.out_sku_sn ?? item?.external_sku_code ?? "").trim();
      return {
        skuId: String(item?.sku_id ?? item?.skuId ?? "").trim(),
        specName: normalizeSkuSpecName(item?.spec),
        specItems: normalizeSkuSpecItems(item?.spec),
        groupPrice: normalizePriceFen(item?.multi_price ?? item?.multiPrice),
        singlePrice: normalizePriceFen(item?.price),
        stock: normalizeNumberValue(item?.quantity),
        outSkuSn,
        externalSkuCode: outSkuSn,
        skuImageUrl: String(item?.thumb_url ?? item?.sku_image_url ?? "").trim()
      };
    })
    .filter((item) => item.specName || item.skuId);
}

function normalizeSkuSpecSourceOrder(specList) {
  // 详情接口已经按商家侧展示顺序返回规格项，继续按 parent_id 排序会把颜色/尺码顺序打乱。
  return Array.isArray(specList) ? specList.slice() : [];
}

function normalizeSkuSpecName(specList) {
  return normalizeSkuSpecSourceOrder(specList)
    .map((item) => String(item?.spec_name ?? item?.specName ?? "").trim())
    .filter(Boolean)
    .join(" / ");
}

function normalizeSkuSpecItems(specList) {
  return normalizeSkuSpecSourceOrder(specList)
    .map((item) => {
      return {
        parentId: String(item?.parent_id ?? item?.parentId ?? "").trim(),
        parentName: String(item?.parent_name ?? item?.parentName ?? "").trim(),
        specId: String(item?.spec_id ?? item?.specId ?? "").trim(),
        specName: String(item?.spec_name ?? item?.specName ?? "").trim()
      };
    })
    .filter((item) => item.parentId && item.parentName);
}

function normalizeSpecDimensions(normalizedSkus) {
  const dimensions = [];
  const seen = new Set();

  (Array.isArray(normalizedSkus) ? normalizedSkus : []).forEach((sku) => {
    (Array.isArray(sku?.specItems) ? sku.specItems : []).forEach((item) => {
      const key = `${item.parentId}::${item.parentName}`;
      if (!item.parentId || !item.parentName || seen.has(key)) {
        return;
      }

      seen.add(key);
      dimensions.push({
        id: item.parentId,
        label: item.parentName
      });
    });
  });

  return dimensions.slice(0, 2);
}

function normalizePriceFen(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const normalizedNumber = Number(value);
  if (!Number.isFinite(normalizedNumber)) {
    return String(value).trim();
  }

  return (normalizedNumber / 100).toFixed(2);
}

function normalizeNumberValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  return String(value).trim();
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
      throw createError("商品详情接口请求超时", "TIMEOUT", error);
    }

    throw createError("商品详情接口请求失败", "NETWORK_ERROR", error);
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
    payload.result_msg,
    payload.resultMsg,
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
  getGoodsDetailByCookie
};
