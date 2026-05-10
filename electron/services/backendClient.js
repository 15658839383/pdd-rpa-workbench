const { listCategoriesByCookie } = require("./shopCategoryService");
const { listPropertiesByCookie } = require("./shopPropertyService");
const { listSpecNamesByCookie } = require("./shopSpecNameService");
const { getGoodsDetailByCookie } = require("./shopGoodsDetailService");
const { quickLoginShopByCookie } = require("./shopQuickLoginService");
const { getShopOverviewByCookie } = require("./shopOverviewService");
const { renameSkuSpecsWithAi } = require("./aiSpecRenameService");

const DEFAULT_BASE_URL = "http://106.75.215.11:8080";
const DEFAULT_TIMEOUT_MS = 10000;
const QUICK_LOGIN_ROLE_DENIED_MESSAGE = "仅 admin、运营管理和财务角色可使用一键登录";

function isFinanceUser(user) {
  const role = String(user?.role || "").trim().toLowerCase();
  const roleName = String(user?.role_name || user?.roleName || "").trim();
  return role === "finance" || role === "caiwu" || role === "财务" || roleName.includes("财务");
}

function canViewAllShops(user) {
  return isAdminUser(user) || isFinanceUser(user);
}

class BackendClientError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = "BackendClientError";
    this.code = code;
    this.status = options.status || null;
    this.cause = options.cause;
  }
}

function canUseShopQuickLogin(user) {
  const role = String(user?.role || "").trim().toLowerCase();
  const roleName = String(user?.role_name || user?.roleName || "").trim();
  return role === "admin" || role === "运营管理" || roleName === "运营管理" || isFinanceUser(user);
}

function createBackendClient({
  defaultBaseUrl = DEFAULT_BASE_URL,
  credentialStore,
  shopCatalogStore,
  sessionStore,
  onSessionInvalidated,
  workspace
}) {
  let baseUrl = normalizeBaseUrl(defaultBaseUrl);
  let currentUser = null;
  let lastUsername = "";
  let shopCatalog = [];
  let shopCatalogScope = null;
  let shopCatalogTotal = 0;
  let shopCatalogUpdatedAt = "";
  let shopCatalogRefreshPromise = null;
  let categoryCache = new Map();
  let attributeCache = new Map();
  let skuSpecCache = new Map();
  const cookieJar = new Map();

  function getState() {
    return {
      baseUrl,
      user: currentUser,
      authenticated: Boolean(currentUser),
      lastUsername
    };
  }

  function resetShopCatalogState() {
    shopCatalog = [];
    shopCatalogScope = null;
    shopCatalogTotal = 0;
    shopCatalogUpdatedAt = "";
  }

  function resetRequestCaches() {
    categoryCache = new Map();
    attributeCache = new Map();
    skuSpecCache = new Map();
  }

  function resetAuthenticatedState() {
    currentUser = null;
    resetShopCatalogState();
    resetRequestCaches();
    shopCatalogRefreshPromise = null;
    cookieJar.clear();
  }

  async function restoreSession() {
    const [storedSession, rememberedCredentials] = await Promise.all([
      sessionStore.read(),
      readRememberedCredentials()
    ]);

    baseUrl = normalizeBaseUrl(defaultBaseUrl);
    resetAuthenticatedState();
    lastUsername = normalizeUsername(rememberedCredentials.lastUsername || storedSession?.lastUsername);
    await persistSession();

    return {
      ok: true,
      authenticated: false,
      baseUrl,
      user: null,
      lastUsername,
      rememberPassword: rememberedCredentials.rememberPassword,
      savedPassword: rememberedCredentials.savedPassword
    };
  }

  async function login(payload = {}) {
    const submittedUsername = normalizeUsername(payload.username);
    const submittedPassword = String(payload.password || "");
    const shouldRememberPassword = payload.rememberPassword === true;

    try {
      baseUrl = normalizeBaseUrl(defaultBaseUrl);
    } catch (error) {
      return failure(normalizeError(error));
    }

    resetAuthenticatedState();
    await persistSession();

    try {
      const response = await request("/api/login", {
        method: "POST",
        json: {
          username: submittedUsername,
          password: submittedPassword
        },
        handleUnauthorized: false
      });

      if (!response.ok) {
        return failure(mapLoginError(response.error));
      }

      lastUsername = submittedUsername || lastUsername;
      const profile = await me({ silentUnauthorized: false });
      if (!profile.ok) {
        return failure(profile.error);
      }

      const rememberedCredentials = await persistRememberedCredentials({
        lastUsername,
        rememberPassword: shouldRememberPassword,
        savedPassword: shouldRememberPassword ? submittedPassword : ""
      }).catch(() => ({
        lastUsername,
        rememberPassword: false,
        savedPassword: ""
      }));

      void refreshShopCatalogInBackground().catch(() => {});

      return {
        ok: true,
        authenticated: true,
        baseUrl,
        user: profile.user,
        lastUsername: rememberedCredentials.lastUsername,
        rememberPassword: rememberedCredentials.rememberPassword,
        savedPassword: rememberedCredentials.savedPassword
      };
    } catch (error) {
      return failure(mapLoginError(normalizeError(error)));
    }
  }

  async function me(options = {}) {
    try {
      const response = await request("/api/me", {
        method: "GET",
        handleUnauthorized: !options.silentUnauthorized
      });

      if (!response.ok) {
        if (response.error?.status === 401 && options.silentUnauthorized) {
          await clearSession({
            preserveBaseUrl: true,
            notify: false
          });
          return failure({
            code: "AUTH_EXPIRED",
            message: "登录已失效，请重新登录"
          });
        }

        return failure(response.error);
      }

      currentUser = response.data?.user || null;
      lastUsername = normalizeUsername(extractUserUsername(currentUser)) || lastUsername;
      await Promise.all([persistSession(), hydrateShopCatalogFromLocalCache()]);

      return {
        ok: true,
        authenticated: Boolean(currentUser),
        baseUrl,
        user: currentUser,
        lastUsername,
        payload: response.data
      };
    } catch (error) {
      return failure(normalizeError(error));
    }
  }

  async function logout() {
    try {
      if (cookieJar.size) {
        await request("/api/auth/logout", {
          method: "POST",
          handleUnauthorized: false
        });
      }
    } catch {
      // Ignore logout network errors and always clear local session.
    }

    await clearSession({
      preserveBaseUrl: true,
      notify: false
    });

    return {
      ok: true,
      authenticated: false,
      baseUrl,
      user: null
    };
  }

  async function changePassword(payload = {}) {
    try {
      const response = await request("/api/change-password", {
        method: "POST",
        json: {
          user: String(payload.user || "").trim(),
          currentPassword: String(payload.currentPassword || ""),
          newPassword: String(payload.newPassword || "")
        }
      });

      if (!response.ok) {
        return failure(mapChangePasswordError(response.error));
      }

      return {
        ok: true,
        message: extractMessage(response.data) || "密码修改成功"
      };
    } catch (error) {
      return failure(mapChangePasswordError(normalizeError(error)));
    }
  }

  async function listShops(options = {}) {
    try {
      const catalogResult = await getShopCatalog({
        forceRefresh: options.forceRefresh === true,
        allowCachedFallback: options.forceRefresh !== true
      });
      if (!catalogResult.ok) {
        return failure(catalogResult.error);
      }

      return {
        ok: true,
        shops: sanitizePublicShopInfoPayload(catalogResult.shops),
        total: catalogResult.total,
        scope: catalogResult.scope || null,
        updatedAt: catalogResult.updatedAt || ""
      };
    } catch (error) {
      return failure(normalizeError(error));
    }
  }

  async function getShopCatalog(options = {}) {
    if (!currentUser) {
      return failure({
        code: "AUTH_EXPIRED",
        message: "登录已失效，请重新登录"
      });
    }

    if (!options.forceRefresh) {
      await hydrateShopCatalogFromLocalCache();
      if (hasShopCatalogSnapshot()) {
        return buildShopCatalogResult();
      }
    }

    const refreshResult = await refreshShopCatalogInBackground();
    if (!refreshResult.ok) {
      if (options.allowCachedFallback && hasShopCatalogSnapshot()) {
        return buildShopCatalogResult();
      }

      return refreshResult;
    }

    return buildShopCatalogResult();
  }

  async function resolveShopByCode(shopCode, options = {}) {
    const normalizedShopCode = String(shopCode || "").trim();
    if (!normalizedShopCode) {
      return failure({
        code: options.requiredCode || "SHOP_CODE_REQUIRED",
        message: options.requiredMessage || "请先选择店铺"
      });
    }

    const initialCatalogResult = await getShopCatalog({
      forceRefresh: false,
      allowCachedFallback: true
    });
    if (!initialCatalogResult.ok) {
      return initialCatalogResult;
    }

    let targetShop = findShopInCatalog(shopCatalog, normalizedShopCode);
    if (targetShop) {
      return {
        ok: true,
        shop: targetShop
      };
    }

    const refreshedCatalogResult = await getShopCatalog({
      forceRefresh: true,
      allowCachedFallback: false
    });
    if (!refreshedCatalogResult.ok) {
      return refreshedCatalogResult;
    }

    targetShop = findShopInCatalog(shopCatalog, normalizedShopCode);
    if (!targetShop) {
      return failure({
        code: options.notFoundCode || "SHOP_NOT_FOUND",
        message: options.notFoundMessage || "未找到对应店铺"
      });
    }

    return {
      ok: true,
      shop: targetShop
    };
  }

  async function resolveShopByCodeFromSnapshot(shopCode, options = {}) {
    const normalizedShopCode = String(shopCode || "").trim();
    if (!normalizedShopCode) {
      return failure({
        code: options.requiredCode || "SHOP_CODE_REQUIRED",
        message: options.requiredMessage || "请先选择店铺"
      });
    }

    await hydrateShopCatalogFromLocalCache();

    let targetShop = findShopInCatalog(shopCatalog, normalizedShopCode);
    if (targetShop) {
      return {
        ok: true,
        shop: targetShop
      };
    }

    // Reuse any refresh that was already started by the caller/login/bootstrap,
    // but never trigger a new /api/shop-info2 request from this snapshot-only resolver.
    if (shopCatalogRefreshPromise) {
      const refreshResult = await shopCatalogRefreshPromise;
      if (refreshResult?.ok) {
        targetShop = findShopInCatalog(shopCatalog, normalizedShopCode);
        if (targetShop) {
          return {
            ok: true,
            shop: targetShop
          };
        }
      }
    }

    if (!hasShopCatalogSnapshot()) {
      return failure({
        code: options.cacheNotReadyCode || "SHOP_CATALOG_CACHE_NOT_READY",
        message: options.cacheNotReadyMessage || "店铺 cookie 缓存尚未准备就绪，请稍后重试"
      });
    }

    return failure({
      code: options.notFoundCode || "SHOP_NOT_FOUND",
      message: options.notFoundMessage || "本地店铺缓存中未找到对应店铺，请等待后台刷新后重试"
    });
  }

  async function hydrateShopCatalogFromLocalCache() {
    if (!currentUser || hasShopCatalogSnapshot() || !shopCatalogStore?.read) {
      return false;
    }

    const cachedRecord = await shopCatalogStore.read().catch(() => null);
    const expectedOwnerKey = buildShopCatalogOwnerKey(currentUser, lastUsername);
    if (!cachedRecord || !expectedOwnerKey || cachedRecord.ownerKey !== expectedOwnerKey) {
      return false;
    }

    const expectedScope = buildDerivedVisibleShopScope(currentUser);
    const cachedScope = normalizeVisibleShopScope(cachedRecord.scope);
    if (expectedScope?.mode && expectedScope.mode !== String(cachedScope?.mode || "").trim()) {
      return false;
    }

    if (expectedScope?.mode === "all" && (!Array.isArray(cachedRecord.shops) || cachedRecord.shops.length === 0)) {
      return false;
    }

    applyShopCatalogSnapshot({
      shops: cachedRecord.shops,
      total: cachedRecord.total,
      scope: cachedRecord.scope,
      updatedAt: cachedRecord.updatedAt
    });

    return hasShopCatalogSnapshot();
  }

  async function refreshShopCatalogInBackground() {
    if (!currentUser) {
      return failure({
        code: "AUTH_EXPIRED",
        message: "登录已失效，请重新登录"
      });
    }

    if (shopCatalogRefreshPromise) {
      return shopCatalogRefreshPromise;
    }

    const refreshOwnerKey = buildShopCatalogOwnerKey(currentUser, lastUsername);
    const refreshTask = (async () => {
      const result = await refreshShopCatalog({
        ownerKey: refreshOwnerKey
      });
      if (result.ok && refreshOwnerKey === buildShopCatalogOwnerKey(currentUser, lastUsername)) {
        await persistShopCatalogSnapshot().catch(() => {});
      }

      return result;
    })();

    shopCatalogRefreshPromise = refreshTask;

    try {
      return await refreshTask;
    } finally {
      if (shopCatalogRefreshPromise === refreshTask) {
        shopCatalogRefreshPromise = null;
      }
    }
  }

  async function persistShopCatalogSnapshot() {
    if (!currentUser || !shopCatalogStore?.write) {
      return null;
    }

    return shopCatalogStore.write({
      ownerKey: buildShopCatalogOwnerKey(currentUser, lastUsername),
      ownerLabel: buildShopCatalogOwnerLabel(currentUser, lastUsername),
      shops: shopCatalog,
      total: shopCatalogTotal,
      scope: shopCatalogScope,
      updatedAt: shopCatalogUpdatedAt || new Date().toISOString()
    });
  }

  function applyShopCatalogSnapshot(snapshot = {}) {
    shopCatalog = sanitizeShopInfoPayload(snapshot.shops);
    shopCatalogScope = normalizeVisibleShopScope(snapshot.scope);
    shopCatalogTotal = Number.isFinite(Number(snapshot.total)) ? Number(snapshot.total) : shopCatalog.length;
    shopCatalogUpdatedAt = normalizeIsoTimestamp(snapshot.updatedAt) || new Date().toISOString();
    return buildShopCatalogResult();
  }

  function buildShopCatalogResult() {
    return {
      ok: true,
      shops: shopCatalog,
      total: Number.isFinite(Number(shopCatalogTotal)) ? Number(shopCatalogTotal) : shopCatalog.length,
      scope: shopCatalogScope || null,
      updatedAt: shopCatalogUpdatedAt || ""
    };
  }

  function hasShopCatalogSnapshot() {
    return Boolean(shopCatalogUpdatedAt) || shopCatalog.length > 0;
  }

  async function quickLoginShop(payload = {}) {
    if (!currentUser) {
      return failure({
        code: "AUTH_EXPIRED",
        message: "登录已失效，请重新登录"
      });
    }

    if (!canUseShopQuickLogin(currentUser)) {
      return failure({
        code: "QUICK_LOGIN_FORBIDDEN",
        message: QUICK_LOGIN_ROLE_DENIED_MESSAGE
      });
    }

    const shopCode = String(payload.shopCode || "").trim();
    if (!shopCode) {
      return failure({
        code: "SHOP_CODE_REQUIRED",
        message: "请先选择店铺，再执行一键登录"
      });
    }

    const profileRoot = String(
      workspace?.browserProfileCookieLogin
      || workspace?.publicPaths?.browserProfileCookieLogin
      || ""
    ).trim();

    if (!profileRoot) {
      return failure({
        code: "PROFILE_ROOT_MISSING",
        message: "未配置一键登录浏览器资料目录"
      });
    }

    try {
      let refreshError = null;
      const refreshResult = await refreshShopCatalogInBackground();
      if (!refreshResult.ok) {
        refreshError = refreshResult.error || null;
      }

      const targetShopResult = await resolveShopByCodeFromSnapshot(shopCode, {
        cacheNotReadyCode: "SHOP_COOKIE_CACHE_NOT_READY",
        cacheNotReadyMessage: "店铺 cookies1 主动刷新后仍未准备就绪，请稍后重试",
        notFoundCode: "SHOP_NOT_FOUND",
        notFoundMessage: "主动刷新后仍未在当前账号的店铺 cookies1 缓存中找到该店铺"
      });
      if (!targetShopResult.ok) {
        if (refreshError && !hasShopCatalogSnapshot()) {
          return failure(refreshError);
        }
        return failure(targetShopResult.error);
      }

      const targetShop = targetShopResult.shop;

      if (!targetShop.cookie1) {
        return failure({
          code: "COOKIE_MISSING",
          message: "该店铺缺少 cookie1，无法执行一键登录"
        });
      }

      const launchResult = await quickLoginShopByCookie({
        shopCode: targetShop.shopCode,
        shopName: targetShop.shopName,
        cookie1: targetShop.cookie1,
        profileRoot
      });

      return {
        ok: true,
        shopCode: targetShop.shopCode,
        shopName: targetShop.shopName || targetShop.shopCode,
        launchedAt: launchResult.launchedAt || new Date().toISOString(),
        message: launchResult.message || `店铺《${targetShop.shopName || targetShop.shopCode}》已打开浏览器并注入最新 cookies`
      };
    } catch (error) {
      return failure({
        code: error?.code || "QUICK_LOGIN_FAILED",
        message: error?.message || "一键登录失败，请稍后重试"
      });
    }
  }

  async function getShopOverview(payload = {}) {
    if (!currentUser) {
      return failure({
        code: "AUTH_EXPIRED",
        message: "登录已失效，请重新登录"
      });
    }

    const shopCode = String(payload.shopCode || "").trim();
    const queryDate = String(payload.queryDate || "").trim();

    if (!shopCode) {
      return failure({
        code: "SHOP_CODE_REQUIRED",
        message: "请先选择店铺，再加载经营总览"
      });
    }

    const targetShopResult = await resolveShopByCode(shopCode, {
      notFoundCode: "SHOP_NOT_FOUND",
      notFoundMessage: "未找到对应店铺，无法加载经营总览"
    });
    if (!targetShopResult.ok) {
      return failure(targetShopResult.error);
    }

    const targetShop = targetShopResult.shop;

    if (!targetShop.cookie1) {
      return failure({
        code: "COOKIE_MISSING",
        message: "该店铺缺少 cookie1，无法加载经营总览"
      });
    }

    try {
      const result = await getShopOverviewByCookie({
        cookie1: targetShop.cookie1,
        shopCode: targetShop.shopCode,
        shopName: targetShop.shopName,
        currentOperator: targetShop.currentOperator,
        queryDate
      });

      if (!result?.ok) {
        return failure({
          code: result?.code || "SHOP_OVERVIEW_FAILED",
          message: result?.message || "加载经营总览失败"
        });
      }

      return {
        ok: true,
        ...result.row
      };
    } catch (error) {
      return failure({
        code: error?.code || "SHOP_OVERVIEW_FAILED",
        message: error?.message || "加载经营总览失败"
      });
    }
  }

  async function listPublishCategories(payload = {}) {
    if (!currentUser) {
      return failure({
        code: "AUTH_EXPIRED",
        message: "登录已失效，请重新登录"
      });
    }

    const shopCode = String(payload.shopCode || "").trim();
    const parentId = String(payload.parentId || "").trim();
    const cacheKey = `${shopCode}::${parentId || "root"}`;

    if (!shopCode) {
      return failure({
        code: "SHOP_CODE_REQUIRED",
        message: "请先选择店铺，再加载类目"
      });
    }

    if (!payload.force && categoryCache.has(cacheKey)) {
      return {
        ok: true,
        shopCode,
        parentId,
        categories: categoryCache.get(cacheKey)
      };
    }

    const targetShopResult = await resolveShopByCode(shopCode, {
      notFoundCode: "SHOP_NOT_FOUND",
      notFoundMessage: "未找到对应店铺，无法加载类目"
    });
    if (!targetShopResult.ok) {
      return failure(targetShopResult.error);
    }

    const targetShop = targetShopResult.shop;

    if (!targetShop.cookie1) {
      return failure({
        code: "COOKIE_MISSING",
        message: "该店铺缺少 cookie1，无法加载类目"
      });
    }

    try {
      const result = await listCategoriesByCookie({
        cookie1: targetShop.cookie1,
        parentId
      });

      if (!result.ok) {
        return failure({
          code: result.code || "CATEGORY_REQUEST_FAILED",
          message: result.message || "加载类目失败"
        });
      }

      categoryCache.set(cacheKey, result.categories);
      return {
        ok: true,
        shopCode,
        parentId,
        categories: result.categories
      };
    } catch (error) {
      return failure({
        code: error?.code || "CATEGORY_REQUEST_FAILED",
        message: error?.message || "加载类目失败"
      });
    }
  }

  async function listCategoryAttributes(payload = {}) {
    if (!currentUser) {
      return failure({
        code: "AUTH_EXPIRED",
        message: "登录已失效，请重新登录"
      });
    }

    const shopCode = String(payload.shopCode || "").trim();
    const catId = String(payload.catId || "").trim();
    const cacheKey = `${shopCode}::${catId}`;

    if (!shopCode) {
      return failure({
        code: "SHOP_CODE_REQUIRED",
        message: "请先选择店铺，再加载商品属性"
      });
    }

    if (!catId) {
      return failure({
        code: "CAT_ID_REQUIRED",
        message: "请先选择三级类目，再加载商品属性"
      });
    }

    if (!payload.force && attributeCache.has(cacheKey)) {
      return {
        ok: true,
        shopCode,
        catId,
        attributes: attributeCache.get(cacheKey)
      };
    }

    const targetShopResult = await resolveShopByCode(shopCode, {
      notFoundCode: "SHOP_NOT_FOUND",
      notFoundMessage: "未找到对应店铺，无法加载商品属性"
    });
    if (!targetShopResult.ok) {
      return failure(targetShopResult.error);
    }

    const targetShop = targetShopResult.shop;

    if (!targetShop.cookie1) {
      return failure({
        code: "COOKIE_MISSING",
        message: "该店铺缺少 cookie1，无法加载商品属性"
      });
    }

    try {
      const result = await listPropertiesByCookie({
        cookie1: targetShop.cookie1,
        catId
      });

      if (!result.ok) {
        return failure({
          code: result.code || "PROPERTY_REQUEST_FAILED",
          message: result.message || "加载商品属性失败"
        });
      }

      attributeCache.set(cacheKey, result.attributes);
      return {
        ok: true,
        shopCode,
        catId,
        attributes: result.attributes
      };
    } catch (error) {
      return failure({
        code: error?.code || "PROPERTY_REQUEST_FAILED",
        message: error?.message || "加载商品属性失败"
      });
    }
  }

  async function queryProductsData(payload = {}) {
    try {
      const page = Number.isFinite(Number(payload.page)) ? Number(payload.page) : 1;
      const pageSize = Number.isFinite(Number(payload.pageSize)) ? Number(payload.pageSize) : 20;
      const search = String(payload.search || "").trim();
      const timestamp = Date.now();
      const query = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        _t: String(timestamp)
      });

      if (search) {
        query.set("search", search);
      }

      const endpoint = `/api/products-data?${query.toString()}`;

      const response = await request(endpoint, {
        method: "GET",
        headers: {
          Accept: "*/*",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
          Referer: "http://127.0.0.1:5000/products.html"
        }
      });

      if (!response.ok) {
        return failure(response.error);
      }

      return {
        ok: true,
        endpoint: buildEndpointUrl(baseUrl, endpoint).toString(),
        page,
        pageSize,
        search,
        itemCount: countProductsDataItems(response.data),
        items: extractProductsDataItems(response.data),
        payload: response.data
      };
    } catch (error) {
      return failure(normalizeError(error));
    }
  }

  async function testProductsData(payload = {}) {
    return queryProductsData(payload);
  }

  async function resolveProductShopByProductId(productId) {
    if (!currentUser) {
      return failure({
        code: "AUTH_EXPIRED",
        message: "登录已失效，请重新登录"
      });
    }

    const normalizedProductId = String(productId || "").trim();
    if (!normalizedProductId) {
      return failure({
        code: "PRODUCT_ID_REQUIRED",
        message: "请输入商品ID后再执行填充"
      });
    }

    const firstPageResult = await queryProductsData({
      page: 1,
      pageSize: 100,
      search: normalizedProductId
    });

    if (!firstPageResult.ok) {
      return failure(firstPageResult.error);
    }

    let matchedProduct = (Array.isArray(firstPageResult.items) ? firstPageResult.items : []).find((item) => {
      return extractProductsDataItemProductId(item) === normalizedProductId;
    });

    const totalPages = extractProductsDataTotalPages(firstPageResult.payload);
    for (let page = 2; !matchedProduct && page <= totalPages; page += 1) {
      const nextPageResult = await queryProductsData({
        page,
        pageSize: 100,
        search: normalizedProductId
      });

      if (!nextPageResult.ok) {
        return failure(nextPageResult.error);
      }

      matchedProduct = (Array.isArray(nextPageResult.items) ? nextPageResult.items : []).find((item) => {
        return extractProductsDataItemProductId(item) === normalizedProductId;
      });
    }

    if (!matchedProduct) {
      return failure({
        code: "PRODUCT_NOT_FOUND",
        message: `未在当前账号可见商品中找到商品 ${normalizedProductId}`
      });
    }

    const matchedShopCode = extractProductsDataItemShopCode(matchedProduct);
    const matchedShopName = extractProductsDataItemShopName(matchedProduct);
    if (!matchedShopCode) {
      return failure({
        code: "PRODUCT_SHOP_UNRESOLVED",
        message: `商品 ${normalizedProductId} 未返回所属店铺信息`
      });
    }

    const targetShopResult = await resolveShopByCode(matchedShopCode, {
      notFoundCode: "SHOP_NOT_VISIBLE",
      notFoundMessage: `商品 ${normalizedProductId} 所属店铺《${matchedShopName || matchedShopCode}》不在当前账号可见店铺范围内`
    });
    if (!targetShopResult.ok) {
      return failure(targetShopResult.error);
    }

    const targetShop = targetShopResult.shop;

    if (!targetShop.cookie1) {
      return failure({
        code: "COOKIE_MISSING",
        message: `商品 ${normalizedProductId} 所属店铺《${targetShop.shopName || matchedShopName || matchedShopCode}》缺少 cookie1，无法获取商品详情`
      });
    }

    return {
      ok: true,
      productId: normalizedProductId,
      shopCode: targetShop.shopCode,
      shopName: targetShop.shopName || matchedShopName || targetShop.shopCode,
      targetShop,
      product: matchedProduct,
      endpoint: firstPageResult.endpoint,
      payload: firstPageResult.payload
    };
  }

  async function getProductFullDetail(payload = {}) {
    if (!currentUser) {
      return failure({
        code: "AUTH_EXPIRED",
        message: "登录已失效，请重新登录"
      });
    }

    const productId = String(payload.productId || "").trim();
    const requestedShopCode = String(payload.shopCode || "").trim();
    if (!productId) {
      return failure({
        code: "PRODUCT_ID_REQUIRED",
        message: "请输入商品ID后再执行填充"
      });
    }

    let targetShop = null;
    let resolvedShop = null;

    if (!requestedShopCode) {
      const resolvedShopResult = await resolveProductShopByProductId(productId);
      if (!resolvedShopResult.ok) {
        return failure(resolvedShopResult.error);
      }

      targetShop = resolvedShopResult.targetShop;
      resolvedShop = {
        shopCode: resolvedShopResult.shopCode,
        shopName: resolvedShopResult.shopName
      };
    } else {
      const targetShopResult = await resolveShopByCode(requestedShopCode, {
        notFoundCode: "SHOP_NOT_FOUND",
        notFoundMessage: "未找到对应店铺，无法获取商品详情"
      });
      if (!targetShopResult.ok) {
        return failure(targetShopResult.error);
      }

      targetShop = targetShopResult.shop;

      if (!targetShop.cookie1) {
        return failure({
          code: "COOKIE_MISSING",
          message: "该店铺缺少 cookie1，无法获取商品详情"
        });
      }

      resolvedShop = {
        shopCode: targetShop.shopCode,
        shopName: targetShop.shopName || targetShop.shopCode
      };
    }

    try {
      const response = await getGoodsDetailByCookie({
        cookie1: targetShop.cookie1,
        goodsId: productId
      });

      if (!response?.ok) {
        return failure({
          code: response?.code || "PRODUCT_DETAIL_REJECTED",
          message: response?.message || "无法获取该商品详情"
        });
      }

      return {
        ok: true,
        shopCode: targetShop.shopCode,
        resolvedShop,
        ...response.detail,
        payload: response.payload
      };
    } catch (error) {
      return failure(normalizeError(error));
    }
  }

  async function listCategorySkuSpecs(payload = {}) {
    if (!currentUser) {
      return failure({
        code: "AUTH_EXPIRED",
        message: "登录已失效，请重新登录"
      });
    }

    const shopCode = String(payload.shopCode || "").trim();
    const catId = String(payload.catId || "").trim();
    const cacheKey = `${shopCode}::${catId}`;

    if (!shopCode) {
      return failure({
        code: "SHOP_CODE_REQUIRED",
        message: "请先选择店铺，再加载商品规格"
      });
    }

    if (!catId) {
      return failure({
        code: "CAT_ID_REQUIRED",
        message: "请先选择三级类目，再加载商品规格"
      });
    }

    if (!payload.force && skuSpecCache.has(cacheKey)) {
      return {
        ok: true,
        shopCode,
        catId,
        specOptions: skuSpecCache.get(cacheKey)
      };
    }

    const targetShopResult = await resolveShopByCode(shopCode, {
      notFoundCode: "SHOP_NOT_FOUND",
      notFoundMessage: "未找到对应店铺，无法加载商品规格"
    });
    if (!targetShopResult.ok) {
      return failure(targetShopResult.error);
    }

    const targetShop = targetShopResult.shop;

    if (!targetShop.cookie1) {
      return failure({
        code: "COOKIE_MISSING",
        message: "该店铺缺少 cookie1，无法加载商品规格"
      });
    }

    try {
      const result = await listSpecNamesByCookie({
        cookie1: targetShop.cookie1,
        catId
      });

      if (!result.ok) {
        return failure({
          code: result.code || "SPEC_NAME_REQUEST_FAILED",
          message: result.message || "加载商品规格失败"
        });
      }

      skuSpecCache.set(cacheKey, result.specOptions);
      return {
        ok: true,
        shopCode,
        catId,
        specOptions: result.specOptions
      };
    } catch (error) {
      return failure({
        code: error?.code || "SPEC_NAME_REQUEST_FAILED",
        message: error?.message || "加载商品规格失败"
      });
    }
  }

  async function rewriteSkuSpecNames(payload = {}) {
    if (!currentUser) {
      return failure({
        code: "AUTH_EXPIRED",
        message: "登录已失效，请重新登录"
      });
    }

    try {
      const result = await renameSkuSpecsWithAi(payload);
      if (!result.ok) {
        return failure({
          code: result.code || "AI_SPEC_RENAME_FAILED",
          message: result.message || "AI 改写规格名失败"
        });
      }

      return {
        ok: true,
        dimensions: result.dimensions
      };
    } catch (error) {
      return failure({
        code: error?.code || "AI_SPEC_RENAME_FAILED",
        message: error?.message || "AI 改写规格名失败"
      });
    }
  }

  async function clearSession(options = {}) {
    resetAuthenticatedState();

    if (options.preserveBaseUrl === false) {
      await sessionStore.clear();
    } else {
      await persistSession();
    }

    if (options.notify) {
      onSessionInvalidated?.({
        type: "session-expired",
        message: options.message || "登录已失效，请重新登录"
      });
    }

    return {
      ok: true,
      authenticated: false,
      baseUrl,
      user: null
    };
  }

  async function request(endpoint, options = {}) {
    const url = buildEndpointUrl(baseUrl, endpoint);
    const headers = {
      Accept: "application/json",
      ...options.headers
    };

    const cookieHeader = buildCookieHeader();
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    let body;
    if (options.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.json);
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: options.method || "GET",
        headers,
        body,
        signal: controller.signal
      });

      syncCookies(response.headers, url);
      const data = await parseResponseBody(response);

      if (response.status === 401) {
        const unauthorizedError = new BackendClientError(
          "AUTH_EXPIRED",
          extractMessage(data) || "登录已失效，请重新登录",
          { status: 401 }
        );

        if (options.handleUnauthorized !== false) {
          await clearSession({
            preserveBaseUrl: true,
            notify: true,
            message: unauthorizedError.message
          });
        }

        return failure(unauthorizedError);
      }

      if (!response.ok) {
        return failure(
          new BackendClientError(
            response.status >= 500 ? "SERVER_ERROR" : "REQUEST_FAILED",
            extractMessage(data) || defaultMessageForStatus(response.status),
            { status: response.status }
          )
        );
      }

      return {
        ok: true,
        status: response.status,
        data
      };
    } catch (error) {
      return failure(normalizeError(error));
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  async function persistSession() {
    await sessionStore.write({
      baseUrl,
      cookies: [],
      lastUsername
    });
  }

  async function readRememberedCredentials() {
    if (!credentialStore?.read) {
      return {
        lastUsername: "",
        rememberPassword: false,
        savedPassword: ""
      };
    }

    return credentialStore.read();
  }

  async function persistRememberedCredentials(record = {}) {
    const normalizedRecord = {
      lastUsername: normalizeUsername(record.lastUsername || lastUsername),
      rememberPassword: record.rememberPassword === true,
      savedPassword: record.rememberPassword === true ? String(record.savedPassword || "") : ""
    };

    if (!credentialStore?.write) {
      return normalizedRecord;
    }

    return credentialStore.write(normalizedRecord);
  }

  function syncCookies(headers, url) {
    const setCookies = typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [];

    setCookies.forEach((header) => {
      const parsed = parseSetCookie(header, url);
      if (!parsed?.name) {
        return;
      }

      if (!parsed.value || isCookieExpired(parsed)) {
        cookieJar.delete(parsed.name);
        return;
      }

      cookieJar.set(parsed.name, parsed);
    });
  }

  function buildCookieHeader() {
    const now = Date.now();
    const pairs = [];

    for (const [name, cookie] of cookieJar.entries()) {
      if (isCookieExpired(cookie, now)) {
        cookieJar.delete(name);
        continue;
      }

      pairs.push(`${cookie.name}=${cookie.value}`);
    }

    return pairs.join("; ");
  }

  return {
    clearSession,
    changePassword,
    getShopOverview,
    getState,
    getProductFullDetail,
    listCategoryAttributes,
    listCategorySkuSpecs,
    listPublishCategories,
    listShops,
    login,
    logout,
    me,
    quickLoginShop,
    rewriteSkuSpecNames,
    restoreSession,
    testProductsData
  };

  async function refreshShopCatalog(options = {}) {
    const visibleResponse = await request("/api/visible-shops", {
      method: "GET"
    });

    if (visibleResponse.ok) {
      const visiblePayload = visibleResponse.data;
      const visibleCatalog = sanitizeVisibleShopInfoPayload(visiblePayload?.shops);

      if (visiblePayload?.success !== true || !Array.isArray(visiblePayload?.shops)) {
        return failure(
          new BackendClientError(
            "SHOP_LIST_REJECTED",
            extractMessage(visiblePayload) || "加载店铺失败"
          )
        );
      }

      const visibleScope = normalizeVisibleShopScope(visiblePayload?.scope);
      const legacyResult = await refreshLegacyShopCatalog({
        ownerKey: options.ownerKey,
        visibleCatalog,
        scope: visibleScope,
        preferredTotal: Number(visiblePayload?.total)
      });

      if (!legacyResult.ok) {
        return legacyResult;
      }

      return legacyResult;
    }

    if (visibleResponse.error?.status !== 404) {
      return visibleResponse;
    }

    return refreshLegacyShopCatalog({
      ownerKey: options.ownerKey
    });
  }

  async function refreshLegacyShopCatalog(options = {}) {
    const response = await request("/api/shop-info2", {
      method: "GET"
    });

    if (!response.ok) {
      return response;
    }

    const fullCatalog = sanitizeShopInfoPayload(response.data);
    const hasVisibleCatalog = Array.isArray(options.visibleCatalog);
    const derivedScope = buildDerivedVisibleShopScope(currentUser);
    const mergedVisibleCatalog = hasVisibleCatalog
      ? mergeVisibleShopCatalog(options.visibleCatalog, fullCatalog)
      : [];
    const shouldUseFullCatalog = canViewAllShops(currentUser)
      && fullCatalog.length > 0
      && (
        !hasVisibleCatalog
        || mergedVisibleCatalog.length === 0
        || String(options.scope?.mode || "").trim() !== "all"
      );

    let mergedCatalog;
    let resolvedScope;
    let preferredTotal;

    if (shouldUseFullCatalog) {
      mergedCatalog = fullCatalog;
      resolvedScope = derivedScope;
      preferredTotal = fullCatalog.length;
    } else if (hasVisibleCatalog) {
      mergedCatalog = mergedVisibleCatalog;
      resolvedScope = options.scope || null;
      preferredTotal = Number.isFinite(Number(options.preferredTotal))
        ? Number(options.preferredTotal)
        : mergedCatalog.length;
    } else {
      mergedCatalog = filterShopsForCurrentUser(fullCatalog, currentUser);
      resolvedScope = derivedScope;
      preferredTotal = Number.isFinite(Number(options.preferredTotal))
        ? Number(options.preferredTotal)
        : mergedCatalog.length;
    }

    if (options.ownerKey && options.ownerKey !== buildShopCatalogOwnerKey(currentUser, lastUsername)) {
      return buildShopCatalogResult();
    }

    return applyShopCatalogSnapshot({
      shops: mergedCatalog,
      total: preferredTotal,
      scope: resolvedScope,
      updatedAt: new Date().toISOString()
    });
  }
}

function parseResponseBody(response) {
  return response.text().then((text) => {
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  });
}

const COOKIE_ATTRIBUTE_HANDLERS = {
  domain(cookie, value) {
    if (value) {
      cookie.domain = value.replace(/^\./, "").toLowerCase();
    }
  },
  path(cookie, value) {
    if (value) {
      cookie.path = value;
    }
  },
  expires(cookie, value) {
    if (!value) {
      return;
    }

    const expiresAt = new Date(value);
    if (!Number.isNaN(expiresAt.getTime())) {
      cookie.expiresAt = expiresAt.toISOString();
    }
  },
  "max-age"(cookie, value) {
    if (!value) {
      return;
    }

    const seconds = Number(value);
    if (Number.isFinite(seconds)) {
      cookie.expiresAt = new Date(Date.now() + seconds * 1000).toISOString();
    }
  },
  secure(cookie) {
    cookie.secure = true;
  },
  httponly(cookie) {
    cookie.httpOnly = true;
  },
  samesite(cookie, value) {
    if (value) {
      cookie.sameSite = value;
    }
  }
};

function parseSetCookie(header, url) {
  if (!header) {
    return null;
  }

  const segments = header.split(";").map((segment) => segment.trim()).filter(Boolean);
  if (!segments.length) {
    return null;
  }

  const [nameValue, ...attributes] = segments;
  const separatorIndex = nameValue.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const cookie = {
    name: nameValue.slice(0, separatorIndex).trim(),
    value: nameValue.slice(separatorIndex + 1),
    domain: url.hostname.toLowerCase(),
    path: "/",
    secure: false,
    httpOnly: false,
    sameSite: null,
    expiresAt: null
  };

  attributes.forEach((attribute) => {
    const attrIndex = attribute.indexOf("=");
    const key = (attrIndex === -1 ? attribute : attribute.slice(0, attrIndex)).trim().toLowerCase();
    const value = attrIndex === -1 ? "" : attribute.slice(attrIndex + 1).trim();

    const handler = COOKIE_ATTRIBUTE_HANDLERS[key];
    if (handler) {
      handler(cookie, value);
    }
  });

  return cookie;
}

function buildEndpointUrl(baseUrl, endpoint) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(String(endpoint || "").replace(/^\//, ""), normalizedBase);
}

function normalizeBaseUrl(input) {
  const value = String(input || "").trim();
  if (!value) {
    throw new BackendClientError("INVALID_BASE_URL", "后台服务地址未配置");
  }

  const normalizedInput = /^https?:\/\//i.test(value) ? value : `http://${value}`;
  const url = new URL(normalizedInput);

  if (!/^https?:$/i.test(url.protocol)) {
    throw new BackendClientError("INVALID_BASE_URL", "后台服务地址配置不正确");
  }

  url.hash = "";
  url.search = "";

  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  return `${url.origin}${pathname}`;
}

function isCookieExpired(cookie, now = Date.now()) {
  if (!cookie?.expiresAt) {
    return false;
  }

  const expiresAt = new Date(cookie.expiresAt).getTime();
  return Number.isNaN(expiresAt) ? false : expiresAt <= now;
}

const STATUS_MESSAGE_MAP = {
  400: "请求参数不正确",
  403: "当前账号无权执行此操作",
  404: "未找到对应接口，请检查后台服务状态"
};

function defaultMessageForStatus(status) {
  if (status >= 500) {
    return "服务器暂时不可用，请稍后重试";
  }

  return STATUS_MESSAGE_MAP[status] || "请求失败，请稍后重试";
}

function extractUserUsername(user) {
  if (!user || typeof user !== "object") {
    return "";
  }

  return user.username || user.user || "";
}

function normalizeUsername(value) {
  return String(value || "").trim();
}

function normalizeIsoTimestamp(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  const timestamp = new Date(text);
  return Number.isNaN(timestamp.getTime()) ? "" : timestamp.toISOString();
}

function extractUserDisplayName(user) {
  if (!user || typeof user !== "object") {
    return "";
  }

  return String(
    user.display_name
    ?? user.displayName
    ?? user.name
    ?? user.operator_name
    ?? user.operatorName
    ?? user.username
    ?? user.user
    ?? ""
  ).trim();
}

function extractShopArray(payload) {
  return Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.shops)
        ? payload.shops
        : Array.isArray(payload?.list)
          ? payload.list
          : [];
}

function sanitizeShopInfoPayload(payload) {
  return extractShopArray(payload)
    .map(normalizeShopInfoItem)
    .filter((item) => item.shopCode && isSupportedShop(item));
}

function sanitizeVisibleShopInfoPayload(payload) {
  return extractShopArray(payload)
    .map(normalizeShopInfoItem)
    .filter((item) => item.shopCode);
}

function sanitizePublicShopInfoPayload(shops) {
  return (Array.isArray(shops) ? shops : []).map((shop) => {
    return {
      id: shop.id,
      shopCode: shop.shopCode,
      shopName: shop.shopName,
      currentOperator: shop.currentOperator,
      currentOperatorId: shop.currentOperatorId,
      currentOperatorUsername: shop.currentOperatorUsername,
      platform: shop.platform,
      remark: shop.remark
    };
  });
}

function normalizeShopInfoItem(item) {
  const operatorIdentity = extractOperatorIdentity(
    item?.current_operator
    ?? item?.currentOperator
    ?? item?.operator
    ?? item?.currentOperatorInfo
    ?? null
  );
  const shopCode = String(
    item?.shop_code
    ?? item?.shopCode
    ?? item?.shop_id
    ?? item?.shopId
    ?? ""
  ).trim();

  return {
    id: String(item?.id ?? shopCode).trim(),
    shopCode,
    shopName: String(item?.shop_name ?? item?.shopName ?? item?.name ?? "").trim(),
    currentOperator: operatorIdentity.name
      || String(item?.current_operator_name ?? item?.currentOperatorName ?? item?.operator_name ?? item?.operatorName ?? "").trim()
      || (typeof item?.current_operator === "string" ? String(item.current_operator).trim() : "")
      || (typeof item?.currentOperator === "string" ? String(item.currentOperator).trim() : ""),
    currentOperatorId: operatorIdentity.id
      || String(
        item?.current_operator_id
        ?? item?.currentOperatorId
        ?? item?.operator_id
        ?? item?.operatorId
        ?? item?.current_operator_uid
        ?? item?.currentOperatorUid
        ?? item?.operator_uid
        ?? item?.operatorUid
        ?? ""
      ).trim(),
    currentOperatorUsername: operatorIdentity.username
      || String(
        item?.current_operator_username
        ?? item?.currentOperatorUsername
        ?? item?.operator_username
        ?? item?.operatorUsername
        ?? ""
      ).trim(),
    platform: String(item?.platform ?? "").trim(),
    remark: String(item?.remark ?? "").trim(),
    cookie1: String(item?.cookie1 ?? item?.cookie_1 ?? item?.cookieValue1 ?? "").trim()
  };
}

function mergeVisibleShopCatalog(visibleCatalog, fullCatalog) {
  const fullCatalogByCode = new Map(
    (Array.isArray(fullCatalog) ? fullCatalog : [])
      .filter((shop) => shop?.shopCode)
      .map((shop) => [shop.shopCode, shop])
  );

  return (Array.isArray(visibleCatalog) ? visibleCatalog : []).map((visibleShop) => {
    const fullShop = fullCatalogByCode.get(visibleShop.shopCode) || {};
    const mergedShop = {
      ...fullShop,
      ...visibleShop
    };

    ["cookie1", "cookie2", "cookie3"].forEach((fieldName) => {
      if (isBlankShopField(mergedShop[fieldName]) && !isBlankShopField(fullShop[fieldName])) {
        mergedShop[fieldName] = fullShop[fieldName];
      }
    });

    return mergedShop;
  });
}

function isBlankShopField(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function extractOperatorIdentity(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      id: "",
      name: "",
      username: ""
    };
  }

  return {
    id: String(
      value.operator_id
      ?? value.operatorId
      ?? value.id
      ?? value.uid
      ?? value.user_id
      ?? value.userId
      ?? ""
    ).trim(),
    name: String(
      value.display_name
      ?? value.displayName
      ?? value.name
      ?? value.operator_name
      ?? value.operatorName
      ?? value.username
      ?? value.user
      ?? ""
    ).trim(),
    username: String(
      value.username
      ?? value.user
      ?? value.login_name
      ?? value.loginName
      ?? ""
    ).trim()
  };
}

function normalizeVisibleShopScope(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return {
    mode: String(value.mode || "").trim(),
    userRole: String(value.userRole || value.role || "").trim(),
    userRoleName: String(value.userRoleName || value.roleName || "").trim(),
    username: String(value.username || value.user || "").trim(),
    displayName: String(value.displayName || value.name || "").trim(),
    operatorId: Number.isFinite(Number(value.operatorId)) ? Number(value.operatorId) : null,
    managedOperatorIds: (Array.isArray(value.managedOperatorIds) ? value.managedOperatorIds : [])
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item))
  };
}

function buildDerivedVisibleShopScope(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  const accessContext = buildShopAccessContext(user);
  const operatorId = [
    user.operator_id,
    user.operatorId,
    user.id,
    user.uid,
    user.user_id,
    user.userId
  ]
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value));

  function resolveScopeMode() {
    if (accessContext.isAdmin) {
      return "all";
    }

    if (accessContext.includesManagedOperators) {
      return "self_and_managed";
    }

    return "self_only";
  }

  return {
    mode: resolveScopeMode(),
    userRole: String(user.role || "").trim(),
    userRoleName: String(user.role_name || user.roleName || "").trim(),
    username: extractUserUsername(user),
    displayName: extractUserDisplayName(user),
    operatorId: Number.isFinite(operatorId) ? operatorId : null,
    managedOperatorIds: Array.from(accessContext.operatorIds)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
  };
}

function filterShopsForCurrentUser(shops, user) {
  const normalizedShops = sortShopsByName(shops);
  const accessContext = buildShopAccessContext(user);

  if (accessContext.isAdmin) {
    return normalizedShops;
  }

  return normalizedShops.filter((shop) => matchesShopAccessContext(shop, accessContext));
}

function sortShopsByName(shops) {
  const normalizedShops = Array.isArray(shops) ? shops.slice() : [];
  normalizedShops.sort((left, right) => {
    return String(left.shopName || left.shopCode).localeCompare(String(right.shopName || right.shopCode), "zh-CN");
  });
  return normalizedShops;
}

function isAdminUser(user) {
  const role = String(user?.role || "").trim().toLowerCase();
  const roleName = String(user?.role_name || user?.roleName || "").trim();
  return role === "admin" || roleName.includes("管理员");
}

function buildShopAccessContext(user) {
  const context = {
    isAdmin: canViewAllShops(user),
    operatorIds: new Set(),
    operatorNames: new Set(),
    includesManagedOperators: false
  };

  appendOperatorIdentity(context, user);

  [
    user?.managed_operators,
    user?.managedOperators,
    user?.managed_operator_profiles,
    user?.managedOperatorProfiles,
    user?.managed_operator_users,
    user?.managedOperatorUsers
  ].forEach((items) => {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((item) => {
      if (!item) {
        return;
      }

      context.includesManagedOperators = true;
      appendOperatorIdentity(context, item);
    });
  });

  [
    user?.managed_operator_ids,
    user?.managedOperatorIds,
    user?.managed_operator_uids,
    user?.managedOperatorUids
  ].forEach((items) => {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((value) => {
      const normalizedValue = String(value || "").trim();
      if (!normalizedValue) {
        return;
      }

      context.includesManagedOperators = true;
      context.operatorIds.add(normalizedValue);
    });
  });

  [
    user?.managed_operator_names,
    user?.managedOperatorNames
  ].forEach((items) => {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((value) => {
      const normalizedValue = String(value || "").trim();
      if (!normalizedValue) {
        return;
      }

      context.includesManagedOperators = true;
      context.operatorNames.add(normalizedValue);
    });
  });

  return context;
}

function appendOperatorIdentity(context, value) {
  if (!context || !value) {
    return;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    [
      value.operator_id,
      value.operatorId,
      value.id,
      value.uid,
      value.user_id,
      value.userId
    ].forEach((candidate) => {
      const normalizedCandidate = String(candidate || "").trim();
      if (normalizedCandidate) {
        context.operatorIds.add(normalizedCandidate);
      }
    });

    [
      value.display_name,
      value.displayName,
      value.name,
      value.operator_name,
      value.operatorName,
      value.currentOperator,
      value.current_operator,
      value.username,
      value.user
    ].forEach((candidate) => {
      const normalizedCandidate = String(candidate || "").trim();
      if (normalizedCandidate) {
        context.operatorNames.add(normalizedCandidate);
      }
    });
  }

  [
    extractUserDisplayName(value),
    extractUserUsername(value)
  ].forEach((candidate) => {
    const normalizedCandidate = String(candidate || "").trim();
    if (normalizedCandidate) {
      context.operatorNames.add(normalizedCandidate);
    }
  });
}

function matchesShopAccessContext(shop, accessContext) {
  if (!shop || !accessContext) {
    return false;
  }

  const shopOperatorIds = [
    shop.currentOperatorId,
    shop.operatorId,
    shop.currentOperatorUid
  ].map((value) => String(value || "").trim()).filter(Boolean);

  if (shopOperatorIds.some((value) => accessContext.operatorIds.has(value))) {
    return true;
  }

  const shopOperatorNames = [
    shop.currentOperator,
    shop.currentOperatorName,
    shop.currentOperatorUsername
  ].map((value) => String(value || "").trim()).filter(Boolean);

  return shopOperatorNames.some((value) => accessContext.operatorNames.has(value));
}

function buildShopCatalogOwnerKey(user, fallbackUsername = "") {
  if (!user || typeof user !== "object") {
    return "";
  }

  const primaryId = [
    user?.id,
    user?.uid,
    user?.user_id,
    user?.userId,
    user?.operator_id,
    user?.operatorId
  ]
    .map((value) => String(value || "").trim())
    .find(Boolean);

  if (primaryId) {
    return `id:${primaryId}`;
  }

  const username = normalizeUsername(extractUserUsername(user) || fallbackUsername).toLowerCase();
  return username ? `user:${username}` : "";
}

function buildShopCatalogOwnerLabel(user, fallbackUsername = "") {
  return extractUserDisplayName(user)
    || normalizeUsername(extractUserUsername(user) || fallbackUsername)
    || "unknown";
}

function findShopInCatalog(shops, shopCode) {
  return (Array.isArray(shops) ? shops : []).find((shop) => shop.shopCode === shopCode) || null;
}

function isSupportedShop(item) {
  const platform = String(item?.platform || "").trim();
  const remark = String(item?.remark || "").trim();

  if (platform !== "拼多多") {
    return false;
  }

  if (remark.includes("关店")) {
    return false;
  }

  return true;
}

function countProductsDataItems(payload) {
  return extractProductsDataItems(payload).length;
}

function extractProductsDataTotalPages(payload) {
  const candidates = [
    payload?.data?.pagination?.total_pages,
    payload?.data?.pagination?.totalPages,
    payload?.pagination?.total_pages,
    payload?.pagination?.totalPages,
    payload?.data?.total_pages,
    payload?.data?.totalPages
  ];

  const matched = candidates
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0);

  return matched || 1;
}

function extractProductsDataItems(payload) {
  const candidates = [
    payload?.data?.products,
    payload?.data?.items,
    payload?.data?.list,
    payload?.data?.rows,
    payload?.products,
    payload?.items,
    payload?.list,
    payload?.rows,
    payload?.data
  ];

  const target = candidates.find((value) => Array.isArray(value));
  return Array.isArray(target) ? target : [];
}

function extractProductsDataItemProductId(item) {
  return String(
    item?.product_id
    ?? item?.productId
    ?? item?.goods_id
    ?? item?.goodsId
    ?? item?.id
    ?? ""
  ).trim();
}

function extractProductsDataItemShopCode(item) {
  return String(
    item?.shop_id
    ?? item?.shopId
    ?? item?.shop_code
    ?? item?.shopCode
    ?? ""
  ).trim();
}

function extractProductsDataItemShopName(item) {
  return String(
    item?.shop_name
    ?? item?.shopName
    ?? item?.name
    ?? ""
  ).trim();
}

function normalizeProductFullDetailPayload(payload, fallbackProductId = "") {
  const root = payload && typeof payload === "object" && payload.data && typeof payload.data === "object"
    ? payload.data
    : payload;
  const product = root?.product && typeof root.product === "object" ? root.product : {};

  return {
    productId: String(
      product.product_id
      ?? product.productId
      ?? root?.product_id
      ?? root?.productId
      ?? fallbackProductId
      ?? ""
    ).trim(),
    categoryPath: normalizeCategoryPath(
      product.category
      ?? product.category_path
      ?? root?.category
      ?? root?.categoryPath
      ?? ""
    ),
    productName: String(
      product.product_name
      ?? product.productName
      ?? root?.product_name
      ?? root?.productName
      ?? ""
    ).trim(),
    carouselImages: normalizeStringArray(root?.carousel_images ?? root?.carouselImages),
    attributes: normalizeProductDetailAttributes(root?.attributes),
    skus: normalizeProductDetailSkus(root?.skus)
  };
}

function normalizeCategoryPath(value) {
  return String(value || "")
    .split(">")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" > ");
}

function normalizeStringArray(value) {
  return (Array.isArray(value) ? value : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeProductDetailAttributes(source) {
  return (Array.isArray(source) ? source : [])
    .map((item) => {
      const refPid = String(item?.ref_pid ?? item?.refPid ?? item?.pid ?? "").trim();
      return {
        refPid,
        name: String(item?.name ?? item?.label ?? "").trim(),
        values: (Array.isArray(item?.values) ? item.values : [])
          .map((value) => {
            return {
              vid: String(value?.vid ?? value?.id ?? "").trim(),
              value: String(value?.value ?? "").trim(),
              rawValue: String(value?.raw_value ?? value?.rawValue ?? value?.value ?? "").trim(),
              unit: String(value?.unit ?? "").trim()
            };
          })
          .filter((value) => value.value || value.rawValue)
      };
    })
    .filter((item) => item.refPid);
}

function normalizeProductDetailSkus(source) {
  return (Array.isArray(source) ? source : [])
    .map((item) => {
      return {
        skuId: String(item?.sku_id ?? item?.skuId ?? "").trim(),
        specName: String(item?.new_spec_desc ?? item?.sku_spec ?? item?.spec_name ?? item?.specName ?? "").trim(),
        groupPrice: normalizeDetailSkuNumber(item?.price?.group ?? item?.group_price ?? item?.groupPrice),
        singlePrice: normalizeDetailSkuNumber(item?.price?.single ?? item?.single_price ?? item?.singlePrice),
        stock: normalizeDetailSkuNumber(item?.stock ?? item?.goods_stock ?? item?.goodsStock),
        weight: normalizeDetailSkuNumber(item?.weight ?? item?.goods_weight ?? item?.goodsWeight),
        externalSkuCode: String(item?.external_sku_code ?? item?.externalSkuCode ?? "").trim(),
        skuImageUrl: String(item?.sku_image_url ?? item?.skuImageUrl ?? "").trim()
      };
    })
    .filter((item) => item.specName || item.skuId);
}

function normalizeDetailSkuNumber(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  return String(value).trim();
}

function extractMessage(payload) {
  if (!payload) {
    return "";
  }

  if (typeof payload === "string") {
    return payload.trim();
  }

  if (typeof payload.message === "string") {
    return payload.message.trim();
  }

  if (typeof payload.error === "string") {
    return payload.error.trim();
  }

  if (typeof payload.msg === "string") {
    return payload.msg.trim();
  }

  return "";
}

function normalizeError(error) {
  if (error instanceof BackendClientError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status || null
    };
  }

  if (error?.name === "AbortError") {
    return {
      code: "TIMEOUT",
      message: "请求超时，请检查后台服务状态或稍后重试",
      status: null
    };
  }

  return {
    code: "NETWORK_ERROR",
    message: "无法连接后台服务，请检查服务是否可访问",
    status: null
  };
}

function mapLoginError(error) {
  if (!error) {
    return {
      code: "LOGIN_FAILED",
      message: "登录失败，请稍后重试"
    };
  }

  if (error.code === "INVALID_BASE_URL") {
    return error;
  }

  if (error.status === 400 || error.status === 401 || error.status === 403 || error.code === "UNAUTHORIZED") {
    return {
      code: "INVALID_CREDENTIALS",
      message: "用户名或密码错误"
    };
  }

  if (error.code === "TIMEOUT") {
    return error;
  }

  if (error.code === "NETWORK_ERROR") {
    return {
      code: "NETWORK_ERROR",
      message: "后台服务暂时无法访问，请检查服务状态"
    };
  }

  return {
    code: error.code || "LOGIN_FAILED",
    message: error.message || "登录失败，请稍后重试"
  };
}

function mapChangePasswordError(error) {
  if (!error) {
    return {
      code: "CHANGE_PASSWORD_FAILED",
      message: "修改密码失败，请稍后重试"
    };
  }

  if (error.code === "AUTH_EXPIRED") {
    return error;
  }

  if (error.status === 400 || error.status === 401 || error.status === 403) {
    return {
      code: "CHANGE_PASSWORD_REJECTED",
      message: error.message || "旧密码不正确，或当前账号无权限修改密码"
    };
  }

  return {
    code: error.code || "CHANGE_PASSWORD_FAILED",
    message: error.message || "修改密码失败，请稍后重试"
  };
}

function failure(error) {
  return {
    ok: false,
    error: error && typeof error === "object"
      ? error
      : {
          code: "UNKNOWN_ERROR",
          message: "请求失败"
        }
  };
}

module.exports = {
  DEFAULT_BASE_URL,
  createBackendClient
};
