<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8646fdab-3e8d-4c65-b77a-0ad4b62649f9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Android build (GitHub Actions)
Push this repo to GitHub -> Actions -> "Android build" -> Run workflow. Download `colorsort-debug-apk` to test on a phone.
For the Play Store AAB add repo secrets: UPLOAD_KEYSTORE_BASE64 (base64 of your .jks), KEYSTORE_PASSWORD, KEY_PASSWORD, KEY_ALIAS.
Local: `npm install && npm run build && npx cap sync android && cd android && ./gradlew bundleRelease`
