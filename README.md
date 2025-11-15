# RoadWatch — FHEVM 交通路况观察 DApp

前端直连区块链与 IPFS（示例中仅填写 CID），无后端。支持两种模式：
- 本地模式（Hardhat + @fhevm/hardhat-plugin + mock-utils）：前端使用 mock 与合约交互，进行加密/解密
- 测试网模式（Sepolia）：前端使用 relayer_sdk 与合约交互，进行加密/解密

## 目录结构

```
action/
  contracts/     # Hardhat 工程（FHEVM 插件）
  frontend/      # Next.js + Tailwind 前端
```

## 一、本地模式（推荐）

1) 启动本地节点（另开终端）
```
cd action/contracts
npm i
npx hardhat node
```

2) 部署合约并导出 ABI/地址到前端
```
cd action/contracts
npm run deploy:local
```
部署完成后，会在 `action/frontend/abi/` 下写入：
- `RoadWatchAddresses.ts`
- `RoadWatchManagerABI.ts`
- `RoadWatchBadgeABI.ts`

3) 启动前端
```
cd action/frontend
npm i
npm run dev
```
前端会自动在链 31337（localhost）下使用 mock 与合约进行 FHE 加解密。

## 二、测试网模式（Sepolia）

1) 配置环境变量（在 `action/contracts/.env`）
```
SEPOLIA_RPC_URL=...
SEPOLIA_PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
```

2) 部署合约
```
cd action/contracts
npm i
npm run deploy:sepolia
```
将部署后的地址填入 `action/frontend/abi/RoadWatchAddresses.ts` 中的 `11155111` 项（或直接扩展部署脚本写入）。

3) 启动前端（切到钱包的 Sepolia 网络）
```
cd action/frontend
npm i
npm run dev
```
前端将检测当前链为 Sepolia，自动走 relayer_sdk。

## 三、合约说明（FHE 特性）
- `RoadWatchManagerFHE.sol`：记录路况存证，同时用 FHE 存储 `severity`（0~100）。
- `submitRecord(...)` 需传入 FHE 加密输入（前端用 FHEVM 实例 `createEncryptedInput` 生成 `enc.handles[0]` 与 `enc.inputProof`）。
- `getSeverity(recordId)` 返回加密句柄，前端使用 `userDecrypt(...)` 结合 EIP-712 授权签名解密。
- `updateSeverity(...)` 示例如何对已存密文做加减运算（同态计算）。
- 防刷：`minIntervalSec` + `lastSubmitAt`，仅可调参，不可删改记录。
- NFT：`RoadWatchBadge.sol`（可选），仅 `Manager` 可铸造。

## 四、前端说明
- UI：Next.js + Tailwind，科技风（品牌色：蓝/霓虹），首页同时包含“最新路况”和“上报表单”。
- FHE 集成：
  - 本地链（31337）→ 使用 mock 与 Hardhat FHEVM 节点交互。
  - 测试网（例如 Sepolia）→ 使用 relayer_sdk（浏览器动态加载）。
  - 已实现密钥对生成、EIP-712 签名缓存与 IndexedDB 公钥参数缓存。
- 产物：
  - Dashboard（最新路况）
  - SubmitForm（表单上报，含 FHE 加密的严重程度）
  - RecordList（列表展示 + handle 解密按钮）

## 五、注意事项
- 本地模式需要 Hardhat 节点支持 `@fhevm/hardhat-plugin@^0.1.0`，保持与模板一致。
- 若 Hardhat 节点报 `KMSVerifierAddress` 未定义，需检查 FHEVM 预编译地址的 JSON（参考模板说明），重启节点与部署。
- 生产环境建议将图片直传 IPFS，并替换前端中的 CID 输入为实际上传流程（Web3.storage、Pinata）。


