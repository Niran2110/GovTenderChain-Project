import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';

const ViewBids = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [tender, setTender] = useState(null);

    useEffect(() => {
        const fetchTender = async () => {
            try {
                const { data } = await api.get(`/tenders/${id}`);
                setTender(data);
            } catch (error) {
                console.error("Could not fetch tender for bid evaluation", error);
                setTender(null);
            }
        };
        fetchTender();
    }, [id]);

    const handleAwardTender = async (winnerBidId) => {
        if (window.confirm(`Are you sure you want to award this tender? This will reject all other bids.`)) {
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };
            try {
                await api.put(`/tenders/${id}/award`, { winnerBidId }, config);
                alert('Tender has been successfully awarded.');
                navigate(`/tenders/${id}`);
            } catch (error) {
                console.error("Failed to award tender", error);
                alert("Error: Could not award the tender.");
            }
        }
    };

    if (!tender) {
        return <div className="page-container"><h2>Loading Bids...</h2></div>;
    }

    // This is the base URL of your backend. In production, you'd use your live Render URL.
    const backendBaseUrl = 'http://localhost:5000';

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
                            {tender.bids.map((bid) => (
                                <tr key={bid._id}>
                                    <td>{bid.contractorName}</td>
                                    <td>
                                        <a 
                                            href={`${backendBaseUrl}/${bid.bidDocument}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            View Document
                                        </a>
                                    </td>
                                    <td>
                                        <button 
                                            className="cta-button award-button"
                                            onClick={() => handleAwardTender(bid._id)}
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