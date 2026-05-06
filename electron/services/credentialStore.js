const fs = require("fs/promises");
const path = require("path");

function createCredentialStore(workspace) {
  const credentialsPath = workspace.credentialsPath || path.join(workspace.root, "login-credentials.json");
  const legacyCredentialsPath = path.join(workspace.root, "remembered-credentials.json");

  async function ensureFile() {
    await fs.mkdir(path.dirname(credentialsPath), { recursive: true });

    try {
      await fs.access(credentialsPath);
      return;
    } catch {
      // Fall through and create or migrate the file.
    }

    const migrated = await tryMigrateLegacyFile();
    if (migrated) {
      return;
    }

    await writeDefaultFile();
  }

  async function tryMigrateLegacyFile() {
    if (legacyCredentialsPath === credentialsPath) {
      return false;
    }

    try {
      const legacyRaw = JSON.parse(await fs.readFile(legacyCredentialsPath, "utf-8"));
      const normalizedLegacyRecord = normalizeCredentialRecord(legacyRaw);
      await writeNormalizedRecord(normalizedLegacyRecord);
      return true;
    } catch {
      return false;
    }
  }

  async function writeDefaultFile() {
    await writeNormalizedRecord(normalizeCredentialRecord(null));
  }

  async function writeNormalizedRecord(normalized) {
    await fs.writeFile(
      credentialsPath,
      JSON.stringify(
        {
          ...normalized,
          updatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      "utf-8"
    );
  }

  async function read() {
    await ensureFile();

    try {
      const raw = JSON.parse(await fs.readFile(credentialsPath, "utf-8"));
      const normalized = normalizeCredentialRecord(raw);

      if (!isSameCredentialRecord(raw, normalized)) {
        await writeNormalizedRecord(normalized);
      }

      return normalized;
    } catch {
      const normalized = normalizeCredentialRecord(null);
      await writeNormalizedRecord(normalized);
      return normalized;
    }
  }

  async function write(record) {
    await ensureFile();
    const normalized = normalizeCredentialRecord(record);
    await writeNormalizedRecord(normalized);
    return normalized;
  }

  async function clear() {
    await ensureFile();
    await writeDefaultFile();
  }

  return {
    path: credentialsPath,
    read,
    write,
    clear
  };
}

module.exports = {
  createCredentialStore
};

function normalizeCredentialRecord(record) {
  if (!record || typeof record !== "object") {
    return {
      lastUsername: "",
      rememberPassword: false,
      savedPassword: ""
    };
  }

  const lastUsername = typeof record.lastUsername === "string" ? record.lastUsername.trim() : "";
  const savedPassword = typeof record.savedPassword === "string" ? record.savedPassword : "";
  const rememberPassword = Boolean(record.rememberPassword) && savedPassword.length > 0;

  return {
    lastUsername,
    rememberPassword,
    savedPassword: rememberPassword ? savedPassword : ""
  };
}

function isSameCredentialRecord(rawRecord, normalizedRecord) {
  if (!rawRecord || typeof rawRecord !== "object") {
    return false;
  }

  return String(rawRecord.lastUsername || "").trim() === normalizedRecord.lastUsername
    && Boolean(rawRecord.rememberPassword) === normalizedRecord.rememberPassword
    && String(rawRecord.savedPassword || "") === normalizedRecord.savedPassword;
}
