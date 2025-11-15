import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);
  console.log("Network chainId:", chainId);

  const Manager = await ethers.getContractFactory("RoadWatchManagerFHE");
  const manager = await Manager.deploy(deployer.address);
  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();
  console.log("RoadWatchManagerFHE:", managerAddress);

  const Badge = await ethers.getContractFactory("RoadWatchBadge");
  const badge = await Badge.deploy(deployer.address, "");
  await badge.waitForDeployment();
  const badgeAddress = await badge.getAddress();
  console.log("RoadWatchBadge:", badgeAddress);

  const tx = await badge.setManager(managerAddress);
  await tx.wait();
  const tx2 = await (await manager.setBadgeContract(badgeAddress)).wait();
  console.log("Badge manager set.");

  // Export ABI + addresses to frontend
  const outDir = path.resolve(__dirname, "..", "..", "frontend", "abi");
  fs.mkdirSync(outDir, { recursive: true });

  const managerArtifactPath = path.resolve(__dirname, "..", "artifacts", "contracts", "RoadWatchManagerFHE.sol", "RoadWatchManagerFHE.json");
  const badgeArtifactPath = path.resolve(__dirname, "..", "artifacts", "contracts", "RoadWatchBadge.sol", "RoadWatchBadge.json");

  const managerArtifact = JSON.parse(fs.readFileSync(managerArtifactPath, "utf-8"));
  const badgeArtifact = JSON.parse(fs.readFileSync(badgeArtifactPath, "utf-8"));

  const chainName =
    chainId === 31337 ? "Localhost" :
    chainId === 11155111 ? "Sepolia" :
    `Chain-${chainId}`;

  const addressesTs =
`export const RoadWatchAddresses = {
  "${chainId}": {
    chainId: ${chainId},
    chainName: "${chainName}",
    manager: "${managerAddress}",
    badge: "${badgeAddress}"
  }
} as const;
`;

  const managerAbiTs = `export const RoadWatchManagerABI = ${JSON.stringify({ abi: managerArtifact.abi }, null, 2)} as const;\n`;
  const badgeAbiTs = `export const RoadWatchBadgeABI = ${JSON.stringify({ abi: badgeArtifact.abi }, null, 2)} as const;\n`;

  fs.writeFileSync(path.join(outDir, "RoadWatchAddresses.ts"), addressesTs);
  fs.writeFileSync(path.join(outDir, "RoadWatchManagerABI.ts"), managerAbiTs);
  fs.writeFileSync(path.join(outDir, "RoadWatchBadgeABI.ts"), badgeAbiTs);

  console.log("ABI and addresses exported to action/frontend/abi");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


