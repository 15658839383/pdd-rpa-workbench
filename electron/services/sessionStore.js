const fs = require("fs/promises");
const path = require("path");
const { safeStorage } = require("electron");

function createSessionStore(workspace) {
  const sessionPath = path.join(workspace.root, "auth-session.json");

  async function read() {
    try {
      const raw = JSON.parse(await fs.readFile(sessionPath, "utf-8"));

      if (raw.encrypted) {
        if (!safeStorage.isEncryptionAvailable() || !raw.payload) {
          return null;
        }

        const decrypted = safeStorage.decryptString(Buffer.from(raw.payload, "base64"));
        return normalizeSessionRecord(JSON.parse(decrypted));
      }

      return normalizeSessionRecord(raw.session || null);
    } catch {
      return null;
    }
  }

  async function write(session) {
    const normalized = normalizeSessionRecord(session);

    const payload = safeStorage.isEncryptionAvailable()
      ? {
          encrypted: true,
          updatedAt: new Date().toISOString(),
          payload: safeStorage.encryptString(JSON.stringify(normalized)).toString("base64")
        }
      : {
          encrypted: false,
          updatedAt: new Date().toISOString(),
          session: normalized
        };

    await fs.writeFile(sessionPath, JSON.stringify(payload, null, 2), "utf-8");
    return normalized;
  }

  async function clear() {
    await fs.rm(sessionPath, { force: true });
  }

  return {
    path: sessionPath,
    read,
    write,
    clear
  };
}

module.exports = {
  createSessionStore
};

function normalizeSessionRecord(session) {
  if (!session || typeof session !== "object") {
    return {
      baseUrl: null,
      cookies: [],
      lastUsername: ""
    };
  }

  return {
    baseUrl: session.baseUrl || null,
    cookies: Array.isArray(session.cookies) ? session.cookies : [],
    lastUsername: typeof session.lastUsername === "string" ? session.lastUsername.trim() : ""
  };
}
