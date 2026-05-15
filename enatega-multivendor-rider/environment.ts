import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev";
import * as Updates from "expo-updates";
import { useContext } from "react";
import { ConfigurationContext } from "./lib/context/global/configuration.context";
// Orda wiring (orda-main fork branch). Points the rider app at the Orda
// .NET backend's GraphQL endpoint instead of upstream Enatega. Override the
// host per build with ORDA_API_HOST (e.g. localhost:5000 for a local backend
// during the emulator smoke test); https/wss in prod, http/ws on localhost.
const ORDA_API_HOST = process.env.ORDA_API_HOST || "api.dagiovanni-bochum.de";
const _http = ORDA_API_HOST.startsWith("localhost") ? "http" : "https";
const _ws = ORDA_API_HOST.startsWith("localhost") ? "ws" : "wss";
const ORDA_GRAPHQL_URL = `${_http}://${ORDA_API_HOST}/graphql`;
const ORDA_WS_GRAPHQL_URL = `${_ws}://${ORDA_API_HOST}/graphql`;

const getEnvVars = (env = Updates.channel) => {
  const configuration = useContext(ConfigurationContext);
  if (__DEV__) {
    loadDevMessages();
    loadErrorMessages();
  }
  if (!__DEV__) {
    return {
      GRAPHQL_URL: ORDA_GRAPHQL_URL,
      WS_GRAPHQL_URL: ORDA_WS_GRAPHQL_URL,
      SENTRY_DSN:
        configuration?.riderAppSentryUrl ??
        "https://e963731ba0f84e5d823a2bbe2968ea4d@o1103026.ingest.sentry.io/6135261",
      // GOOGLE_MAPS_KEY: 'AIzaSyBk4tvTtPaSEAVSvaao2yISz4m8Q-BeE1M',
      GOOGLE_MAPS_KEY:configuration?.googleApiKey,
      ENVIRONMENT: "production",
    };
  }

  return {
    GRAPHQL_URL: ORDA_GRAPHQL_URL,
    WS_GRAPHQL_URL: ORDA_WS_GRAPHQL_URL,
    SENTRY_DSN:
      configuration?.riderAppSentryUrl ??
      "https://e963731ba0f84e5d823a2bbe2968ea4d@o1103026.ingest.sentry.io/6135261",
    // GOOGLE_MAPS_KEY: 'AIzaSyBk4tvTtPaSEAVSvaao2yISz4m8Q-BeE1M',
    GOOGLE_MAPS_KEY:configuration?.googleApiKey,
    ENVIRONMENT: "development",
  };
};

export default getEnvVars;
