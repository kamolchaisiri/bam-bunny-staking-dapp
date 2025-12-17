const hre = require("hardhat");

async function main() {
  // 1. เตรียมบัญชีคน Deploy (ตัวเราเอง)
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 2. สร้างเหรียญ (MyToken)
  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();
  await myToken.waitForDeployment(); // รอให้สร้างเสร็จ
  const myTokenAddress = await myToken.getAddress();
  console.log("MyToken deployed to:", myTokenAddress);

  // 3. สร้างระบบ Staking
  // ใส่ address เหรียญ PTK เข้าไปเป็นทั้ง "เหรียญที่รับฝาก" และ "เหรียญรางวัล"
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(myTokenAddress, myTokenAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("Staking deployed to:", stakingAddress);

  // 4. ขั้นตอนสำคัญ: เติมเงินเข้าตู้ Staking (Fund the contract)
  // โอนเหรียญ 500,000 PTK จากกระเป๋าเรา เข้าไปใน Staking Contract เพื่อเอาไว้จ่ายเป็นดอกเบี้ย
  const rewardAmount = hre.ethers.parseUnits("500000", 18); // 5แสนเหรียญ
  const tx = await myToken.transfer(stakingAddress, rewardAmount);
  await tx.wait(); // รอให้โอนเสร็จ

  console.log("Transferred 500,000 PTK to Staking Contract (Ready to pay rewards)");
  console.log("--- Deployment Completed Successfully ---");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});