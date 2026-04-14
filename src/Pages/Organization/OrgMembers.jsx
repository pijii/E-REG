import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import '../../Styles/Organization.css';

function OrgMembers() {
    const { user } = useAuth();
    const [approvedMembers, setApprovedMembers] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]); // Roles from the database
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedRoleId, setSelectedRoleId] = useState("");

    const currentOrgId = user?.profile?.id;

    const fetchAllData = useCallback(async () => {
        if (!currentOrgId) return;
        setLoading(true);

        try {
            // 1. Fetch Roles created for this Organization
            const { data: rolesData } = await supabase
                .from('roles')
                .select('*')
                .eq('org_id', currentOrgId);
            setAvailableRoles(rolesData || []);

            // 2. Fetch Approved Members (Joining with roles table)
            const { data: approved } = await supabase
                .from('org_members')
                .select(`
                    id, is_approved,
                    student:student_id (name, department),
                    role_info:role (id, role_created)
                `)
                .eq('org_id', currentOrgId)
                .eq('is_approved', true);

            // 3. Fetch Pending Requests
            const { data: pending } = await supabase
                .from('org_members')
                .select(`
                    id,
                    student:student_id (name, department)
                `)
                .eq('org_id', currentOrgId)
                .eq('is_approved', false);

            setApprovedMembers(approved || []);
            setPendingStudents(pending || []);
        } catch (error) {
            console.error("Database Error:", error);
        } finally {
            setLoading(false);
        }
    }, [currentOrgId]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Automatically assign the "Member" role ID if it exists, or first available
    async function handleApprove(requestId) {
        // Find the ID for the role named "Member" in your roles table
        const defaultRole = availableRoles.find(r => r.role_created.toLowerCase() === 'member');
        const roleToAssign = defaultRole ? defaultRole.id : (availableRoles[0]?.id || null);

        const { error } = await supabase
            .from('org_members')
            .update({ 
                is_approved: true, 
                role: roleToAssign 
            })
            .eq('id', requestId);

        if (!error) fetchAllData();
    }

    async function handleUpdateRole() {
        if (!selectedMember || !selectedRoleId) return;
        
        const { error } = await supabase
            .from('org_members')
            .update({ role: selectedRoleId })
            .eq('id', selectedMember.id);
        
        if (!error) fetchAllData();
    }

    async function handleDeleteMember() {
        if (!selectedMember) return;
        const { error } = await supabase
            .from('org_members')
            .delete()
            .eq('id', selectedMember.id);
        
        if (!error) fetchAllData();
    }

    if (!user) return <div className="text-center mt-5">Loading authentication...</div>;

    return (
        <div className="container-fluid">
            <div className="row member-box bg-red">
                <div className="col-lg-12 mt-3">
                    <div className="row title-head">
                        <h1 className="fw-bold">Organization Members</h1>
                        <hr />
                    </div>

                    <div className="row header-row text-center d-flex flex-row mt-2 bg-dark">
                        <div className="col-6 col-md-3"><h5 className="fw-bold">Name</h5></div>
                        <div className="d-none d-md-block col-md-3"><h5 className="fw-bold">Department</h5></div>
                        <div className="d-none d-md-block col-md-3"><h5 className="fw-bold">Role</h5></div>
                        <div className="col-6 col-md-3"><h5 className="fw-bold">Actions</h5></div>
                    </div>

                    {loading ? <p className="text-center mt-4">Syncing with database...</p> : 
                        approvedMembers.map((m) => (
                            <div key={m.id} className="row body-row text-center d-flex flex-row mt-2 pt-3 border-bottom pb-2">
                                <div className="col-6 col-md-3"><h5>{m.student?.name}</h5></div>
                                <div className="d-none d-md-block col-md-3"><h5>{m.student?.department}</h5></div>
                                <div className="d-none d-md-block col-md-3">
                                    <span className="badge bg-primary px-3 py-2">
                                        {m.role_info?.role_created || "Unassigned"}
                                    </span>
                                </div>
                                <div className="col-6 col-md-3">
                                    <button className="btn btn-outline-dark btn-sm fw-bold" 
                                            data-bs-toggle="modal" 
                                            data-bs-target="#editRoleModal"
                                            onClick={() => {
                                                setSelectedMember(m);
                                                setSelectedRoleId(m.role_info?.id || "");
                                            }}>
                                        Manage
                                    </button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* Add Member Button with Request Count */}
            <div className="row mt-4">
                <div className="col-12 text-center text-lg-end">
                    <button className="create-btn py-3 px-5 shadow-lg btn btn-dark position-relative" data-bs-toggle="modal" data-bs-target="#addMemberModal">
                        <h4 className='fw-bold mb-0'>New Requests</h4>
                        {pendingStudents.length > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                {pendingStudents.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Modal: Pending Requests */}
            <div className="modal fade" id="addMemberModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header"><h5 className="modal-title fw-bold">Approve Members</h5></div>
                        <div className="modal-body">
                            {pendingStudents.length === 0 ? <p className="text-center text-muted">Clean slate! No requests.</p> : 
                                pendingStudents.map(req => (
                                    <div key={req.id} className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                                        <div>
                                            <h6 className="fw-bold mb-0">{req.student?.name}</h6>
                                            <small>{req.student?.department}</small>
                                        </div>
                                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(req.id)}>Approve</button>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Edit Role (DYNAMIC OPTIONS) */}
            <div className="modal fade" id="editRoleModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header"><h5 className="fw-bold">Edit Organization Role</h5></div>
                        <div className="modal-body">
                            <label className="mb-2">Select Role for {selectedMember?.student?.name}:</label>
                            <select 
                                className="form-select" 
                                value={selectedRoleId}
                                onChange={(e) => setSelectedRoleId(e.target.value)}
                            >
                                <option value="" disabled>Choose a role...</option>
                                {availableRoles.map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.role_created}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-footer d-flex justify-content-between">
                            <button className="btn btn-danger" data-bs-dismiss="modal" onClick={handleDeleteMember}>Remove Member</button>
                            <button className="btn btn-primary" data-bs-dismiss="modal" onClick={handleUpdateRole}>Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrgMembers;