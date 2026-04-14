import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import '../../Styles/Organization.css';
import logoPlaceholder from '../../img/logo/E-Reg.png';

function OrgProfile() {
    const { user: authUser, loading: authLoading } = useAuth();
    
    // UI & Navigation State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const fileInputRef = useRef(null);

    // Modal Control States
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState({ show: false, type: '', id: null });

    // Data States
    const [orgData, setOrgData] = useState({
        id: '', name: '', org_id: '', profile_img: logoPlaceholder,
        adviser: '', type: 'internal', email: '', account_id: ''
    });
    const [roles, setRoles] = useState([]);
    const [roleForm, setRoleForm] = useState({ id: null, name: '' });
    const [notifications, setNotifications] = useState([]);
    const [systemSettings, setSystemSettings] = useState({ auto_approval: false, maintenance_mode: false });

    useEffect(() => {
        if (authUser?.profile && authUser?.role === 'organization') {
            const profile = authUser.profile;
            setOrgData({
                id: profile.id,
                name: profile.name || '',
                org_id: profile.org_id || '',
                profile_img: profile.profile_img || logoPlaceholder,
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

    // --- Notifications Logic ---
    const fetchNotifications = async (accId) => {
        const { data } = await supabase.from('notification').select('*').eq('user_id', accId).order('created_at', { ascending: false });
        if (data) setNotifications(data);
    };

    const handleReadNotification = async (id) => {
        const { error } = await supabase.from('notification').update({ is_read: true }).eq('id', id);
        if (!error) setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    // --- Roles Logic ---
    const fetchRoles = async (orgId) => {
        const { data } = await supabase.from('roles').select('*').eq('org_id', orgId);
        if (data) setRoles(data);
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        if (roleForm.id) {
            await supabase.from('roles').update({ role_created: roleForm.name }).eq('id', roleForm.id);
        } else {
            await supabase.from('roles').insert([{ role_created: roleForm.name, org_id: orgData.id }]);
        }
        fetchRoles(orgData.id);
        setShowRoleModal(false);
        setRoleForm({ id: null, name: '' });
    };

    // --- Reactive Settings Update ---
    const updateToggle = async (field, value) => {
        setSystemSettings(prev => ({ ...prev, [field]: value }));
        await supabase.from('organization').update({ [field]: value }).eq('id', orgData.id);
    };

    // --- Unified Delete Executor ---
    const executeDelete = async () => {
        const { type, id } = showDeleteConfirm;
        if (type === 'role') {
            await supabase.from('roles').delete().eq('id', id);
            setRoles(roles.filter(r => r.id !== id));
        } else if (type === 'notification') {
            await supabase.from('notification').delete().eq('id', id);
            setNotifications(notifications.filter(n => n.id !== id));
        }
        setShowDeleteConfirm({ show: false, type: '', id: null });
    };

    if (authLoading || loading) return <div className="p-5 text-center text-light fw-bold">Connecting to E-Reg...</div>;

    return (
        <div className="container-fluid py-4">
            {/* PRE-RENDERED PREMIUM HEADER */}
            <div className="row shadow-lg p-4 bg-dark text-light align-items-center mb-4 mx-0 rounded-4 border-bottom border-danger border-4 position-relative overflow-hidden">
                <div className="col-12 col-lg-2 d-flex justify-content-center position-relative">
                    <div className="profile-img-container shadow-lg" style={{ width: '130px', height: '130px' }}>
                        <img 
                            src={orgData.profile_img} 
                            alt="Org Logo" 
                            className='w-100 h-100 border border-3 border-secondary rounded-circle object-fit-cover' 
                            onError={(e) => e.target.src = logoPlaceholder}
                        />
                    </div>
                </div>
                <div className="col-12 col-lg-10 text-center text-lg-start mt-3 mt-lg-0">
                    <h2 className='fw-bold text-uppercase mb-1 tracking-tight'>{orgData.name}</h2>
                    <span className="badge bg-danger px-3 py-2 rounded-pill small">
                        <i className="bi bi-shield-check me-2"></i>Official {orgData.type} Organization
                    </span>
                </div>
            </div>

            <div className="row mx-0">
                {/* MODERN SIDEBAR */}
                <div className="col-md-3 mb-4">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="list-group list-group-flush">
                            {[
                                { id: 'overview', icon: 'grid-1x2-fill' },
                                { id: 'notifications', icon: 'bell-fill' },
                                { id: 'roles', icon: 'person-badge-fill' },
                                { id: 'settings', icon: 'sliders' }
                            ].map((tab) => (
                                <button 
                                    key={tab.id} 
                                    className={`list-group-item list-group-item-action p-3 border-0 d-flex align-items-center fw-bold ${activeTab === tab.id ? 'bg-danger text-white active' : 'text-muted'}`} 
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <i className={`bi bi-${tab.icon} me-3 fs-5`}></i>
                                    {tab.id.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="col-md-9">
                    <div className="card shadow-sm border-0 p-4 rounded-4 bg-white min-vh-50">
                        
                        {/* 1. OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="animate-fade-in">
                                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                                    <h5 className="fw-bold m-0 text-dark">General Information</h5>
                                    <button className="btn btn-outline-danger btn-sm rounded-pill px-4" onClick={() => setShowEditProfile(true)}>
                                        <i className="bi bi-pencil-square me-2"></i>Modify Profile
                                    </button>
                                </div>
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <label className="text-muted small fw-bold d-block mb-1">FACULTY ADVISER</label>
                                        <div className="p-3 bg-light rounded-3 fw-bold">{orgData.adviser}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted small fw-bold d-block mb-1">CONTACT EMAIL</label>
                                        <div className="p-3 bg-light rounded-3 fw-bold">{orgData.email}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted small fw-bold d-block mb-1">ORG ID / CODE</label>
                                        <div className="p-3 bg-light rounded-3 fw-bold">{orgData.org_id || 'Not Assigned'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. NOTIFICATIONS */}
                        {activeTab === 'notifications' && (
                            <div className="animate-fade-in">
                                <h5 className="fw-bold mb-4 border-bottom pb-3">Activity Inbox</h5>
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div key={n.id} className={`p-3 border rounded-4 mb-3 d-flex justify-content-between align-items-center transition-all ${!n.is_read ? 'bg-light border-danger shadow-sm border-start border-4' : 'opacity-75'}`}>
                                        <div onClick={() => handleReadNotification(n.id)} className="flex-grow-1" style={{cursor: 'pointer'}}>
                                            <h6 className={`mb-1 ${!n.is_read ? 'fw-bold text-dark' : 'text-muted'}`}>{n.title}</h6>
                                            <p className="small text-muted mb-0">{n.message}</p>
                                        </div>
                                        <button className="btn btn-sm btn-link text-danger fs-5" onClick={() => setShowDeleteConfirm({ show: true, type: 'notification', id: n.id })}>
                                            <i className="bi bi-trash3-fill"></i>
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-center py-5">
                                        <i className="bi bi-mailbox2 text-muted fs-1 d-block mb-3"></i>
                                        <p className="text-muted fw-bold">No notifications to display.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. ROLES (CRUD) */}
                        {activeTab === 'roles' && (
                            <div className="animate-fade-in">
                                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                                    <h5 className="fw-bold m-0 text-dark">Executive Board Roles</h5>
                                    <button className="btn btn-danger btn-sm rounded-pill px-3 fw-bold shadow-sm" onClick={() => { setRoleForm({ id: null, name: '' }); setShowRoleModal(true); }}>
                                        <i className="bi bi-plus-lg me-2"></i>New Position
                                    </button>
                                </div>
                                <div className="row g-3">
                                    {roles.map(r => (
                                        <div key={r.id} className="col-12 col-md-6">
                                            <div className="p-3 border rounded-4 d-flex justify-content-between align-items-center hover-shadow transition-all">
                                                <span className="fw-bold text-dark"><i className="bi bi-person-fill text-danger me-2"></i>{r.role_created}</span>
                                                <div className="btn-group">
                                                    <button className="btn btn-sm btn-light border" onClick={() => { setRoleForm({ id: r.id, name: r.role_created }); setShowRoleModal(true); }}><i className="bi bi-pencil text-primary"></i></button>
                                                    <button className="btn btn-sm btn-light border text-danger" onClick={() => setShowDeleteConfirm({ show: true, type: 'role', id: r.id })}><i className="bi bi-trash"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 4. SYSTEM SETTINGS */}
                        {activeTab === 'settings' && (
                            <div className="animate-fade-in">
                                <h5 className="fw-bold mb-4 border-bottom pb-3">Configuration</h5>
                                <div className="p-4 bg-light rounded-4 mb-3 border-start border-4 border-danger shadow-sm">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="fw-bold mb-1">Auto-Approval System</h6>
                                            <p className="small text-muted mb-0">Allow students to join without manual intervention.</p>
                                        </div>
                                        <div className="form-check form-switch">
                                            <input className="form-check-input fs-4" type="checkbox" checked={systemSettings.auto_approval} onChange={(e) => updateToggle('auto_approval', e.target.checked)} />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-light rounded-4 mb-3 border-start border-4 border-warning shadow-sm">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="fw-bold mb-1">Maintenance Lock</h6>
                                            <p className="small text-muted mb-0">Prevent new registrations and hide current events.</p>
                                        </div>
                                        <div className="form-check form-switch">
                                            <input className="form-check-input fs-4" type="checkbox" checked={systemSettings.maintenance_mode} onChange={(e) => updateToggle('maintenance_mode', e.target.checked)} />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center mt-4">
                                    <small className="badge bg-secondary-subtle text-muted fw-normal"><i className="bi bi-check2-circle me-1"></i>System updates are reactive and saved instantly.</small>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- REFINED MODALS --- */}

            {/* Profile Update Modal */}
            {showEditProfile && (
                <div className="modal show d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <form className="modal-content border-0 rounded-4 shadow-2xl" onSubmit={async (e) => {
                            e.preventDefault();
                            await supabase.from('organization').update({ name: orgData.name, adviser: orgData.adviser, type: orgData.type }).eq('id', orgData.id);
                            setShowEditProfile(false);
                        }}>
                            <div className="modal-header bg-dark text-white rounded-top-4 p-4">
                                <h5 className="modal-title fw-bold">Update Organization Details</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditProfile(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="mb-3"><label className="small fw-bold">Display Name</label><input type="text" className="form-control rounded-3" value={orgData.name} onChange={e => setOrgData({...orgData, name: e.target.value})} /></div>
                                <div className="mb-3"><label className="small fw-bold">Assigned Adviser</label><input type="text" className="form-control rounded-3" value={orgData.adviser} onChange={e => setOrgData({...orgData, adviser: e.target.value})} /></div>
                                <div className="mb-3">
                                    <label className="small fw-bold">Organization Type</label>
                                    <select className="form-select rounded-3" value={orgData.type} onChange={e => setOrgData({...orgData, type: e.target.value})}>
                                        <option value="internal">Internal</option>
                                        <option value="external">External</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button type="button" className="btn btn-light fw-bold" onClick={() => setShowEditProfile(false)}>Dismiss</button>
                                <button type="submit" className="btn btn-danger px-4 fw-bold shadow">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Role Manager Modal */}
            {showRoleModal && (
                <div className="modal show d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <form className="modal-content border-0 rounded-4" onSubmit={handleSaveRole}>
                            <div className="modal-header border-bottom-0"><h5 className="modal-title fw-bold">{roleForm.id ? 'Edit Officer Title' : 'Add New Position'}</h5></div>
                            <div className="modal-body p-4 pt-0">
                                <input type="text" className="form-control form-control-lg rounded-3 border-2" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} placeholder="e.g. Executive Secretary" required />
                            </div>
                            <div className="modal-footer border-0"><button type="submit" className="btn btn-danger w-100 py-3 fw-bold rounded-3 shadow-sm">{roleForm.id ? 'UPDATE POSITION' : 'CREATE POSITION'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modern Danger Confirmation */}
            {showDeleteConfirm.show && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4 text-center p-4">
                            <div className="text-danger mb-3"><i className="bi bi-exclamation-circle-fill fs-1"></i></div>
                            <h5 className="fw-bold">Remove Record?</h5>
                            <p className="small text-muted">This will be permanently deleted from the E-Reg system.</p>
                            <div className="d-flex gap-2 mt-3">
                                <button className="btn btn-secondary w-100 fw-bold" onClick={() => setShowDeleteConfirm({ show: false, type: '', id: null })}>Keep</button>
                                <button className="btn btn-danger w-100 fw-bold shadow-sm" onClick={executeDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrgProfile;