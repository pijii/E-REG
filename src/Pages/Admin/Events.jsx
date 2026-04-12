import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../Styles/Admin.css';

function EventsTable() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortAsc, setSortAsc] = useState(true);

  // Modal State
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // ------------------ DATABASE FETCH ------------------
  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('event')
      .select(`
        event_id,
        title,
        date,
        is_approve,
        organization:event_creator_id ( name )
      `);

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      const formattedData = data.map(event => ({
        id: event.event_id,
        name: event.title,
        organizer: event.organization?.name || 'Unknown',
        isApproved: event.is_approve, // Mapping the boolean
        displayDate: new Date(event.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }),
        rawDate: event.date 
      }));
      setEvents(formattedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ------------------ APPROVAL LOGIC ------------------
  const toggleApproval = async (event) => {
    const { error } = await supabase
      .from('event')
      .update({ is_approve: !event.isApproved })
      .eq('event_id', event.id);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      // Update local state to reflect change instantly
      setEvents(prev => prev.map(e => 
        e.id === event.id ? { ...e, isApproved: !event.isApproved } : e
      ));
    }
  };

  // ------------------ DELETE LOGIC ------------------
  const handleDeleteClick = (event) => {
    setSelectedEvent(event);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedEvent) return;
    const { error } = await supabase
      .from('event')
      .delete()
      .eq('event_id', selectedEvent.id);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
      setShowConfirm(false);
      setSelectedEvent(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setSelectedEvent(null);
  };

  // ------------------ SEARCH & SORT ------------------
  const filteredEvents = events.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.organizer.toLowerCase().includes(search.toLowerCase())
  );

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const key = sortKey === 'date' ? 'rawDate' : sortKey;
    const valA = a[key]?.toString().toLowerCase();
    const valB = b[key]?.toString().toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="container-fluid py-4">
      <h2 className="fw-bold mb-4">Event Management</h2>

      <div className="member-box bg-red shadow-sm rounded-3 overflow-hidden">
        {/* SEARCH BAR */}
        <div className="mx-1 mb-3">
          <div className="input-group" style={{ maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search by event or organizer..."
              className="form-control border-start-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE HEADER */}
        <div className="row header-row bg-dark text-white py-3 px-3 m-1">
          <div className="col-4 col-md-3" onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
            Event Name {sortKey === 'name' && (sortAsc ? '▲' : '▼')}
          </div>
          <div className="col-md-2 d-none d-md-block" onClick={() => handleSort('organizer')} style={{ cursor: 'pointer' }}>
            Organizer {sortKey === 'organizer' && (sortAsc ? '▲' : '▼')}
          </div>
          <div className="col-md-2 d-none d-md-block text-center" onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
            Event Date {sortKey === 'date' && (sortAsc ? '▲' : '▼')}
          </div>
          <div className="col-4 col-md-2 text-center">Status</div>
          <div className="col-4 col-md-3 text-center">Actions</div>
        </div>

        {/* TABLE BODY */}
        <div className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-2 text-muted">Fetching events...</p>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-5 text-muted">No events found.</div>
          ) : (
            sortedEvents.map((event) => (
              <div className="row body-row border-bottom py-3 px-3 m-1 align-items-center bg-white hover-row" key={event.id}>
                <div className="col-4 col-md-3 fw-semibold text-dark">{event.name}</div>
                <div className="col-md-2 d-none d-md-block text-secondary">{event.organizer}</div>
                <div className="col-md-2 d-none d-md-block text-center">{event.displayDate}</div>
                
                {/* STATUS BADGE */}
                <div className="col-4 col-md-2 text-center">
                  <span className={`badge rounded-pill ${event.isApproved ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {event.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="col-4 col-md-3 text-center">
                  <button 
                    className={`btn btn-sm px-3 me-2 ${event.isApproved ? 'btn-outline-secondary' : 'btn-success'}`}
                    onClick={() => toggleApproval(event)}
                  >
                    {event.isApproved ? 'Unapprove' : 'Approve'}
                  </button>
                  <button 
                    className="btn btn-outline-danger btn-sm px-3" 
                    onClick={() => handleDeleteClick(event)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DELETE MODAL (Same as before) */}
      {showConfirm && (
        <div className="modal-custom-overlay" onClick={cancelDelete}>
          <div className="modal-custom-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-custom-header">
              <span className="text-danger fw-bold">⚠️ Confirm Delete</span>
            </div>
            <div className="modal-custom-body">
              Are you sure you want to delete <strong>{selectedEvent?.name}</strong>?
              <p className="small text-muted mt-2">This action is permanent and cannot be undone.</p>
            </div>
            <div className="modal-custom-footer">
              <button className="btn btn-light border" onClick={cancelDelete}>Cancel</button>
              <button className="btn btn-danger px-4" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventsTable;