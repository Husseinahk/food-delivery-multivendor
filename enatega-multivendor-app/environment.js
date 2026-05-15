// /*****************************
//  * environment.js (Orda fork — orda-main branch)
//  * Upstream Enatega ships this file as `environment.js.example` and expects
//  * the consumer to copy it to `environment.js`. In the Orda fork we keep
//  * the customised version checked in so every deployment gets the same
//  * default behaviour: point at the per-restaurant backend host.
//  *
//  * Override per build:
//  *   - `ORDA_API_HOST=api.example.com expo start` for ad-hoc testing
//  *   - or set the values directly here for a fixed customer build.
//  *
//  * GRAPHQL_URL — HTTP+HTTPS endpoint, served by .NET 10 HotChocolate at /graphql.
//  * WS_GRAPHQL_URL — WebSocket subscriptions endpoint, same path different scheme.
//  * SERVER_URL — Apollo uses this as the canonical "server" string in errors.
//  * SERVER_REST_URL — only used by Enatega's legacy REST callbacks (image upload).
//  *                   Points at /api on the same host; we route those to multipart
//  *                   endpoints once we wire image upload (Phase 2b admin panel).
//  ******************************/

import { useContext } from 'react'
import ConfigurationContext from './src/context/Configuration'
import * as Updates from 'expo-updates'

const API_HOST = process.env.ORDA_API_HOST || 'api.dagiovanni-bochum.de'

const useEnvVars = (env = Updates.channel) => {
  const configuration = useContext(ConfigurationContext)

  // Same shape for prod + dev. Override ORDA_API_HOST=localhost:5000 (or
  // your tunnel) for simulator runs hitting the local backend.
  const protocolHttp = API_HOST.startsWith('localhost') ? 'http' : 'https'
  const protocolWs = API_HOST.startsWith('localhost') ? 'ws' : 'wss'

  return {
    GRAPHQL_URL: `${protocolHttp}://${API_HOST}/graphql`,
    WS_GRAPHQL_URL: `${protocolWs}://${API_HOST}/graphql`,
    SERVER_URL: `${protocolHttp}://${API_HOST}/graphql`,
    SERVER_REST_URL: `${protocolHttp}://${API_HOST}/`,
    // Identity provider client IDs come from build-time env on our side (set
    // in eas.json / app.config.js) rather than the runtime Configuration
    // query. We still surface them via the same hook so consumer screens
    // don't have to branch.
    IOS_CLIENT_ID_GOOGLE: configuration?.iOSClientID ?? process.env.ORDA_IOS_GOOGLE_CLIENT_ID,
    ANDROID_CLIENT_ID_GOOGLE: configuration?.androidClientID ?? process.env.ORDA_ANDROID_GOOGLE_CLIENT_ID,
    AMPLITUDE_API_KEY: configuration?.appAmplitudeApiKey,
    GOOGLE_MAPS_KEY: configuration?.googleApiKey ?? process.env.ORDA_GOOGLE_MAPS_KEY,
    EXPO_CLIENT_ID: configuration?.expoClientID,
    SENTRY_DSN: configuration?.customerAppSentryUrl ?? process.env.ORDA_SENTRY_DSN,
    TERMS_AND_CONDITIONS: configuration?.termsAndConditions,
    PRIVACY_POLICY: configuration?.privacyPolicy,
    TEST_OTP: configuration?.testOtp,
    GOOGLE_PACES_API_BASE_URL: configuration?.googlePlacesApiBaseUrl
  }
}

export default useEnvVars
