import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

function OrgView({ orgId, onTabChange }) {
    const { user } = useAuth();
    const [organization, setOrganization] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        if (orgId) fetchOrgData();
    }, [orgId]);

    const fetchOrgData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Organization Details from 'organization' table
            const { data: orgData } = await supabase
                .from('organization')
                .select('*')
                .eq('id', orgId)
                .single();
            setOrganization(orgData);

            // 2. Fetch Members using the 'org_members' table 
            const { data: memberData } = await supabase
                .from('org_members')
                .select(`
                    is_approved,
                    roles ( role_created ),
                    student:student_id (
                        name,
                        profile,
                        department
                    )
                `)
                .eq('org_id', orgId)
                .eq('is_approved', true);

            if (memberData) {
                const formattedMembers = memberData.map(m => ({
                    name: m.student?.name || 'Unknown',
                    profile: m.student?.profile,
                    department: m.student?.department || 'N/A',
                    position: m.roles?.role_created || 'Member'
                }));
                setMembers(formattedMembers);
            }
        } catch (error) {
            console.error("Error fetching org view:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- NEW JOIN FUNCTION ---
    const handleJoin = async () => {
        if (!user?.profile?.profile_id) return alert("Please log in as a student.");
        
        setJoining(true);
        try {
            const { error } = await supabase
                .from('org_members')
                .insert([
                    { 
                        org_id: orgId, 
                        student_id: user.profile.profile_id, 
                        is_approved: false 
                    }
                ]);

            if (error) throw error;
            alert("Application sent successfully!");
        } catch (error) {
            console.error("Join Error:", error.message);
            alert("You have already applied or there was an error.");
        } finally {
            setJoining(false);
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="text-center py-5"><div className="spinner-border text-danger"></div></div>
    );

    return (
        <div className="container-fluid mt-2 px-2 px-md-4 text-start d-flex flex-column" style={{ minHeight: '90vh' }}>
            
            {/* Header / Back Navigation */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <button 
                    className="btn btn-outline-danger rounded-pill px-4 fw-bold shadow-sm"
                    onClick={() => onTabChange('organizations')}
                >
                    <i className="bi bi-arrow-left me-2"></i> Back to List
                </button>
                <h4 className="fw-bold text-dark mb-0">Organization Profile</h4>
            </div>

            <div className="row g-4 flex-grow-1">
                {/* --- LEFT SIDE: ORG DETAILS --- */}
                <div className="col-lg-4">
                    <div className="shadow-lg bg-dark rounded-4 p-4 text-white text-center mb-4">
                        <img 
                            src={organization?.profile || '/default-org.png'} 
                            className="rounded-circle border border-white border-4 shadow-sm mb-3" 
                            style={{ width: '120px', height: '120px', objectFit: 'cover' }} 
                            alt="Org Logo" 
                        />
                        <h2 className="fw-bold mb-1">{organization?.name}</h2>
                        <span className="badge rounded-pill bg-white text-danger px-3 mb-3 fw-bold">
                            {organization?.type}
                        </span>

                        {/* --- ADDED JOIN BUTTON --- */}
                        <div className="mt-3 mb-4">
                            <button 
                                className="btn btn-danger rounded-pill w-100 fw-bold py-2 shadow-sm"
                                onClick={handleJoin}
                                disabled={joining}
                            >
                                {joining ? 'Sending Request...' : 'Join Organization'}
                            </button>
                        </div>

                        <hr className="border-white border-opacity-25" />
                        <div className="text-start">
                            <label className="small opacity-75 text-uppercase fw-bold">Org Code</label>
                            <p className="mb-3">{organization?.org_id || 'N/A'}</p>

                            <label className="small opacity-75 text-uppercase fw-bold">About</label>
                            <p className="mb-3">This is an {organization?.type} organization dedicated to campus growth.</p>
                            
                            <label className="small opacity-75 text-uppercase fw-bold">Adviser</label>
                            <p className="mb-3">{organization?.adviser || 'No Adviser Assigned'}</p>
                            
                            <div className="d-flex justify-content-between align-items-center mt-4">
                                <small className="opacity-50">Created: {new Date(organization?.created_at).toLocaleDateString()}</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT SIDE: MEMBERS TABLE --- */}
                <div className="col-lg-8 d-flex flex-column">
                    <div className="flex-shrink-0 mb-3">
                        <input 
                            type="text" 
                            className="search-box py-2 px-4 w-100 shadow-sm border-0" 
                            placeholder="Search members or positions..." 
                            style={{ borderRadius: '15px', backgroundColor: '#fff' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="shadow-lg bg-red rounded-4 overflow-hidden d-flex flex-column flex-grow-1 mb-4" style={{ maxHeight: '70vh' }}>
                        <div className="py-3 px-4 flex-shrink-0 bg-red border-bottom border-white border-opacity-10">
                            <h5 className='fw-bold text-white mb-0'>Organization Members</h5>
                        </div>

                        <div className="bg-red flex-grow-1 px-3 table-responsive" style={{ overflowY: 'auto' }}>
                            <table className="table table-borderless align-middle mb-0 text-white" 
                                   style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead className="sticky-top" style={{ zIndex: 10 }}>
                                    <tr className="text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                        <th className="ps-4 py-3 text-white" style={{ backgroundColor: '#2c3034', borderRadius: '12px 0 0 12px' }}>Profile</th>
                                        <th className="py-3 text-white" style={{ backgroundColor: '#2c3034' }}>Full Name</th>
                                        <th className="py-3 text-white" style={{ backgroundColor: '#2c3034' }}>Department</th>
                                        <th className="text-center pe-4 py-3 text-white" style={{ backgroundColor: '#2c3034', borderRadius: '0 12px 12px 0' }}>Position</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map((member, index) => (
                                            <tr key={index} className="shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                                                <td className="ps-4 py-3" style={{ borderRadius: '12px 0 0 12px' }}>
                                                    <img 
                                                        src={member.profile || '/default-profile.png'} 
                                                        className="rounded-circle border border-white border-2 shadow-sm" 
                                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                                                        alt="User" 
                                                    />
                                                </td>
                                                <td><span className="fw-bold">{member.name}</span></td>
                                                <td className="opacity-75">{member.department}</td>
                                                <td className="text-center pe-4" style={{ borderRadius: '0 12px 12px 0' }}>
                                                    <span className={`badge px-3 py-2 ${member.position !== 'Member' ? 'bg-white text-danger' : 'bg-dark border border-white border-opacity-25'}`} style={{ borderRadius: '10px' }}>
                                                        {member.position}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-5 opacity-50 text-white">No members found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrgView;