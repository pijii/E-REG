import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import '../../Styles/Organization.css'; 
import logoPlaceholder from '../../img/logo/E-Reg.png';

function StudentManagement() {
    const { user: authUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    
    // UI & Navigation State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Data States
    const [studentData, setStudentData] = useState({
        profile_id: '', name: '', department: '', year_level: '', 
        section: '', profile: logoPlaceholder, email: '', account_id: ''
    });
    
    const [notifications, setNotifications] = useState([]);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [accessibleOrg, setAccessibleOrg] = useState(null);

    // Modal & Form States
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    
    // Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    // Universal Modal State
    const [confirmAction, setConfirmAction] = useState({ 
        show: false, title: '', message: '', onConfirm: null, 
        isHazard: false, isStatusOnly: false, isSuccess: false 
    });

    useEffect(() => {
        if (authUser?.profile && authUser?.role === 'student') {
            const profile = authUser.profile;
            setStudentData({
                profile_id: profile.profile_id,
                name: profile.name || '',
                department: profile.department || '',
                year_level: profile.year_level || '',
                section: profile.section || '',
                profile: profile.profile || logoPlaceholder,
                email: authUser.account?.email || '',
                account_id: profile.account_id
            });
            
            fetchNotifications(profile.account_id);
            checkOrganizationAccess(profile.profile_id); 
            setLoading(false);
        }
    }, [authUser]);

    // --- MODAL UTILS ---
    const showStatusMessage = (title, message, isError = false, isSuccess = false) => {
        setConfirmAction({
            show: true, title, message, onConfirm: null, isHazard: isError, isStatusOnly: true, isSuccess: isSuccess
        });
    };

    const requestConfirmation = (title, message, action, isHazard = false) => {
        setConfirmAction({ show: true, title, message, onConfirm: action, isHazard, isStatusOnly: false, isSuccess: false });
    };

    // --- LOGIC: ORGANIZATION ACCESS (Using Table 9 & 10) ---
    const checkOrganizationAccess = async (studentId) => {
        try {
            // Joins org_members with organization and roles to check permissions
            const { data, error } = await supabase
                .from('org_members')
                .select(`
                    org_id,
                    is_approved,
                    organization:org_id ( name ),
                    role_info:role ( 
                        role_created, 
                        can_quick_login 
                    )
                `)
                .eq('student_id', studentId)
                .eq('is_approved', true)
                .single();

            if (error) throw error;

            // Check the boolean flag from the roles table
            if (data && data.role_info?.can_quick_login) {
                setAccessibleOrg({
                    id: data.org_id,
                    name: data.organization.name,
                    roleName: data.role_info.role_created
                });
            }
        } catch (err) {
            console.error("Access verification failed:", err.message);
            setAccessibleOrg(null);
        }
    };

    const handleSwitchToOrg = () => {
        requestConfirmation(
            "Enter Organization Panel?", 
            `Switching to ${accessibleOrg.name} management mode as ${accessibleOrg.roleName}.`, 
            () => navigate('/organization/dashboard')
        );
    };

    // --- LOGIC: PASSWORD SECURITY ---
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        
        if (newPassword.length < 6) {
            return showStatusMessage("Security Error", "New password must be at least 6 characters.", true);
        }

        const { error: reauthError } = await supabase.auth.signInWithPassword({
            email: studentData.email,
            password: currentPassword,
        });

        if (reauthError) {
            return showStatusMessage("Authentication Failed", "Incorrect current password.", true);
        }

        requestConfirmation(
            "Confirm Update?",
            "Your login credentials will be permanently changed.",
            async () => {
                const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
                
                if (updateError) {
                    showStatusMessage("Error", updateError.message, true);
                } else {
                    showStatusMessage("Success", "Password updated successfully.", false, true);
                    setCurrentPassword('');
                    setNewPassword('');
                    setShowPasswordModal(false);
                }
            }
        );
    };

    // --- LOGIC: PROFILE & NOTIFICATIONS ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        requestConfirmation("Profile Update", "Upload new profile photo?", async () => {
            const fileName = `student-${studentData.profile_id}-${Date.now()}`;
            const { error: uploadError } = await supabase.storage.from('profiles').upload(`student-profiles/${fileName}`, file);
            if (uploadError) return showStatusMessage("Upload Error", uploadError.message, true);
            const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(`student-profiles/${fileName}`);
            await supabase.from('student').update({ profile: publicUrl }).eq('profile_id', studentData.profile_id);
            setStudentData(prev => ({ ...prev, profile: publicUrl }));
            showStatusMessage("Success", "Avatar updated.", false, true);
        });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('student').update({
            name: studentData.name, 
            department: studentData.department, 
            year_level: studentData.year_level, 
            section: studentData.section
        }).eq('profile_id', studentData.profile_id);
        
        if (!error) { 
            setShowEditProfile(false); 
            showStatusMessage("Saved", "Profile data updated.", false, true); 
        }
    };

    const fetchNotifications = async (accId) => {
        const { data } = await supabase.from('notification').select('*').eq('user_id', accId).order('created_at', { ascending: false });
        if (data) setNotifications(data);
    };

    const handleReadNotification = async (id) => {
        await supabase.from('notification').update({ is_read: true }).eq('id', id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const markAllAsRead = () => {
        requestConfirmation("Mark All Read", "Clear notifications?", async () => {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length > 0) {
                await supabase.from('notification').update({ is_read: true }).in('id', unreadIds);
                setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            }
        });
    };

    const deleteSelected = () => {
        requestConfirmation("Delete?", "Remove selected notifications?", async () => {
            await supabase.from('notification').delete().in('id', selectedNotifications);
            setNotifications(notifications.filter(n => !selectedNotifications.includes(n.id)));
            setSelectedNotifications([]);
        }, true);
    };

    if (authLoading || loading) return <div className="p-5 text-center text-light fw-bold">Connecting...</div>;

    return (
        <div className="container-fluid py-4">
            {/* BANNER */}
            <div className="row shadow-lg p-4 bg-dark text-light align-items-center mb-4 mx-0 rounded-4 border-bottom border-danger border-4">
                <div className="col-12 col-lg-2 d-flex justify-content-center">
                    <div className="position-relative profile-wrapper" onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer' }}>
                        <img src={studentData.profile} className='rounded-circle border border-3 border-secondary shadow-sm hover-opacity' style={{ width: '130px', height: '130px', objectFit: 'cover' }} onError={(e) => e.target.src = logoPlaceholder} />
                        <div className="position-absolute bottom-0 end-0 bg-danger text-white rounded-circle p-2 shadow" style={{ fontSize: '12px' }}><i className="bi bi-camera-fill"></i></div>
                        <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                    </div>
                </div>
                <div className="col-12 col-lg-10 text-center text-lg-start mt-3 mt-lg-0">
                    <h2 className='fw-bold text-uppercase mb-1 tracking-tighter'>{studentData.name}</h2>
                    <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-2">
                        <span className="badge bg-danger rounded-pill px-3 py-2 small">ID: {studentData.profile_id}</span>
                        <span className="badge bg-secondary rounded-pill px-3 py-2 small">{studentData.department}</span>
                    </div>
                </div>
            </div>

            <div className="row mx-0 g-4">
                {/* NAVIGATION */}
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-sticky" style={{ top: '20px' }}>
                        <div className="list-group list-group-flush">
                            {['overview', 'notifications', 'settings'].map(tab => (
                                <button key={tab} className={`list-group-item p-3 border-0 fw-bold text-uppercase ${activeTab === tab ? 'bg-danger text-white active' : 'text-muted'}`} onClick={() => setActiveTab(tab)}>
                                    <i className={`bi bi-${tab === 'overview' ? 'person-badge' : tab === 'notifications' ? 'bell' : 'sliders'} me-3`}></i>{tab}
                                </button>
                            ))}
                        </div>
                        {accessibleOrg && (
                            <div className="p-3 bg-light border-top text-center">
                                <p className="small fw-bold text-muted mb-0">OFFICER ACCESS GRANTED</p>
                                <p className="text-danger small fw-bold mb-2">{accessibleOrg.roleName}</p>
                                <button className="btn btn-dark w-100 rounded-pill fw-bold btn-sm py-2 shadow-sm" onClick={handleSwitchToOrg}>
                                    <i className="bi bi-shield-lock-fill me-2 text-danger"></i>LOGIN AS OFFICER
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* CONTENT */}
                <div className="col-md-9">
                    <div className="card shadow-sm border-0 p-4 rounded-4 bg-white" style={{ minHeight: '550px' }}>
                        {activeTab === 'overview' && (
                            <div className="animate-fade-in">
                                <div className="d-flex justify-content-between border-bottom pb-3 mb-4 align-items-center">
                                    <h5 className="fw-bold m-0 text-dark text-uppercase">Academic Profile</h5>
                                    <button className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-bold" onClick={() => setShowEditProfile(true)}>Update Info</button>
                                </div>
                                <div className="row g-4">
                                    <div className="col-md-6"><label className="small fw-bold text-muted">DEPARTMENT</label><div className="p-3 bg-light rounded-3 fw-bold">{studentData.department || 'N/A'}</div></div>
                                    <div className="col-md-6"><label className="small fw-bold text-muted">EMAIL</label><div className="p-3 bg-light rounded-3 fw-bold">{studentData.email}</div></div>
                                    <div className="col-md-6"><label className="small fw-bold text-muted">YEAR LEVEL</label><div className="p-3 bg-light rounded-3 fw-bold">{studentData.year_level || 'N/A'}</div></div>
                                    <div className="col-md-6"><label className="small fw-bold text-muted">SECTION</label><div className="p-3 bg-light rounded-3 fw-bold">{studentData.section || 'N/A'}</div></div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="animate-fade-in">
                                <div className="d-flex justify-content-between border-bottom pb-3 mb-4 align-items-center">
                                    <h5 className="fw-bold m-0 text-dark text-uppercase">Inbox</h5>
                                    <div className="d-flex gap-2">
                                        {selectedNotifications.length > 0 ? <button className="btn btn-danger btn-sm rounded-pill px-3 fw-bold" onClick={deleteSelected}>Delete ({selectedNotifications.length})</button> : <button className="btn btn-dark btn-sm rounded-pill px-3 fw-bold" onClick={markAllAsRead}>Mark All Read</button>}
                                    </div>
                                </div>
                                <div className="custom-scroll pe-2" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                    {notifications.length > 0 ? notifications.map(n => (
                                        <div key={n.id} className={`p-3 mb-2 rounded-4 border-start border-4 d-flex align-items-center ${!n.is_read ? 'bg-light border-danger shadow-sm' : 'bg-white opacity-75'}`}>
                                            <input className="form-check-input me-3" type="checkbox" checked={selectedNotifications.includes(n.id)} onChange={() => setSelectedNotifications(prev => prev.includes(n.id) ? prev.filter(i => i !== n.id) : [...prev, n.id])} />
                                            <div className="flex-grow-1" onClick={() => handleReadNotification(n.id)} style={{ cursor: 'pointer' }}><h6 className={`mb-0 ${!n.is_read ? 'fw-bold' : ''}`}>{n.title}</h6><small className="text-muted">{n.message}</small></div>
                                        </div>
                                    )) : <div className="text-center py-5 text-muted fw-bold">No new updates.</div>}
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="animate-fade-in">
                                <h5 className="fw-bold border-bottom pb-3 mb-4 text-dark text-uppercase">Account Security</h5>
                                <div className="p-4 bg-light rounded-4 border-start border-4 border-danger d-flex justify-content-between align-items-center shadow-sm">
                                    <div><h6 className="fw-bold mb-0 text-dark">Password Management</h6><small className="text-muted small">Keep your account secure with a strong password.</small></div>
                                    <button className="btn btn-danger rounded-pill px-4 fw-bold btn-sm shadow-sm" onClick={() => setShowPasswordModal(true)}>Change Password</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- FEEDBACK MODAL --- */}
            {confirmAction.show && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1400 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 rounded-4 shadow-lg text-center p-4">
                            <i className={`bi fs-1 mb-2 ${confirmAction.isHazard ? 'bi-exclamation-octagon-fill text-danger' : confirmAction.isSuccess ? 'bi-check-circle-fill text-success animate-bounce' : 'bi-shield-lock-fill text-primary'}`}></i>
                            <h5 className={`fw-bold ${confirmAction.isSuccess ? 'text-success' : ''}`}>{confirmAction.title}</h5>
                            <p className="small text-muted mb-4">{confirmAction.message}</p>
                            <div className="d-flex gap-2">
                                {!confirmAction.isStatusOnly && <button className="btn btn-light w-100 fw-bold border" onClick={() => setConfirmAction({...confirmAction, show: false})}>Cancel</button>}
                                <button className={`btn w-100 fw-bold ${confirmAction.isHazard ? 'btn-danger' : confirmAction.isSuccess ? 'btn-success' : 'btn-dark'}`} 
                                    onClick={() => { if (confirmAction.onConfirm) confirmAction.onConfirm(); setConfirmAction({...confirmAction, show: false}); }}>
                                    {confirmAction.isStatusOnly ? 'OK' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FORMS (PASSWORD & PROFILE) --- */}
            {showPasswordModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1200 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <form className="modal-content border-0 rounded-4 shadow" onSubmit={handlePasswordUpdate}>
                            <div className="modal-header bg-dark text-white p-3 border-0"><h5 className="modal-title fw-bold">SECURITY SETTINGS</h5></div>
                            <div className="modal-body p-4">
                                <div className="mb-3"><label className="small fw-bold">Current Password</label><input type="password" placeholder="Verify identity" className="form-control" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
                                <div className="mb-3"><label className="small fw-bold">New Password</label><input type="password" placeholder="Must have Characters and Numbers" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} required /></div>
                            </div>
                            <div className="modal-footer border-0 p-3 pt-0"><button type="button" className="btn btn-light fw-bold" onClick={() => setShowPasswordModal(false)}>Cancel</button><button type="submit" className="btn btn-danger px-4 fw-bold">Update</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showEditProfile && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1200 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <form className="modal-content border-0 rounded-4 shadow" onSubmit={handleUpdateProfile}>
                            <div className="modal-header bg-dark text-white p-3 border-0"><h5 className="modal-title fw-bold">EDIT INFO</h5></div>
                            <div className="modal-body p-4">
                                <div className="mb-3"><label className="small fw-bold">Name</label><input type="text" className="form-control" value={studentData.name} onChange={e => setStudentData({...studentData, name: e.target.value})} required/></div>
                                <div className="mb-3"><label className="small fw-bold">Dept</label><input type="text" className="form-control" value={studentData.department} onChange={e => setStudentData({...studentData, department: e.target.value})} /></div>
                                <div className="row">
                                    <div className="col-6"><label className="small fw-bold">Year</label><input type="number" className="form-control" value={studentData.year_level} onChange={e => setStudentData({...studentData, year_level: e.target.value})} /></div>
                                    <div className="col-6"><label className="small fw-bold">Sec</label><input type="text" className="form-control" value={studentData.section} onChange={e => setStudentData({...studentData, section: e.target.value})} /></div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-3 pt-0"><button type="button" className="btn btn-light fw-bold" onClick={() => setShowEditProfile(false)}>Close</button><button type="submit" className="btn btn-danger px-4 fw-bold">Save</button></div>
                        </form>
                    </div>
                </div>
            )}
            
            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 5px; } 
                .custom-scroll::-webkit-scrollbar-thumb { background-color: #dc3545; border-radius: 10px; } 
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out forwards; } 
                .animate-bounce { animation: bounce 0.6s ease infinite alternate; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes bounce { from { transform: scale(1); } to { transform: scale(1.1); } }
            `}</style>
        </div>
    );
}

export default StudentManagement;