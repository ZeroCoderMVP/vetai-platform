// Quick DB check - writes output to check_db_result.txt
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const out = [];
try {
  const db = new Database(path.resolve(__dirname, "dev.db"));
  const feed = db.prepare("SELECT COUNT(*) as cnt FROM FeedRecord").get();
  const mix = db.prepare("SELECT COUNT(*) as cnt FROM MixBatch").get();
  const ing = db.prepare("SELECT COUNT(*) as cnt FROM IngredientConsumption").get();
  out.push(`FeedRecord: ${feed.cnt}`);
  out.push(`MixBatch: ${mix.cnt}`);
  out.push(`IngredientConsumption: ${ing.cnt}`);
  
  // Check some sample data
  const sampleFeed = db.prepare("SELECT groupName, date, planned, actual FROM FeedRecord LIMIT 3").all();
  out.push(`\nSample FeedRecords: ${JSON.stringify(sampleFeed, null, 2)}`);
  
  const sampleMix = db.prepare("SELECT recipeName, date, mixer FROM MixBatch LIMIT 3").all();
  out.push(`\nSample MixBatches: ${JSON.stringify(sampleMix, null, 2)}`);
  
  db.close();
} catch(e) {
  out.push(`ERROR: ${e.message}`);
}

fs.writeFileSync(path.resolve(__dirname, "check_db_result.txt"), out.join("\n"), "utf8");
