import React from 'react';
// Import useNavigate instead of useHistory
import { useParams, useNavigate } from 'react-router-dom';
import { mockTenders } from '../../data/mockData';

const ViewBids = () => {
    const { id } = useParams();
    // Initialize useNavigate
    const navigate = useNavigate();
    const tender = mockTenders.find(t => t.id === id);

    const handleAwardTender = (contractorName) => {
        if (window.confirm(`Are you sure you want to award this tender to ${contractorName}? This action cannot be undone.`)) {
            
            const winningBid = tender.bids.find(b => b.contractorName === contractorName);
            if (winningBid) {
                winningBid.awarded = true;
            }

            tender.status = "In Progress";

            alert(`Tender has been successfully awarded to ${contractorName}.`);
            
            // Use the navigate function to redirect
            navigate(`/tenders/${id}`);
        }
    };

    if (!tender) return <div className="page-container"><h2>Tender not found</h2></div>;

    return (
        <div className="page-container">
            <h1>Bid Evaluation for Tender: "{tender.title}"</h1>
            <p>Review the submitted bids and select a winner to award the project.</p>

            <div className="bid-list-container">
                {tender.bids.length > 0 ? (
                    <table className="bids-table">
                        <thead>
                            <tr>
                                <th>Contractor Name</th>
                                <th>Bid Document</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tender.bids.map((bid, index) => (
                                <tr key={index}>
                                    <td>{bid.contractorName}</td>
                                    <td>
                                        <a href="#" onClick={(e) => { e.preventDefault(); alert(`Downloading ${bid.bidDocument}...`) }}>
                                            {bid.bidDocument}
                                        </a>
                                    </td>
                                    <td>
                                        <button 
                                            className="cta-button award-button"
                                            onClick={() => handleAwardTender(bid.contractorName)}
                                        >
                                            Award Tender
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No bids have been submitted for this tender yet.</p>
                )}
            </div>
        </div>
    );
};

export default ViewBids;