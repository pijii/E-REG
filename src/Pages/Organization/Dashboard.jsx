import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext'; // Update the path accordingly
import { supabase } from '../../supabaseClient';
import '../../Styles/Organization.css';

function Dashboard({ onTabChange }) {
    const { user, loading: authLoading } = useAuth();
    
    // Local state for dashboard metrics
    const [stats, setStats] = useState({
        orgName: "Loading...",
        totalEvents: 0,
        totalParticipants: 0,
        totalOrgMembers: 0
    });
    const [dataLoading, setDataLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        // Ensure we have a user and that they are an 'organization'
        if (!user || user.role !== 'organization') return;

        try {
            setDataLoading(true);
            const orgId = user.profile.id;

            // 1. Fetch Total Events created by this organization
            const { count: eventCount } = await supabase
                .from('event')
                .select('*', { count: 'exact', head: true })
                .eq('event_creator_id', orgId);

            // 2. Fetch Total Participants across all events of this organization
            // Using a join to count event_participants for all events owned by this org
            const { data: eventsData } = await supabase
                .from('event')
                .select(`
                    event_id,
                    event_participants(count)
                `)
                .eq('event_creator_id', orgId);

            const totalParts = eventsData?.reduce((acc, curr) => 
                acc + (curr.event_participants[0]?.count || 0), 0) || 0;

            // 3. Fetch Total Org Members (Students assigned to this organization_id)
            const { count: memberCount } = await supabase
                .from('student')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', orgId);

            setStats({
                orgName: user.profile.name,
                totalEvents: eventCount || 0,
                totalParticipants: totalParts,
                totalOrgMembers: memberCount || 0
            });
        } catch (error) {
            console.error("Error fetching dashboard stats:", error.message);
        } finally {
            setDataLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchDashboardData();
        }
    }, [user, authLoading, fetchDashboardData]);

    const goToCreateEvent = () => {
        onTabChange('create-events');
    };

    // Handle loading states
    if (authLoading || dataLoading) {
        return (
            <div className="mt-5 container text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading Dashboard...</span>
                </div>
            </div>
        );
    }

    // Handle case where user might not be an organization
    if (!user || user.role !== 'organization') {
        return <div className="mt-5 container">Access Denied. Organizations only.</div>;
    }

    return (
        <div className="mt-5 container-fluid">
            {/* Welcome Section */}
            <div className="row">
                <div className="col-lg-12 mt-3">
                    <h1 className="fw-bold">Welcome, {stats.orgName}</h1>
                    <h4>Create and manage school events and registrations.</h4>
                </div>
            </div>

            {/* Dashboard Cards Section */}
            <div className="row mt-5 pt-5">
                <div className="col-lg-4 col-md-12 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="dashboard-title fw-bold">Total Events</h4>
                        <h1 className="centered mt-5 fw-bold">{stats.totalEvents}</h1>
                    </div>
                </div>
                <div className="col-lg-4 col-md-12 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="dashboard-title fw-bold">Total Participants</h4>
                        <h1 className="centered mt-5 fw-bold">{stats.totalParticipants}</h1>
                    </div>
                </div>
                <div className="col-lg-4 col-md-12 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="dashboard-title fw-bold">Total Org Members</h4>
                        <h1 className="centered mt-5 fw-bold">{stats.totalOrgMembers}</h1>
                    </div>
                </div>
            </div>

            {/* Create Event Button */}
            <div className="row my-5 pt-lg-4 text-center">
                <div className="col-lg-12 mt-3">
                    <button 
                        className="create-btn py-3 px-5 shadow-lg btn-transform" 
                        onClick={goToCreateEvent}
                    >
                        <h4 className='fw-bold'>Create Event</h4>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;