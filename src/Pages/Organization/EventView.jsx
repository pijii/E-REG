import { useState } from 'react';
import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

function EventView({ onTabChange }) {
    const [modalType, setModalType] = useState(null); // Which modal to show

    const goToEditEvent = () => setModalType('edit');
    const goToEventList = () => onTabChange('my-events');

    const closeModal = () => setModalType(null);

    const handleEditEventConfirm = () => {
        closeModal();
        if (onTabChange) onTabChange('edit-event');
    };

    const handleCloseRegistration = () => {
        alert("Registration closed for this event."); 
        closeModal();
    };

    const handleDeleteEvent = () => {
        alert("Event deleted."); 
        closeModal();
    };

    const handleParticipantApprove = () => {
        alert("Participant approved");
        closeModal();
    };

    const handleParticipantDelete = () => {
        alert("Participant deleted");
        closeModal();
    };

    const handleMatchUp = () => {
        alert("Match-up created");
        closeModal();
    };

    const handleGoLive = () => {
        alert("Event is now live!");
        closeModal();
    };

    return (
        <div className="container-fluid">
            {/* Back Button */}
            <div className="col-12 back-button">
                <button className='bg-transparent border-0' onClick={goToEventList}>
                    <h5 className='fw-bold'>⟵Back to Event List</h5>
                </button>
            </div>

            {/* Event Header */}
            <div className="col-12 justify-content-center text-center mt-3">
                <img src={logo} alt="Event Placeholder" className='img-fluid border rounded shadow-lg' />
                <h1 className='mt-5 fw-bold'>Event Title</h1>
            </div>

            {/* Event Details */}
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
                    <h5 className='fw-bold mt-2'>Event Mode: </h5>
                    <h5 className='fw-bold mt-2'>Registration Status: </h5>
                    <h5 className='fw-bold mt-2'>Event Code: </h5>
                </div>
                <div className="col-12 event-details-footer mt-4 justify-content-center text-center d-flex p-3 flex-column flex-md-row gap-3 gap-lg-5">
                    <button className='details-btn' onClick={() => setModalType('edit')}>
                        <h4 className='fw-bold'>Edit Event</h4>
                    </button>
                    <button className='details-btn btn-danger text-white' onClick={() => setModalType('close')}>
                        <h4 className='fw-bold'>Close Registration</h4>
                    </button>
                    <button className='details-btn btn-danger text-white' onClick={() => setModalType('delete')}>
                        <h4 className='fw-bold'>Delete Event</h4>
                    </button>
                </div>
            </div>

            {/* Event Description */}
            <div className="row row mt-5 shadow-lg event-round py-4 p-md-4">
                <div className="col-12">
                    <h2 className='fw-bold'>Event Description:</h2>
                    <hr />
                </div>
                <div className="col-12">
                    <h5 className='fw-bold'>This is a sample event description. You can add more details about the event here.</h5>
                </div>
            </div>

            {/* Registered Participants */}
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
                            <h5 className='fw-bold'>Approved</h5>
                        </div>
                        <div className="col-6 col-md-3 align-self-center">
                            <div className="dropdown">
                                <button className="btn dropdown-toggle fw-bold" type="button" data-bs-toggle="dropdown">
                                    Edit
                                </button>

                                <ul className="dropdown-menu">
                                    <li className='d-block d-md-none'>
                                        <button className="dropdown-item" onClick={() => setModalType('view-participant')}>
                                            View Details
                                        </button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={() => setModalType('approve-participant')}>
                                            Approve
                                        </button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item text-white btn-danger" onClick={() => setModalType('delete-participant')}>
                                            Delete
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Match Up */}
            <div className="row mt-5 shadow-lg event-round event-matchup py-4 p-md-4">
                <div className="col-12">
                    <h2 className='fw-bold'>Match Up:</h2>
                    <hr />
                </div>
            </div>

            <div className="row pt-lg-4 text-center text-md-end">
                <div className="col-lg-12 mt-3">
                    <button className="create-btn py-3 px-5 shadow-lg" onClick={() => setModalType('create-matchup')}>
                        <h4 className='fw-bold'>Create Match Up</h4>
                    </button>
                </div>
            </div>

            <div className="row my-5 d-flex justify-content-center text-center">
                <div className="col-12">
                    <video src={logo} className='shadow-lg img-fluid'></video>
                </div>
                <div className="col-12">
                    <button className='create-btn py-3 px-5 shadow-lg' onClick={() => setModalType('go-live')}>
                        <h4 className='fw-bold'><u>Go Live</u></h4>
                    </button>
                </div>
            </div>

            {/* Modal Overlay */}
            {modalType && <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>}

            {/* Reusable Modal */}
            {modalType === 'edit' && (
                <Modal
                    title="Edit Event"
                    message="Do you want to edit this event?"
                    confirmText="Yes"
                    cancelText="Cancel"
                    onConfirm={handleEditEventConfirm}
                    onCancel={closeModal}
                />
            )}

            {modalType === 'close' && (
                <Modal
                    title="Close Registration"
                    message="Are you sure you want to close registration for this event?"
                    confirmText="Confirm"
                    cancelText="Cancel"
                    redConfirm
                    onConfirm={handleCloseRegistration}
                    onCancel={closeModal}
                />
            )}

            {modalType === 'delete' && (
                <Modal
                    title="Delete Event"
                    message="Are you sure you want to delete this event? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    redConfirm
                    onConfirm={handleDeleteEvent}
                    onCancel={closeModal}
                />
            )}

            {modalType === 'view-participant' && (
                <Modal
                    title="Participant Details"
                    message="Details of the participant will go here."
                    confirmText="OK"
                    onConfirm={closeModal}
                />
            )}

            {modalType === 'approve-participant' && (
                <Modal
                    title="Approve Participant"
                    message="Are you sure you want to approve this participant?"
                    confirmText="Approve"
                    cancelText="Cancel"
                    onConfirm={handleParticipantApprove}
                    onCancel={closeModal}
                />
            )}

            {modalType === 'delete-participant' && (
                <Modal
                    title="Delete Participant"
                    message="Are you sure you want to delete this participant?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    redConfirm
                    onConfirm={handleParticipantDelete}
                    onCancel={closeModal}
                />
            )}

            {modalType === 'create-matchup' && (
                <Modal
                    title="Create Match Up"
                    message="This will create match-ups for the event."
                    confirmText="OK"
                    cancelText="Cancel"
                    onConfirm={handleMatchUp}
                    onCancel={closeModal}
                />
            )}

            {modalType === 'go-live' && (
                <Modal
                    title="Go Live"
                    message="Are you ready to go live for this event?"
                    confirmText="Go Live"
                    cancelText="Cancel"
                    onConfirm={handleGoLive}
                    onCancel={closeModal}
                />
            )}
        </div>
    );
}

// Reusable Modal Component
const Modal = ({ title, message, confirmText, cancelText, onConfirm, onCancel, redConfirm }) => (
    <div className="modal d-block" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-4">
                <h5 className="fw-bold">{title}</h5>
                <p>{message}</p>
                <div className="d-flex justify-content-center gap-3 mt-3">
                    {cancelText && <button className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>}
                    {confirmText && <button className={`btn ${redConfirm ? 'btn-danger text-white' : 'btn-primary'}`} onClick={onConfirm}>{confirmText}</button>}
                </div>
            </div>
        </div>
    </div>
);

export default EventView;