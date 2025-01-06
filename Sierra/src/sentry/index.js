import { init } from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const SENTRY_DSN = process.env.SENTRY_DSN;
init({
  dsn: `${SENTRY_DSN}`,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
