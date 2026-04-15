import '../../Styles/Organization.css'; // Reusing your existing styles
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

function StudentDashboard({ onTabChange }) {
    const { user } = useAuth();
    const [joinedEvents, setJoinedEvents] = useState(0);
    const [myOrganizations, setMyOrganizations] = useState(0);
    const [availableEvents, setAvailableEvents] = useState(0);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    
    // Mapping from Table 4: student
    const studentName = user?.profile?.name || "Student";
    const studentId = user?.profile?.profile_id;

    useEffect(() => {
        const fetchStudentStats = async () => {
            if (!studentId) return;

            try {
                // 1. Count Joined Events (Table 7: event_participants)
                const { count: joinedCount, error: joinedError } = await supabase
                    .from('event_participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('student_id', studentId);
                
                if (!joinedError) setJoinedEvents(joinedCount || 0);

                // 2. Count My Organizations (Table 10: org_members)
                const { count: orgCount, error: orgError } = await supabase
                    .from('org_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('student_id', studentId)
                    .eq('is_approved', true);
                
                if (!orgError) setMyOrganizations(orgCount || 0);

                // 3. Count Total Available/Active Events (Table 6: event)
                // FIX: Changed 'is_approved' to 'is_approve'
                const { count: eventCount, error: eventError } = await supabase
                    .from('event')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_active', true)
                    .eq('is_approve', true); 
                
                if (!eventError) setAvailableEvents(eventCount || 0);

                // 4. Fetch Top 3 Upcoming Events (Table 6: event)
                const now = new Date().toISOString();
                const { data: eventsData, error: eventsError } = await supabase
                    .from('event')
                    .select('event_id, title, date, venue, category')
                    .eq('is_active', true)
                    .eq('is_approve', true) // FIX: Changed 'is_approved' to 'is_approve'
                    .gte('date', now)
                    .order('date', { ascending: true })
                    .limit(3);
                
                if (!eventsError) setUpcomingEvents(eventsData || []);

            } catch (err) {
                console.error('Fetch student stats error:', err);
            }
        };

        fetchStudentStats();
    }, [studentId]);

    const formatEventDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="mt-5 container-fluid">
            {/* Welcome Section */}
            <div className="row">
                <div className="col-lg-12 mt-3">
                    <h1 className="fw-bold mb-0 text-start">Hello, {studentName}!</h1>
                    <h4 className="text-muted text-start">Check out your registrations and upcoming school events.</h4>
                </div>
            </div>

            {/* Stats Boxes */}
            <div className="row mt-5 pt-3">
                <div className="col-lg-4 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="fw-bold text-white">My Registrations</h4>
                        <h1 className="mt-5 fw-bold text-white">{joinedEvents}</h1>
                    </div>
                </div>

                <div className="col-lg-4 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="fw-bold text-white">Organizations</h4>
                        <h1 className="mt-5 fw-bold text-white">{myOrganizations}</h1>
                    </div>
                </div>

                <div className="col-lg-4 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="fw-bold text-white">Available Events</h4>
                        <h1 className="mt-5 fw-bold text-white">{availableEvents}</h1>
                    </div>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="row my-5 pt-lg-2 text-center">
                <div className="col-lg-6 col-md-12 mt-3">
                    <button
                        className="create-btn py-3 px-5 btn-transform w-100"
                        onClick={() => onTabChange('events')}
                    >
                        <h4 className="fw-bold">Browse All Events</h4>
                    </button>
                </div>

                <div className="col-lg-6 col-md-12 mt-3">
                    <button
                        className="create-btn py-3 px-5 btn-transform w-100"
                        onClick={() => onTabChange('my-reg')}
                    >
                        <h4 className="fw-bold">Track My Status</h4>
                    </button>
                </div>
            </div>

            {/* Upcoming Events Section */}
            <div className="row mt-5 pb-5">
                <div className="col-12 mt-3">
                    <h2 className="fw-bold mb-4 text-start">Upcoming Events</h2>
                    <div className="row">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map((event) => (
                                <div key={event.event_id} className="col-md-4 mb-4">
                                    <div className="card h-100 shadow-sm border-0 upcoming-event-card" onClick={() => onTabChange('event-view', event.event_id)} style={{cursor: 'pointer'}}>
                                        <div className="card-body p-4 text-start">
                                            <span className="badge bg-primary text-uppercase mb-2" style={{ fontSize: '0.7rem' }}>
                                                {event.category || 'School Event'}
                                            </span>
                                            <h5 className="card-title fw-bold text-dark mb-3">
                                                {event.title}
                                            </h5>
                                            <p className="card-text text-muted mb-1" style={{ fontSize: '0.9rem' }}>
                                                <strong>Date:</strong> {formatEventDate(event.date)}
                                            </p>
                                            <p className="card-text text-muted" style={{ fontSize: '0.9rem' }}>
                                                <strong>Venue:</strong> {event.venue || 'TBA'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12">
                                <div className="alert alert-light text-center border-0 py-5 shadow-sm">
                                    <h5 className="text-muted mb-0">No upcoming events found.</h5>
                                    <p className="text-muted mt-2">Check back later for new events!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;