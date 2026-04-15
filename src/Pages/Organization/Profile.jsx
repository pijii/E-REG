import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import '../../Styles/Organization.css';
import logoPlaceholder from '../../img/logo/E-Reg.png';

function OrgManagement() {
    const { user: authUser, loading: authLoading } = useAuth();
    const fileInputRef = useRef(null);
    
    // UI & Navigation State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Data States
    const [orgData, setOrgData] = useState({
        id: '', name: '', profile: logoPlaceholder,
        adviser: '', type: 'internal', email: '', account_id: ''
    });
    const [notifications, setNotifications] = useState([]);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [roles, setRoles] = useState([]);
    const [systemSettings, setSystemSettings] = useState({ auto_approval: false, maintenance_mode: false });

    // Modal & Form States
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roleForm, setRoleForm] = useState({ id: null, name: '', can_quick_login: false });
    
    // Password Change States
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    const [passwordStatus, setPasswordStatus] = useState({ message: '', isError: false });

    // Universal Confirmation Modal State
    const [confirmAction, setConfirmAction] = useState({ 
        show: false, title: '', message: '', onConfirm: null, isHazard: false 
    });

    useEffect(() => {
        if (authUser?.profile && authUser?.role === 'organization') {
            const profile = authUser.profile;
            setOrgData({
                id: profile.id,
                name: profile.name || '',
                profile: profile.profile || logoPlaceholder,
                adviser: profile.adviser || '',
                type: profile.type || 'internal',
                email: authUser.account?.email || '',
                account_id: profile.account_id
            });
            setSystemSettings({
                auto_approval: profile.auto_approval || false,
                maintenance_mode: profile.maintenance_mode || false
            });
            fetchRoles(profile.id);
            fetchNotifications(profile.account_id);
            setLoading(false);
        }
    }, [authUser]);

    const requestConfirmation = (title, message, action, isHazard = false) => {
        setConfirmAction({ show: true, title, message, onConfirm: action, isHazard });
    };

    // --- PROFILE IMAGE UPLOAD ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        requestConfirmation(
            "Change Profile Picture?",
            "Are you sure you want to upload this new logo for your organization?",
            async () => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${orgData.id}-${Math.random()}.${fileExt}`;
                const filePath = `org-profiles/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('profiles')
                    .upload(filePath, file);

                if (uploadError) {
                    setPasswordStatus({ message: "Upload failed: " + uploadError.message, isError: true });
                    return;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('profiles')
                    .getPublicUrl(filePath);

                const { error: dbError } = await supabase
                    .from('organization')
                    .update({ profile: publicUrl })
                    .eq('id', orgData.id);

                if (!dbError) setOrgData(prev => ({ ...prev, profile: publicUrl }));
            }
        );
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        requestConfirmation(
            "Update Profile Information?", 
            "Save the updated name and adviser details?",
            async () => {
                const { error } = await supabase.from('organization').update({
                    name: orgData.name,
                    adviser: orgData.adviser,
                    type: orgData.type
                }).eq('id', orgData.id);
                if (!error) setShowEditProfile(false);
            }
        );
    };

    // --- PASSWORD UPDATE ---
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setPasswordStatus({ message: '', isError: false });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordStatus({ message: "Passwords do not match.", isError: true });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordStatus({ message: "Password must be at least 6 characters.", isError: true });
            return;
        }

        requestConfirmation(
            "Update Password?",
            "You will be required to use this new password on your next login.",
            async () => {
                const { error } = await supabase.auth.updateUser({ 
                    password: passwordData.newPassword 
                });

                if (error) {
                    setPasswordStatus({ message: error.message, isError: true });
                } else {
                    setPasswordStatus({ message: "Password updated successfully!", isError: false });
                    setPasswordData({ newPassword: '', confirmPassword: '' });
                }
            }
        );
    };

    // --- NOTIFICATION ACTIONS ---
    const fetchNotifications = async (accId) => {
        const { data } = await supabase.from('notification').select('*').eq('user_id', accId).order('created_at', { ascending: false });
        if (data) setNotifications(data);
    };

    const handleReadNotification = async (id) => {
        const { error } = await supabase.from('notification').update({ is_read: true }).eq('id', id);
        if (!error) setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const markAllAsRead = () => {
        requestConfirmation("Mark All as Read?", "Mark all current notifications as seen?", async () => {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length > 0) {
                await supabase.from('notification').update({ is_read: true }).in('id', unreadIds);
                setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            }
        });
    };

    const deleteSelected = () => {
        requestConfirmation("Delete Selected?", "Remove chosen items permanently?", async () => {
            await supabase.from('notification').delete().in('id', selectedNotifications);
            setNotifications(notifications.filter(n => !selectedNotifications.includes(n.id)));
            setSelectedNotifications([]);
        }, true);
    };

    // --- ROLE ACTIONS ---
    const fetchRoles = async (orgId) => {
        const { data } = await supabase.from('roles').select('*').eq('org_id', orgId);
        if (data) setRoles(data);
    };

    const handleSaveRole = (e) => {
        e.preventDefault();
        requestConfirmation("Save Role Settings?", "Confirm changes to this board position?", async () => {
            if (roleForm.id) {
                const { error } = await supabase.from('roles').update({ 
                    role_created: roleForm.name,
                    can_quick_login: roleForm.can_quick_login 
                }).eq('id', roleForm.id);
                
                if (!error) {
                    setRoles(roles.map(r => r.id === roleForm.id ? { ...r, role_created: roleForm.name, can_quick_login: roleForm.can_quick_login } : r));
                }
            } else {
                const { data, error } = await supabase.from('roles').insert([{ 
                    role_created: roleForm.name, 
                    org_id: orgData.id,
                    can_quick_login: roleForm.can_quick_login
                }]).select();
                
                if (data) setRoles([...roles, data[0]]);
            }
            setShowRoleModal(false);
        });
    };

    const deleteRole = (id) => {
        requestConfirmation("Delete Role?", "Remove this position from the board?", async () => {
            await supabase.from('roles').delete().eq('id', id);
            setRoles(roles.filter(r => r.id !== id));
        }, true);
    };

    // --- SETTINGS ACTIONS ---
    const toggleSetting = (field, value) => {
        const label = field.replace('_', ' ').toUpperCase();
        requestConfirmation(`Toggle ${label}?`, `Set ${label} to ${value ? 'Enabled' : 'Disabled'}?`, async () => {
            setSystemSettings(prev => ({ ...prev, [field]: value }));
            await supabase.from('organization').update({ [field]: value }).eq('id', orgData.id);
        });
    };

    if (authLoading || loading) return <div className="p-5 text-center text-light fw-bold">Authenticating...</div>;

    return (
        <div className="container-fluid py-4">
            {/* PROFILE HEADER */}
            <div className="row shadow-lg p-4 bg-dark text-light align-items-center mb-4 mx-0 rounded-4 border-bottom border-danger border-4">
                <div className="col-12 col-lg-2 d-flex justify-content-center">
                    <div className="position-relative profile-wrapper" onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer' }}>
                        <img 
                            src={orgData.profile} 
                            alt="Logo" 
                            className='rounded-circle border border-3 border-secondary shadow-sm hover-opacity' 
                            style={{ width: '130px', height: '130px', objectFit: 'cover' }} 
                            onError={(e) => e.target.src = logoPlaceholder} 
                        />
                        <div className="position-absolute bottom-0 end-0 bg-danger text-white rounded-circle p-2 shadow" style={{ fontSize: '12px' }}>
                            <i className="bi bi-camera-fill"></i>
                        </div>
                        <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                    </div>
                </div>
                <div className="col-12 col-lg-10 text-center text-lg-start mt-3 mt-lg-0">
                    <h2 className='fw-bold text-uppercase mb-1 tracking-tighter'>{orgData.name}</h2>
                    <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-2">
                        <span className="badge bg-danger rounded-pill px-3 py-2 small">OFFICIAL {orgData.type}</span>
                        <span className={`badge rounded-pill px-3 py-2 small ${systemSettings.maintenance_mode ? 'bg-warning text-dark' : 'bg-success'}`}>
                            <i className={`bi bi-${systemSettings.maintenance_mode ? 'pause-circle' : 'check-circle-fill'} me-1`}></i>
                            {systemSettings.maintenance_mode ? 'MAINTENANCE MODE' : 'SYSTEM ACTIVE'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="row mx-0 g-4">
                {/* SIDEBAR */}
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-sticky" style={{ top: '20px' }}>
                        <div className="list-group list-group-flush">
                            {['overview', 'notifications', 'roles', 'settings'].map(tab => (
                                <button key={tab} className={`list-group-item p-3 border-0 fw-bold text-uppercase ${activeTab === tab ? 'bg-danger text-white active' : 'text-muted'}`} onClick={() => setActiveTab(tab)}>
                                    <i className={`bi bi-${tab === 'overview' ? 'grid' : tab === 'notifications' ? 'bell' : tab === 'roles' ? 'person-badge' : 'sliders'} me-3`}></i>
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="col-md-9">
                    <div className="card shadow-sm border-0 p-4 rounded-4 bg-white" style={{ minHeight: '550px' }}>
                        
                        {/* OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="animate-fade-in">
                                <div className="d-flex justify-content-between border-bottom pb-3 mb-4 align-items-center">
                                    <h5 className="fw-bold m-0 text-dark text-uppercase">Profile Summary</h5>
                                    <button className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-bold" onClick={() => setShowEditProfile(true)}>Edit Details</button>
                                </div>
                                <div className="row g-4">
                                    <div className="col-md-6"><label className="small fw-bold text-muted">FACULTY ADVISER</label><div className="p-3 bg-light rounded-3 fw-bold">{orgData.adviser}</div></div>
                                    <div className="col-md-6"><label className="small fw-bold text-muted">OFFICIAL EMAIL</label><div className="p-3 bg-light rounded-3 fw-bold">{orgData.email}</div></div>
                                    <div className="col-md-6"><label className="small fw-bold text-muted">ACCOUNT TYPE</label><div className="p-3 bg-light rounded-3 fw-bold text-uppercase">{orgData.type}</div></div>
                                    <div className="col-md-6">
                                        <label className="small fw-bold text-muted">OPERATIONAL STATUS</label>
                                        <div className="p-3 bg-light rounded-3 fw-bold text-uppercase">
                                            {systemSettings.maintenance_mode ? <span className="text-warning">Under Maintenance</span> : <span className="text-success">Fully Functional</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS */}
                        {activeTab === 'notifications' && (
                            <div className="animate-fade-in">
                                <div className="d-flex justify-content-between border-bottom pb-3 mb-4 align-items-center">
                                    <h5 className="fw-bold m-0 text-dark text-uppercase">Inbox</h5>
                                    <div className="d-flex gap-2">
                                        {selectedNotifications.length > 0 ? 
                                            <button className="btn btn-danger btn-sm rounded-pill px-3 fw-bold" onClick={deleteSelected}>Delete ({selectedNotifications.length})</button> :
                                            <button className="btn btn-dark btn-sm rounded-pill px-3 fw-bold" onClick={markAllAsRead}>Mark All Read</button>
                                        }
                                    </div>
                                </div>
                                <div className="custom-scroll pe-2" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                    {notifications.length > 0 ? notifications.map(n => (
                                        <div key={n.id} className={`p-3 mb-2 rounded-4 border-start border-4 d-flex align-items-center transition-all ${!n.is_read ? 'bg-light border-danger shadow-sm' : 'bg-white opacity-75 border-secondary'}`}>
                                            <input className="form-check-input me-3" type="checkbox" checked={selectedNotifications.includes(n.id)} onChange={() => setSelectedNotifications(prev => prev.includes(n.id) ? prev.filter(i => i !== n.id) : [...prev, n.id])} />
                                            <div className="flex-grow-1" onClick={() => handleReadNotification(n.id)} style={{ cursor: 'pointer' }}>
                                                <h6 className={`mb-0 ${!n.is_read ? 'fw-bold' : ''}`}>{n.title}</h6>
                                                <small className="text-muted">{n.message}</small>
                                            </div>
                                        </div>
                                    )) : <div className="text-center py-5 text-muted fw-bold">No new notifications.</div>}
                                </div>
                            </div>
                        )}

                        {/* ROLES */}
                        {activeTab === 'roles' && (
                            <div className="animate-fade-in">
                                <div className="d-flex justify-content-between border-bottom pb-3 mb-4 align-items-center">
                                    <h5 className="fw-bold m-0 text-dark text-uppercase">Board Members</h5>
                                    <button className="btn btn-danger btn-sm rounded-pill px-4 fw-bold shadow-sm" onClick={() => { setRoleForm({ id: null, name: '', can_quick_login: false }); setShowRoleModal(true); }}>
                                        <i className="bi bi-plus-lg me-2"></i>New Position
                                    </button>
                                </div>
                                <div className="row g-3 custom-scroll pe-2" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                    {roles.map(r => (
                                        <div key={r.id} className="col-md-6">
                                            <div className="role-card p-3 border rounded-4 d-flex justify-content-between align-items-center bg-light transition-all shadow-hover">
                                                <div className="d-flex flex-column">
                                                    <span className="fw-bold text-dark">{r.role_created}</span>
                                                    {r.can_quick_login && <small className="text-success fw-bold" style={{ fontSize: '10px' }}><i className="bi bi-lightning-fill"></i> QUICK LOGIN ENABLED</small>}
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-sm btn-warning rounded-circle shadow-sm p-2 d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }} onClick={() => { setRoleForm({ id: r.id, name: r.role_created, can_quick_login: r.can_quick_login }); setShowRoleModal(true); }}>
                                                        <i className="bi bi-pencil-fill text-white"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-danger rounded-circle shadow-sm p-2 d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }} onClick={() => deleteRole(r.id)}>
                                                        <i className="bi bi-trash3-fill text-white"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SETTINGS */}
                        {activeTab === 'settings' && (
                            <div className="animate-fade-in">
                                <h5 className="fw-bold border-bottom pb-3 mb-4 text-dark text-uppercase">Organization Controls</h5>
                                
                                <div className="p-4 bg-dark text-white rounded-4 mb-3 d-flex justify-content-between align-items-center shadow">
                                    <div><h6 className="fw-bold mb-0">Auto-Approval Mode</h6><small className="text-secondary small">Instantly verify participant registrations.</small></div>
                                    <div className="form-check form-switch"><input className="form-check-input fs-4" type="checkbox" checked={systemSettings.auto_approval} onChange={(e) => toggleSetting('auto_approval', e.target.checked)} /></div>
                                </div>
                                <div className="p-4 bg-light rounded-4 mb-4 d-flex justify-content-between align-items-center border border-warning border-start border-4 shadow-sm">
                                    <div><h6 className="fw-bold mb-0 text-dark">System Maintenance Mode</h6><small className="text-muted small">Disable all public organizational events.</small></div>
                                    <div className="form-check form-switch"><input className="form-check-input fs-4" type="checkbox" checked={systemSettings.maintenance_mode} onChange={(e) => toggleSetting('maintenance_mode', e.target.checked)} /></div>
                                </div>

                                <div className="mt-5 pt-3 border-top">
                                    <h5 className="fw-bold text-dark text-uppercase mb-3">Security & Privacy</h5>
                                    <form onSubmit={handlePasswordUpdate} className="p-4 border rounded-4 bg-white shadow-sm">
                                        <h6 className="fw-bold mb-3"><i className="bi bi-key-fill me-2 text-danger"></i>Update Password</h6>
                                        
                                        {passwordStatus.message && (
                                            <div className={`alert ${passwordStatus.isError ? 'alert-danger' : 'alert-success'} py-2 small fw-bold mb-3`}>
                                                {passwordStatus.message}
                                            </div>
                                        )}

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="small fw-bold text-muted mb-1">New Password</label>
                                                <input 
                                                    type="password" 
                                                    className="form-control rounded-3" 
                                                    placeholder="Minimum 6 characters"
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                                    required 
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="small fw-bold text-muted mb-1">Confirm New Password</label>
                                                <input 
                                                    type="password" 
                                                    className="form-control rounded-3" 
                                                    placeholder="Repeat new password"
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                                    required 
                                                />
                                            </div>
                                            <div className="col-12 text-end mt-4">
                                                <button type="submit" className="btn btn-dark rounded-pill px-4 fw-bold">
                                                    Update Password
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- UNIVERSAL MODALS --- */}

            {confirmAction.show && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1200 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 rounded-4 shadow-lg text-center p-4">
                            <i className={`bi ${confirmAction.isHazard ? 'bi-exclamation-triangle-fill text-danger' : 'bi-shield-fill-check text-primary'} fs-1 mb-2`}></i>
                            <h5 className="fw-bold">{confirmAction.title}</h5>
                            <p className="small text-muted mb-4">{confirmAction.message}</p>
                            <div className="d-flex gap-2">
                                <button className="btn btn-light w-100 fw-bold border" onClick={() => setConfirmAction({...confirmAction, show: false})}>Cancel</button>
                                <button className={`btn w-100 fw-bold ${confirmAction.isHazard ? 'btn-danger' : 'btn-dark'}`} onClick={() => { confirmAction.onConfirm(); setConfirmAction({...confirmAction, show: false}); }}>Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEditProfile && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <form className="modal-content border-0 rounded-4 shadow" onSubmit={handleUpdateProfile}>
                            <div className="modal-header bg-dark text-white p-3 border-0"><h5 className="modal-title fw-bold">Update Details</h5></div>
                            <div className="modal-body p-4">
                                <div className="mb-3"><label className="small fw-bold mb-1">Organization Name</label><input type="text" className="form-control rounded-3" value={orgData.name} onChange={e => setOrgData({...orgData, name: e.target.value})} required/></div>
                                <div className="mb-3"><label className="small fw-bold mb-1">Faculty Adviser</label><input type="text" className="form-control rounded-3" value={orgData.adviser} onChange={e => setOrgData({...orgData, adviser: e.target.value})} required/></div>
                            </div>
                            <div className="modal-footer border-0 p-3 pt-0">
                                <button type="button" className="btn btn-light fw-bold" onClick={() => setShowEditProfile(false)}>Close</button>
                                <button type="submit" className="btn btn-danger px-4 fw-bold shadow-sm">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showRoleModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <form className="modal-content border-0 rounded-4 shadow-lg" onSubmit={handleSaveRole}>
                            <div className="modal-header bg-danger text-white p-3 border-0"><h5 className="modal-title fw-bold">Modify Position</h5></div>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="small fw-bold mb-1">Position Title</label>
                                    <input type="text" className="form-control rounded-pill px-3 py-2 border-2" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} placeholder="e.g. Executive Secretary" required />
                                </div>
                                <div className="p-3 bg-light rounded-4 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="fw-bold mb-0" style={{ fontSize: '14px' }}>Allow Quick Login</h6>
                                        <small className="text-muted" style={{ fontSize: '11px' }}>Grant this role instant entry permission.</small>
                                    </div>
                                    <div className="form-check form-switch">
                                        <input 
                                            className="form-check-input fs-5" 
                                            type="checkbox" 
                                            checked={roleForm.can_quick_login} 
                                            onChange={(e) => setRoleForm({...roleForm, can_quick_login: e.target.checked})} 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-3 pt-0">
                                <button type="button" className="btn btn-light fw-bold" onClick={() => setShowRoleModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-dark px-4 fw-bold">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 5px; }
                .custom-scroll::-webkit-scrollbar-thumb { background-color: #dc3545; border-radius: 10px; }
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out forwards; }
                .hover-opacity:hover { opacity: 0.85; transition: 0.3s; }
                .shadow-hover:hover { box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.1) !important; transform: translateY(-2px); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

export default OrgManagement;