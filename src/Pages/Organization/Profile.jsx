import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

function Profile() {


    return (
        <div className="container-fluid">
            <div className="row shadow-lg event-round p-3 p-md-4 gap-3 gap-lg-5">
                <div className="col-12 col-md-4 col-lg-3 align-content-center">
                    <div className='prof-img border w-100 d-flex justify-content-center'>
                        <img src={logo} alt="profile picture" className='img-fluid' />
                    </div>
                </div>
                <div className="col-12 col-md-6 col-lg-6">
                    <h3 className='fw-bold'>Org Name</h3>
                    <h6 className='fw-bold'>Org ID:</h6>
                    <h6 className='fw-bold'>Org Members:</h6>
                    <h6 className='fw-bold'>Org Adviser:</h6>
                </div>
                <div className="col-12 col-lg-2 d-flex justify-content-center">
                    <button className='submit-button mt-3 btn-transform'>Edit Profile</button>
                </div>
            </div>

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
        </div>
    );
};

export default Profile;