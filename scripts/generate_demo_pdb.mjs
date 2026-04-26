import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = "/home/ubuntu/upload/XF1_DLL3_Mcb028_000_SC_0.84.pdb";
const targetPath = resolve("/home/ubuntu/ailux-agent-redesign-workspace/client/src/lib/demoPdb.ts");

const pdbContent = readFileSync(sourcePath, "utf8");
const output = `export const demoPdbName = ${JSON.stringify("XF1_DLL3_Mcb028_000_SC_0.84.pdb")} as const;\n\nexport const demoPdbContent = ${JSON.stringify(pdbContent)};\n`;

writeFileSync(targetPath, output, "utf8");
