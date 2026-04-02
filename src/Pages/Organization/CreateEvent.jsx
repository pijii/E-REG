import { useState, useRef } from 'react';
import '../../Styles/Organization.css';

function CreateEvent({ onTabChange }) {
    const [eventMode, setEventMode] = useState(""); // Online / Face-to-Face
    const [teamMatch, setTeamMatch] = useState(""); // Yes / No
    const [teamSize, setTeamSize] = useState("");
    const [eventCode, setEventCode] = useState(""); // Generated event code
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const formRef = useRef(null); // Reference to form for validation

    const getTomorrowStr = () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date - offset).toISOString().split("T")[0];
    };

    const generateEventCode = () => {
        const prefix = "CCS";
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
        return `${prefix}${year}${random}`;
    };

    const handleCreateEvent = (e) => {
        e.preventDefault();

        if (!formRef.current.checkValidity()) {
            formRef.current.reportValidity();
            return;
        }

        const code = generateEventCode();
        setEventCode(code);
        setShowConfirmation(false);
        setShowSuccess(true);
    };

    const handleViewEvent = () => {
        setShowSuccess(false);
        if (onTabChange) onTabChange('event-view'); // Navigate to Event View
    };

    return (
        <div className="container-fluid">
            <div className="row shadow-lg form-box">
                <form ref={formRef}>
                    <div className="col-12 mt-4 text-center">
                        <h2 className='fw-bold pt-3'>Create New Event</h2>
                        <h5 className='fw-bold mt-0'>Fill out the event information below</h5>
                    </div>

                    <div className="row mt-5 d-flex p-lg-5 pb-5">
                        {/* Event Title */}
                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Event Title:</h5>
                            <input type="text" className="form-control mx-1 px-3" placeholder='Enter event title...' required />
                        </div>

                        {/* Event Category */}
                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Event Category:</h5>
                            <select className="form-select px-3 mx-1" required defaultValue="">
                                <option value="" disabled hidden>Select Category</option>
                                <option value="performing">Performing Arts</option>
                                <option value="seminar">Seminar</option>
                                <option value="competition">Competition</option>
                            </select>
                        </div>

                        {/* Event Mode */}
                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Event Mode:</h5>
                            <div className="d-flex mx-3">
                                <input type="radio" name="eventMode" value="online" onChange={e => setEventMode(e.target.value)} required />
                                <label className="fw-bold ms-1">Online</label>

                                <input type="radio" name="eventMode" value="faceToFace" className="ms-3" onChange={e => setEventMode(e.target.value)} />
                                <label className="fw-bold ms-1">Face-to-Face</label>
                            </div>
                        </div>

                        {/* Team Match */}
                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Team Match:</h5>
                            <div className="d-flex mx-3">
                                <input type="radio" name="teamMatch" value="yes" onChange={e => setTeamMatch(e.target.value)} required />
                                <label className="fw-bold ms-1">Yes</label>

                                <input type="radio" name="teamMatch" value="no" className="ms-3" onChange={e => { setTeamMatch(e.target.value); setTeamSize(""); }} />
                                <label className="fw-bold ms-1">No</label>
                            </div>
                        </div>

                        {/* Team Size */}
                        {teamMatch === "yes" && (
                            <div className="col-12 col-lg-6 mt-3">
                                <h5 className='fw-bold ms-2'>Team Size:</h5>
                                <input type="number" className="form-control mx-1 px-3" placeholder="Enter team size..." min="1" required value={teamSize} onChange={e => setTeamSize(e.target.value)} />
                            </div>
                        )}

                        {/* Maximum Participants / Teams */}
                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>{teamMatch === "yes" ? "Maximum Teams:" : "Maximum Participants:"}</h5>
                            <input type="number"
                                   className="form-control mx-1 px-3"
                                   placeholder={teamMatch === "yes" ? "Enter maximum teams..." : "Enter maximum participants..."}
                                   min="1"
                                   required />
                        </div>

                        {/* Date */}
                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Date:</h5>
                            <input type="date" className="form-control mx-1 px-3" min={getTomorrowStr()} required />
                        </div>

                        {/* Time */}
                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Time:</h5>
                            <input type="time" className="form-control mx-1 px-3" required />
                        </div>

                        {/* Venue */}
                        {eventMode === "faceToFace" && (
                            <div className="col-12 col-lg-6 mt-3">
                                <h5 className='fw-bold ms-2'>Venue:</h5>
                                <input type="text" className="form-control mx-1 px-3" required />
                            </div>
                        )}

                        {/* Upload Poster */}
                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Upload Poster:</h5>
                            <input type="file" className="form-control mx-1 px-3" accept="image/*" required />
                        </div>

                        {/* Description */}
                        <div className="col-12 mt-3">
                            <h5 className='fw-bold ms-2'>Description:</h5>
                            <textarea className='w-100 p-3 rounded' rows="4" required placeholder="Enter a detailed description..."></textarea>
                        </div>

                        {/* Create Button */}
                        <div className="col-12 mt-4 text-center">
                            <button type="button" className="submit-button btn-transform mt-3" onClick={() => setShowConfirmation(true)}>
                                Create Event
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Modal backdrop */}
            {(showConfirmation || showSuccess) && <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>}

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="modal d-block" style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Creation</h5>
                                <button className="btn-close" onClick={() => setShowConfirmation(false)}></button>
                            </div>
                            <div className="modal-body text-center">
                                Are you sure you want to create this event?
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowConfirmation(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleCreateEvent}>Yes, Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccess && (
                <div className="modal d-block" style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content text-center p-4">
                            <h5 className="fw-bold">Event successfully created!</h5>
                            <p>Event Code: <strong>{eventCode}</strong></p>
                            <button className="btn btn-dark mt-3" onClick={handleViewEvent}>View Event</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateEvent;