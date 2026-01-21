const fs = require("fs");
const path = require("path");
const redis = require("./client");

const lua = fs.readFileSync(
  path.join(__dirname, "tokenBucket.lua"),
  "utf8"
);

async function loadScript() {
  const sha = await redis.script("LOAD", lua);
  console.log("Lua script loaded ✅");
  return sha;
}

module.exports = loadScript;
