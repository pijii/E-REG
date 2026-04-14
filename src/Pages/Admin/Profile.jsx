import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient'; 
import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

function AdminProfile() {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false); 
    const fileInputRef = useRef(null);
    
    const [selectedIds, setSelectedIds] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const [adminData, setAdminData] = useState({
        profile_id: '',
        account_id: '',
        name: '',
        email: '',
        profile_img: logo,
        school_id: '',
        school_name: 'Not Assigned',
        school_location: '',
        school_zip: ''
    });

    const [systemSettings, setSystemSettings] = useState({
        maintenanceMode: false,
        autoApprove: false
    });

    const [stats, setStats] = useState({ 
        eventCount: 0,
        pendingEvents: 0,
        studentCount: 0,
        orgCount: 0,
        notificationCount: 0
    });

    useEffect(() => {
        getProfile();
    }, []);

    async function getProfile() {
        try {
            setLoading(true);
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("No user logged in");

            let { data, error } = await supabase
                .from('admin')
                .select(`
                    profile_id, name, profile_img, account_id, school_id,
                    maintenance_mode, auto_approval,
                    account:account_id!inner ( email, auth_id ),
                    school:school_id ( name, location, zip_code )
                `)
                .eq('account.auth_id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setAdminData({
                    profile_id: data.profile_id,
                    account_id: data.account_id,
                    name: data.name || 'No Name Set',
                    email: data.account?.email || user.email,
                    profile_img: data.profile_img || logo,
                    school_id: data.school_id,
                    school_name: data.school?.name || 'School Not Linked',
                    school_location: data.school?.location || 'Address not found',
                    school_zip: data.school?.zip_code || 'N/A'
                });
                
                setSystemSettings({
                    maintenanceMode: data.maintenance_mode,
                    autoApprove: data.auto_approval
                });

                fetchStats(data.account_id);
                fetchNotifications(data.account_id);
            }
        } catch (error) {
            console.error('Error loading admin profile:', error.message);
        } finally {
            setLoading(false);
        }
    }

    const fetchStats = async (accId) => {
        try {
            const targetId = accId || adminData.account_id;
            if (!targetId) return;

            const [events, pending, students, orgs, notifCount] = await Promise.all([
                supabase.from('event').select('*', { count: 'exact', head: true }),
                supabase.from('event').select('*', { count: 'exact', head: true }).eq('is_approve', false),
                supabase.from('student').select('*', { count: 'exact', head: true }),
                supabase.from('organization').select('*', { count: 'exact', head: true }),
                supabase.from('notification').select('*', { count: 'exact', head: true })
                    .eq('user_id', targetId).eq('is_read', false)
            ]);

            setStats({ 
                eventCount: events.count || 0,
                pendingEvents: pending.count || 0,
                studentCount: students.count || 0,
                orgCount: orgs.count || 0,
                notificationCount: notifCount.count || 0
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchNotifications = async (accId) => {
        try {
            const targetId = accId || adminData.account_id;
            if (!targetId) return;

            const { data, error } = await supabase
                .from('notification')
                .select('*')
                .eq('user_id', targetId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    // --- PROFILE UPDATE LOGIC ---
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('admin')
                .update({ name: adminData.name })
                .eq('profile_id', adminData.profile_id);

            if (error) throw error;
            
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Update failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- SELECTION LOGIC ---
    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === notifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(notifications.map(n => n.id)); // Use 'id' based on your SQL schema
        }
    };

    // --- BULK ACTIONS ---
    const handleBulkMarkRead = async () => {
        if (selectedIds.length === 0) return;
        try {
            const { error } = await supabase
                .from('notification')
                .update({ is_read: true })
                .in('id', selectedIds);

            if (error) throw error;
            
            setNotifications(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, is_read: true } : n));
            setSelectedIds([]);
            fetchStats(adminData.account_id);
        } catch (error) {
            console.error("Error updating notifications:", error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        
        try {
            const { error } = await supabase
                .from('notification')
                .delete()
                .in('id', selectedIds);

            if (error) {
                alert(`Delete Failed: ${error.message}`);
                return;
            }
            
            setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
            setSelectedIds([]);
            setShowDeleteModal(false);
            fetchStats(adminData.account_id);
        } catch (error) {
            console.error("Unexpected error:", error);
            alert("An unexpected error occurred during deletion.");
        }
    };

    const markAsRead = async (notifId) => {
        try {
            const { error } = await supabase
                .from('notification')
                .update({ is_read: true })
                .eq('id', notifId);

            if (error) throw error;
            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
            fetchStats(adminData.account_id);
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const handleSettingToggle = async (settingKey) => {
        const dbField = settingKey === 'maintenanceMode' ? 'maintenance_mode' : 'auto_approval';
        const newValue = !systemSettings[settingKey];

        try {
            const { error } = await supabase
                .from('admin')
                .update({ [dbField]: newValue })
                .eq('profile_id', adminData.profile_id);

            if (error) throw error;
            setSystemSettings(prev => ({ ...prev, [settingKey]: newValue }));
        } catch (error) {
            alert("Update failed: " + error.message);
        }
    };

    const uploadProfilePic = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `admin-${adminData.profile_id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { contentType: file.type, upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('admin')
                .update({ profile_img: publicUrl })
                .eq('profile_id', adminData.profile_id);

            if (updateError) throw updateError;

            setAdminData(prev => ({ ...prev, profile_img: publicUrl }));
        } catch (error) {
            console.error("Photo Error:", error.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading && !adminData.profile_id) return <div className="text-center p-5 text-light fw-bold">Connecting to E-Reg...</div>;

    return (
        <div className="container-fluid py-4">
            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title fw-bold"><i className="bi bi-trash3-fill me-2"></i>Confirm Delete</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
                            </div>
                            <div className="modal-body text-dark py-4">
                                <p className="mb-0">Are you sure you want to delete <strong>{selectedIds.length}</strong> selected notification(s)? This cannot be undone.</p>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-secondary px-4 fw-bold" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                <button className="btn btn-danger px-4 fw-bold" onClick={handleBulkDelete}>Delete Now</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PROFILE HEADER */}
            <div className="row shadow-lg event-round p-3 p-md-4 gap-3 bg-dark text-light align-items-center mb-4 mx-0">
                <div className='col-12 col-lg-2 d-flex justify-content-center justify-content-lg-start'>
                    <div className='avatar-wrapper shadow mx-auto mx-lg-0' style={{cursor: 'pointer'}} onClick={() => !uploading && fileInputRef.current.click()}>
                        {uploading ? (
                            <div className="d-flex justify-content-center align-items-center w-100 h-100 bg-secondary rounded-3">
                                <div className="spinner-border text-light" role="status"></div>
                            </div>
                        ) : (
                            <div className="position-relative">
                                <img src={adminData.profile_img} alt="Admin" className='img-fluid object-fit-cover w-100 h-100 border border-secondary rounded-3' style={{aspectRatio: '1/1'}} onError={(e) => e.target.src = logo} />
                                <div className="change-photo-overlay">
                                    <i className="bi bi-camera fs-1 mb-1"></i>
                                    <span className="small fw-bold">Change Photo</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={uploadProfilePic} className="d-none" accept="image/*" />
                </div>

                <div className="col-12 col-lg-9 text-center text-md-start">
                    <span className="badge bg-danger mb-2">SYSTEM ADMINISTRATOR</span>
                    <h2 className='fw-bold mb-0'>{adminData.name}</h2>
                    <p className='text-danger fw-semibold mb-1'><i className="bi bi-building-fill me-2"></i>{adminData.school_name}</p>
                    
                    <div className="d-flex flex-wrap gap-4 justify-content-center justify-content-md-start mt-3">
                        <div>
                            <h4 className="fw-bold mb-0">{stats.eventCount}</h4>
                            <small className="text-uppercase opacity-50 small">Events</small>
                        </div>
                        <div className="border-start ps-4">
                            <h4 className="fw-bold mb-0">{stats.orgCount}</h4>
                            <small className="text-uppercase opacity-50 small">Orgs</small>
                        </div>
                        <div className="border-start ps-4">
                            <h4 className="fw-bold mb-0">{stats.studentCount}</h4>
                            <small className="text-uppercase opacity-50 small">Students</small>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mx-0">
                {/* SIDEBAR NAVIGATION */}
                <div className="col-md-3 mb-4">
                    <div className="list-group shadow-sm border-0 mb-4">
                        <button className={`list-group-item list-group-item-action p-3 fw-bold ${activeTab === 'overview' ? 'active bg-danger border-danger text-white' : ''}`} onClick={() => setActiveTab('overview')}>
                            <i className="bi bi-person-badge me-2"></i> Profile & School
                        </button>
                        <button className={`list-group-item list-group-item-action p-3 fw-bold ${activeTab === 'notifications' ? 'active bg-danger border-danger text-white' : ''}`} onClick={() => setActiveTab('notifications')}>
                            <i className="bi bi-bell me-2"></i> Notifications 
                            {stats.notificationCount > 0 && <span className="badge rounded-pill bg-warning text-dark float-end">{stats.notificationCount}</span>}
                        </button>
                        <button className={`list-group-item list-group-item-action p-3 fw-bold ${activeTab === 'system' ? 'active bg-danger border-danger text-white' : ''}`} onClick={() => setActiveTab('system')}>
                            <i className="bi bi-gear-wide-connected me-2"></i> System Settings
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="col-md-9">
                    <div className="card shadow-sm border-0 p-4 bg-white min-vh-50">
                        
                        {/* TAB: PROFILE OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="animate-fade-in">
                                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                                    <h5 className="fw-bold mb-0 text-dark">Administrative Profile</h5>
                                    <button className={`btn btn-sm ${isEditing ? 'btn-secondary' : 'btn-outline-danger'} px-4 rounded-pill`} onClick={() => setIsEditing(!isEditing)}>
                                        {isEditing ? 'Cancel' : 'Edit Profile'}
                                    </button>
                                </div>

                                {isEditing ? (
                                    <form onSubmit={handleUpdateProfile}>
                                        <div className="mb-4">
                                            <label className="form-label small fw-bold text-muted">DISPLAY NAME</label>
                                            <input type="text" className="form-control form-control-lg border-2" value={adminData.name} onChange={(e) => setAdminData({...adminData, name: e.target.value})} required />
                                        </div>
                                        <button type="submit" className="btn btn-danger px-5 py-2 fw-bold" disabled={loading}>
                                            {loading ? 'Updating...' : 'Update Profile'}
                                        </button>
                                    </form>
                                ) : (
                                    <>
                                        <div className="row mb-3">
                                            <div className="col-sm-4 text-muted small fw-bold">FULL NAME</div>
                                            <div className="col-sm-8 fw-semibold text-dark">{adminData.name}</div>
                                        </div>
                                        <div className="row mb-5">
                                            <div className="col-sm-4 text-muted small fw-bold">EMAIL ADDRESS</div>
                                            <div className="col-sm-8 fw-semibold text-dark">{adminData.email}</div>
                                        </div>
                                        
                                        <h5 className="fw-bold border-bottom pb-3 mb-4 text-dark">School Information</h5>
                                        <div className="row mb-3">
                                            <div className="col-sm-4 text-muted small fw-bold">INSTITUTION</div>
                                            <div className="col-sm-8 fw-bold text-danger">{adminData.school_name}</div>
                                        </div>
                                        <div className="row mb-3">
                                            <div className="col-sm-4 text-muted small fw-bold">LOCATION</div>
                                            <div className="col-sm-8 fw-semibold text-dark">{adminData.school_location}</div>
                                        </div>
                                        <div className="row mb-3">
                                            <div className="col-sm-4 text-muted small fw-bold">ZIP CODE</div>
                                            <div className="col-sm-8 fw-semibold text-dark">{adminData.school_zip}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* TAB: NOTIFICATIONS */}
                        {activeTab === 'notifications' && (
                            <div className="animate-fade-in">
                                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                                    <h5 className="fw-bold mb-0 text-dark">Notification Inbox</h5>
                                    {notifications.length > 0 && (
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="small text-muted">{selectedIds.length}/{notifications.length} Selected</span>
                                            <div className="form-check form-switch ms-2">
                                                <input className="form-check-input" type="checkbox" checked={selectedIds.length === notifications.length && notifications.length > 0} onChange={toggleSelectAll} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedIds.length > 0 && (
                                    <div className="alert alert-dark d-flex justify-content-between align-items-center py-2 px-3 mb-3 shadow-sm border-0" style={{borderRadius: '10px'}}>
                                        <span className="small fw-bold text-white"><i className="bi bi-info-circle me-2"></i>Bulk Options</span>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-light fw-bold rounded-pill px-3" onClick={handleBulkMarkRead}>Mark Read</button>
                                            <button className="btn btn-sm btn-danger fw-bold rounded-pill px-3" onClick={() => setShowDeleteModal(true)}>Delete Selected</button>
                                        </div>
                                    </div>
                                )}

                                {notifications.length > 0 ? (
                                    <div className="list-group list-group-flush">
                                        {notifications.map((notif) => (
                                            <div key={notif.id} className={`list-group-item mb-2 border rounded shadow-sm p-3 d-flex align-items-start gap-3 transition-all ${!notif.is_read ? 'border-start border-danger border-4' : ''}`}>
                                                <div className="pt-1">
                                                    <input type="checkbox" className="form-check-input border-secondary" checked={selectedIds.includes(notif.id)} onChange={() => toggleSelect(notif.id)} />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h6 className={`mb-1 ${!notif.is_read ? 'fw-bold text-dark' : 'text-muted'}`}>{notif.title || 'System Notification'}</h6>
                                                    <p className="mb-1 small text-secondary">{notif.message}</p>
                                                    <div className="d-flex justify-content-between align-items-center mt-2">
                                                        <span className="text-muted" style={{fontSize: '0.7rem'}}>{new Date(notif.created_at).toLocaleString()}</span>
                                                        {!notif.is_read && (
                                                            <button className="btn btn-link btn-sm text-danger p-0 fw-bold text-decoration-none" onClick={() => markAsRead(notif.id)}>Mark as read</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="bi bi-bell-slash fs-1 text-muted opacity-25"></i>
                                        <p className="text-muted mt-2">No new notifications.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: SYSTEM CONTROLS */}
                        {activeTab === 'system' && (
                            <div className="animate-fade-in">
                                <h5 className="fw-bold border-bottom pb-3 mb-4 text-dark">Administrative Settings</h5>
                                <div className="setting-card form-check form-switch mb-3 p-3 border rounded shadow-sm">
                                    <input className="form-check-input ms-0 me-3" type="checkbox" checked={systemSettings.maintenanceMode} onChange={() => handleSettingToggle('maintenanceMode')} />
                                    <label className="form-check-label">
                                        <strong className="text-dark">Maintenance Mode</strong><br/>
                                        <small className="text-muted">Disable all user-facing features for site updates.</small>
                                    </label>
                                </div>
                                <div className="setting-card form-check form-switch p-3 border rounded shadow-sm">
                                    <input className="form-check-input ms-0 me-3" type="checkbox" checked={systemSettings.autoApprove} onChange={() => handleSettingToggle('autoApprove')} />
                                    <label className="form-check-label">
                                        <strong className="text-dark">Event Auto-Approval</strong><br/>
                                        <small className="text-muted">Instantly approve event requests without manual review.</small>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminProfile;