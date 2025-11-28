const cron = require('node-cron');
const Tender = require('../models/Tender');
const User = require('../models/User');
const { ethers } = require('ethers');

// --- BLOCKCHAIN CONFIGURATION ---
// PASTE YOUR DEPLOYED ADDRESS HERE ⬇️
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
const LOCAL_RPC_URL = "http://127.0.0.1:8545"; // URL of your 'npx hardhat node'

// The Interface (ABI) for your contract
const CONTRACT_ABI = [
  "function recordWinner(string _tenderId, string _contractorName, uint256 _bidAmount) public"
];

async function writeToBlockchain(tenderId, contractorName, bidAmount) {
    try {
        const provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
        const signer = await provider.getSigner(); // Uses the first account as Admin
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        console.log(`🔗 Blockchain: Recording winner...`);
        const tx = await contract.recordWinner(tenderId, contractorName, bidAmount);
        await tx.wait();
        console.log(`✅ Blockchain: Record successful! Hash: ${tx.hash}`);
    } catch (error) {
        console.error("❌ Blockchain Error:", error.message);
    }
}

const startTenderScheduler = () => {
    cron.schedule('* * * * *', async () => {
        console.log('--- [Scheduler] Checking for expired tenders... ---');
        try {
            const now = new Date();
            const expiredTenders = await Tender.find({ status: 'Open', deadline: { $lt: now } });

            if (expiredTenders.length === 0) return;

            for (const tender of expiredTenders) {
                console.log(`Evaluating: ${tender.title}`);
                if (tender.bids.length === 0) continue;

                // 1. Technical Qualification
                let qualifiedBids = [];
                for (let bid of tender.bids) {
                    const contractor = await User.findById(bid.contractorId);
                    if (contractor && 
                        (contractor.turnover || 0) >= tender.minTurnover && 
                        (contractor.yearsExperience || 0) >= tender.minExperience) {
                        qualifiedBids.push(bid);
                    } else {
                        bid.status = 'Disqualified';
                    }
                }

                // 2. Financial Ranking (L1)
                const validBids = qualifiedBids.filter(bid => bid.bidAmount <= tender.totalValue);
                if (validBids.length === 0) {
                    await tender.save();
                    continue;
                }

                validBids.sort((a, b) => a.bidAmount - b.bidAmount);
                const winningBid = validBids[0];

                console.log(`Winner: ${winningBid.contractorName}`);

                // 3. Update Database
                tender.bids.forEach(bid => {
                    if (bid._id.equals(winningBid._id)) bid.status = 'Awarded';
                    else if (bid.status !== 'Disqualified') bid.status = 'Rejected';
                });
                tender.status = 'In Progress';
                await tender.save();

                // 4. WRITE TO BLOCKCHAIN
                await writeToBlockchain(
                    tender._id.toString(), 
                    winningBid.contractorName, 
                    winningBid.bidAmount
                );
            }
        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    });
};

module.exports = startTenderScheduler;