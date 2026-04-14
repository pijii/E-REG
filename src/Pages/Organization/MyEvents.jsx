import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

function MyEvents({ onTabChange }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filter & Sort States
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [sortBy, setSortBy] = useState('newest'); 

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);

            // 1. Get current user session
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 2. Get Account ID
            const { data: accountData, error: accError } = await supabase
                .from('account')
                .select('account_id')
                .eq('auth_id', user.id)
                .single();

            if (accError) throw accError;

            // 3. Get Organization ID
            const { data: orgData, error: orgError } = await supabase
                .from('organization')
                .select('id')
                .eq('account_id', accountData.account_id)
                .single();

            if (orgError) throw orgError;

            // 4. Fetch events for this organization
            const { data, error } = await supabase
                .from('event')
                .select('*')
                .eq('event_creator_id', orgData.id)
                .eq('is_active', true);

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Sorting and Filtering Logic
    const processedEvents = events
        .filter(event => {
            const matchesSearch = (event.title || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
            const matchesDate = !dateFilter || (event.date && event.date.startsWith(dateFilter));
            return matchesSearch && matchesCategory && matchesDate;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === 'event_date') return new Date(a.date) - new Date(b.date);
            return 0;
        });

    return (
        <div className="container-fluid">
            {/* Search, Filter, and Sort Section */}
            <div className="row g-3">
                <div className="col-lg-5 col-md-12">
                    <input 
                        type="text" 
                        className="search-box py-1 px-4 w-100" 
                        placeholder="Search your events..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="col-lg-2 col-md-4 d-flex align-items-center">
                    <p className='fw-bold mb-0 me-2'>Category:</p>
                    <select className="form-select border-0" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="all">All</option>
                        <option value="performing">Performing Arts</option>
                        <option value="seminar">Seminar</option>
                        <option value="competition">Competition</option>
                    </select>
                </div>
                <div className="col-lg-2 col-md-4 d-flex align-items-center">
                    <p className='fw-bold mb-0 me-2'>Sort:</p>
                    <select className="form-select border-0" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="newest">Recently Added</option>
                        <option value="oldest">Oldest First</option>
                        <option value="event_date">By Event Date</option>
                    </select>
                </div>
                <div className="col-lg-3 col-md-4 d-flex align-items-center">
                    <p className='fw-bold mb-0 me-2'>Date:</p>
                    <input type="date" className="form-control border-0" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>
            </div>

            {/* Event List */}
            <div className="row mt-5 event-panel border px-1 shadow-lg">
                <div className="col-lg-12 pt-4 bg-red align-self-start eventlist-top">
                    <h1 className='fw-bold'>My Event Lists:</h1>
                    <hr />
                </div>

                {loading ? (
                    <div className="col-12 text-center py-5">
                        <div className="spinner-border text-danger" role="status"></div>
                    </div>
                ) : processedEvents.length > 0 ? (
                    processedEvents.map((event) => (
                        <div key={event.event_id} className="col-lg-4 col-md-6 mb-4">
                            <button 
                                className="event-card p-3 bg-white border rounded shadow-lg w-100 position-relative" 
                                onClick={() => onTabChange('event-view', event.event_id)} // PASSING THE ID HERE
                            >
                                <span className={`badge position-absolute top-0 end-0 m-3 ${event.is_approve ? 'bg-success' : 'bg-warning text-dark'}`}>
                                    {event.is_approve ? 'Approved' : 'Pending'}
                                </span>

                                <img 
                                    src={event.poster || logo} 
                                    alt="Event" 
                                    className="event-image mb-3 mw-100 mh-100" 
                                    style={{height: '180px', width: '100%', objectFit: 'cover'}}
                                />
                                
                                <h5 className='fw-bold text-start mb-1'>{event.title}</h5>
                                
                                <div className="d-flex flex-wrap gap-1 mb-2">
                                    <span className="badge bg-primary">{event.category}</span>
                                    <span className="badge bg-info text-dark">{event.mode}</span>
                                </div>

                                <div className="d-flex justify-content-between align-items-center border-top pt-2">
                                    <small className="fw-bold">{new Date(event.date).toLocaleDateString()}</small>
                                    <small className="text-muted">Code: {event.event_code}</small>
                                </div>
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <h3>No events found.</h3>
                    </div>
                )}
            </div>

            <div className="row pt-4 text-center text-md-end">
                <div className="col-12">
                    <button className="create-btn py-3 px-5 shadow-lg btn-transform" onClick={() => onTabChange('create-events')}>
                        <h4 className='fw-bold'>Create Event</h4>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MyEvents;