import { hostingErrors } from "./hosting-config";

const errors = hostingErrors(process.env);
if (errors.length) {
  console.error("Hosting configuration rejected (values are never printed):");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    "Hosting configuration: PASS; Tutor disabled. Connectivity and account permissions are not tested.",
  );
}
