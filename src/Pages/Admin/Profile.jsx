import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient'; 
import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

// Import Bootstrap Icons if not already done in index.js/App.js
// import 'bootstrap-icons/font/bootstrap-icons.css';

function AdminProfile() {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false); 
    const fileInputRef = useRef(null);
    
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
        orgCount: 0 
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
                    profile_id, 
                    name, 
                    profile_img, 
                    account_id, 
                    school_id,
                    maintenance_mode,
                    auto_approval,
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
                    // Use logo if profile_img is null or empty
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

                fetchStats();
            }
        } catch (error) {
            console.error('Error loading admin profile:', error.message);
        } finally {
            setLoading(false);
        }
    }

    const fetchStats = async () => {
        try {
            const { count: eventCount } = await supabase.from('event').select('*', { count: 'exact', head: true });
            const { count: pendingEvents } = await supabase.from('event').select('*', { count: 'exact', head: true }).eq('is_approve', false);
            const { count: studentCount } = await supabase.from('student').select('*', { count: 'exact', head: true });
            const { count: orgCount } = await supabase.from('organization').select('*', { count: 'exact', head: true });

            setStats({ 
                eventCount: eventCount || 0,
                pendingEvents: pendingEvents || 0,
                studentCount: studentCount || 0,
                orgCount: orgCount || 0
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
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

            // Generate a unique filename using timestamp to avoid caching issues
            const fileExt = file.name.split('.').pop();
            const fileName = `admin-${adminData.profile_id}-${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage ('avatars' bucket)
            let { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Update the 'admin' table with the new URL
            const { error: updateError } = await supabase
                .from('admin')
                .update({ profile_img: publicUrl })
                .eq('profile_id', adminData.profile_id);

            if (updateError) throw updateError;

            // Update local state to immediately show the new picture
            setAdminData(prev => ({ ...prev, profile_img: publicUrl }));
            alert("Profile picture updated successfully!");
        } catch (error) {
            console.error("Upload error details:", error);
            alert("Error updating picture: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateName = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('admin')
                .update({ name: adminData.name })
                .eq('profile_id', adminData.profile_id);

            if (error) throw error;
            alert('Name updated successfully!');
            setIsEditing(false);
        } catch (error) {
            alert(error.message);
        }
    };

    if (loading) return <div className="text-center p-5 text-light fw-bold">Connecting to E-Reg...</div>;

    // --- Inline Styles for the specific Hover Effect ---
    // Note: It's better to put this in your Organization.css, but inline for easy copy-paste
    const avatarContainerStyle = {
        height: '180px',
        width: '180px',
        position: 'relative',
        cursor: uploading ? 'default' : 'pointer',
        overflow: 'hidden',
        borderRadius: '15px'
    };

    const overlayStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent black
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0, // Hidden by default
        transition: 'opacity 0.2s ease-in-out',
        //borderRadius: '15px' // Matches container
    };

    // Helper function for rendering image/spinner
    const renderProfileImage = () => {
        if (uploading) {
            return (
                <div className="d-flex justify-content-center align-items-center bg-secondary w-100 h-100" style={{borderRadius: '15px'}}>
                    <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Uploading...</span>
                    </div>
                </div>
            );
        }
        return (
            <img 
                src={adminData.profile_img} 
                alt="Admin" 
                className='img-fluid object-fit-cover w-100 h-100 border border-secondary' 
                style={{borderRadius: '15px'}} 
                onError={(e) => e.target.src = logo} // Fallback if URL fails
            />
        );
    };

    return (
        <div className="container-fluid py-4">
            {/* ---------------- PROFILE HEADER ---------------- */}
            <div className="row shadow-lg event-round p-3 p-md-4 gap-3 bg-dark text-light align-items-center mb-4 mx-0">
                
                {/* Fixed Profile Picture Section */}
                <div className='col-12 col-lg-2 d-flex justify-content-center justify-content-lg-start'>
                    <div 
                        className='avatar-wrapper shadow mx-auto mx-lg-0' // Added class for CSS hover targeting
                        style={avatarContainerStyle}
                        onClick={() => !uploading && fileInputRef.current.click()} // Click container to upload
                    >
                        {renderProfileImage()}

                        {/* Standard Change Photo Overlay */}
                        {!uploading && (
                            <div className="change-photo-overlay" style={overlayStyle}>
                                <i className="bi bi-camera fs-1 mb-1"></i>
                                <span className="small fw-bold">Change Photo</span>
                            </div>
                        )}
                    </div>
                    {/* Hidden File Input */}
                    <input type="file" ref={fileInputRef} onChange={uploadProfilePic} style={{display:'none'}} accept="image/*" />
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
                {/* ---------------- SIDEBAR ---------------- */}
                <div className="col-md-3 mb-4">
                    <div className="list-group shadow-sm border-0 mb-4">
                        <button className={`list-group-item list-group-item-action p-3 fw-bold ${activeTab === 'overview' ? 'active bg-danger border-danger' : ''}`} onClick={() => {setActiveTab('overview'); setIsEditing(false)}}>
                            <i className="bi bi-person-badge me-2"></i> Profile & School
                        </button>
                        <button className={`list-group-item list-group-item-action p-3 fw-bold ${activeTab === 'system' ? 'active bg-danger border-danger' : ''}`} onClick={() => setActiveTab('system')}>
                            <i className="bi bi-gear-wide-connected me-2"></i> System Settings
                        </button>
                    </div>

                    <div className="card border-0 shadow-sm bg-danger text-white p-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <small className="text-uppercase fw-bold opacity-75">Pending Reviews</small>
                                <h3 className="mb-0 fw-bold">{stats.pendingEvents}</h3>
                            </div>
                            <i className="bi bi-exclamation-octagon fs-1 opacity-25"></i>
                        </div>
                    </div>
                </div>

                {/* ---------------- MAIN CONTENT ---------------- */}
                <div className="col-md-9">
                    <div className="card shadow-sm border-0 p-4 bg-white min-vh-50">
                        {activeTab === 'overview' && (
                            <div className="animate-fade-in">
                                <div className="d-flex justify-content-between flex-column flex-lg-row align-items-center border-bottom pb-3 mb-4">
                                    <h5 className="col-12 col-lg-9 fw-bold mb-0 text-dark">Administrative Profile</h5>
                                    <button className={`btn col-12 mt-2 mt-lg-0 col-lg-2 btn-sm ${isEditing ? 'btn-secondary' : 'btn-outline-danger'} px-4 rounded-pill`} onClick={() => setIsEditing(!isEditing)}>
                                        {isEditing ? 'Cancel' : 'Edit Profile'}
                                    </button>
                                </div>

                                {isEditing ? (
                                    <form onSubmit={handleUpdateName}>
                                        <div className="mb-4">
                                            <label className="form-label small fw-bold text-muted">DISPLAY NAME</label>
                                            <input type="text" className="form-control form-control-lg border-2 shadow-none" value={adminData.name} onChange={(e) => setAdminData({...adminData, name: e.target.value})} />
                                        </div>
                                        <button type="submit" className="btn btn-danger px-5 py-2 fw-bold">Update Profile</button>
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

                        {activeTab === 'system' && (
                            <div className="animate-fade-in">
                                <h5 className="fw-bold border-bottom pb-3 mb-4 text-dark">System Controls</h5>
                                
                                <div className="form-check form-switch mb-4 p-3 border rounded bg-light">
                                    <input className="form-check-input ms-0 me-3 shadow-none" type="checkbox" checked={systemSettings.maintenanceMode} onChange={() => handleSettingToggle('maintenanceMode')} />
                                    <label className="form-check-label">
                                        <strong className="text-dark">Maintenance Mode</strong><br/>
                                        <small className="text-muted">Toggles global access to student features.</small>
                                    </label>
                                </div>

                                <div className="form-check form-switch mb-4 p-3 border rounded bg-light">
                                    <input className="form-check-input ms-0 me-3 shadow-none" type="checkbox" checked={systemSettings.autoApprove} onChange={() => handleSettingToggle('autoApprove')} />
                                    <label className="form-check-label">
                                        <strong className="text-dark">Event Auto-Approval</strong><br/>
                                        <small className="text-muted">If enabled, organization events are approved instantly.</small>
                                    </label>
                                </div>

                                <div className="mt-5 pt-3 border-top">
                                    <button className="btn btn-outline-dark btn-sm me-2" onClick={fetchStats}>
                                        <i className="bi bi-arrow-clockwise me-1"></i> Refresh Stats
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Very important: Add this CSS to make the overlay work */}
            <style>{`
                .avatar-wrapper:hover .change-photo-overlay {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}

export default AdminProfile;