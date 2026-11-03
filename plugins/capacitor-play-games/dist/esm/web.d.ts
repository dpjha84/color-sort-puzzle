import { WebPlugin } from "@capacitor/core";
import type { IdentityVerificationSignature, PlayerInfo, PlayGamesPlugin, SignInResult, Snapshot, SnapshotMeta } from "./definitions";
/**
 * Web / non-native fallback: every method resolves to a safe default (signed
 * out, empty). Gate feature usage behind `isSignedIn()`, which is `false` here.
 */
export declare class PlayGamesWeb extends WebPlugin implements PlayGamesPlugin {
    initialize(): Promise<void>;
    signIn(): Promise<SignInResult>;
    isSignedIn(): Promise<{
        signedIn: boolean;
    }>;
    getPlayer(): Promise<PlayerInfo>;
    requestServerSideAccess(): Promise<{
        authCode: string;
    }>;
    fetchIdentityVerificationSignature(): Promise<IdentityVerificationSignature>;
    unlockAchievement(): Promise<void>;
    incrementAchievement(): Promise<void>;
    showAchievements(): Promise<void>;
    submitScore(): Promise<void>;
    showLeaderboard(): Promise<void>;
    showAllLeaderboards(): Promise<void>;
    loadSnapshot(): Promise<{
        snapshot: Snapshot | null;
    }>;
    saveSnapshot(): Promise<void>;
    listSnapshots(): Promise<{
        snapshots: SnapshotMeta[];
    }>;
    deleteSnapshot(): Promise<void>;
}
//# sourceMappingURL=web.d.ts.map