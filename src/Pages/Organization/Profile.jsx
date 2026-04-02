import React, { useState } from 'react';
import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

function Profile() {
    const [modalContent, setModalContent] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [roleName, setRoleName] = useState('');
    const [roles, setRoles] = useState(['President', 'VP1', 'VP2', 'Secretary']);
    const [editProfileData, setEditProfileData] = useState({
        orgName: 'Org Name',
        orgID: '12345',
        orgMembers: '10',
        orgAdviser: 'John Doe'
    });

    // Profile picture state
    const [profilePic, setProfilePic] = useState(logo);
    const [tempProfilePic, setTempProfilePic] = useState(null);

    const handleModal = (content) => {
        setModalContent(content);
        if(content === 'Edit Existing Role') setRoleName(''); // reset input
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setTempProfilePic(null); // clear temporary profile pic preview
    };

    const saveProfile = () => {
        if(tempProfilePic) setProfilePic(tempProfilePic); // update main profile pic
        setTempProfilePic(null);
        closeModal();
    };

    const saveRole = () => {
        closeModal();
    };

    const deleteRole = (role) => {
        setRoles(roles.filter(r => r !== role));
    };

    const populateRoleInput = (role) => {
        setRoleName(role);
    };

    return (
        <div className="container-fluid">
            {/* Red Profile Box */}
            <div className="row shadow-lg event-round p-3 p-md-4 gap-3 gap-lg-5">
                <div className='col-12 col-md-4 col-lg-3 align-content-center'>
                    <div className='prof-img border w-100 d-flex justify-content-center'>
                        <img src={profilePic} alt="profile picture" className='img-fluid' />
                    </div>
                </div>
                <div className="col-12 col-md-6 col-lg-6 mt-3">
                    <h2 className='fw-bold'>{editProfileData.orgName}</h2>
                    <h5 className='fw-bold'>Org ID: {editProfileData.orgID}</h5>
                    <h5 className='fw-bold'>Org Members: {editProfileData.orgMembers}</h5>
                    <h5 className='fw-bold'>Org Adviser: {editProfileData.orgAdviser}</h5>
                </div>
                <div className="col-12 col-lg-2 d-flex justify-content-center">
                    <button 
                        className='submit-button mt-3 btn-transform'
                        onClick={() => handleModal('Edit Profile')}
                    >
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Organization Officers Table */}
            <div className="row member-box mt-3">
                <div className="col-lg-12 mt-3">
                    <div className="row title-head">
                        <h1 className="fw-bold">Organization Officers</h1>
                        <hr />
                    </div>

                    <div className="row header-row text-center d-flex flex-row mt-2">
                        <div className="col-6 col-md-3 align-self-center">
                            <h5 className="fw-bold">Name</h5>
                        </div>
                        <div className="d-none d-md-block col-md-3 align-self-center">
                            <h5 className="fw-bold">Department</h5>
                        </div>
                        <div className="d-none d-md-block col-md-3 align-self-center">
                            <h5 className="fw-bold">Role</h5>
                        </div>
                        <div className="col-6 col-md-3 align-self-center">
                            <h5 className="fw-bold">Actions</h5>
                        </div>
                    </div>

                    <div className="row body-row text-center d-flex flex-row mt-2 pt-3">
                        <div className="col-6 col-md-3 align-self-center">
                            <h5 className="fw-bold">Peejay Ruben G. Galang</h5>
                        </div>
                        <div className="d-none d-md-block col-md-3 align-self-center">
                            <h5 className="fw-bold">CCS</h5>
                        </div>
                        <div className="d-none d-md-block col-md-3 align-self-center">
                            <h5 className="fw-bold">{roles[1]}</h5>
                        </div>
                        <div className="col-6 col-md-3 align-self-center">
                            <div className="dropdown">
                                <button
                                    className="btn dropdown-toggle fw-bold"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                >
                                    Edit
                                </button>
                                <ul className="dropdown-menu">
                                    <li className='d-block d-md-none'>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => handleModal('View Details')}
                                        >
                                            View Details
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => handleModal('Edit Existing Role')}
                                        >
                                            Edit Role
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            className="dropdown-item text-danger"
                                            onClick={() => handleModal('Delete Role')}
                                        >
                                            Delete Role
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Roles Button Below Red Box */}
            <div className="row mt-4">
                <div className="col-12 d-flex justify-content-center">
                    <button 
                        className='submit-button btn-transform'
                        onClick={() => handleModal('Edit Existing Role')}
                    >
                        Edit Roles
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{modalContent}</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {/* Edit Profile Form */}
                                {modalContent === 'Edit Profile' && (
                                    <form>
                                        {/* Profile Picture Upload */}
                                        <div className="mb-3 d-flex flex-column align-items-center">
                                            <img 
                                                src={tempProfilePic || profilePic} 
                                                alt="Profile Preview" 
                                                className="img-fluid rounded mb-2" 
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

                                        <div className="mb-3">
                                            <label className="form-label">Organization Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editProfileData.orgName}
                                                onChange={(e) => setEditProfileData({...editProfileData, orgName: e.target.value})}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Org ID</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editProfileData.orgID}
                                                onChange={(e) => setEditProfileData({...editProfileData, orgID: e.target.value})}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Org Members</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editProfileData.orgMembers}
                                                onChange={(e) => setEditProfileData({...editProfileData, orgMembers: e.target.value})}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Org Adviser</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editProfileData.orgAdviser}
                                                onChange={(e) => setEditProfileData({...editProfileData, orgAdviser: e.target.value})}
                                            />
                                        </div>
                                    </form>
                                )}

                                {/* Edit Roles Form */}
                                {modalContent === 'Edit Existing Role' && (
                                    <div>
                                        {/* Input + Add Button */}
                                        <div className="mb-3 d-flex gap-2">
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={roleName}
                                                onChange={(e) => setRoleName(e.target.value)}
                                                placeholder="Type new role name"
                                            />
                                            <button 
                                                className="btn btn-success"
                                                onClick={() => {
                                                    if(roleName && !roles.includes(roleName)) {
                                                        setRoles([...roles, roleName]);
                                                        setRoleName('');
                                                    }
                                                }}
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {/* Existing Roles List */}
                                        <div className="mt-3">
                                            <h6>Existing Roles</h6>
                                            <ul className="list-group">
                                                {roles.map((role, index) => (
                                                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                                        <span 
                                                            style={{cursor: 'pointer'}}
                                                            onClick={() => setRoleName(role)}
                                                        >
                                                            {role}
                                                        </span>
                                                        <button 
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => setRoles(roles.filter(r => r !== role))}
                                                        >
                                                            Delete
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Confirmation for other actions */}
                                {modalContent !== 'Edit Profile' && modalContent !== 'Edit Existing Role' && (
                                    <p>Are you sure you want to proceed with <strong>{modalContent}</strong>?</p>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                {modalContent === 'Edit Profile' && (
                                    <button type="button" className="btn btn-primary" onClick={saveProfile}>Save</button>
                                )}
                                {modalContent === 'Edit Existing Role' && (
                                    <button type="button" className="btn btn-primary" onClick={saveRole}>Save</button>
                                )}
                                {modalContent !== 'Edit Profile' && modalContent !== 'Edit Existing Role' && (
                                    <button type="button" className="btn btn-danger" onClick={closeModal}>Confirm</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;