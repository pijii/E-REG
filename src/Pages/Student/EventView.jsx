import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

function StudentEventView({ onTabChange, eventId }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [eventData, setEventData] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [regStatus, setRegStatus] = useState(null); 
    const [participants, setParticipants] = useState([]);
    const [matches, setMatches] = useState([]); // New state for matches
    
    const [activeModal, setActiveModal] = useState(null); 
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        if (eventId) {
            fetchEventDetails();
            checkRegistration();
            fetchParticipants();
            fetchBrackets(); // Fetch brackets on load
        }
    }, [eventId, user]);

    const triggerNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('event').select('*').eq('event_id', eventId).single();
            if (error) throw error;
            setEventData(data);
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 
        }
    };

    // Fetch Bracket/Match Data
    const fetchBrackets = async () => {
        try {
            // Assumes you have a 'matches' table with team names and round info
            const { data, error } = await supabase
                .from('matches')
                .select('*')
                .eq('event_id', eventId)
                .order('round', { ascending: true });
            
            if (error) throw error;
            setMatches(data || []);
        } catch (err) {
            console.error("Error fetching brackets:", err);
        }
    };

    const checkRegistration = async () => {
        if (!user?.profile?.profile_id) return;
        const { data } = await supabase
            .from('event_participants')
            .select('is_approved')
            .eq('event_id', eventId)
            .eq('student_id', user.profile.profile_id)
            .single();
        
        if (data) {
            setIsRegistered(true);
            setRegStatus(data.is_approved ? 'approved' : 'pending');
        } else {
            setIsRegistered(false);
        }
    };

    const fetchParticipants = async () => {
        const { data } = await supabase
            .from('event_participants')
            .select(`team, student:student_id (name, department)`)
            .eq('event_id', eventId)
            .eq('is_approved', true);
        setParticipants(data || []);
    };

    const handleRegister = async () => {
        try {
            const { error } = await supabase.from('event_participants').insert([
                { 
                    event_id: eventId, 
                    student_id: user.profile.profile_id,
                    is_approved: false 
                }
            ]);
            if (error) throw error;
            setActiveModal('success');
            checkRegistration();
        } catch (error) {
            triggerNotification("Error joining event.", "danger");
        }
    };

    const handleCancelRegistration = async () => {
        const { error } = await supabase
            .from('event_participants')
            .delete()
            .eq('event_id', eventId)
            .eq('student_id', user.profile.profile_id);
        
        if (!error) {
            setIsRegistered(false);
            setRegStatus(null);
            setActiveModal(null);
            triggerNotification("Application withdrawn.", "info");
        }
    };

    if (loading || !eventData) return <div className="p-5 text-center fw-bold text-danger">Loading...</div>;

    return (
        <div className="container-fluid py-4 position-relative" style={{ fontSize: '1.1rem' }}>
            
            {notification.show && (
                <div className={`alert alert-${notification.type} shadow-lg position-fixed top-0 start-50 translate-middle-x mt-4 fw-bold`} 
                     style={{ zIndex: 9999, borderRadius: '50px', padding: '10px 30px', border: 'none' }}>
                    {notification.message}
                </div>
            )}

            <button className='btn btn-outline-dark fw-bold mb-4 shadow-sm' onClick={() => onTabChange('events')}>
                ⟵ BACK TO MY EVENTS
            </button>

            <div className="row g-4">
                {/* SIDEBAR */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-lg mb-4 overflow-hidden rounded-4">
                        <img src={eventData.poster || logo} className='img-fluid' alt="Poster" />
                        <div className="p-3 bg-dark text-white text-center fw-bold text-uppercase">
                            {eventData.category || "Tournament"}
                        </div>
                    </div>

                    <div className="card p-4 border-0 shadow-sm mb-4 bg-white text-center rounded-4">
                        <h5 className="fw-bold mb-3 text-dark">Registration</h5>
                        {!isRegistered ? (
                            <button className="btn btn-danger btn-lg w-100 fw-bold shadow-sm" onClick={handleRegister}>
                                REGISTER NOW
                            </button>
                        ) : (
                            <div>
                                <div className={`badge w-100 p-3 mb-3 fs-6 ${regStatus === 'approved' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                    {regStatus === 'approved' ? '✓ ENROLLED' : '⏳ PENDING APPROVAL'}
                                </div>
                                <button className="btn btn-sm btn-link text-muted fw-bold text-decoration-none" onClick={() => setActiveModal('withdraw')}>
                                    Withdraw Application
                                </button>
                            </div>
                        )}
                    </div>

                    <button className="btn btn-dark w-100 py-3 fw-bold rounded-4 shadow-sm mb-4" onClick={() => setActiveModal('bracket')}>
                        🏆 VIEW BRACKET
                    </button>
                </div>

                {/* MAIN CONTENT */}
                <div className="col-md-8">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h1 className="fw-bold text-uppercase m-0 text-dark">{eventData.title}</h1>
                        {eventData.is_live && <span className="badge bg-danger pulse px-3 py-2">LIVE</span>}
                    </div>

                    <div className="row mb-4 g-3">
                        <div className="col-sm-6">
                            <div className="card p-3 border-0 shadow-sm bg-white rounded-3">
                                <small className="fw-bold text-muted text-uppercase">Schedule</small>
                                <div className="fw-bold">{new Date(eventData.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <div className="card p-3 border-0 shadow-sm bg-white rounded-3">
                                <small className="fw-bold text-muted text-uppercase">Venue</small>
                                <div className="fw-bold">{eventData.venue || 'TBA'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4 border-0 shadow-sm bg-white mb-4 rounded-4">
                        <h6 className="fw-bold text-danger border-bottom border-2 pb-2 mb-3" style={{ width: 'fit-content' }}>OVERVIEW</h6>
                        <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{eventData.description}</p>
                    </div>

                    <div className="card border-0 shadow-lg bg-dark overflow-hidden mb-4 rounded-4">
                        <div className="card-header bg-dark text-white border-secondary fw-bold">EVENT BROADCAST</div>
                        {eventData.is_live && eventData.stream_url ? (
                            <div className="ratio ratio-16x9">
                                <iframe src={eventData.stream_url} title="Live" allowFullScreen></iframe>
                            </div>
                        ) : (
                            <div className="text-center py-5 text-white opacity-25"><h4>OFFLINE</h4></div>
                        )}
                    </div>

                    <div className="card p-4 border-0 shadow-sm bg-white mb-4 rounded-4">
                        <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">PARTICIPANT ROSTER</h5>
                        <div className="row g-2">
                            {participants.length > 0 ? participants.map((p, i) => (
                                <div key={i} className="col-md-6 col-lg-4">
                                    <div className="p-2 border border-light rounded-3 bg-light d-flex justify-content-between align-items-center shadow-sm">
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold small text-dark">{p.student?.name}</span>
                                            <span className="x-small text-muted" style={{fontSize: '0.7rem'}}>{p.student?.department}</span>
                                        </div>
                                        <span className="badge bg-white text-danger border border-danger-subtle">{p.team || 'Solo'}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-muted small italic">Approved participants will appear here.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {activeModal === 'success' && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4 p-4 text-center">
                            <h2 className="text-success mb-2">✔</h2>
                            <h4 className="fw-bold">Registration Sent!</h4>
                            <p className="text-muted">Your entry for <strong>{eventData.title}</strong> is now pending approval from the organizers.</p>
                            <button className="btn btn-dark w-100 fw-bold py-2 mt-3 rounded-3" onClick={() => setActiveModal(null)}>CLOSE</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'withdraw' && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4 p-4">
                            <h4 className="fw-bold mb-3 text-danger">Withdraw Entry?</h4>
                            <p className="text-muted">Are you sure you want to cancel your registration? You will be removed from the participant list.</p>
                            <div className="d-flex gap-2 mt-4">
                                <button className="btn btn-light flex-grow-1 fw-bold" onClick={() => setActiveModal(null)}>GO BACK</button>
                                <button className="btn btn-danger flex-grow-1 fw-bold" onClick={handleCancelRegistration}>WITHDRAW</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* UPDATED BRACKET MODAL */}
            {activeModal === 'bracket' && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
                            <div className="modal-header bg-dark text-white border-0 py-3">
                                <h5 className="modal-title fw-bold">🏆 TOURNAMENT PROGRESS</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setActiveModal(null)}></button>
                            </div>
                            <div className="modal-body bg-light" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="p-3">
                                    {matches.length > 0 ? (
                                        <div className="row g-3">
                                            {matches.map((match, idx) => (
                                                <div key={idx} className="col-12 mb-3">
                                                    <div className="text-center small fw-bold text-muted text-uppercase mb-2">Round {match.round}</div>
                                                    <div className="card shadow-sm border-0 rounded-3">
                                                        <div className="row g-0">
                                                            <div className={`col-5 p-3 text-center ${match.winner === match.team_a ? 'bg-success-subtle fw-bold' : ''}`}>
                                                                {match.team_a || 'TBA'}
                                                            </div>
                                                            <div className="col-2 p-3 text-center bg-dark text-white fw-bold">VS</div>
                                                            <div className={`col-5 p-3 text-center ${match.winner === match.team_b ? 'bg-success-subtle fw-bold' : ''}`}>
                                                                {match.team_b || 'TBA'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 opacity-50">
                                            <p>Tournament matchups will be visible here once the bracket is finalized by the admin.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentEventView;