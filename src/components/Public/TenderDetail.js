import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../api';
import { useAuth } from '../../hooks/useAuth';

const TenderDetail = () => {
    const { id } = useParams();
    const { user, token, isContractor, isAdmin } = useAuth();
    const [tender, setTender] = useState(null);
    const [isBidSubmitted, setIsBidSubmitted] = useState(false);
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();

    // Function to load data
    const fetchTender = async () => {
        try {
            const { data } = await api.get(`/tenders/${id}`);
            setTender(data);
        } catch (error) {
            console.error("Could not fetch tender details", error);
            setTender(null);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchTender();
    }, [id, isBidSubmitted]);

    // Handle Approval
    const handleApproveMilestone = async (milestoneId) => {
         if (window.confirm('Approve this milestone payment?')) {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                // 1. Call Backend
                await api.put(`/tenders/${id}/milestones/${milestoneId}/approve`, {}, config);
                alert('Milestone Approved!');
                
                // 2. CRITICAL: Re-fetch data immediately to update UI
                fetchTender(); 
            } catch (error) {
                alert('Approval failed. Check backend logs.');
            }
         }
    };

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
        } catch (error) {
            alert(`Bid submission failed: ${error.response?.data?.msg || 'Server error'}`);
        }
    };
    
    const handleDelete = async () => {
        if (window.confirm('Delete this tender?')) {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try { await api.delete(`/tenders/${id}`, config); alert('Tender deleted.'); navigate('/tenders'); }
            catch (error) { alert('Failed to delete tender.'); }
        }
    };

    if (!tender) return <div className="page-container"><h2>Loading...</h2></div>;

    const getMilestoneStatusClass = (status) => {
        if (status === 'Paid') return 'milestone-paid';
        if (status === 'Approved') return 'milestone-approved';
        return 'milestone-pending';
    };

    const awardedBid = tender.bids.find(b => b.status === 'Awarded');
    const isEligible = isContractor && user; // Simplified check
    const hasAlreadyBid = isContractor && tender.bids.some(b => b.contractorId === user.id);
    const canPlaceBid = isEligible && !hasAlreadyBid && tender.status === 'Open';
    const backendBaseUrl = 'http://localhost:5000';

    return (
        <div className="tender-detail-container page-container">
            {isAdmin && <button onClick={handleDelete} className="delete-corner-btn">🗑️ Delete Tender</button>}
            
            <div className="tender-card-header">
                <h2>{tender.title}</h2>
            </div>
            <div className="tender-meta">
                <p><strong>Value:</strong> ₹{tender.totalValue.toLocaleString('en-IN')}</p>
                <p><strong>Status:</strong> {tender.status}</p>
                {tender.deadline && <p><strong>Deadline:</strong> {new Date(tender.deadline).toLocaleString()}</p>}
            </div>
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

            {awardedBid && <div className="awarded-info"><h3>Awarded To</h3><p>{awardedBid.contractorName} (₹{awardedBid.bidAmount})</p></div>}

            <h3>Project Milestones</h3>
            <div className="milestones-list">
                {tender.milestones.map((milestone) => (
                    <div key={milestone._id} className="milestone-card">
                        <div className="milestone-info">
                            <h4>{milestone.name}</h4>
                            <p><strong>Payout:</strong> ₹{milestone.payoutAmount.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="milestone-status">
                            {/* 1. Show the status Badge */}
                            <span className={`status-badge ${getMilestoneStatusClass(milestone.status)}`}>{milestone.status}</span>
                            
                            {/* 2. Show Button ONLY if status is Pending (Logic is strict here) */}
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