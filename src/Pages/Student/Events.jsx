import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../Styles/Organization.css'; 
import logo from '../../img/logo/E-Reg.png';

function StudentEvents({ onTabChange }) {
    const [events, setEvents] = useState([]);
    const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest'); 

    useEffect(() => {
        fetchStudentDashboardData();
    }, []);

    const fetchStudentDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Get current session
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 2. Fetch Events
            // Note: Changed 'is_approved' to 'is_approve' to match your schema
            const { data: eventData, error: eventError } = await supabase
                .from('event')
                .select(`
                    *,
                    organization (name)
                `)
                .eq('is_active', true)
                .eq('is_approve', true); 

            if (eventError) throw eventError;

            // 3. Get Student Profile and Registrations
            const { data: accountData } = await supabase
                .from('account')
                .select('account_id')
                .eq('auth_id', user.id)
                .single();

            if (accountData) {
                const { data: studentData } = await supabase
                    .from('student')
                    .select('profile_id')
                    .eq('account_id', accountData.account_id)
                    .single();

                if (studentData) {
                    const { data: participationData } = await supabase
                        .from('event_participants')
                        .select('event_id')
                        .eq('student_id', studentData.profile_id);
                    
                    const registeredIds = new Set(participationData?.map(p => p.event_id));
                    setRegisteredEventIds(registeredIds);
                }
            }

            setEvents(eventData || []);
        } catch (error) {
            console.error('Error fetching student dashboard:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const processedEvents = events
        .filter(event => {
            const matchesSearch = (event.title || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
            if (sortBy === 'event_date') return new Date(a.date) - new Date(b.date);
            return 0;
        });

    return (
        <div className="container-fluid">
            <div className="row g-3">
                <div className="col-lg-6 col-md-12">
                    <input 
                        type="text" 
                        className="search-box py-1 px-4 w-100" 
                        placeholder="Search events..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="col-lg-3 col-md-6 d-flex align-items-center">
                    <p className='fw-bold mb-0 me-2'>Category:</p>
                    <select className="form-select border-0" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="all">All</option>
                        <option value="performing">Performing Arts</option>
                        <option value="seminar">Seminar</option>
                        <option value="competition">Competition</option>
                    </select>
                </div>
                <div className="col-lg-3 col-md-6 d-flex align-items-center">
                    <p className='fw-bold mb-0 me-2'>Sort:</p>
                    <select className="form-select border-0" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="newest">Recently Added</option>
                        <option value="event_date">Event Date</option>
                    </select>
                </div>
            </div>

            <div className="row mt-5 event-panel border px-1 shadow-lg">
                <div className="col-lg-12 pt-4 eventlist-top">
                    <h3 className='fw-bold'>Available Events</h3>
                    <hr />
                </div>

                {loading ? (
                    <div className="col-12 text-center py-5">
                        <div className="spinner-border text-danger" role="status"></div>
                    </div>
                ) : processedEvents.length > 0 ? (
                    processedEvents.map((event) => (
                        <div key={event.event_id} className="col-lg-4 col-md-6 mb-4">
                            <div 
                                className="event-card p-3 bg-white border rounded shadow-lg w-100 position-relative" 
                                style={{ cursor: 'pointer' }}
                                onClick={() => onTabChange('event-view', event.event_id)}
                            >
                                {registeredEventIds.has(event.event_id) ? (
                                    <span className="badge position-absolute top-0 end-0 m-3 bg-success">Registered</span>
                                ) : (
                                    <span className={`badge position-absolute top-0 end-0 m-3 ${event.is_open ? 'bg-primary' : 'bg-secondary'}`}>
                                        {event.is_open ? 'Open' : 'Closed'}
                                    </span>
                                )}

                                <img 
                                    src={event.poster || logo} 
                                    alt="Event" 
                                    className="event-image mb-3 mw-100" 
                                    style={{height: '180px', width: '100%', objectFit: 'cover'}}
                                />
                                
                                <h5 className='fw-bold text-start mb-1'>{event.title}</h5>
                                <p className="text-muted text-start small mb-2">Host: {event.organization?.name}</p>
                                
                                <div className="d-flex flex-wrap gap-1 mb-2">
                                    <span className="badge bg-info text-dark">{event.category}</span>
                                    <span className="badge bg-light text-dark border">{event.mode}</span>
                                </div>

                                <div className="d-flex justify-content-between align-items-center border-top pt-2">
                                    <small className="fw-bold">{new Date(event.date).toLocaleDateString()}</small>
                                    <small className="text-muted text-truncate" style={{maxWidth: '120px'}}>{event.venue}</small>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <h3>No events found.</h3>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentEvents;