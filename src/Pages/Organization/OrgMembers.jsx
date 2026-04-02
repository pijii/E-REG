import '../../Styles/Organization.css';

function orgMembers() {
    return (
        <div className="container-fluid">
            {/* ---------------- Title ---------------- */}
            <div className="row member-box">
                <div className="col-lg-12 mt-3">
                    <div className="row title-head">
                        <h1 className="fw-bold">Organization Members</h1>
                        <hr />
                    </div>

                    {/* ---------------- Header ---------------- */}
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

                    {/* ---------------- Sample Member Row ---------------- */}
                    <div className="row body-row text-center d-flex flex-row mt-2 pt-3">
                        <div className="col-6 col-md-3 align-self-center">
                            <h5 className="fw-bold">Peejay Ruben G. Galang</h5>
                        </div>
                        <div className="d-none d-md-block col-md-3 align-self-center">
                            <h5 className="fw-bold">CCS</h5>
                        </div>
                        <div className="d-none d-md-block col-md-3 align-self-center">
                            <h5 className="fw-bold">VP1</h5>
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
                                    <li>
                                        <button
                                            className="dropdown-item d-lg-none"
                                            data-bs-toggle="modal"
                                            data-bs-target="#viewStudentModal"
                                        >
                                            View Details
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            className="dropdown-item"
                                            data-bs-toggle="modal"
                                            data-bs-target="#editRoleModal"
                                        >
                                            Edit Role
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            className="dropdown-item text-danger"
                                            data-bs-toggle="modal"
                                            data-bs-target="#deleteRoleModal"
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

            {/* ---------------- Add Member Button ---------------- */}
            <div className="row">
                <div className="col-12 text-center text-lg-end mt-2">
                    <button
                        className="create-btn py-3 px-5 shadow-lg"
                        data-bs-toggle="modal"
                        data-bs-target="#addMemberModal"
                    >
                        <h4 className='fw-bold'>Add Member</h4>
                    </button>
                </div>
            </div>

            {/* ---------------- Modals ---------------- */}

            {/* View Details Modal */}
            <div className="modal fade" id="viewStudentModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Student Details</h5>
                            <button className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div className="modal-body text-center">
                            <p>Name: Juan Dela Cruz</p>
                            <p>Course: BSIT</p>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" data-bs-dismiss="modal">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Role Modal */}
            <div className="modal fade" id="editRoleModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Edit Role</h5>
                            <button className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div className="modal-body text-center">
                            <p>Select a new role for the member:</p>
                            <select className="form-select">
                                <option value="VP1">VP1</option>
                                <option value="VP2">VP2</option>
                                <option value="Secretary">Secretary</option>
                                <option value="Member">Member</option>
                            </select>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button className="btn btn-primary">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <div className="modal fade" id="deleteRoleModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title text-danger">Confirm Delete</h5>
                            <button className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div className="modal-body text-center">
                            <p>Are you sure you want to delete this role?</p>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button className="btn btn-danger">Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Member Modal */}
            <div className="modal fade" id="addMemberModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Add Member</h5>
                            <button className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div className="modal-body text-center">
                            <p>Form to add a new member goes here.</p>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button className="btn btn-primary">Save</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default orgMembers;