import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

function EventView({ onTabChange, eventId }) {
    const [loading, setLoading] = useState(true);
    const [modalType, setModalType] = useState(null); 
    const [eventData, setEventData] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [streamInput, setStreamInput] = useState('');
    
    // Tracks winner for each Match ID
    const [winners, setWinners] = useState({}); 

    const [editForm, setEditForm] = useState({
        title: '',
        category: '',
        date: '',
        time: '',
        venue: '',
        description: '',
        team_match: false,
        match_type: 'single_elim'
    });

    useEffect(() => {
        if (eventId) {
            fetchEventDetails();
            fetchParticipants();
        }
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('event').select('*').eq('event_id', eventId).single();
            if (error) throw error;
            if (data) {
                const parts = data.date ? data.date.split('T') : ['', ''];
                setEventData(data);
                setStreamInput(data.stream_url || '');
                setEditForm({
                    title: data.title || '',
                    category: data.category || '',
                    date: parts[0],
                    time: parts[1] ? parts[1].substring(0, 5) : '',
                    venue: data.venue || '',
                    description: data.description || '',
                    team_match: data.team_match || false,
                    match_type: data.match_type || 'single_elim'
                });
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const fetchParticipants = async () => {
        const { data } = await supabase.from('event_participants').select(`id, is_approved, team, student:student_id (name, department, year_level, section)`).eq('event_id', eventId);
        setParticipants(data || []);
    };

    const handleUpdateStream = async () => {
        const { error } = await supabase.from('event').update({ stream_url: streamInput }).eq('event_id', eventId);
        if (!error) {
            setEventData({ ...eventData, stream_url: streamInput });
            alert("Stream URL updated successfully!");
        }
    };

    const handleToggleWinner = (matchId, teamName) => {
        setWinners(prev => {
            if (prev[matchId] === teamName) {
                const newState = { ...prev };
                delete newState[matchId];
                return newState;
            }
            return { ...prev, [matchId]: teamName };
        });
    };

    const renderBracketView = () => {
        const teams = [...new Set(participants.filter(p => p.is_approved && p.team).map(p => p.team))];
        if (teams.length < 2) return <p className="small text-muted text-center py-3">Assign teams to generate matches.</p>;

        const round1 = [];
        for (let i = 0; i < teams.length; i += 2) {
            round1.push({ id: `r1m${i}`, a: teams[i], b: teams[i+1] || "BYE" });
        }

        const round2 = [];
        for (let i = 0; i < round1.length; i += 2) {
            const winnerA = winners[round1[i].id];
            const winnerB = round1[i+1] ? winners[round1[i+1].id] : null;
            if (winnerA || winnerB) {
                round2.push({ id: `r2m${i}`, a: winnerA || "TBD", b: winnerB || (round1[i+1] ? "TBD" : "BYE") });
            }
        }

        return (
            <div className="bracket-logic">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold small text-primary m-0">ROUND 1</h6>
                    <span className="badge bg-primary x-small">
                        {eventData.match_type?.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
                {round1.map((m) => (
                    <div key={m.id} className="mb-3 border rounded shadow-sm bg-white overflow-hidden">
                        <div 
                            className={`p-2 d-flex justify-content-between align-items-center cursor-pointer transition-all ${winners[m.id] === m.a ? 'bg-success text-white' : ''}`}
                            onClick={() => handleToggleWinner(m.id, m.a)}
                        >
                            <span className="fw-bold small">{m.a}</span>
                            {winners[m.id] === m.a && <small className="fw-bold">WINNER</small>}
                        </div>
                        <div className="bg-light text-center x-small py-1 border-top border-bottom fw-bold text-muted">VS</div>
                        <div 
                            className={`p-2 d-flex justify-content-between align-items-center cursor-pointer transition-all ${winners[m.id] === m.b ? 'bg-success text-white' : ''}`}
                            onClick={() => m.b !== "BYE" && handleToggleWinner(m.id, m.b)}
                        >
                            <span className="fw-bold small">{m.b}</span>
                            {winners[m.id] === m.b && <small className="fw-bold">WINNER</small>}
                        </div>
                    </div>
                ))}

                {round2.length > 0 && (
                    <>
                        <hr className="my-4" />
                        <h6 className="fw-bold small text-danger mb-2">ROUND 2 MATCHUPS</h6>
                        {round2.map((m) => (
                            <div key={m.id} className="mb-3 p-2 border-start border-danger border-4 bg-white shadow-sm rounded">
                                <div className="d-flex justify-content-between small fw-bold">
                                    <span>{m.a}</span>
                                    <span className="text-muted">vs</span>
                                    <span>{m.b}</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        );
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        const combinedTimestamp = `${editForm.date}T${editForm.time}:00`;
        const { error } = await supabase.from('event').update({ ...editForm, date: combinedTimestamp }).eq('event_id', eventId);
        if (!error) { 
            setEventData({ ...eventData, ...editForm, date: combinedTimestamp }); 
            setModalType(null);
        }
    };

    const handleDownloadAttendance = () => {
        const approvedList = participants.filter(p => p.is_approved);
        let csv = "NAME\tYEAR & SECTION\tTEAM\tSIGNATURE\n";
        approvedList.forEach(p => {
            const yrSec = `${p.student?.year_level || ''} ${p.student?.section || ''}`.trim();
            csv += `${p.student?.name}\t${yrSec}\t${p.team}\t____________________\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `${eventData.title}_Attendance.xls`; link.click();
    };

    const handleAutoMatch = async () => {
        const approvedNoTeam = participants.filter(p => p.is_approved && !p.team);
        const teamSize = eventData.team_size || 2;
        for (let i = 0; i < approvedNoTeam.length; i++) {
            const teamName = `Team ${Math.floor(i / teamSize) + 1}`;
            await supabase.from('event_participants').update({ team: teamName }).eq('id', approvedNoTeam[i].id);
        }
        fetchParticipants();
    };

    const handleToggleLive = async () => {
        const nextStatus = !eventData.is_live;
        await supabase.from('event').update({ is_live: nextStatus }).eq('event_id', eventId);
        setEventData({ ...eventData, is_live: nextStatus });
    };

    if (loading || !eventData) return <div className="p-5 text-center fw-bold">Loading...</div>;

    return (
        <div className="container-fluid py-4" style={{ fontSize: '1.1rem' }}>
            <button className='btn btn-outline-dark fw-bold mb-4 shadow-sm' onClick={() => onTabChange('my-events')}>⟵ BACK</button>

            <div className="row g-4">
                {/* SIDEBAR */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-lg mb-4 overflow-hidden">
                        <img src={eventData.poster || logo} className='img-fluid' alt="Poster" />
                        <div className="p-3 bg-dark text-white text-center fw-bold uppercase">
                            {eventData.category || "General"}
                        </div>
                    </div>
                    
                    <div className="card p-3 bg-light border-0 shadow-sm">
                        <h5 className="fw-bold text-primary mb-3 text-center">🏆 TOURNAMENT TRACKER</h5>
                        {renderBracketView()}
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="col-md-8">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h1 className="fw-bold text-uppercase m-0">{eventData.title}</h1>
                        {eventData.is_live && <span className="badge bg-danger pulse px-3 py-2">● LIVE</span>}
                    </div>

                    <div className="card p-4 border-0 shadow-sm mb-4 bg-white">
                        <h6 className="fw-bold text-secondary border-bottom pb-2 mb-3">ADMIN ACTIONS</h6>
                        
                        <div className="mb-4">
                            <label className="fw-bold small text-primary mb-2">LIVE STREAM URL (EMBED LINK)</label>
                            <div className="input-group shadow-sm">
                                <input 
                                    type="text" 
                                    className="form-control border-primary" 
                                    placeholder="https://www.youtube.com/embed/..." 
                                    value={streamInput} 
                                    onChange={(e) => setStreamInput(e.target.value)}
                                />
                                <button className="btn btn-primary fw-bold" onClick={handleUpdateStream}>SAVE LINK</button>
                            </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                            <button className="btn btn-outline-primary fw-bold" onClick={() => setModalType('edit')}>EDIT INFO</button>
                            <button className={`btn fw-bold ${eventData.is_live ? 'btn-outline-danger' : 'btn-danger'}`} onClick={handleToggleLive}>
                                {eventData.is_live ? 'STOP LIVE' : 'GO LIVE'}
                            </button>
                            <button className="btn btn-success fw-bold" onClick={handleAutoMatch}>AUTO MATCH</button>
                            <button className="btn btn-dark fw-bold" onClick={handleDownloadAttendance}>DOWNLOAD EXCEL</button>
                            <button className="btn btn-outline-danger fw-bold ms-auto" onClick={() => {
                                if(window.confirm("Are you sure?")) {
                                    supabase.from('event').delete().eq('event_id', eventId).then(() => onTabChange('my-events'));
                                }
                            }}>DELETE</button>
                        </div>
                    </div>

                    <div className="card p-4 border-0 shadow-sm bg-white mb-4">
                        <h6 className="fw-bold text-secondary border-bottom pb-2 mb-3">DESCRIPTION</h6>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{eventData.description}</p>
                    </div>

                    {/* LIVE MONITOR */}
                    <div className="card border-0 shadow-lg bg-dark overflow-hidden mb-4" style={{ minHeight: '400px' }}>
                        <div className="card-header bg-secondary text-white fw-bold">BROADCAST MONITOR</div>
                        {eventData.is_live ? (
                            <div className="ratio ratio-16x9"><iframe src={eventData.stream_url} title="Live" allowFullScreen></iframe></div>
                        ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 text-white opacity-50 py-5"><h4>OFFLINE</h4></div>
                        )}
                    </div>

                    {/* ROSTER */}
                    <div className="card p-4 border-0 shadow-sm bg-white mb-4">
                        <h5 className="fw-bold mb-4">PARTICIPANT LIST ({participants.length})</h5>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>NAME</th>
                                        <th>YEAR/SECTION</th>
                                        <th>TEAM</th>
                                        <th className="text-center">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.map(p => (
                                        <tr key={p.id}>
                                            <td className="fw-bold">{p.student?.name}</td>
                                            <td>{p.student?.year_level} {p.student?.section}</td>
                                            <td className="text-primary fw-bold">{p.team || '—'}</td>
                                            <td className="text-center">
                                                <button className={`btn btn-sm fw-bold ${p.is_approved ? 'btn-success' : 'btn-warning'}`} onClick={async () => {
                                                    await supabase.from('event_participants').update({ is_approved: !p.is_approved }).eq('id', p.id);
                                                    fetchParticipants();
                                                }}>
                                                    {p.is_approved ? 'APPROVED' : 'APPROVE'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT MODAL */}
            {modalType === 'edit' && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 p-4 shadow-lg">
                            <h3 className="fw-bold mb-4">Edit Event Details</h3>
                            <form onSubmit={handleUpdateEvent}>
                                <div className="mb-3"><label className="fw-bold small">TITLE</label><input type="text" className="form-control" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} /></div>
                                <div className="row mb-3">
                                    <div className="col-6">
                                        <label className="fw-bold small">MATCH TYPE</label>
                                        <select className="form-select" value={editForm.match_type} onChange={e => setEditForm({...editForm, match_type: e.target.value})}>
                                            <option value="single_elim">Single Elimination</option>
                                            <option value="double_elim">Double Elimination</option>
                                            <option value="round_robin">Round Robin</option>
                                            <option value="series">Series (e.g. Baseball)</option>
                                        </select>
                                    </div>
                                    <div className="col-6"><label className="fw-bold small">VENUE</label><input type="text" className="form-control" value={editForm.venue} onChange={e => setEditForm({...editForm, venue: e.target.value})} /></div>
                                </div>
                                <div className="mb-4"><label className="fw-bold small">DESCRIPTION</label><textarea className="form-control" rows="3" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})}></textarea></div>
                                <div className="d-flex justify-content-end gap-2"><button type="button" className="btn btn-light" onClick={() => setModalType(null)}>CLOSE</button><button type="submit" className="btn btn-primary fw-bold">SAVE DETAILS</button></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventView;