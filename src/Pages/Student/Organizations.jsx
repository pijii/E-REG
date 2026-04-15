import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import '../../Styles/Organization.css'; 

function StudentOrganizations({ onTabChange }) { // Added onTabChange prop
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [userMemberships, setUserMemberships] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        if (user?.profile?.profile_id) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: orgs } = await supabase.from('organization').select('*').order('name');
            const { data: members } = await supabase.from('org_members').select('org_id, is_approved').eq('student_id', user.profile.profile_id);

            const membershipMap = {};
            members?.forEach(m => membershipMap[m.org_id] = m.is_approved ? 'approved' : 'pending');
            setOrganizations(orgs || []);
            setUserMemberships(membershipMap);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRequest = async () => {
        if (!user?.profile?.profile_id || !selectedOrg) return;
        setIsJoining(true);
        const { error } = await supabase.from('org_members').insert([{
            student_id: user.profile.profile_id,
            org_id: selectedOrg.id,
            is_approved: false 
        }]);
        if (!error) setUserMemberships(prev => ({ ...prev, [selectedOrg.id]: 'pending' }));
        setSelectedOrg(null);
        setIsJoining(false);
    };

    const filteredOrgs = organizations.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        (typeFilter === 'all' || org.type === typeFilter)
    );

    return (
        <div className="container-fluid mt-2 px-2 px-md-4 text-start d-flex flex-column" style={{ minHeight: '90vh' }}>
            {/* 1. Search Bar Area */}
            <div className="flex-shrink-0 mb-3">
                <div className="row g-3 align-items-center">
                    <div className="col-12 col-lg-8">
                        <input 
                            type="text" 
                            className="search-box py-2 px-4 w-100 shadow-sm border-0" 
                            placeholder="Search organizations..." 
                            style={{ borderRadius: '15px', backgroundColor: '#fff' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="col-12 col-lg-4 d-flex justify-content-start justify-content-lg-end align-items-center">
                        <span className='fw-bold me-2 text-dark'>Type:</span>
                        <select className="form-select border-0 shadow-sm w-auto" style={{ borderRadius: '12px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="all">All</option>
                            <option value="internal">Internal</option>
                            <option value="external">External</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Main Panel */}
            <div className="shadow-lg bg-red rounded-4 overflow-hidden d-flex flex-column flex-grow-1 mb-4">
                <div className="py-3 px-4 flex-shrink-0 bg-red">
                    <h2 className='fw-bold text-white mb-0 fs-3'>Campus Organizations</h2>
                </div>

                <div className="bg-red flex-grow-1 px-3 table-responsive" style={{ overflowY: 'auto' }}>
                    {loading ? (
                        <div className="text-center py-5"><div className="spinner-border text-white"></div></div>
                    ) : (
                        <table className="table table-borderless align-middle mb-0 text-white" 
                               style={{ borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: '600px' }}>
                            <thead className="sticky-top" style={{ zIndex: 10 }}>
                                <tr className="text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                    <th className="ps-4 py-3 text-white" style={{ backgroundColor: '#2c3034', borderRadius: '12px 0 0 12px' }}>Logo</th>
                                    <th className="py-3 text-white" style={{ backgroundColor: '#2c3034' }}>Organization Name</th>
                                    <th className="py-3 text-white text-center" style={{ backgroundColor: '#2c3034' }}>Type</th>
                                    <th className="py-3 text-white" style={{ backgroundColor: '#2c3034' }}>Adviser</th>
                                    <th className="text-center pe-4 py-3 text-white" style={{ backgroundColor: '#2c3034', borderRadius: '0 12px 12px 0' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrgs.map((org) => {
                                    const status = userMemberships[org.id];
                                    return (
                                        <tr key={org.id} className="shadow-sm org-row-hover" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}>
                                            <td className="ps-4 py-3" style={{ borderRadius: '12px 0 0 12px' }} onClick={() => onTabChange('org-view', org.id)}>
                                                <img 
                                                    src={org.profile || '/default-org.png'} 
                                                    className="rounded-circle border border-white border-2 shadow-sm" 
                                                    style={{ width: '45px', height: '45px', objectFit: 'cover' }} 
                                                    alt="Logo" 
                                                />
                                            </td>
                                            <td onClick={() => onTabChange('org-view', org.id)}>
                                                <span className="fw-bold fs-6 fs-md-5 clickable-name">{org.name}</span>
                                            </td>
                                            <td className="text-center" onClick={() => onTabChange('org-view', org.id)}>
                                                <span className="badge rounded-pill bg-white text-danger px-3 fw-bold">
                                                    {org.type}
                                                </span>
                                            </td>
                                            <td className="opacity-75" onClick={() => onTabChange('org-view', org.id)}>{org.adviser || 'TBA'}</td>
                                            <td className="text-center pe-4" style={{ borderRadius: '0 12px 12px 0' }}>
                                                {status === 'approved' ? (
                                                    <span className="badge bg-success px-4 py-2 border border-white" style={{ borderRadius: '10px' }}>Member</span>
                                                ) : status === 'pending' ? (
                                                    <span className="badge bg-white text-danger px-4 py-2 shadow-sm" style={{ borderRadius: '10px' }}>Pending</span>
                                                ) : (
                                                    <button 
                                                        className="btn btn-light px-4 rounded-pill fw-bold text-danger shadow-sm" 
                                                        style={{ fontSize: '0.8rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevents navigating to OrgView when clicking Join
                                                            setSelectedOrg(org);
                                                        }}
                                                    >
                                                        Join
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            {selectedOrg && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(3px)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm mx-auto" style={{ maxWidth: '90%' }}>
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                            <div className="modal-body text-center p-4">
                                <img 
                                    src={selectedOrg.profile || '/default-org.png'} 
                                    className="rounded-circle mb-3 border shadow-sm"
                                    style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                                    alt="Logo"
                                />
                                <h5 className="fw-bold mb-1 text-dark">Join {selectedOrg.name}?</h5>
                                <div className="d-grid gap-2 mt-4">
                                    <button className="btn btn-danger py-2 fw-bold rounded-pill shadow-sm" onClick={handleJoinRequest} disabled={isJoining}>
                                        {isJoining ? 'Sending...' : 'Confirm Request'}
                                    </button>
                                    <button className="btn btn-light border py-2 rounded-pill" onClick={() => setSelectedOrg(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentOrganizations;