const DEFAULT_TIMEOUT_MS = 10000;
const ANTI_CONTENT_URL = "http://106.75.215.11:9000/api/0as";
const MALL_GOODS_COUNT_URL = "https://mms.pinduoduo.com/vodka/v2/mms/query/display/mall_goods/count";
const GOODS_PAGE_OVERVIEW_URL = "https://mms.pinduoduo.com/sydney/api/goodsDataShow/queryGoodsPageOverviewForMms";
const MALL_TRADE_URL = "https://mms.pinduoduo.com/sydney/api/mallTrade/queryMallTradeList";

async function getShopOverviewByCookie({
  cookie1,
  shopCode = "",
  shopName = "",
  currentOperator = "",
  queryDate = ""
} = {}) {
  const normalizedCookie = String(cookie1 || "").trim();
  const normalizedQueryDate = normalizeQueryDate(queryDate);

  if (!normalizedCookie) {
    return {
      ok: false,
      code: "COOKIE_MISSING",
      message: "该店铺缺少 cookie1，无法加载经营总览"
    };
  }

  const etagMatch = normalizedCookie.match(/rckk=([^;]+)/);
  if (!etagMatch?.[1]) {
    return {
      ok: false,
      code: "ETAG_MISSING",
      message: "该店铺的 cookie1 中缺少 rckk，无法加载经营总览"
    };
  }

  try {
    const [goodsCountPayload, goodsOverviewPayload, mallTradePayload] = await Promise.all([
      queryMallGoodsCount({
        cookie1: normalizedCookie,
        etag: etagMatch[1]
      }),
      queryGoodsPageOverview({
        cookie1: normalizedCookie
      }),
      queryMallTrade({
        cookie1: normalizedCookie,
        queryDate: normalizedQueryDate
      })
    ]);

    return {
      ok: true,
      row: normalizeShopOverviewRow({
        shopCode,
        shopName,
        currentOperator,
        queryDate: normalizedQueryDate,
        goodsCount: goodsCountPayload?.result,
        goodsOverview: goodsOverviewPayload?.result,
        mallTrade: mallTradePayload?.result
      })
    };
  } catch (error) {
    return {
      ok: false,
      code: error?.code || "SHOP_OVERVIEW_REQUEST_FAILED",
      message: error?.message || "加载经营总览失败"
    };
  }
}

async function queryMallGoodsCount({ cookie1, etag } = {}) {
  const response = await requestPddJson(MALL_GOODS_COUNT_URL, {
    cookie1,
    etag,
    referer: "https://mms.pinduoduo.com/goods/goods_list?msfrom=mms_sidenav",
    json: {
      excluded_goods_type_list: [112]
    }
  });

  const payload = response.payload;
  if (payload?.success !== true || !payload?.result || typeof payload.result !== "object") {
    throw createError(
      extractMessage(payload) || "加载店铺商品状态失败",
      "SHOP_OVERVIEW_COUNT_FAILED"
    );
  }

  return payload;
}

async function queryGoodsPageOverview({ cookie1 } = {}) {
  const response = await requestPddJson(GOODS_PAGE_OVERVIEW_URL, {
    cookie1,
    referer: "https://mms.pinduoduo.com/sycm/goods_effect",
    json: {}
  });

  const payload = response.payload;
  if (payload?.success !== true || !payload?.result || typeof payload.result !== "object") {
    throw createError(
      extractMessage(payload) || "加载店铺流量概览失败",
      "SHOP_OVERVIEW_TRAFFIC_FAILED"
    );
  }

  return payload;
}

async function queryMallTrade({ cookie1, queryDate } = {}) {
  const response = await requestPddJson(MALL_TRADE_URL, {
    cookie1,
    referer: "https://mms.pinduoduo.com/sycm/stores_data/operation",
    json: {
      queryType: 6,
      queryDate
    }
  });

  const payload = response.payload;
  if (payload?.success !== true || !payload?.result || typeof payload.result !== "object") {
    throw createError(
      extractMessage(payload) || "加载店铺成交走势失败",
      "SHOP_OVERVIEW_TRADE_FAILED"
    );
  }

  return payload;
}

async function requestPddJson(url, { cookie1, referer, json, etag = "" } = {}) {
  const antiContentResponse = await requestJson(ANTI_CONTENT_URL, {
    headers: {
      accept: "application/json"
    }
  });

  const antiContent = antiContentResponse.payload?.data;
  if (!antiContent) {
    throw createError("未获取到 anti-content，无法加载经营总览", "ANTI_CONTENT_MISSING");
  }

  return requestJson(url, {
    method: "POST",
    headers: buildHeaders({
      antiContent,
      cookie1,
      referer,
      etag
    }),
    json
  });
}

function buildHeaders({ antiContent, cookie1, referer, etag = "" }) {
  const headers = {
    accept: "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "anti-content": String(antiContent || ""),
    "cache-control": "max-age=0",
    "content-type": "application/json",
    origin: "https://mms.pinduoduo.com",
    priority: "u=1, i",
    referer: String(referer || ""),
    "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    cookie: String(cookie1 || "")
  };

  if (etag) {
    headers.etag = String(etag);
  }

  return headers;
}

function normalizeShopOverviewRow({
  shopCode,
  shopName,
  currentOperator,
  queryDate,
  goodsCount,
  goodsOverview,
  mallTrade
} = {}) {
  const fetchedAtDate = new Date();
  const todayData = goodsOverview?.todayData || {};
  const yesterdayData = goodsOverview?.yesData || {};
  const comparisonContext = buildComparisonContext({
    goodsOverview,
    mallTrade,
    queryDate,
    referenceDate: fetchedAtDate
  });
  const tradeComparison = comparisonContext?.tradeSnapshot || null;
  const trafficComparison = comparisonContext?.trafficSnapshot || null;
  const fetchedAt = fetchedAtDate.toISOString();

  return {
    shopCode: String(shopCode || "").trim(),
    shopName: String(shopName || shopCode || "").trim(),
    currentOperator: String(currentOperator || "").trim(),
    listedCount: normalizeNumber(goodsCount?.on_sale_num),
    delistedCount: normalizeNumber(goodsCount?.off_sale_num),
    yesterdayOrderCount: normalizeNumber(yesterdayData?.payOrdrCnt),
    comparisonOrderCount: normalizeNumber(tradeComparison?.payOrdrCnt),
    todayOrderCount: normalizeNumber(todayData?.payOrdrCnt),
    yesterdayGmv: normalizeNumber(yesterdayData?.payOrdrAmt),
    comparisonGmv: normalizeNumber(tradeComparison?.payOrdrAmt),
    todayGmv: normalizeNumber(todayData?.payOrdrAmt),
    yesterdayBuyerCount: normalizeNumber(yesterdayData?.payOrdrUsrCnt),
    comparisonBuyerCount: normalizeNumber(trafficComparison?.payOrdrUsrCnt),
    todayBuyerCount: normalizeNumber(todayData?.payOrdrUsrCnt),
    yesterdayVisitors: normalizeNumber(yesterdayData?.guv),
    comparisonVisitors: normalizeNumber(trafficComparison?.guv),
    todayVisitors: normalizeNumber(todayData?.guv),
    yesterdayViews: normalizeNumber(yesterdayData?.gpv),
    comparisonViews: normalizeNumber(trafficComparison?.gpv),
    todayViews: normalizeNumber(todayData?.gpv),
    yesterdayVisitedGoodsCount: normalizeNumber(yesterdayData?.vstGoodsCnt),
    comparisonVisitedGoodsCount: normalizeNumber(trafficComparison?.vstGoodsCnt),
    todayVisitedGoodsCount: normalizeNumber(todayData?.vstGoodsCnt),
    yesterdayPayRate: normalizeRateValue(yesterdayData?.payUvRto),
    comparisonPayRate: normalizeRateValue(trafficComparison?.payUvRto),
    todayPayRate: normalizeRateValue(todayData?.payUvRto),
    rowStatus: "success",
    rowError: "",
    fetchedAt,
    comparisonHour: comparisonContext?.hour || "",
    queryDate
  };
}

function buildComparisonContext({ goodsOverview, mallTrade, queryDate, referenceDate } = {}) {
  const preferredHour = resolvePreferredComparisonHour({
    queryDate,
    referenceDate
  });
  const tradeComparison = findTradeComparisonSnapshot(mallTrade, preferredHour);
  const fallbackHour = tradeComparison?.hour || preferredHour || findLatestTrafficSnapshotHour(goodsOverview);
  const trafficComparison = findTrafficComparisonSnapshot(goodsOverview, {
    fallbackHour,
    preferredHour
  });

  return {
    hour: tradeComparison?.hour || trafficComparison?.hour || "",
    tradeSnapshot: tradeComparison?.snapshot || null,
    trafficSnapshot: trafficComparison?.snapshot || null
  };
}

function findTradeComparisonSnapshot(mallTrade, preferredHour = "") {
  const todaySnapshots = Array.isArray(mallTrade?.todayRtList) ? mallTrade.todayRtList : [];
  const yesterdaySnapshots = Array.isArray(mallTrade?.yesterdayRtList) ? mallTrade.yesterdayRtList : [];
  const latestTodaySnapshot = findLastSnapshotWithHour(todaySnapshots);
  const comparisonHour = resolveComparisonHour({
    preferredHour,
    fallbackHour: normalizeHour(latestTodaySnapshot?.hr),
    snapshots: yesterdaySnapshots,
    getHour: (item) => item?.hr
  });

  if (!comparisonHour) {
    return {
      hour: "",
      snapshot: null
    };
  }

  const comparisonSnapshot = findSnapshotByHour(yesterdaySnapshots, comparisonHour, (item) => item?.hr);

  return {
    hour: comparisonHour,
    snapshot: comparisonSnapshot
  };
}

function findTrafficComparisonSnapshot(goodsOverview, { fallbackHour = "", preferredHour = "" } = {}) {
  const yesterdaySnapshots = Array.isArray(goodsOverview?.yesList) ? goodsOverview.yesList : [];
  const comparisonHour = resolveComparisonHour({
    preferredHour,
    fallbackHour: normalizeHour(fallbackHour) || findLatestTrafficSnapshotHour(goodsOverview),
    snapshots: yesterdaySnapshots,
    getHour: (item) => item?.statHr ?? item?.hr
  });

  if (!comparisonHour) {
    return {
      hour: "",
      snapshot: null
    };
  }

  const comparisonSnapshot = findSnapshotByHour(
    yesterdaySnapshots,
    comparisonHour,
    (item) => item?.statHr ?? item?.hr
  );

  return {
    hour: comparisonHour,
    snapshot: comparisonSnapshot
  };
}

function findLatestTrafficSnapshotHour(goodsOverview) {
  const todaySnapshots = Array.isArray(goodsOverview?.todayList) ? goodsOverview.todayList : [];
  const latestTodaySnapshot = findLastSnapshotWithHour(todaySnapshots);
  return normalizeHour(latestTodaySnapshot?.statHr ?? latestTodaySnapshot?.hr);
}

function findLastSnapshotWithHour(source) {
  const snapshots = Array.isArray(source) ? source : [];

  for (let index = snapshots.length - 1; index >= 0; index -= 1) {
    const snapshot = snapshots[index];
    if (normalizeHour(snapshot?.statHr ?? snapshot?.hr)) {
      return snapshot;
    }
  }

  return null;
}

function resolvePreferredComparisonHour({ queryDate, referenceDate } = {}) {
  const targetDate = referenceDate instanceof Date && Number.isFinite(referenceDate.getTime())
    ? referenceDate
    : new Date();
  const normalizedQueryDate = normalizeQueryDate(queryDate);

  if (normalizedQueryDate !== formatLocalDate(targetDate)) {
    return "";
  }

  return String(targetDate.getHours()).padStart(2, "0");
}

function resolveComparisonHour({ preferredHour = "", fallbackHour = "", snapshots, getHour } = {}) {
  const normalizedPreferredHour = normalizeHour(preferredHour);
  if (normalizedPreferredHour && hasSnapshotForHour(snapshots, normalizedPreferredHour, getHour)) {
    return normalizedPreferredHour;
  }

  return normalizeHour(fallbackHour);
}

function hasSnapshotForHour(snapshots, hour, getHour) {
  return Boolean(findSnapshotByHour(snapshots, hour, getHour));
}

function findSnapshotByHour(snapshots, hour, getHour) {
  const normalizedHour = normalizeHour(hour);
  if (!normalizedHour) {
    return null;
  }

  const source = Array.isArray(snapshots) ? snapshots : [];
  return source.find((item) => normalizeHour(getHour(item)) === normalizedHour) || null;
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const normalizedText = value.replace(/,/g, "").trim();
    if (!normalizedText) {
      return null;
    }

    const numericValue = Number(normalizedText);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeRateValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const normalizedText = value.trim();
    if (!normalizedText) {
      return null;
    }

    if (normalizedText.endsWith("%")) {
      const numericValue = Number(normalizedText.slice(0, -1));
      return Number.isFinite(numericValue) ? numericValue / 100 : null;
    }

    const numericValue = Number(normalizedText);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeHour(value) {
  const normalizedText = String(value ?? "").trim();
  if (!normalizedText) {
    return "";
  }

  const numericValue = Number(normalizedText);
  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return String(Math.max(0, Math.min(23, numericValue))).padStart(2, "0");
}

function normalizeQueryDate(value) {
  const normalizedText = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedText)) {
    return normalizedText;
  }

  return formatLocalDate(new Date());
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
      throw createError("经营总览接口请求超时", "TIMEOUT", error);
    }

    throw createError("经营总览接口请求失败", "NETWORK_ERROR", error);
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
  getShopOverviewByCookie
};
