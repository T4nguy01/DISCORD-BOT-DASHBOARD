const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "data");
const CONFIG_FILE = path.join(DATA_DIR, "guild-configs.json");

const DEFAULT_CONFIG = {
  allowSayCommand: true,
  allow8ballCommand: true,
  logChannelId: "",
  welcomeChannel: "",
  byeChannel: "",
  levelChannel: "",
  language: "fr",
  disabledCommands: [],
  activeRoleId: "",
  inactiveRoleId: "",
  inactivityDays: 7,
  ticketCategoryId: "",
  ticketSupportRoleId: "",
  ticketTranscriptChannelId: "",
  selfRoles: [],
  autoRoleId: "",
  autoRoleEnabled: false,
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

let configCache = null;

function loadAllConfigs() {
  if (configCache) return configCache;

  ensureDataDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    configCache = {};
    return configCache;
  }

  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    configCache = parsed && typeof parsed === "object" ? parsed : {};
    return configCache;
  } catch {
    configCache = {};
    return configCache;
  }
}

function saveAllConfigs(configs) {
  configCache = configs;
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2), "utf8");
}

function getGuildConfig(guildId) {
  const configs = loadAllConfigs();
  return {
    ...DEFAULT_CONFIG,
    ...(configs[guildId] || {}),
  };
}

function updateGuildConfig(guildId, nextConfig) {
  const configs = loadAllConfigs();
  configs[guildId] = {
    ...DEFAULT_CONFIG,
    ...(configs[guildId] || {}),
    ...nextConfig,
  };
  saveAllConfigs(configs);
  return configs[guildId];
}

function normalizeCommandName(name) {
  return String(name || "").trim().toLowerCase();
}

function isCommandEnabled(guildId, commandName) {
  const config = getGuildConfig(guildId);
  const name = normalizeCommandName(commandName);
  const disabled = new Set(
    Array.isArray(config.disabledCommands)
      ? config.disabledCommands.map(normalizeCommandName)
      : []
  );

  if (name === "say" && config.allowSayCommand === false) return false;
  if (name === "8ball" && config.allow8ballCommand === false) return false;
  return !disabled.has(name);
}

function getCommandStates(guildId, commandNames) {
  const states = {};
  for (const name of commandNames) {
    states[name] = isCommandEnabled(guildId, name);
  }
  return states;
}

function updateCommandStates(guildId, commandStates) {
  const nextDisabled = [];

  for (const [rawName, enabled] of Object.entries(commandStates || {})) {
    const name = normalizeCommandName(rawName);
    if (!name) continue;
    if (!enabled) nextDisabled.push(name);
  }

  const uniqueDisabled = [...new Set(nextDisabled)];
  return updateGuildConfig(guildId, { disabledCommands: uniqueDisabled });
}

module.exports = {
  DEFAULT_CONFIG,
  getGuildConfig,
  updateGuildConfig,
  isCommandEnabled,
  getCommandStates,
  updateCommandStates,
};
