# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.3] - 2026-10-18

### Fixed

- Game Center interactive sign-in now waits for authentication to finish instead
  of reporting failure as soon as its screen appears. Cancellation and unavailable
  sign-in UI return an explicit reason; GameKit service failures retain their code.
- Android sign-in preserves native service errors instead of reporting every
  failure as an unauthenticated account.
- Android snapshot reads reject after 30 seconds if the service never answers,
  allowing a later read to retry. Late results close their snapshot or metadata
  buffer and cannot replace the timeout with an empty or successful result.
  Snapshot writes remain pending until the native operation actually settles.

## [0.3.2] - 2026-10-18

### Fixed

- `loadSnapshot` on Android no longer creates a save slot. It opened the slot
  with create-if-missing, so a read of a missing slot left an empty one behind.
  A missing slot now resolves `{ snapshot: null }`; a slot that exists but holds
  no data still resolves with `data: ""`.
- `loadSnapshot` on Android rejects when the saved data cannot be read. A read
  error used to leave the call unanswered, so the app waited forever for the
  save. A read that returns nothing now rejects instead of passing as empty
  data, and the opened snapshot is always closed.
- Every Android call now answers when its Play Games task is cancelled or its
  result handling throws, instead of leaving the promise pending. An unresolved
  snapshot conflict closes both snapshots and rejects.

## [0.3.1] - 2026-10-12

### Changed

- Update Google Play Games Services v2 to 22.1.0. It keeps the SDK's minSdk 24
  and changes no APIs this plugin uses.
- Update Android Gradle Plugin to 9.4.1 and Kotlin to 2.4.21.
- Update Capacitor to 8.5.3 for development, Biome to 2.5.15, Rollup to 4.64.5,
  and pnpm to 12.11.2. The Capacitor peer requirement stays 8.5.1 or newer
  within version 8.

## [0.3.0] - 2026-09-08

### Breaking changes

- `saveSnapshot` now requires `expectedPlayerId`, the native player id associated
  with the save payload. Both native platforms reject writes for another player.
  Update each save call to pass the payload owner's player id; do not substitute
  a newly signed-in player's id for data that belongs to another account.
- Align npm, SwiftPM, and CocoaPods on Capacitor 8.5.1 or newer within version 8,
  and raise the iOS deployment target to the Capacitor 8 minimum of iOS 15.
  Android builds require Gradle 9.6 or newer for Android Gradle Plugin 9.4.0.

### Changed

- Emit the CommonJS entry as `.cjs` and use explicit JavaScript import extensions
  in the ESM entry. Verify both package entry points and their web fallbacks in
  separate Node processes so package consumers receive the plugin exports.
- Update Capacitor to 8.5.1, Biome to 2.5.12, Rollup to 4.63.1, and pnpm to
  12.3.4. Development and CI use Node 26.
- Override the Xcode project parser's UUID dependency with the patched CommonJS
  release 11.1.1 until the upstream parser updates its dependency.
- Update Android Gradle Plugin to 9.4.0, Kotlin to 2.4.20, AndroidX AppCompat to
  1.8.0, and the default compile/target SDK to 37. Gradle 9.6 or newer is required.
- Anchor Game Center presentation to the owning Capacitor bridge under UIScene.
- Resolve GameKit save conflicts using the winning save's loaded bytes, after a
  successful read. Failed reads and conflict resolutions now reject without
  overwriting saves with empty data. Add five native regression cases.
- Run SwiftLint directly in a macOS CI job; the removed npm wrapper silently
  skipped checks on Linux and when SwiftLint was absent.
- Give Capacitor docgen a dedicated config so generated Promise return types
  remain accurate with the current TypeScript build configuration.
- Android rechecks ownership after opening the snapshot and closes discarded
  snapshots using the client that opened them. Failed writes reject before
  committing snapshot metadata. This incorporates Coreshatter's
  former package patch into the plugin's native and TypeScript sources.
- Android snapshot listing now refreshes from the server so a cached empty list
  cannot be mistaken for a missing remote save.

## [0.2.1] - 2026-07-30

### Changed

- Android: Play Games Services v2 SDK 21.0.0 to 22.0.0. The 22.0.0 public API
  is additive over 21.0.0 (it adds `GameStatsClient` and `PlayerGameEvent`),
  every symbol this plugin calls is unchanged, and no plugin source changed.
- Android: Android Gradle Plugin 9.3.1, Kotlin Gradle Plugin 2.4.10.
- Toolchain to latest: TypeScript 6 to 7.0.2 (the native `tsgo` compiler),
  Biome 2.5.6, Capacitor 8.4.2, rollup 4.62.3, rimraf 6.1.3,
  `@capacitor/docgen` 0.3.1, pnpm 11.18.0.
- iOS: `capacitor-swift-pm` floor 8.4.2.
- CI: `actions/setup-node` v7.

### Requirements

- Android `minSdkVersion` 24. Play Games Services v2 SDK 22.0.0 raises its own
  floor from 21 to 24, so an app that sets `minSdkVersion` below 24 fails the
  manifest merge. This module already defaulted to 24, and Capacitor 8 requires
  24, so an app on stock Capacitor 8 settings needs no change.

## [0.2.0] - 2026-07-12

### Added

- `requestServerSideAccess({ serverClientId, forceRefresh? })` (Android): a
  one-time OAuth 2.0 server auth code for the signed-in Play Games player, for a
  backend to exchange for the authoritative player id (Play Games Services v2
  `GamesSignInClient.requestServerSideAccess`).
- `fetchIdentityVerificationSignature()` (iOS): a GameKit identity-verification
  bundle (`GKLocalPlayer.fetchItems(forIdentityVerificationSignature:)`) a backend
  verifies against Apple's certificate to trust the Game Center player id.
- Both methods have a safe no-op web fallback and reject as unimplemented on the
  non-owning native platform.

## [0.1.0] - 2026-06-20

### Added

- Initial release.
- Sign-in (silent + interactive) and player profile.
- Achievement unlock / increment and the native achievements UI.
- Leaderboard score submission and the native leaderboard UI.
- Saved Games (load / save / list / delete) with most-recently-modified conflict
  resolution.
- `signInStateChanged` event for system-driven auth changes.
- Android via Google Play Games Services v2, iOS via Apple GameKit, with a safe
  no-op web fallback. iOS registers via `CAPBridgedPlugin` (Capacitor 8 Swift
  registration, no Objective-C `.m` file required).
