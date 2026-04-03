import React, { useState } from 'react';
import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

function AdminProfile() {
    const [modalContent, setModalContent] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [editProfileData, setEditProfileData] = useState({
        name: 'Admin Name',
        adminID: 'ADM001',
        email: 'admin@example.com'
    });

    // Profile picture state
    const [profilePic, setProfilePic] = useState(logo);
    const [tempProfilePic, setTempProfilePic] = useState(null);

    const handleModal = (content) => {
        setModalContent(content);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setTempProfilePic(null);
    };

    const saveProfile = () => {
        if (tempProfilePic) setProfilePic(tempProfilePic);
        setTempProfilePic(null);
        closeModal();
    };

    return (
        <div className="container-fluid">

            {/* ---------------- PROFILE BOX ---------------- */}
            <div className="row shadow-lg event-round p-3 p-md-4 gap-3 gap-lg-5 bg-dark text-light">
                <div className='col-12 col-md-4 col-lg-3 align-content-center'>
                    <div className='prof-img border w-100 d-flex justify-content-center'>
                        <img src={profilePic} alt="Admin profile" className='img-fluid rounded-circle' />
                    </div>
                </div>

                <div className="col-12 col-md-6 col-lg-6 mt-3">
                    <h2 className='fw-bold'>{editProfileData.name}</h2>
                    <h5 className='fw-bold'>Admin ID: {editProfileData.adminID}</h5>
                    <h5 className='fw-bold'>Email: {editProfileData.email}</h5>
                </div>

                <div className="col-12 col-lg-3 d-flex justify-content-center">
                    <button 
                        className='submit-button mt-3 btn-transform'
                        onClick={() => handleModal('Edit Profile')}
                    >
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* ---------------- MODAL ---------------- */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{modalContent}</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>

                            <div className="modal-body">
                                {modalContent === 'Edit Profile' && (
                                    <form>
                                        {/* Profile Picture Upload */}
                                        <div className="mb-3 d-flex flex-column align-items-center">
                                            <img 
                                                src={tempProfilePic || profilePic} 
                                                alt="Profile Preview" 
                                                className="img-fluid rounded-circle mb-2" 
                                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                            />
                                            <input 
                                                type="file" 
                                                className="form-control"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if(file) {
                                                        const reader = new FileReader();
                                                        reader.onload = () => setTempProfilePic(reader.result);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Name */}
                                        <div className="mb-3">
                                            <label className="form-label">Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editProfileData.name}
                                                onChange={(e) => setEditProfileData({...editProfileData, name: e.target.value})}
                                            />
                                        </div>

                                        {/* Admin ID */}
                                        <div className="mb-3">
                                            <label className="form-label">Admin ID</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editProfileData.adminID}
                                                onChange={(e) => setEditProfileData({...editProfileData, adminID: e.target.value})}
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="mb-3">
                                            <label className="form-label">Email</label>
                                            <input 
                                                type="email" 
                                                className="form-control"
                                                value={editProfileData.email}
                                                onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})}
                                            />
                                        </div>
                                    </form>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                {modalContent === 'Edit Profile' && (
                                    <button type="button" className="btn btn-primary" onClick={saveProfile}>Save</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default AdminProfile;