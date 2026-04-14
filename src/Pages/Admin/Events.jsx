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
    
    /**
     * Join Logic: 
     * Fetches all events and joins with the organization table 
     * via the event_creator_id (FK -> organization.id).
     */
    const { data, error } = await supabase
      .from('event')
      .select(`
        event_id,
        title,
        date,
        is_approve,
        event_creator_id,
        organization (
          name,
          account_id
        )
      `);

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      const formattedData = data.map(event => {
        const org = event.organization;

        return {
          id: event.event_id,
          name: event.title,
          organizer: org?.name || 'Unknown Organization',
          orgAccountId: org?.account_id || null, 
          isApproved: event.is_approve,
          displayDate: new Date(event.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          rawDate: event.date 
        };
      });
      setEvents(formattedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  /**
   * Helper function to send notifications to the organization's account
   * References account.account_id in your schema
   */
  const sendNotification = async (targetAccountId, title, message, type = 'system') => {
    if (!targetAccountId) {
      console.warn('Notification skipped: Organization has no linked account_id.');
      return;
    }

    const { error } = await supabase
      .from('notification')
      .insert([
        { 
          user_id: targetAccountId, 
          title: title, 
          message: message, 
          type: type,
          is_read: false
        }
      ]);
    
    if (error) {
      console.error('Database Error sending notification:', error.message);
    }
  };

  const toggleApproval = async (event) => {
    const newStatus = !event.isApproved;
    const { error } = await supabase
      .from('event')
      .update({ is_approve: newStatus })
      .eq('event_id', event.id);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      // Send notification based on the new status
      const title = newStatus ? 'Event Approved' : 'Event Update';
      const message = `Your event "${event.name}" has been ${newStatus ? 'approved' : 'marked as pending'} by the administrator.`;
      
      await sendNotification(event.orgAccountId, title, message, 'approval');

      setEvents(prev => prev.map(e => 
        e.id === event.id ? { ...e, isApproved: newStatus } : e
      ));
    }
  };

  const handleDeleteClick = (event) => {
    setSelectedEvent(event);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedEvent) return;
    
    // Notify organization before the record is deleted 
    // (This ensures the FK reference is valid during the insert)
    await sendNotification(
      selectedEvent.orgAccountId, 
      'Event Deleted', 
      `Your event "${selectedEvent.name}" was deleted by the administrator.`,
      'alert'
    );

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

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filteredEvents = events.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.organizer.toLowerCase().includes(search.toLowerCase())
  );

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const key = sortKey === 'date' ? 'rawDate' : sortKey;
    const valA = a[key]?.toString().toLowerCase() || '';
    const valB = b[key]?.toString().toLowerCase() || '';
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="container-fluid py-4 px-2 px-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Event Management</h2>
        <span className="badge bg-primary px-3 py-2">Total Events: {events.length}</span>
      </div>

      <div className="member-box shadow-sm rounded-3 overflow-hidden bg-white">
        {/* Search Bar */}
        <div className="p-3 border-bottom bg-light">
          <div className="input-group" style={{ maxWidth: '450px' }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              placeholder="Search by event title or organization..."
              className="form-control border-start-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table Header (Desktop) */}
        <div className="row header-row bg-dark text-white py-3 px-3 m-0 d-none d-xl-flex text-center fw-bold">
          <div className="col-xl-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
            Event Title {sortKey === 'name' && (sortAsc ? '▲' : '▼')}
          </div>
          <div className="col-xl-2" style={{ cursor: 'pointer' }} onClick={() => handleSort('organizer')}>
            Organizer {sortKey === 'organizer' && (sortAsc ? '▲' : '▼')}
          </div>
          <div className="col-xl-2" style={{ cursor: 'pointer' }} onClick={() => handleSort('date')}>
            Date {sortKey === 'date' && (sortAsc ? '▲' : '▼')}
          </div>
          <div className="col-xl-2">Status</div>
          <div className="col-xl-3">Actions</div>
        </div>

        {/* Scrollable Table Body */}
        <div className="p-0 overflow-auto" style={{ maxHeight: '70vh' }}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-2 text-muted">Loading events...</p>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-5 text-muted">No events matching your search were found.</div>
          ) : (
            sortedEvents.map((event) => (
              <div className="row body-row border-bottom py-4 px-3 m-0 align-items-center bg-white text-center" key={event.id}>
                {/* Title */}
                <div className="col-12 col-xl-3 mb-3 mb-xl-0">
                  <div className="fw-bold text-dark fs-5">{event.name}</div>
                </div>

                {/* Organizer */}
                <div className="col-12 col-xl-2 mb-3 mb-xl-0">
                  <div className="text-secondary d-flex align-items-center justify-content-center">
                    <i className="bi bi-person-badge me-2"></i>
                    {event.organizer}
                  </div>
                </div>

                {/* Date */}
                <div className="col-12 col-xl-2 mb-3 mb-xl-0">
                  <div className="text-muted">{event.displayDate}</div>
                </div>
                
                {/* Status Badge */}
                <div className="col-12 col-xl-2 mb-3 mb-xl-0">
                  <span className={`badge rounded-pill px-3 py-2 ${event.isApproved ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {event.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-12 col-xl-3">
                  <div className="d-flex justify-content-center gap-2">
                    <button 
                      className={`btn btn-sm px-4 fw-bold ${event.isApproved ? 'btn-outline-secondary' : 'btn-success'}`}
                      onClick={() => toggleApproval(event)}
                    >
                      {event.isApproved ? 'Unapprove' : 'Approve'}
                    </button>
                    <button 
                      className="btn btn-outline-danger btn-sm px-4 fw-bold" 
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

      {/* Modern Custom Modal */}
      {showConfirm && (
        <div 
          className="modal-custom-overlay d-flex align-items-center justify-content-center p-3" 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 
          }}
          onClick={cancelDelete}
        >
          <div 
            className="modal-custom-box w-100 shadow-lg border-0 bg-white rounded-4 overflow-hidden" 
            style={{ maxWidth: '400px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 text-center">
              <div className="mb-3 text-danger">
                <i className="bi bi-exclamation-triangle-fill fs-1"></i>
              </div>
              <h4 className="fw-bold">Delete Event?</h4>
              <p className="text-muted">
                Are you sure you want to delete <strong>{selectedEvent?.name}</strong>? 
                This action cannot be undone and the organizer will be notified.
              </p>
              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-light border flex-grow-1 py-2" onClick={cancelDelete}>Cancel</button>
                <button className="btn btn-danger flex-grow-1 py-2 fw-bold" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventsTable;