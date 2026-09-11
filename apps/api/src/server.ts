import { cleanupAvatars } from "./lib/avatars.js";
import { createApp } from "./app.js";
import { config } from "./config.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`Deoly API running on http://localhost:${config.port}`);
});

const runAvatarCleanup = () => void cleanupAvatars().catch(() => console.warn("Avatar cleanup could not run; will retry."));
runAvatarCleanup();
setInterval(runAvatarCleanup, 5 * 60 * 1000).unref();
