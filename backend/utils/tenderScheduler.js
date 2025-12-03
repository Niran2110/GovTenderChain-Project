const cron = require('node-cron');
const Tender = require('../models/Tender');
const User = require('../models/User');
const { ethers } = require('ethers');

// --- BLOCKCHAIN CONFIG (Keep your specific address) ---
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
const LOCAL_RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_ABI = [ "function recordWinner(string _tenderId, string _contractorName, uint256 _bidAmount) public" ];

async function writeToBlockchain(tenderId, contractorName, bidAmount) {
    try {
        const provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
        const signer = await provider.getSigner(); 
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const tx = await contract.recordWinner(tenderId, contractorName, bidAmount);
        await tx.wait();
        console.log(`✅ Blockchain: Record successful! Hash: ${tx.hash}`);
    } catch (error) {
        console.error("❌ Blockchain Error:", error.message);
    }
}

const startTenderScheduler = () => {
    cron.schedule('* * * * *', async () => {
        console.log(`\n--- ⏰ Scheduler Run: ${new Date().toLocaleTimeString()} ---`);
        
        try {
            const now = new Date();
            // Only check OPEN tenders
            const expiredTenders = await Tender.find({ status: 'Open', deadline: { $lt: now } });

            if (expiredTenders.length === 0) return;

            console.log(`Found ${expiredTenders.length} tenders to process.`);

            for (const tender of expiredTenders) {
                console.log(`Processing: ${tender.title}`);

                // Scenario 1: Zero Bids
                if (tender.bids.length === 0) {
                    console.log('❌ No bids received. Setting to ReviewPending.');
                    tender.status = 'ReviewPending'; 
                    await tender.save();
                    continue;
                }

                // Phase 1: Technical Eval
                let qualifiedBids = [];
                for (let bid of tender.bids) {
                    const contractor = await User.findById(bid.contractorId);
                    if (!contractor) { bid.status = 'Rejected'; continue; }

                    if ((contractor.turnover || 0) >= tender.minTurnover && 
                        (contractor.yearsExperience || 0) >= tender.minExperience) {
                        qualifiedBids.push(bid);
                    } else {
                        bid.status = 'Disqualified';
                    }
                }

                // Phase 2: Financial Eval
                const validFinancialBids = qualifiedBids.filter(bid => bid.bidAmount <= tender.totalValue);

                // Scenario 2: No Qualified Bidders
                if (validFinancialBids.length === 0) {
                    console.log('⚠️ No qualified bidders found. Setting to ReviewPending.');
                    tender.status = 'ReviewPending';
                    await tender.save();
                    continue;
                }

                // Scenario 3: Winner Found
                validFinancialBids.sort((a, b) => a.bidAmount - b.bidAmount);
                const winningBid = validFinancialBids[0];

                console.log(`🏆 WINNER: ${winningBid.contractorName}`);

                tender.bids.forEach(bid => {
                    if (bid._id.equals(winningBid._id)) bid.status = 'Awarded';
                    else if (bid.status !== 'Disqualified') bid.status = 'Rejected';
                });

                tender.status = 'In Progress';
                await tender.save();

                // Write to Blockchain
                await writeToBlockchain(tender._id.toString(), winningBid.contractorName, winningBid.bidAmount);
            }
        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    });
};

module.exports = startTenderScheduler;