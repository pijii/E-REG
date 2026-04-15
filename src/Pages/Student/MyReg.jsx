import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import '../../Styles/Organization.css'; 

function MyRegistrations({ onTabChange }) { // Added onTabChange prop
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.profile?.profile_id) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const profileId = user.profile.profile_id;

            // 1. Fetch Organization Memberships
            const { data: orgData } = await supabase
                .from('org_members')
                .select(`
                    is_approved,
                    organization:org_id (id, name, type, profile)
                `)
                .eq('student_id', profileId);

            // 2. Fetch Event Registrations
            const { data: eventData } = await supabase
                .from('event_participants')
                .select(`
                    is_approved,
                    event:event_id (event_id, title, date, poster)
                `)
                .eq('student_id', profileId);

            setOrganizations(orgData || []);
            setEvents(eventData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to render the table rows for Orgs
    const renderOrgRows = () => (
        organizations.length > 0 ? organizations.map((item, index) => (
            <tr 
                key={`org-${index}`} 
                className="shadow-sm" 
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}
                onClick={() => onTabChange('org-view', item.organization?.id)} // Navigates to OrgView
            >
                <td className="ps-4 py-3" style={{ borderRadius: '12px 0 0 12px' }}>
                    <img src={item.organization?.profile || '/default-org.png'} className="rounded-circle border border-white border-2 shadow-sm" style={{ width: '40px', height: '40px', objectFit: 'cover' }} alt="Logo" />
                </td>
                <td><span className="fw-bold">{item.organization?.name}</span></td>
                <td className="text-center"><span className="badge rounded-pill bg-white text-danger px-3">{item.organization?.type}</span></td>
                <td className="text-center pe-4" style={{ borderRadius: '0 12px 12px 0' }}>
                    <span className={`badge ${item.is_approved ? 'bg-success' : 'bg-white text-danger'} px-4 py-2`} style={{ borderRadius: '10px' }}>
                        {item.is_approved ? 'Member' : 'Pending'}
                    </span>
                </td>
            </tr>
        )) : <tr><td colSpan="4" className="text-center py-4 opacity-50 text-white">No joined organizations.</td></tr>
    );

    // Helper to render the table rows for Events
    const renderEventRows = () => (
        events.length > 0 ? events.map((item, index) => (
            <tr 
                key={`event-${index}`} 
                className="shadow-sm" 
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}
                onClick={() => onTabChange('event-view', item.event?.event_id)} // Navigates to EventView
            >
                <td className="ps-4 py-3" style={{ borderRadius: '12px 0 0 12px' }}>
                    <img src={item.event?.poster || '/default-event.png'} className="rounded border border-white border-2 shadow-sm" style={{ width: '40px', height: '40px', objectFit: 'cover' }} alt="Poster" />
                </td>
                <td><span className="fw-bold">{item.event?.title}</span></td>
                <td className="text-center opacity-75">{item.event?.date ? new Date(item.event.date).toLocaleDateString() : 'TBA'}</td>
                <td className="text-center pe-4" style={{ borderRadius: '0 12px 12px 0' }}>
                    <span className={`badge ${item.is_approved ? 'bg-success' : 'bg-white text-danger'} px-4 py-2`} style={{ borderRadius: '10px' }}>
                        {item.is_approved ? 'Registered' : 'Waitlisted'}
                    </span>
                </td>
            </tr>
        )) : <tr><td colSpan="4" className="text-center py-4 opacity-50 text-white">No registered events.</td></tr>
    );

    return (
        <div className="container-fluid mt-2 px-2 px-md-4 text-start d-flex flex-column" style={{ minHeight: '90vh' }}>
            <h4 className="fw-bold text-dark mb-3">My Registration Dashboard</h4>

            <div className="row g-4 flex-grow-1">
                {/* --- ORGANIZATIONS TABLE --- */}
                <div className="col-xl-6 d-flex flex-column">
                    <div className="shadow-lg bg-red rounded-4 overflow-hidden d-flex flex-column flex-grow-1" style={{ maxHeight: '75vh' }}>
                        <div className="py-3 px-4 flex-shrink-0 bg-red border-bottom border-white border-opacity-10">
                            <h5 className='fw-bold text-white mb-0'>My Organizations</h5>
                        </div>
                        <div className="bg-red flex-grow-1 px-3 table-responsive" style={{ overflowY: 'auto' }}>
                            <table className="table table-borderless align-middle mb-0 text-white" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead className="sticky-top" style={{ zIndex: 10 }}>
                                    <tr className="text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                                        <th className="ps-4 py-3 text-white" style={{ backgroundColor: '#2c3034', borderRadius: '12px 0 0 12px' }}>Logo</th>
                                        <th className="py-3 text-white" style={{ backgroundColor: '#2c3034' }}>Name</th>
                                        <th className="py-3 text-white text-center" style={{ backgroundColor: '#2c3034' }}>Type</th>
                                        <th className="text-center pe-4 py-3 text-white" style={{ backgroundColor: '#2c3034', borderRadius: '0 12px 12px 0' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? <tr><td colSpan="4" className="text-center py-5"><div className="spinner-border text-white"></div></td></tr> : renderOrgRows()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- EVENTS TABLE --- */}
                <div className="col-xl-6 d-flex flex-column">
                    <div className="shadow-lg bg-red rounded-4 overflow-hidden d-flex flex-column flex-grow-1" style={{ maxHeight: '75vh' }}>
                        <div className="py-3 px-4 flex-shrink-0 bg-red border-bottom border-white border-opacity-10">
                            <h5 className='fw-bold text-white mb-0'>My Events</h5>
                        </div>
                        <div className="bg-red flex-grow-1 px-3 table-responsive" style={{ overflowY: 'auto' }}>
                            <table className="table table-borderless align-middle mb-0 text-white" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead className="sticky-top" style={{ zIndex: 10 }}>
                                    <tr className="text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                                        <th className="ps-4 py-3 text-white" style={{ backgroundColor: '#2c3034', borderRadius: '12px 0 0 12px' }}>Poster</th>
                                        <th className="py-3 text-white" style={{ backgroundColor: '#2c3034' }}>Title</th>
                                        <th className="py-3 text-white text-center" style={{ backgroundColor: '#2c3034' }}>Date</th>
                                        <th className="text-center pe-4 py-3 text-white" style={{ backgroundColor: '#2c3034', borderRadius: '0 12px 12px 0' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? <tr><td colSpan="4" className="text-center py-5"><div className="spinner-border text-white"></div></td></tr> : renderEventRows()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MyRegistrations;