import '../../Styles/Organization.css';

function orgMembers() {
    return (
        <div className="container-fluid">
            <div className="row member-box">
                <div className="col-lg-12 mt-3">
                    <div className="row title-head">
                        <h1 className="fw-bold">Organization Members</h1>
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
                            <h5 className="fw-bold d-none d-md-block">Role</h5>
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
                            <h5 className="fw-bold d-none d-md-block">VP1</h5>
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
                                        
                                    >
                                        View Details
                                    </button>
                                    </li>
                                    <li>
                                    <button
                                        className="dropdown-item"
                                        
                                    >
                                        Edit Role
                                    </button>
                                    </li>
                                    <li>
                                    <button
                                        className="dropdown-item text-danger"
                                        
                                    >
                                        Delete Role
                                    </button>
                                    </li>
                                </ul>
                                </div>
                        </div>
                    </div>

                    {/* Add more content here to ensure the page is long enough to scroll */}
                </div>
            </div>
            <div className="row">
                <div className="col-12 text-center text-lg-end mt-2">
                    <button className="create-btn py-3 px-5 shadow-lg">
                        <h4 className='fw-bold'>Add Member</h4>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default orgMembers;