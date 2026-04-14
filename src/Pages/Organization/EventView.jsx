import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import * as XLSX from 'xlsx';
import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

function EventView({ onTabChange, eventId }) {
    const [loading, setLoading] = useState(true);
    const [modalType, setModalType] = useState(null);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    
    const [eventData, setEventData] = useState(null);
    const [participants, setParticipants] = useState([]);

    const [editForm, setEditForm] = useState({
        title: '',
        category: '',
        date: '',
        time: '',
        venue: '',
        mode: '',
        description: '',
        organizer: ''
    });

    useEffect(() => {
        if (eventId) {
            fetchEventDetails();
            fetchParticipants();
        }
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('event')
                .select('*')
                .eq('event_id', eventId)
                .single();
            if (error) throw error;

            // Logic to separate Date and Time from a single timestamp column
            // Assuming your column is named 'date' but contains 'YYYY-MM-DD HH:MM:SS'
            let dbDate = '';
            let dbTime = '';

            if (data.date) {
                const parts = data.date.split(' '); // Splits "2026-04-12 14:30:00" into ["2026-04-12", "14:30:00"]
                dbDate = parts[0];
                dbTime = parts[1] ? parts[1].substring(0, 5) : ''; // Gets "14:30"
            }

            setEventData({ ...data, separatedDate: dbDate, separatedTime: dbTime });
            
            setEditForm({
                title: data.title || '',
                category: data.category || '',
                date: dbDate,
                time: dbTime,
                venue: data.venue || '',
                mode: data.mode || '',
                description: data.description || '',
                organizer: data.organizer || ''
            });
        } catch (error) {
            console.error('Error fetching event:', error.message);
        }
    };

    const fetchParticipants = async () => {
        try {
            const { data, error } = await supabase
                .from('event_participants')
                .select(`
                    id,
                    is_approved,
                    created_at,
                    student_id,
                    students (
                        name,
                        department
                    )
                `)
                .eq('event_id', eventId);

            if (error) throw error;
            setParticipants(data || []);
        } catch (error) {
            console.error('Error fetching participants:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        // Combine them back for the database if necessary
        const combinedTimestamp = `${editForm.date} ${editForm.time}:00`;
        
        const { error } = await supabase
            .from('event')
            .update({
                ...editForm,
                date: combinedTimestamp // Storing back as single column
            })
            .eq('event_id', eventId);

        if (!error) { 
            setEventData({ ...eventData, ...editForm, separatedDate: editForm.date, separatedTime: editForm.time }); 
            closeModal(); 
        }
    };

    const handleGenerateAttendance = () => {
        const approved = participants.filter(p => p.is_approved);
        if (approved.length === 0) return alert("No approved participants found.");

        const attendanceData = approved.map((p, index) => ({
            "No.": index + 1,
            "Name": p.students?.name || 'N/A',
            "Section/Dept": p.students?.department || 'N/A',
            "Signature": "____________________" 
        }));

        const ws = XLSX.utils.json_to_sheet(attendanceData);
        ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 25 }, { wch: 30 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance Sheet");
        XLSX.writeFile(wb, `${eventData.title}_Attendance.xlsx`);
        closeModal();
    };

    const handleToggleRegistration = async () => {
        const newStatus = !eventData.is_open;
        const { error } = await supabase.from('event').update({ is_open: newStatus }).eq('event_id', eventId);
        if (!error) { setEventData({ ...eventData, is_open: newStatus }); closeModal(); }
    };

    const closeModal = () => { setModalType(null); setSelectedParticipant(null); };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-danger"></div></div>;

    return (
        <div className="container-fluid">
            <div className="col-12 back-button">
                <button className='bg-transparent border-0' onClick={() => onTabChange('my-events')}>
                    <h5 className='fw-bold'>⟵ Back to Event List</h5>
                </button>
            </div>

            <div className="col-12 text-center mt-3">
                <img src={eventData.poster || logo} alt="Poster" className='img-fluid border rounded shadow-lg' style={{ maxHeight: '400px' }} />
                <h1 className='mt-5 fw-bold text-uppercase' style={{ fontSize: '3rem' }}>{eventData.title}</h1>
            </div>

            {/* Event Details Section */}
            <div className="row mt-5 shadow-lg event-round py-4 p-2 p-md-5">
                <div className="col-12"><h2 className='fw-bold' style={{ fontSize: '2.5rem' }}>Event Details:</h2><hr /></div>
                <div className="col-12 mt-3">
                    <h4 className='fw-bold mt-3'>Category: <span className="fw-normal">{eventData.category}</span></h4>
                    <h4 className='fw-bold mt-3'>Date: <span className="fw-normal">{eventData.separatedDate}</span></h4>
                    <h4 className='fw-bold mt-3'>Time: <span className="fw-normal">{eventData.separatedTime}</span></h4>
                    <h4 className='fw-bold mt-3'>Venue: <span className="fw-normal">{eventData.venue}</span></h4>
                    <h4 className='fw-bold mt-3'>Registration Status: 
                        <span className={`fw-bold ms-2 ${eventData.is_open ? 'text-success' : 'text-danger'}`}>
                            {eventData.is_open ? 'OPEN' : 'CLOSED'}
                        </span>
                    </h4>
                </div>

                <div className="col-12 mt-5 d-flex flex-wrap gap-3 justify-content-center">
                    <button className='details-btn' onClick={() => setModalType('edit-event')}><h4 className='fw-bold mb-0'>Edit Event</h4></button>
                    <button className='details-btn btn-warning' onClick={() => setModalType('toggle-reg')}><h4 className='fw-bold mb-0'>{eventData.is_open ? 'Close' : 'Open'} Registration</h4></button>
                    <button className='details-btn btn-success text-white' onClick={() => setModalType('attendance')}><h4 className='fw-bold mb-0'>Generate Attendance</h4></button>
                </div>
            </div>

            {/* Event Description Section */}
            <div className="row mt-5 shadow-lg event-round py-5 p-md-5">
                <div className="col-12"><h2 className='fw-bold' style={{ fontSize: '2.5rem' }}>Event Description:</h2><hr /></div>
                <div className="col-12 mt-3">
                    <h4 className='fw-normal' style={{ lineHeight: '1.6' }}>{eventData.description || "No description provided."}</h4>
                </div>
            </div>

            {/* Registered Participants */}
            <div className="row member-box mt-5 mb-5 p-4 shadow-lg event-round">
                <div className="col-lg-12">
                    <h2 className="fw-bold" style={{ fontSize: '2.5rem' }}>Registered Participants ({participants.length}):</h2>
                    <hr />
                    <div className="row header-row text-center fw-bold mt-4 py-3 bg-light rounded">
                        <div className="col-4"><h4>Name</h4></div>
                        <div className="col-4"><h4>Department</h4></div>
                        <div className="col-4"><h4>Actions</h4></div>
                    </div>

                    {participants.length > 0 ? participants.map((p) => (
                        <div key={p.id} className="row text-center border-bottom py-4 align-items-center">
                            <div className="col-4"><h4 className="fw-bold mb-0">{p.students?.name || 'Unknown'}</h4></div>
                            <div className="col-4"><h4>{p.students?.department || 'N/A'}</h4></div>
                            <div className="col-4">
                                <button className="btn btn-lg btn-outline-dark dropdown-toggle fw-bold" data-bs-toggle="dropdown">Options</button>
                                <ul className="dropdown-menu">
                                    <li><button className="dropdown-item fw-bold text-success">Approve</button></li>
                                    <li><button className="dropdown-item fw-bold text-danger">Remove</button></li>
                                </ul>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-5"><h4 className="text-muted">No participants found.</h4></div>
                    )}
                </div>
            </div>

            {/* Match Up & Live Sections */}
            <div className="row mt-5 shadow-lg event-round py-5 text-center bg-light border">
                <h1 className='fw-bold'>MATCH UP CONTROL</h1>
                <button className="create-btn py-3 px-5 mx-auto shadow mt-3" style={{ fontSize: '1.5rem' }}>Create Match Up</button>
            </div>

            <div className="row my-5 shadow-lg event-round py-5 text-center bg-dark text-white">
                <h1 className='fw-bold text-danger'>LIVE CONTROL</h1>
                <button className='create-btn bg-danger py-3 px-5 mx-auto border-0 shadow mt-3 text-white' style={{ fontSize: '1.5rem' }}>GO LIVE NOW</button>
            </div>

            {/* MODALS */}
            {modalType === 'edit-event' && (
                <div className="modal d-block" style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content p-4 shadow-lg border-0">
                            <h2 className="fw-bold text-center mb-4">Edit Event</h2>
                            <form onSubmit={handleUpdateEvent}>
                                <div className="row g-3">
                                    <div className="col-12"><label className="fw-bold">Title</label><input type="text" className="form-control form-control-lg" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} /></div>
                                    <div className="col-md-6"><label className="fw-bold">Date</label><input type="date" className="form-control form-control-lg" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} /></div>
                                    <div className="col-md-6"><label className="fw-bold">Time</label><input type="time" className="form-control form-control-lg" value={editForm.time} onChange={(e) => setEditForm({...editForm, time: e.target.value})} /></div>
                                    <div className="col-12"><label className="fw-bold">Venue</label><input type="text" className="form-control form-control-lg" value={editForm.venue} onChange={(e) => setEditForm({...editForm, venue: e.target.value})} /></div>
                                    <div className="col-12"><label className="fw-bold">Description</label><textarea className="form-control form-control-lg" rows="5" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})}></textarea></div>
                                </div>
                                <div className="d-flex justify-content-end gap-2 mt-4">
                                    <button type="button" className="btn btn-lg btn-light border" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="btn btn-lg btn-primary px-4">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {modalType && modalType !== 'edit-event' && (
                <Modal 
                    title={modalType === 'attendance' ? "Download Attendance" : "Update Status"}
                    message={modalType === 'attendance' ? "Download Excel sheet for signatures?" : "Confirm changes?"}
                    confirmText="Confirm"
                    onConfirm={modalType === 'attendance' ? handleGenerateAttendance : handleToggleRegistration}
                    onCancel={closeModal}
                />
            )}
        </div>
    );
}

const Modal = ({ title, message, confirmText, onConfirm, onCancel }) => (
    <div className="modal d-block" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-5 border-0 shadow">
                <h2 className="fw-bold">{title}</h2>
                <p className="fs-5 text-muted">{message}</p>
                <div className="d-flex justify-content-center gap-3 mt-4">
                    <button className="btn btn-lg btn-light border px-4" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-lg btn-primary px-4" onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    </div>
);

export default EventView;