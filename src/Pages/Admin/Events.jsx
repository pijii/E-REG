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
        isApproved: event.is_approve,
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

  const toggleApproval = async (event) => {
    const { error } = await supabase
      .from('event')
      .update({ is_approve: !event.isApproved })
      .eq('event_id', event.id);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      setEvents(prev => prev.map(e => 
        e.id === event.id ? { ...e, isApproved: !event.isApproved } : e
      ));
    }
  };

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
    <div className="container-fluid py-4 px-2 px-md-4">
      <h2 className="fw-bold mb-4 text-center text-md-start">Event Management</h2>

      <div className="member-box shadow-sm rounded-3 overflow-hidden bg-red overflow-y-auto">
        {/* SEARCH BAR */}
        <div className="p-3 border-bottom">
          <div className="input-group mx-auto mx-md-0" style={{ maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search by event or organizer..."
              className="form-control text-center text-md-start"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE HEADER - Hidden on Mobile AND Tablet (xl means it only shows on Desktop) */}
        <div className="row header-row bg-dark text-white py-3 px-3 m-0 d-none d-xl-flex text-center">
          <div className="col-xl-3" onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
            Event Title {sortKey === 'name' && (sortAsc ? '▲' : '▼')}
          </div>
          <div className="col-xl-2" onClick={() => handleSort('organizer')} style={{ cursor: 'pointer' }}>
            Organizer {sortKey === 'organizer' && (sortAsc ? '▲' : '▼')}
          </div>
          <div className="col-xl-2" onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
            Date {sortKey === 'date' && (sortAsc ? '▲' : '▼')}
          </div>
          <div className="col-xl-2">Status</div>
          <div className="col-xl-3">Actions</div>
        </div>

        {/* TABLE BODY */}
        <div className="p-0">
          {loading ? (
            <div className="text-center py-5 bg-red ">
              <div className="spinner-border text-danger" role="status"></div>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-5 text-muted bg-red">No events found.</div>
          ) : (
            sortedEvents.map((event) => (
              <div className="row body-row border-bottom py-4 px-3 m-1 align-items-center bg-white text-center" key={event.id}>
                
                {/* Event Title */}
                <div className="col-12 col-xl-3 mb-3 mb-xl-0">
                  <span className="d-xl-none fw-bold text-uppercase small text-muted d-block mb-1">Event Title</span>
                  <div className="fw-bold text-dark fs-5 fs-xl-6">{event.name}</div>
                </div>

                {/* Organizer */}
                <div className="col-12 col-xl-2 mb-3 mb-xl-0">
                  <span className="d-xl-none fw-bold text-uppercase small text-muted d-block mb-1">Organizer</span>
                  <div className="text-secondary">{event.organizer}</div>
                </div>

                {/* Date */}
                <div className="col-12 col-xl-2 mb-3 mb-xl-0">
                  <span className="d-xl-none fw-bold text-uppercase small text-muted d-block mb-1">Date</span>
                  <div>{event.displayDate}</div>
                </div>
                
                {/* Status */}
                <div className="col-12 col-xl-2 mb-3 mb-xl-0">
                  <span className="d-xl-none fw-bold text-uppercase small text-muted d-block mb-1">Status</span>
                  <span className={`badge rounded-pill ${event.isApproved ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {event.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-12 col-xl-3">
                  <span className="d-xl-none fw-bold text-uppercase small text-muted d-block mb-2">Actions</span>
                  <div className="d-flex justify-content-center gap-2">
                    <button 
                      className={`btn btn-sm px-4 ${event.isApproved ? 'btn-outline-secondary' : 'btn-success'}`}
                      onClick={() => toggleApproval(event)}
                    >
                      {event.isApproved ? 'Unapprove' : 'Approve'}
                    </button>
                    <button 
                      className="btn btn-outline-danger btn-sm px-4" 
                      onClick={() => handleDeleteClick(event)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DELETE MODAL (Centered and Responsive) */}
      {showConfirm && (
        <div className="modal-custom-overlay d-flex align-items-center justify-content-center p-3" onClick={cancelDelete}>
          <div className="modal-custom-box w-100 shadow-lg border-0" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-custom-header text-center border-0 pt-4">
              <h5 className="text-danger fw-bold mb-0">Confirm Delete</h5>
            </div>
            <div className="modal-custom-body text-center px-4 py-3">
              Are you sure you want to delete <strong>{selectedEvent?.name}</strong>?
              <p className="small text-muted mt-2 mb-0">This action cannot be undone.</p>
            </div>
            <div className="modal-custom-footer border-0 pb-4 px-4 d-flex gap-2">
              <button className="btn btn-light border w-100" onClick={cancelDelete}>Cancel</button>
              <button className="btn btn-danger w-100" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventsTable;