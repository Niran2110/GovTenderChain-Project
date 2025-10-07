import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const TenderDetail = () => {
    const { id } = useParams();
    const { user, token, isContractor, isAdmin } = useAuth();
    const [tender, setTender] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTender = async () => {
            try {
                const { data } = await axios.get(`http://localhost:5000/api/tenders/${id}`);
                setTender(data);
            } catch (error) {
                console.error("Could not fetch tender details", error);
                setTender(null);
            }
        };
        fetchTender();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to permanently delete this tender?')) {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                await axios.delete(`http://localhost:5000/api/tenders/${id}`, config);
                alert('Tender deleted successfully.');
                navigate('/tenders');
            } catch (error) {
                console.error('Error deleting tender:', error);
                alert('Failed to delete tender.');
            }
        }
    };

    const { register, handleSubmit, formState: { errors } } = useForm();

    const handleBidSubmit = (data) => {
        alert('This function would now submit your bid to the backend.');
    };
    
    const handleApproveMilestone = (milestoneId) => {
         alert('This function would now send an approval request to the backend.');
    };

    if (!tender) {
        return <div className="page-container"><h2>Loading Tender Details...</h2></div>;
    }

    const checkEligibility = (contractorClass, tenderClasses) => {
        if (!contractorClass || !tenderClasses.length) return false;
        if (contractorClass === 'Class 1') return true;
        if (contractorClass === 'Class 2') return tenderClasses.includes('Class 2') || tenderClasses.includes('Class 3');
        if (contractorClass === 'Class 3') return tenderClasses.includes('Class 3');
        return false;
    };

    const getMilestoneStatusClass = (status) => {
        if (status === 'Paid') return 'milestone-paid';
        if (status === 'Approved') return 'milestone-approved';
        return 'milestone-pending';
    };

    const awardedBid = tender.bids.find(b => b.awarded);
    const isEligible = isContractor && checkEligibility(user?.class, tender.eligibleClasses);
    const hasAlreadyBid = isContractor && tender.bids.some(b => b.contractorName === user.name);
    const canPlaceBid = isEligible && !hasAlreadyBid && tender.status === 'Open';

    return (
        <div className="tender-detail-container page-container">
            {isAdmin && (
                <button onClick={handleDelete} className="delete-corner-btn">
                    🗑️ Delete Tender
                </button>
            )}

            <div className="tender-card-header">
                <h2>{tender.title}</h2>
                <div className="eligibility-info detail-eligibility">
                    <strong>Eligible Classes:</strong> {tender.eligibleClasses.join(', ')}
                </div>
            </div>
            <div className="tender-meta">
                <p><strong>Value:</strong> ₹{tender.totalValue.toLocaleString('en-IN')}</p>
                <p><strong>Status:</strong> {tender.status}</p>
            </div>
            <p className="tender-description">{tender.description}</p>
            
            {isAdmin && tender.status === 'Open' && tender.bids.length > 0 && (
                <div className="admin-actions">
                    <Link to={`/tenders/${tender._id}/bids`} className="cta-button">
                        View & Evaluate Bids ({tender.bids.length})
                    </Link>
                </div>
            )}

            {isContractor && tender.status === 'Open' && (
                <div className="bid-section">
                    <h3>Place Your Bid</h3>
                    {user && !isEligible && <p className="notice error-notice">Your contractor class ({user.class}) is not eligible for this tender.</p>}
                    {hasAlreadyBid && <p className="notice success-notice">Your bid for this tender has been submitted.</p>}
                    {canPlaceBid && (
                        <form onSubmit={handleSubmit(handleBidSubmit)} className="bid-form">
                            <p>As a <strong>{user.class} Contractor</strong>, you are eligible to bid.</p>
                            <div className="form-group">
                                <label>Upload Bid Document (PDF only)</label>
                                <input type="file" accept=".pdf" {...register("bidDocument", { required: "A PDF bid document is required."})} />
                                {errors.bidDocument && <p className="error">{errors.bidDocument.message}</p>}
                            </div>
                            <button type="submit" className="cta-button">Submit Bid Document</button>
                        </form>
                    )}
                </div>
            )}

            {awardedBid && (
                <div className="awarded-info">
                    <h3>Project Awarded To</h3>
                    <p><strong>Contractor:</strong> {awardedBid.contractorName}</p>
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
                            {isAdmin && milestone.status === 'Pending' && tender.status !== 'Completed' && (
                                <button
                                className="approve-button"
                                onClick={() => handleApproveMilestone(milestone._id)}
                                >
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