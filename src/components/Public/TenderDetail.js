import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../api';
import { useAuth } from '../../hooks/useAuth';
// Import ethers to talk to the blockchain
import { ethers } from 'ethers';

const TenderDetail = () => {
    // --- 🔴 PASTE YOUR CONTRACT ADDRESS HERE 🔴 ---
    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
    
    const { id } = useParams();
    const { user, token, isContractor, isAdmin } = useAuth();
    const [tender, setTender] = useState(null);
    const [isBidSubmitted, setIsBidSubmitted] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false); // State for the loading spinner
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();

    const fetchTender = async () => {
        try {
            const { data } = await api.get(`/tenders/${id}`);
            setTender(data);
        } catch (error) {
            setTender(null);
        }
    };

    useEffect(() => {
        fetchTender();
    }, [id, isBidSubmitted]);

    // --- NEW: BLOCKCHAIN VERIFICATION FUNCTION ---
    const verifyIntegrity = async () => {
        setIsVerifying(true);
        try {
            // 1. Connect to Local Blockchain (Hardhat)
            // Note: In a real app, this would connect to Metamask or a public RPC
            const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
            
            // 2. Define the Interface (ABI) to read the 'awards' array
            const abi = [ 
                "function awards(uint256) public view returns (string, string, uint256, uint256)",
                "function getAwardCount() public view returns (uint256)"
            ];
            
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

            // 3. Find the record for THIS tender
            let blockchainRecord = null;
            const count = await contract.getAwardCount();
            
            // Loop through all awards on blockchain to find the matching Tender ID
            for (let i = 0; i < count; i++) {
                const record = await contract.awards(i);
                // record[0] is tenderId
                if (record[0] === id) {
                    blockchainRecord = {
                        contractorName: record[1],
                        amount: record[2].toString() // Convert BigInt to string
                    };
                    break; 
                }
            }

            // 4. Compare with Database Data
            const dbWinner = tender.bids.find(b => b.status === 'Awarded');

            if (!blockchainRecord) {
                alert("⚠️ NOT FOUND: This tender has not been awarded on the Blockchain yet.");
            } else if (!dbWinner) {
                alert("⚠️ MISMATCH: Blockchain has a winner, but the Database does not! (Possible Deletion)");
            } else {
                // Check if names match
                if (blockchainRecord.contractorName === dbWinner.contractorName) {
                    alert(`✅ INTEGRITY VERIFIED!\n\nBlockchain Record:\n- Winner: ${blockchainRecord.contractorName}\n- Amount: ₹${blockchainRecord.amount}\n\nDatabase Record:\n- Winner: ${dbWinner.contractorName}\n- Amount: ₹${dbWinner.bidAmount}\n\nDATA IS AUTHENTIC AND UNTOUCHED.`);
                } else {
                    alert(`❌ CRITICAL SECURITY WARNING ❌\n\nData Tampering Detected!\n\nBlockchain Says: ${blockchainRecord.contractorName}\nDatabase Says: ${dbWinner.contractorName}\n\nThe database has been altered manually!`);
                }
            }

        } catch (error) {
            console.error(error);
            alert("Connection Error: Is your local Blockchain (Hardhat) running?");
        }
        setIsVerifying(false);
    };
    // --- END VERIFICATION FUNCTION ---

    const handleBidSubmit = async (data) => {
        const bidFile = data.bidDocument[0];
        if (!bidFile) return;
        const formData = new FormData();
        formData.append('bidDocument', bidFile);
        formData.append('bidAmount', data.bidAmount);
        const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } };
        try {
            await api.post(`/tenders/${id}/bids`, formData, config);
            alert('Bid submitted successfully!');
            setIsBidSubmitted(true);
        } catch (error) { alert(`Bid submission failed: ${error.response?.data?.msg || 'Server error'}`); }
    };
    
    const handleDelete = async () => {
        if (window.confirm('Delete this tender?')) {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try { await api.delete(`/tenders/${id}`, config); alert('Tender deleted.'); navigate('/tenders'); }
            catch (error) { alert('Failed to delete tender.'); }
        }
    };

    const handleApproveMilestone = async (milestoneId) => {
         if (window.confirm('Approve this milestone payment?')) {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try { await api.put(`/tenders/${id}/milestones/${milestoneId}/approve`, {}, config); alert('Milestone Approved!'); fetchTender(); }
            catch (error) { alert('Approval failed.'); }
         }
    };

    // --- NEW EXTEND DEADLINE FUNCTION ---
    const [newDeadline, setNewDeadline] = useState('');
    const handleExtendDeadline = async () => {
        if (!newDeadline) return alert("Please select a new date.");
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await api.put(`/tenders/${id}/extend`, { newDeadline }, config);
            alert("Deadline Extended! Tender is Open again.");
            fetchTender();
        } catch (error) { alert("Failed to extend deadline."); }
    };

    if (!tender) return <div className="page-container"><h2>Loading...</h2></div>;

    const getTenderStatusClass = (status) => {
        if (status === 'Open') return 'status-open';
        if (status === 'In Progress') return 'status-progress';
        if (status === 'Completed') return 'status-completed';
        if (status === 'ReviewPending') return 'status-review-pending';
        return '';
    };

    const getMilestoneStatusClass = (status) => {
        if (status === 'Paid') return 'milestone-paid';
        if (status === 'Approved') return 'milestone-approved';
        return 'milestone-pending';
    };

    const awardedBid = tender.bids.find(b => b.status === 'Awarded');
    const isEligible = isContractor && user; 
    const hasAlreadyBid = isContractor && tender.bids.some(b => b.contractorId === user.id);
    const canPlaceBid = isEligible && !hasAlreadyBid && tender.status === 'Open';
    const backendBaseUrl = 'http://localhost:5000';

    return (
        <div className="tender-detail-container page-container">
            {isAdmin && <button onClick={handleDelete} className="delete-corner-btn">🗑️ Delete</button>}
            
            <div className="tender-card-header">
                <h2>{tender.title}</h2>
                <div className="eligibility-info detail-eligibility">
                    <strong>Eligible:</strong> {tender.eligibleClasses.join(', ')}
                </div>
            </div>
            
            <div className="tender-meta">
                <p><strong>Value:</strong> ₹{tender.totalValue.toLocaleString('en-IN')}</p>
                <p>
                    <strong>Status: </strong> 
                    <span className={`status-badge ${getTenderStatusClass(tender.status)}`}>
                        {tender.status === 'ReviewPending' ? 'Action Required' : tender.status}
                    </span>
                </p>
                {tender.deadline && <p><strong>Deadline:</strong> {new Date(tender.deadline).toLocaleString()}</p>}
            </div>

            {/* --- NEW VERIFICATION BUTTON --- */}
            {/* Show this button for everyone (Public, Admin, Contractor) if the tender is awarded */}
            {tender.status === 'In Progress' && (
                <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f0f3f4', borderLeft: '5px solid #2c3e50', borderRadius: '4px' }}>
                    <h4 style={{marginTop: 0}}>🛡️ Blockchain Audit</h4>
                    <p style={{fontSize: '0.9rem', marginBottom: '10px'}}>Verify that the winner of this tender matches the immutable record on the Ethereum Blockchain.</p>
                    <button 
                        onClick={verifyIntegrity} 
                        className="cta-button" 
                        style={{ backgroundColor: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}
                        disabled={isVerifying}
                    >
                        {isVerifying ? 'Checking Ledger...' : 'Verify Authenticity'}
                    </button>
                </div>
            )}

            {isAdmin && tender.status === 'ReviewPending' && (
                <div className="review-pending-box">
                    <h3>⚠️ Evaluation Result: Unsuccessful</h3>
                    <p>No qualified bids received. Extend deadline to re-open?</p>
                    <div className="extension-controls">
                        <input type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
                        <button onClick={handleExtendDeadline} className="cta-button">Extend</button>
                    </div>
                </div>
            )}

            <p className="tender-description">{tender.description}</p>

            {tender.tenderDocument && (
                <div className="tender-doc-download">
                    <h3>Official Documentation</h3>
                    <a href={`${backendBaseUrl}/${tender.tenderDocument}`} target="_blank" rel="noopener noreferrer" className="doc-link">📄 Download PDF</a>
                </div>
            )}
            
            {isAdmin && tender.status === 'Open' && tender.bids.length > 0 && (
                <div className="admin-actions">
                    <Link to={`/tenders/${tender._id}/bids`} className="cta-button">View Bids ({tender.bids.length})</Link>
                </div>
            )}

            {isContractor && tender.status === 'Open' && (
                <div className="bid-section">
                    <h3>Place Your Bid</h3>
                    {hasAlreadyBid && <p className="notice success-notice">Bid Submitted.</p>}
                    {canPlaceBid && (
                        <form onSubmit={handleSubmit(handleBidSubmit)} className="bid-form">
                            <div className="form-group"><label>Amount (₹)</label><input type="number" {...register("bidAmount", { required: true })} /></div>
                            <div className="form-group"><label>Upload PDF</label><input type="file" accept=".pdf" {...register("bidDocument", { required: true })} /></div>
                            <button type="submit" className="cta-button">Submit Bid</button>
                        </form>
                    )}
                </div>
            )}

            {awardedBid && (
                <div className="awarded-info">
                    <h3>Project Awarded To</h3>
                    <p><strong>Contractor:</strong> {awardedBid.contractorName} (₹{awardedBid.bidAmount})</p>
                </div>
            )}

            <h3>Project Milestones & Fund Status</h3>
            <div className="milestones-list">
                {tender.milestones.map((milestone) => (
                    <div key={milestone._id || milestone.name} className="milestone-card">
                        <div className="milestone-info">
                            <h4>{milestone.name}</h4>
                            <p><strong>Payout:</strong> ₹{milestone.payoutAmount.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="milestone-status">
                            <span className={`status-badge ${getMilestoneStatusClass(milestone.status)}`}>{milestone.status}</span>
                            {isAdmin && milestone.status === 'Pending' && tender.status === 'In Progress' && (
                                <button className="approve-button" onClick={() => handleApproveMilestone(milestone._id)}>
                                    Approve
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TenderDetail;