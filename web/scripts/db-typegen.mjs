import { spawnSync } from "node:child_process";
import { renameSync, writeFileSync } from "node:fs";

const result = spawnSync(
  "supabase",
  ["gen", "types", "--lang", "typescript", "--linked", "--schema", "public"],
  { encoding: "utf8" },
);
if (
  result.error ||
  result.status !== 0 ||
  !result.stdout.includes("export type Database")
) {
  process.stderr.write(
    result.stderr ||
      result.error?.message ||
      "Supabase did not return valid database types.\n",
  );
  process.exit(result.status || 1);
}
const destination = "src/lib/supabase/database.types.ts";
writeFileSync(destination + ".tmp", result.stdout);
renameSync(destination + ".tmp", destination);
