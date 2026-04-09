import '../../Styles/Organization.css';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

function Dashboard({ onTabChange }) {
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalOrganizations, setTotalOrganizations] = useState(0);
    const [totalEvents, setTotalEvents] = useState(0);
    const [adminName, setAdminName] = useState("Admin");

    // Fetch totals from Supabase
    useEffect(() => {
        const fetchTotals = async () => {
            try {
                const { data: studentsData, error: studentsError } = await supabase
                    .from('student')
                    .select('profile_id', { count: 'exact' });
                if (studentsError) console.log('Students fetch error:', studentsError);
                else setTotalStudents(studentsData?.length || 0);

                const { data: orgData, error: orgError } = await supabase
                    .from('organization')
                    .select('id', { count: 'exact' });
                if (orgError) console.log('Organizations fetch error:', orgError);
                else setTotalOrganizations(orgData?.length || 0);

                const { data: eventData, error: eventError } = await supabase
                    .from('event')
                    .select('event_id', { count: 'exact' });
                if (eventError) console.log('Events fetch error:', eventError);
                else setTotalEvents(eventData?.length || 0);

            } catch (err) {
                console.error('Fetch totals error:', err);
            }
        };

        fetchTotals();
    }, []);

    // Fetch Admin Name
    useEffect(() => {
        const fetchAdminName = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) {
                    console.log("Session missing or error:", sessionError);
                    return;
                }

                const user = session.user;

                // Get account
                const { data: accountData, error: accError } = await supabase
                    .from('account')
                    .select('account_id')
                    .eq('auth_id', user.id)
                    .single();
                if (accError || !accountData) {
                    console.log("Account not found:", accError);
                    return;
                }

                // Get admin profile
                const { data: adminData, error: adminError } = await supabase
                    .from('admin')
                    .select('name')
                    .eq('account_id', accountData.account_id)
                    .single();
                if (adminError || !adminData) {
                    console.log("Admin profile not found:", adminError);
                    return;
                }

                setAdminName(adminData.name || "Admin");
            } catch (err) {
                console.error("Fetch admin name error:", err);
            }
        };

        fetchAdminName();
    }, []);

    const goToCreateOrg = () => onTabChange('organizations');
    const goToCreateStudent = () => onTabChange('students');

    return (
        <div className="mt-5 container-fluid">

            {/* Welcome */}
            <div className="row">
                <div className="col-lg-12 mt-3">
                    <h1 className="fw-bold">Welcome, {adminName}</h1>
                    <h4>Manage students, organizations, and events.</h4>
                </div>
            </div>

            {/* Dashboard Boxes */}
            <div className="row mt-5 pt-5">

                <div className="col-lg-4 col-md-6 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="fw-bold">Students</h4>
                        <h1 className="mt-5 fw-bold">{totalStudents}</h1>
                    </div>
                </div>

                <div className="col-lg-4 col-md-6 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="fw-bold">Organizations</h4>
                        <h1 className="mt-5 fw-bold">{totalOrganizations}</h1>
                    </div>
                </div>

                <div className="col-lg-4 col-md-6 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="fw-bold">Events</h4>
                        <h1 className="mt-5 fw-bold">{totalEvents}</h1>
                    </div>
                </div>

            </div>

            {/* Buttons */}
            <div className="row my-5 pt-lg-4 text-center">

                <div className="col-lg-6 col-md-12 mt-3">
                    <button 
                        className="create-btn py-3 px-5 btn-transform"
                        onClick={goToCreateOrg}
                    >
                        <h4 className="fw-bold">Create Org Account</h4>
                    </button>
                </div>

                <div className="col-lg-6 col-md-12 mt-3">
                    <button 
                        className="create-btn py-3 px-5 btn-transform"
                        onClick={goToCreateStudent}
                    >
                        <h4 className="fw-bold">Create Student Account</h4>
                    </button>
                </div>

            </div>

        </div>
    );
}

export default Dashboard;