import { useState, useEffect } from "react";
import { ethers } from "ethers";

// ⚠️ Deployed addresses from your project
const TOKEN_ADDRESS = "0x191d9F164F88412ddFCf65562a84e4771f050BE9"; 
const STAKING_ADDRESS = "0x445cCB48c2083dF6C2f58A46b2aC991E822654D5";

import StakingABI from "./abis/Staking.json";
import TokenABI from "./abis/MyToken.json";

function App() {
  const [account, setAccount] = useState("");
  const [stakingContract, setStakingContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakedBalance, setStakedBalance] = useState("0");
  const [rewardBalance, setRewardBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const addHistory = (type, amount) => {
    const newEntry = {
      id: Date.now(),
      type: type,
      amount: amount,
      time: new Date().toLocaleTimeString(),
      status: "Confirmed 🟢" 
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 5));
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const _provider = new ethers.BrowserProvider(window.ethereum);
        const _signer = await _provider.getSigner();
        const _account = await _signer.getAddress();
        setAccount(_account);
        const _staking = new ethers.Contract(STAKING_ADDRESS, StakingABI.abi, _signer);
        const _token = new ethers.Contract(TOKEN_ADDRESS, TokenABI.abi, _signer);
        setStakingContract(_staking);
        setTokenContract(_token);
      } catch (err) { console.error(err); }
    } else { alert("Please install MetaMask!"); }
  };

  const updateBalances = async () => {
    if (stakingContract && account) {
      try {
        const staked = await stakingContract.stakedAmounts(account);
        const reward = await stakingContract.earned(account);
        setStakedBalance(ethers.formatUnits(staked, 18));
        setRewardBalance(ethers.formatUnits(reward, 18));
      } catch (err) { console.error("Update failed:", err); }
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || !tokenContract) return;
    try {
      setIsLoading(true);
      const amount = ethers.parseUnits(stakeAmount, 18);
      const approveTx = await tokenContract.approve(STAKING_ADDRESS, amount);
      await approveTx.wait();
      const tx = await stakingContract.stake(amount);
      await tx.wait();
      addHistory("Stake", `${stakeAmount} MTK`);
      setStakeAmount("");
      updateBalances();
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const handleClaim = async () => {
    if (!stakingContract) return;
    try {
      setIsLoading(true);
      const tx = await stakingContract.getReward();
      await tx.wait();
      addHistory("Claim", `${parseFloat(rewardBalance).toFixed(4)} MTK`);
      updateBalances();
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    updateBalances();
    const interval = setInterval(updateBalances, 5000);
    return () => clearInterval(interval);
  }, [stakingContract, account]);

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        {/* Navigation */}
        <nav style={styles.nav}>
          <div style={styles.logoGroup}>
            <span style={styles.brandName}>🐰 BAM & BUNNY VAULT</span>
          </div>
          {account ? (
            <div style={styles.walletBadge}>
              <span style={styles.statusDot}></span>
              {account.substring(0, 6)}...{account.substring(38)}
            </div>
          ) : (
            <button onClick={connectWallet} style={styles.connectBtnSmall}>Connect Wallet</button>
          )}
        </nav>

        {!account ? (
          <div style={styles.welcomeHero}>
            <h1 style={styles.heroTitle}>Grow Your Assets</h1>
            <button onClick={connectWallet} style={styles.connectBtnLarge}>Connect MetaMask</button>
          </div>
        ) : (
          <div style={styles.dashboard}>
            {/* Stats Row */}
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <p style={styles.label}>Staked Balance</p>
                <h2 style={styles.value}>{parseFloat(stakedBalance).toLocaleString()} <span style={styles.unit}>MTK</span></h2>
              </div>
              <div style={styles.statCard}>
                <p style={styles.label}>Pending Rewards</p>
                <h2 style={{...styles.value, color: '#FFD700'}}>{parseFloat(rewardBalance).toFixed(6)} <span style={styles.unit}>MTK</span></h2>
              </div>
            </div>

            {/* Actions Card */}
            <div style={styles.actionSection}>
              <div style={styles.inputWrapper}>
                <input 
                  type="number" 
                  style={styles.mainInput}
                  placeholder="0.00" 
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
                <button onClick={handleStake} style={styles.primaryBtn} disabled={isLoading}>
                  {isLoading ? "Wait..." : "STAKE"}
                </button>
              </div>
              <button onClick={handleClaim} style={styles.claimBtn} disabled={isLoading}>Claim Reward</button>
            </div>

            {/* History Table */}
            <div style={styles.historySection}>
              <h3 style={styles.sectionTitle}>Recent Activity</h3>
              {history.length === 0 ? (
                <p style={{color: '#848E9C'}}>No recent transactions found.</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Action</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Time</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <tr key={item.id} style={styles.tableRow}>
                        <td style={styles.td}>{item.type}</td>
                        <td style={styles.td}>{item.amount}</td>
                        <td style={styles.td}>{item.time}</td>
                        <td style={{...styles.td, color: '#0ECB81'}}>{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  body: { minHeight: '100vh', backgroundColor: '#0B0E11', color: '#EAECEF', fontFamily: 'Arial, sans-serif' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' },
  logoGroup: { display: 'flex', alignItems: 'center' },
  brandName: { fontSize: '1.2rem', fontWeight: 'bold' },
  walletBadge: { background: '#1E2329', padding: '8px 16px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '10px' },
  statusDot: { width: '8px', height: '8px', background: '#0ECB81', borderRadius: '50%' },
  connectBtnSmall: { padding: '8px 16px', background: '#FCD535', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  welcomeHero: { textAlign: 'center', marginTop: '100px' },
  heroTitle: { fontSize: '3rem', marginBottom: '30px' },
  connectBtnLarge: { padding: '15px 40px', fontSize: '1.1rem', background: '#FCD535', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  dashboard: { display: 'flex', flexDirection: 'column', gap: '20px' },
  statsRow: { display: 'flex', gap: '20px' },
  statCard: { flex: 1, background: '#1E2329', padding: '25px', borderRadius: '16px', border: '1px solid #2B3139' },
  label: { color: '#848E9C', marginBottom: '10px', fontSize: '0.9rem' },
  value: { fontSize: '2rem', margin: 0 },
  unit: { fontSize: '1rem', color: '#848E9C' },
  actionSection: { background: '#1E2329', padding: '30px', borderRadius: '16px', textAlign: 'center' },
  inputWrapper: { display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' },
  mainInput: { background: '#0B0E11', border: '1px solid #474D57', padding: '12px', borderRadius: '8px', color: '#fff', width: '200px' },
  primaryBtn: { background: '#FCD535', color: '#000', border: 'none', padding: '0 30px', borderRadius: '8px', fontWeight: 'bold' },
  claimBtn: { width: '250px', padding: '10px', background: 'transparent', border: '1px solid #474D57', color: '#fff', borderRadius: '8px' },
  historySection: { background: '#1E2329', padding: '30px', borderRadius: '16px', border: '1px solid #2B3139' },
  sectionTitle: { marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { textAlign: 'left', borderBottom: '1px solid #2B3139', color: '#848E9C' },
  th: { padding: '12px 10px' },
  tableRow: { borderBottom: '1px solid #2B3139' },
  td: { padding: '15px 10px', fontSize: '0.9rem' }
};

export default App;