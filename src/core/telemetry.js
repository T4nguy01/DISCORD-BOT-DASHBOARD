const os = require("node:os");

const MAX_EVENTS = 100;
const MAX_TIMESTAMPS = 5000;

const state = {
  startedAt: Date.now(),
  totalInteractions: 0,
  successCount: 0,
  errorCount: 0,
  blockedCount: 0,
  commandCounts: {},
  guildCounts: {},
  interactionTimestamps: [],
  recentEvents: [],
  cpuSample: {
    atNs: process.hrtime.bigint(),
    usage: process.cpuUsage(),
  },
};

function pushEvent(event) {
  state.recentEvents.unshift(event);
  if (state.recentEvents.length > MAX_EVENTS) {
    state.recentEvents.length = MAX_EVENTS;
  }
}

function pushInteractionTimestamp(ms) {
  state.interactionTimestamps.push(ms);
  if (state.interactionTimestamps.length > MAX_TIMESTAMPS) {
    state.interactionTimestamps.splice(0, state.interactionTimestamps.length - MAX_TIMESTAMPS);
  }
}

function getInteractionsLastSeconds(seconds) {
  const now = Date.now();
  const threshold = now - seconds * 1000;
  let count = 0;
  for (let i = state.interactionTimestamps.length - 1; i >= 0; i -= 1) {
    if (state.interactionTimestamps[i] >= threshold) count += 1;
    else break;
  }
  return count;
}

function sampleCpuPercent() {
  const nowNs = process.hrtime.bigint();
  const diffNs = Number(nowNs - state.cpuSample.atNs);
  const diffUsage = process.cpuUsage(state.cpuSample.usage);

  state.cpuSample = {
    atNs: nowNs,
    usage: process.cpuUsage(),
  };

  if (diffNs <= 0) return 0;
  const elapsedUs = diffNs / 1000;
  const usedUs = diffUsage.user + diffUsage.system;
  const cores = os.cpus().length || 1;
  const percent = (usedUs / (elapsedUs * cores)) * 100;
  return Math.max(0, Math.min(100, percent));
}

function getRuntimeStats() {
  const mem = process.memoryUsage();
  return {
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpuProcessPercent: Number(sampleCpuPercent().toFixed(2)),
    rssMb: Number((mem.rss / 1024 / 1024).toFixed(1)),
    heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(1)),
    heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(1)),
    externalMb: Number((mem.external / 1024 / 1024).toFixed(1)),
    systemTotalMemMb: Number((os.totalmem() / 1024 / 1024).toFixed(1)),
    systemFreeMemMb: Number((os.freemem() / 1024 / 1024).toFixed(1)),
    loadAvg1m: Number(os.loadavg()[0].toFixed(2)),
  };
}

function recordCommand(interaction, status, detail = "") {
  const commandName = interaction.commandName || "unknown";
  const commandKey = String(commandName).toLowerCase();
  const guildId = interaction.guildId || "dm";

  state.totalInteractions += 1;
  state.commandCounts[commandKey] = (state.commandCounts[commandKey] || 0) + 1;
  state.guildCounts[guildId] = (state.guildCounts[guildId] || 0) + 1;
  pushInteractionTimestamp(Date.now());

  if (status === "success") state.successCount += 1;
  if (status === "error") state.errorCount += 1;
  if (status === "blocked") state.blockedCount += 1;

  pushEvent({
    at: new Date().toISOString(),
    type: "command",
    status,
    commandName,
    guildId: interaction.guildId || "",
    channelId: interaction.channelId || "",
    userTag: interaction.user?.tag || "",
    userId: interaction.user?.id || "",
    detail: String(detail || ""),
  });
}

function recordSystem(status, detail = "") {
  pushEvent({
    at: new Date().toISOString(),
    type: "system",
    status,
    detail: String(detail || ""),
  });
}

function getGuildUsage(client, limit = 10) {
  const entries = Object.entries(state.guildCounts)
    .filter(([guildId]) => guildId !== "dm")
    .map(([guildId, interactions]) => {
      const guild = client.guilds.cache.get(guildId);
      return {
        guildId,
        guildName: guild ? guild.name : "Unknown guild",
        interactions,
      };
    })
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, Math.max(1, Math.min(Number(limit) || 10, 50)));

  return entries;
}

function getSummary(client) {
  const uptimeSec = Math.floor((Date.now() - state.startedAt) / 1000);
  return {
    startedAt: new Date(state.startedAt).toISOString(),
    uptimeSec,
    guildCount: client.guilds.cache.size,
    totalInteractions: state.totalInteractions,
    successCount: state.successCount,
    errorCount: state.errorCount,
    blockedCount: state.blockedCount,
    interactionsPerMin: getInteractionsLastSeconds(60),
    pingMs: Math.round(client.ws.ping || 0),
    commandCounts: state.commandCounts,
    runtime: getRuntimeStats(),
    topGuilds: getGuildUsage(client, 10),
  };
}

function getRecentEvents(limit = 20) {
  const size = Math.max(1, Math.min(Number(limit) || 20, 100));
  return state.recentEvents.slice(0, size);
}

module.exports = {
  recordCommand,
  recordSystem,
  getSummary,
  getRecentEvents,
};
