import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const CreateTender = () => {
    const { register, handleSubmit, control, formState: { errors } } = useForm({
        defaultValues: {
            milestones: [{ name: '', payoutAmount: '' }]
        }
    });
    const { fields, append, remove } = useFieldArray({ control, name: 'milestones' });
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        console.log("--- Checking Auth State Before API Call ---");
        console.log("User Object:", user);
        console.log("Auth Token:", token);

        if (!token || user?.role !== 'admin') {
            alert("Authentication Error: No valid admin token found. Please try logging out and logging back in.");
            return;
        }

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        };

        try {
            await axios.post('http://localhost:5000/api/tenders', data, config);
            alert('Tender created successfully!');
            navigate('/admin');
        } catch (error) {
            console.error('Error creating tender:', error.response ? error.response.data : error.message);
            alert('Failed to create tender. Your token might be invalid or expired.');
        }
    };

    return (
        <div className="page-container">
            <h1>Create a New Tender</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="create-tender-form">
                <fieldset>
                    <legend>Tender Details</legend>
                    <div className="form-group">
                        <label>Title</label>
                        <input {...register("title", { required: "Title is required" })} />
                        {errors.title && <p className="error">{errors.title.message}</p>}
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea {...register("description", { required: "Description is required" })} rows="4"></textarea>
                        {errors.description && <p className="error">{errors.description.message}</p>}
                    </div>
                    <div className="form-group">
                        <label>Total Value (in ₹)</label>
                        <input type="number" {...register("totalValue", { required: "Total value is required" })} />
                        {errors.totalValue && <p className="error">{errors.totalValue.message}</p>}
                    </div>
                    <div className="form-group">
                        <label>Eligible Classes (Hold Ctrl/Cmd to select multiple)</label>
                        <select multiple {...register("eligibleClasses", { required: "At least one class is required" })} className="multi-select">
                            <option value="Class 1">Class 1</option>
                            <option value="Class 2">Class 2</option>
                            <option value="Class 3">Class 3</option>
                        </select>
                        {errors.eligibleClasses && <p className="error">{errors.eligibleClasses.message}</p>}
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Project Milestones</legend>
                    {fields.map((field, index) => (
                        <div key={field.id} className="milestone-fields">
                            <input {...register(`milestones.${index}.name`, { required: true })} placeholder="Milestone Name" />
                            <input type="number" {...register(`milestones.${index}.payoutAmount`, { required: true })} placeholder="Payout Amount (₹)" />
                            <button type="button" onClick={() => remove(index)} className="remove-btn">Remove</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => append({ name: '', payoutAmount: '' })} className="add-btn">
                        Add Milestone
                    </button>
                </fieldset>
                
                <button type="submit" className="cta-button">Publish Tender</button>
            </form>
        </div>
    );
};

export default CreateTender;