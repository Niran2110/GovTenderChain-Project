import React from 'react';
import { Link } from 'react-router-dom';
import { mockTenders } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';

const ContractorDashboard = () => {
    const { user } = useAuth();
    
    const myProjects = mockTenders.filter(tender => 
        tender.bids.some(bid => bid.contractorName === user.name && bid.awarded)
    );

    return (
        <div className="dashboard-container page-container">
            <h1>Contractor Dashboard</h1>
            <p>Welcome, <strong>{user.name}</strong>. You are registered as a <strong>{user.class} Contractor</strong>.</p>
            <Link to="/tenders" className="cta-button">Browse Open Tenders</Link>

            <h2 className="dashboard-section-title">Your Active Projects</h2>
            {myProjects.length > 0 ? (
                <div className="tender-list">
                    {myProjects.map((tender) => (
                    <Link to={`/tenders/${tender.id}`} key={tender.id} className="tender-card-link">
                        <div className="tender-card">
                        <h3>{tender.title}</h3>
                        <p><strong>Status:</strong> {tender.status}</p>
                        <p><strong>Value:</strong> ₹{tender.totalValue.toLocaleString('en-IN')}</p>
                        </div>
                    </Link>
                    ))}
                </div>
            ) : (
                <p>You have no active projects. Browse open tenders to place a bid.</p>
            )}
        </div>
    );
};

export default ContractorDashboard;