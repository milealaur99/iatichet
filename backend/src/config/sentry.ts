import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const initSetry = () => {
  Sentry.init({
    dsn: "https://73bc2b474d649cb79c7e8cbdf3487046@o4507991397367808.ingest.de.sentry.io/4507991400644688",
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0
  });
  return Sentry;
};

export { initSetry };
