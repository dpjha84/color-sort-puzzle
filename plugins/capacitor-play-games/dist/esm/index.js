import { registerPlugin } from "@capacitor/core";
const PlayGames = registerPlugin("PlayGames", {
    web: () => import("./web.js").then((m) => new m.PlayGamesWeb()),
});
export * from "./definitions.js";
export { PlayGames };
//# sourceMappingURL=index.js.map