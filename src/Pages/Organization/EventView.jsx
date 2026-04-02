import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

function EventView({onTabChange}) {

    const goToEditEvent = () => {
        onTabChange('edit-event'); 
    };

    const goToEvent = () => {
        onTabChange('my-events'); 
    };

    return (
        <div className="container-fluid">
            <div className="col-12  back-button">
                <button className='bg-transparent border-0' onClick={goToEvent}><h5 className='fw-bold'>⟵Back to Event List</h5></button>
            </div>
            <div className="col-12 justify-content-center text-center mt-3">
                <img src={logo} alt="Event Placeholder" className='img-fluid border rounded shadow-lg' />
                <h1 className='mt-5 fw-bold'>Event Title</h1>
            </div>
            <div className="row mt-5 shadow-lg event-round py-4 p-2 p-md-4">
                <div className="col-12">
                    <h2 className='fw-bold'>Event Details:</h2>
                    <hr />
                </div>
                <div className="col-12">
                    <h5 className='fw-bold mt-2'>Category: </h5>
                    <h5 className='fw-bold mt-2'>Date: </h5>
                    <h5 className='fw-bold mt-2'>Time: </h5>
                    <h5 className='fw-bold mt-2'>Venue: </h5>
                    <h5 className='fw-bold mt-2'>Organizer: </h5>
                    <br />
                    <br />
                    <h5 className='fw-bold mt-2'>Total Participants: </h5>
                    <h5 className='fw-bold mt-2'>Registration Status: </h5>
                    <h5 className='fw-bold mt-2'>Event Code: </h5>
                </div>
                <div className="col-12 event-details-footer mt-4 justify-content-center text-center d-flex p-3 flex-column flex-md-row gap-3 gap-lg-5">
                    <button className='details-btn' onClick={goToEditEvent}><h4 className='fw-bold'>Edit Event</h4></button>
                    <button className='details-btn'><h4 className='fw-bold'>Close Registration</h4></button>
                    <button className='details-btn'><h4 className='fw-bold'>Delete Event</h4></button>
                </div>
            </div>

            <div className="row row mt-5 shadow-lg event-round py-4 p-md-4">
                <div className="col-12">
                    <h2 className='fw-bold'>Event Description:</h2>
                    <hr />
                </div>
                <div className="col-12">
                    <h5 className='fw-bold'>This is a sample event description. You can add more details about the event here.</h5>
                </div>
            </div>

            <div className="row member-box mt-5">
                <div className="col-lg-12 mt-3">
                    <div className="row title-head">
                        <h2 className="fw-bold">Registered Participants:</h2>
                        <hr />
                    </div>
                    <div className="row header-row text-center d-flex flex-row mt-2">
                        <div className="col-6 col-md-3 align-self-center">
                            <h5 className="fw-bold">Name</h5>
                        </div>
                        <div className="d-none d-md-block col-md-3 align-self-center">
                            <h5 className="fw-bold">Date Joined</h5>
                        </div>
                        <div className="d-none d-md-block col-md-3 align-self-center">
                            <h5 className="fw-bold d-none d-md-block">Status</h5>
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
                            <h5 className="fw-bold">10/24/26</h5>
                        </div>
                        <div className="d-none d-md-block col-md-3 align-self-center">
                            <h5 className="fw-bold d-none d-md-block">Approved</h5>
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
                                            Approve
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            className="dropdown-item text-danger"

                                        >
                                            Delete
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Add more content here to ensure the page is long enough to scroll */}
                </div>
            </div>


            <div className="row mt-5 shadow-lg event-round event-matchup py-4 p-md-4">
                <div className="col-12">
                    <h2 className='fw-bold'>Match Up:</h2>
                    <hr />
                </div>
            </div>

            <div className="row pt-lg-4 text-center text-md-end">
                <div className="col-lg-12 mt-3">
                    <button className="create-btn py-3 px-5 shadow-lg">
                        <h4 className='fw-bold'>Create Match Up</h4>
                    </button>
                </div>
            </div>

            <div className="row my-5 d-flex justify-content-center text-center">
                <div className="col-12">
                    <video src={logo} className='shadow-lg img-fluid'></video>
                </div>
                <div className="col-12">
                    <button className='create-btn py-3 px-5 shadow-lg'><h4 className='fw-bold'><u>Go Live</u></h4></button>
                </div>
            </div>
        </div>
    );
}

export default EventView;