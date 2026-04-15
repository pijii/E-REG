import { useState, useRef } from 'react';
import { supabase } from '../../supabaseClient'; 
import { useAuth } from '../../context/AuthContext'; 
import '../../Styles/Organization.css';

function CreateEvent({ onTabChange }) {
    const { user: authUser } = useAuth();

    // Form States
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [eventMode, setEventMode] = useState(""); 
    const [teamMatch, setTeamMatch] = useState("no"); 
    const [teamSize, setTeamSize] = useState("");
    const [maxCapacity, setMaxCapacity] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [eventTime, setEventTime] = useState("");
    const [venue, setVenue] = useState("");
    const [description, setDescription] = useState("");
    const [posterFile, setPosterFile] = useState(null);

    // UI States
    const [eventCode, setEventCode] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const formRef = useRef(null);

    const getTomorrowStr = () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date - offset).toISOString().split("T")[0];
    };

    const generateEventCode = () => {
        const prefix = "CCS";
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}${year}${random}`;
    };

    const handleCreateEvent = async (e) => {
        if (e) e.preventDefault();
        
        // Ensure we are pulling the ID from the 'organization' table row
        // In your AuthContext, this is stored in 'profile'
        const creatorOrgId = authUser?.profile?.org_id || authUser?.profile?.id; 

        if (!creatorOrgId) {
            console.error("AuthUser Object:", authUser);
            alert("Error: Organization profile not found. Check if the 'organization' table has a record for this account.");
            return;
        }

        setLoading(true);

        try {
            // 1. Upload Poster
            let posterUrl = "";
            if (posterFile) {
                const fileExt = posterFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('EventsPoster')
                    .upload(fileName, posterFile);
                
                if (uploadError) throw uploadError;
                
                const { data: urlData } = supabase.storage
                    .from('EventsPoster')
                    .getPublicUrl(fileName);
                
                posterUrl = urlData.publicUrl;
            }

            const generatedCode = generateEventCode();

            // 2. Insert into 'event' table
            const { error: eventError } = await supabase
                .from('event')
                .insert([{
                    title,
                    category,
                    mode: eventMode, // 'face-to-face' or 'online'
                    team_match: teamMatch === "yes",
                    team_size: teamMatch === "yes" ? parseInt(teamSize) : null,
                    max_team: teamMatch === "yes" ? parseInt(maxCapacity) : null,
                    max_participants: teamMatch === "no" ? parseInt(maxCapacity) : null,
                    date: `${eventDate}T${eventTime}`,
                    venue: eventMode === "face-to-face" ? venue : "Online",
                    description,
                    poster: posterUrl,
                    event_code: generatedCode,
                    is_approve: false,
                    event_creator_id: creatorOrgId 
                }]);

            if (eventError) throw eventError;

            // 3. Notify Admin
            const { data: adminAccount } = await supabase
                .from('account')
                .select('account_id')
                .eq('role', 'admin')
                .eq('school_id', authUser.account.school_id)
                .limit(1)
                .single();

            if (adminAccount) {
                await supabase
                    .from('notification')
                    .insert([{
                        user_id: adminAccount.account_id,
                        title: "New Event for Approval",
                        message: `A new event "${title}" requires your approval.`,
                        type: "approval",
                        link: `/admin/manage-events` 
                    }]);
            }

            setEventCode(generatedCode);
            setShowConfirmation(false);
            setShowSuccess(true);
        } catch (error) {
            console.error("Submission Error:", error.message);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            <div className="row shadow-lg form-box">
                <form ref={formRef} onSubmit={(e) => { e.preventDefault(); setShowConfirmation(true); }}>
                    <div className="col-12 mt-4 text-center">
                        <h2 className='fw-bold'>Create New Event</h2>
                        <h5 className='fw-bold mt-0'>Fill out the event information below</h5>
                    </div>

                    <div className="row d-flex p-lg-5">
                        <div className="col-12 col-lg-6">
                            <h5 className='fw-bold ms-2'>Event Title:</h5>
                            <input type="text" className="form-control mx-1 px-3" 
                                value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder='Enter event title...' required />
                        </div>

                        <div className="col-12 col-lg-6">
                            <h5 className='fw-bold ms-2'>Event Category:</h5>
                            <select className="form-select px-3 mx-1" required value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option value="" disabled hidden>Select Category</option>
                                <option value="performing">Performing Arts</option>
                                <option value="seminar">Seminar</option>
                                <option value="competition">Competition</option>
                            </select>
                        </div>

                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Event Mode:</h5>
                            <div className="d-flex mx-3">
                                <input type="radio" name="eventMode" value="online" checked={eventMode === "online"} onChange={e => setEventMode(e.target.value)} required />
                                <label className="fw-bold ms-1">Online</label>

                                <input type="radio" name="eventMode" value="face-to-face" className="ms-3" checked={eventMode === "face-to-face"} onChange={e => setEventMode(e.target.value)} />
                                <label className="fw-bold ms-1">Face-to-Face</label>
                            </div>
                        </div>

                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Team Match:</h5>
                            <div className="d-flex mx-3">
                                <input type="radio" name="teamMatch" value="yes" checked={teamMatch === "yes"} onChange={e => setTeamMatch(e.target.value)} required />
                                <label className="fw-bold ms-1">Yes</label>

                                <input type="radio" name="teamMatch" value="no" className="ms-3" checked={teamMatch === "no"} onChange={e => { setTeamMatch(e.target.value); setTeamSize(""); }} />
                                <label className="fw-bold ms-1">No</label>
                            </div>
                        </div>

                        {teamMatch === "yes" && (
                            <div className="col-12 col-lg-6 mt-3">
                                <h5 className='fw-bold ms-2'>Team Size:</h5>
                                <input type="number" className="form-control mx-1 px-3" min="1" required value={teamSize} onChange={e => setTeamSize(e.target.value)} />
                            </div>
                        )}

                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>{teamMatch === "yes" ? "Maximum Teams:" : "Maximum Participants:"}</h5>
                            <input type="number" className="form-control mx-1 px-3" min="1" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} required />
                        </div>

                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Date:</h5>
                            <input type="date" className="form-control mx-1 px-3" min={getTomorrowStr()} value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
                        </div>

                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Time:</h5>
                            <input type="time" className="form-control mx-1 px-3" value={eventTime} onChange={(e) => setEventTime(e.target.value)} required />
                        </div>

                        {eventMode === "face-to-face" && (
                            <div className="col-12 col-lg-6 mt-3">
                                <h5 className='fw-bold ms-2'>Venue:</h5>
                                <input type="text" className="form-control mx-1 px-3" value={venue} onChange={(e) => setVenue(e.target.value)} required />
                            </div>
                        )}

                        <div className="col-12 col-lg-6 mt-3">
                            <h5 className='fw-bold ms-2'>Upload Poster:</h5>
                            <input type="file" className="form-control mx-1 px-3" accept="image/*" onChange={(e) => setPosterFile(e.target.files[0])} required />
                        </div>

                        <div className="col-12 mt-3">
                            <h5 className='fw-bold ms-2'>Description:</h5>
                            <textarea className='w-100 p-3 rounded' rows="4" required value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                        </div>

                        <div className="col-12 mt-4 text-center">
                            <button type="submit" className="submit-button btn-transform mt-3" disabled={loading}>
                                {loading ? "Creating..." : "Create Event"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Modals */}
            {(showConfirmation || showSuccess) && <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>}

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
                                <button className="btn btn-primary" onClick={handleCreateEvent} disabled={loading}>
                                    {loading ? "Processing..." : "Yes, Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSuccess && (
                <div className="modal d-block" style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content text-center p-4">
                            <h5 className="fw-bold">Event successfully created!</h5>
                            <p>Event Code: <strong>{eventCode}</strong></p>
                            <button className="btn btn-dark mt-3" onClick={() => { setShowSuccess(false); onTabChange('event-view'); }}>View Event</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateEvent;