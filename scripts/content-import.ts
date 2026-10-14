import { importContentPack } from "./content-pack";

const args = process.argv.slice(2);
if (args.length !== 1 || args[0].startsWith("-")) {
  console.error(
    "Usage: npm run content:import -- content-packs/inbox/<pack-id>",
  );
  process.exitCode = 1;
} else {
  importContentPack(args[0])
    .then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((error: unknown) => {
      console.error(
        `Content import rejected: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      process.exitCode = 1;
    });
}
