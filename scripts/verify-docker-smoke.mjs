const appBaseUrl =
  process.env.APP_BASE_URL ?? process.env.BASE_URL ?? "http://app:3000";
const healthUrl =
  process.env.APP_HEALTH_URL ?? `${appBaseUrl.replace(/\/$/, "")}/api/health`;

async function main() {
  const response = await fetch(healthUrl, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => null);

  if (
    !response.ok ||
    payload?.status !== "ok" ||
    payload?.database !== "connected"
  ) {
    throw new Error(
      `Smoke verification failed for ${healthUrl}: HTTP ${response.status} ${JSON.stringify(payload)}`,
    );
  }

  console.log(
    `Docker smoke verification PASS: ${healthUrl} status=${payload.status} database=${payload.database}`,
  );
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
