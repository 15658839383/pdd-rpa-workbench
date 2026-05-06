const fs = require("fs/promises");
const path = require("path");
const { safeStorage } = require("electron");

function createShopCatalogStore(workspace) {
  const catalogPath = workspace.shopCatalogCachePath || path.join(workspace.root, "shop-catalog-cache.json");

  async function read() {
    try {
      const raw = JSON.parse(await fs.readFile(catalogPath, "utf-8"));

      if (raw.encrypted) {
        if (!safeStorage.isEncryptionAvailable() || !raw.payload) {
          return null;
        }

        const decrypted = safeStorage.decryptString(Buffer.from(raw.payload, "base64"));
        return normalizeShopCatalogRecord(JSON.parse(decrypted));
      }

      return normalizeShopCatalogRecord(raw.record || raw.catalog || raw);
    } catch {
      return null;
    }
  }

  async function write(record) {
    const normalized = normalizeShopCatalogRecord(record);
    const payload = safeStorage.isEncryptionAvailable()
      ? {
          encrypted: true,
          updatedAt: normalized.updatedAt || new Date().toISOString(),
          payload: safeStorage.encryptString(JSON.stringify(normalized)).toString("base64")
        }
      : {
          encrypted: false,
          updatedAt: normalized.updatedAt || new Date().toISOString(),
          record: normalized
        };

    await fs.mkdir(path.dirname(catalogPath), { recursive: true });
    await fs.writeFile(catalogPath, JSON.stringify(payload, null, 2), "utf-8");
    return normalized;
  }

  async function clear() {
    await fs.rm(catalogPath, { force: true });
  }

  return {
    path: catalogPath,
    read,
    write,
    clear
  };
}

module.exports = {
  createShopCatalogStore
};

function normalizeShopCatalogRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const shops = Array.isArray(record.shops)
    ? record.shops.map(normalizeShopCatalogItem).filter((item) => item.shopCode)
    : [];

  return {
    ownerKey: String(record.ownerKey || "").trim(),
    ownerLabel: String(record.ownerLabel || "").trim(),
    total: Number.isFinite(Number(record.total)) ? Number(record.total) : shops.length,
    updatedAt: normalizeTimestamp(record.updatedAt),
    scope: normalizeShopCatalogScope(record.scope),
    shops
  };
}

function normalizeShopCatalogItem(item) {
  return {
    id: String(item?.id ?? item?.shopCode ?? "").trim(),
    shopCode: String(item?.shopCode ?? item?.shop_code ?? "").trim(),
    shopName: String(item?.shopName ?? item?.shop_name ?? item?.name ?? "").trim(),
    currentOperator: String(item?.currentOperator ?? item?.current_operator ?? "").trim(),
    currentOperatorId: String(item?.currentOperatorId ?? item?.current_operator_id ?? "").trim(),
    currentOperatorUsername: String(item?.currentOperatorUsername ?? item?.current_operator_username ?? "").trim(),
    platform: String(item?.platform ?? "").trim(),
    remark: String(item?.remark ?? "").trim(),
    cookie1: String(item?.cookie1 ?? item?.cookie_1 ?? "").trim()
  };
}

function normalizeShopCatalogScope(scope) {
  if (!scope || typeof scope !== "object" || Array.isArray(scope)) {
    return null;
  }

  return {
    mode: String(scope.mode || "").trim(),
    userRole: String(scope.userRole || scope.role || "").trim(),
    userRoleName: String(scope.userRoleName || scope.roleName || "").trim(),
    username: String(scope.username || scope.user || "").trim(),
    displayName: String(scope.displayName || scope.name || "").trim(),
    operatorId: Number.isFinite(Number(scope.operatorId)) ? Number(scope.operatorId) : null,
    managedOperatorIds: (Array.isArray(scope.managedOperatorIds) ? scope.managedOperatorIds : [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
  };
}

function normalizeTimestamp(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  const timestamp = new Date(text);
  return Number.isNaN(timestamp.getTime()) ? "" : timestamp.toISOString();
}
