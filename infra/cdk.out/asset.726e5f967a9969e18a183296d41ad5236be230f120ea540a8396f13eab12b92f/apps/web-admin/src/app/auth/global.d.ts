export {};

declare global {
  interface Window {
    /**
     * Runtime config a deployed `index.html` is expected to set (e.g. a
     * small inline `<script>` before the app bundle loads) — see
     * `cognito-client.ts`'s `getCognitoConfig()` doc comment for why this
     * is a runtime, not build-time, mechanism.
     */
    __ECCLESIA_CONFIG__?: {
      cognitoRegion?: string;
      cognitoClientId?: string;
    };
  }
}
