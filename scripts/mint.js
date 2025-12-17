const hre = require("hardhat");

async function main() {
  // ใส่ Address ของ MyToken ที่คุณ Deploy ไปแล้ว
  const TOKEN_ADDRESS = "0x191d9F164F88412ddFCf65562a84e4771f050BE9"; 
  
  // ใส่ Address กระเป๋าของคุณที่ต้องการรับเหรียญ
  const MY_WALLET = "0x445cCB48c2083dF6C2f58A46b2aC991E822654D5"; 

  const token = await hre.ethers.getContractAt("MyToken", TOKEN_ADDRESS);

  console.log("Minting 1000 MTK to:", MY_WALLET);
  
  // สั่ง Mint เหรียญจำนวน 1,000 เหรียญ
  const tx = await token.mint(MY_WALLET, hre.ethers.parseUnits("1000", 18));
  await tx.wait();

  console.log("Minting Successful!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});