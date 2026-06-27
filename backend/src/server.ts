import { env } from "./config.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`AtechSkills API listening on http://localhost:${env.PORT}${env.API_PREFIX}`);
});
