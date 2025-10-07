import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const TenderList = () => {
   const [tenders, setTenders] = useState([]);

   useEffect(() => {
     const fetchTenders = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/tenders');
            setTenders(data);
        } catch (error) {
            console.error("Could not fetch tenders", error);
        }
     };
     fetchTenders();
   }, []);

   const getStatusClass = (status) => {
    if (status === 'Open') return 'status-open';
    if (status === 'In Progress') return 'status-progress';
    if (status === 'Completed') return 'status-completed';
    return '';
  };

  return (
    <div className="page-container">
      <h1>All Public Tenders</h1>
      <div className="tender-list">
        {tenders.map((tender) => (
          <Link to={`/tenders/${tender._id}`} key={tender._id} className="tender-card-link">
            <div className="tender-card">
              <div className="tender-card-header">
                <h3>{tender.title}</h3>
                <span className={`status-badge ${getStatusClass(tender.status)}`}>
                  {tender.status}
                </span>
              </div>
              <p><strong>Value:</strong> ₹{tender.totalValue.toLocaleString('en-IN')}</p>
              <div className="eligibility-info">
                <strong>Eligible Classes:</strong> {tender.eligibleClasses.join(', ')}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TenderList;