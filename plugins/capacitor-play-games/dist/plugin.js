var capacitorPlayGames = (function (exports, core) {
    'use strict';

    const PlayGames = core.registerPlugin("PlayGames", {
        web: () => Promise.resolve().then(function () { return web; }).then((m) => new m.PlayGamesWeb()),
    });

    /**
     * Web / non-native fallback: every method resolves to a safe default (signed
     * out, empty). Gate feature usage behind `isSignedIn()`, which is `false` here.
     */
    class PlayGamesWeb extends core.WebPlugin {
        async initialize() { }
        async signIn() {
            return { signedIn: false };
        }
        async isSignedIn() {
            return { signedIn: false };
        }
        async getPlayer() {
            return { playerId: "", displayName: "" };
        }
        async requestServerSideAccess() {
            return { authCode: "" };
        }
        async fetchIdentityVerificationSignature() {
            return {
                publicKeyUrl: "",
                signature: "",
                salt: "",
                timestamp: 0,
                playerId: "",
                bundleId: "",
            };
        }
        async unlockAchievement() { }
        async incrementAchievement() { }
        async showAchievements() { }
        async submitScore() { }
        async showLeaderboard() { }
        async showAllLeaderboards() { }
        async loadSnapshot() {
            return { snapshot: null };
        }
        async saveSnapshot() { }
        async listSnapshots() {
            return { snapshots: [] };
        }
        async deleteSnapshot() { }
    }

    var web = /*#__PURE__*/Object.freeze({
        __proto__: null,
        PlayGamesWeb: PlayGamesWeb
    });

    exports.PlayGames = PlayGames;

    return exports;

})({}, capacitorExports);
//# sourceMappingURL=plugin.js.map
