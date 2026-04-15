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
     * 1. Get event details
     * 2. Join organization using event_creator_id
     * 3. Select name and account_id from the organization table
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
      // LOG DATA TO DEBUG: Check if 'organization' is null or if 'account_id' is missing
      console.log("Fetched Events Data:", data);

      const formattedData = data.map(event => {
        // Safe check for nested organization object
        const org = event.organization;

        return {
          id: event.event_id,
          name: event.title,
          organizer: org?.name || 'Unknown Organization',
          orgAccountId: org?.account_id || null, // If this is null, the error will trigger
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
   */
  const sendNotification = async (targetAccountId, title, message, type = 'system') => {
    if (!targetAccountId) {
      console.error(`Notification failed: No target account ID found. Verify that the organization for this event has an account_id set in the database.`);
      return;
    }

    const { error } = await supabase
      .from('notification')
      .insert([
        { 
          user_id: targetAccountId, // References account.account_id (BIGINT)
          title: title, 
          message: message, 
          type: type,
          is_read: false
        }
      ]);
    
    if (error) {
      console.error('Database Error sending notification:', error.message);
    } else {
      console.log(`Notification sent successfully to Account ID: ${targetAccountId}`);
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
      // Send notification to the organization
      const title = newStatus ? 'Event Approved' : 'Event Status Update';
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
      <h2 className="fw-bold mb-4 text-center text-md-start">Event Management</h2>

      <div className="member-box shadow-sm rounded-3 overflow-hidden bg-red overflow-y-auto">
        <div className="p-3 border-bottom">
          <div className="input-group mx-auto mx-md-0" style={{ maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search events..."
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Header */}
        <div className="row header-row bg-dark text-white py-3 px-3 m-0 d-none d-xl-flex text-center">
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

        {/* Table Body */}
        <div className="p-0 bg-red">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status"></div>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-5 text-muted">No events found.</div>
          ) : (
            sortedEvents.map((event) => (
              <div className="row body-row border-bottom py-2 my-2 px-3 m-0 align-items-center bg-white text-center" key={event.id}>
                <div className="col-12 col-xl-3 mb-3 mb-xl-0">
                  <div className="fw-bold text-dark fs-5">{event.name}</div>
                </div>

                <div className="col-12 col-xl-2 mb-3 mb-xl-0">
                  <div className="text-secondary">{event.organizer}</div>
                </div>

                <div className="col-12 col-xl-2 mb-3 mb-xl-0">
                  <div>{event.displayDate}</div>
                </div>
                
                <div className="col-12 col-xl-2 mb-3 mb-xl-0">
                  <span className={`badge rounded-pill ${event.isApproved ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {event.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                <div className="col-12 col-xl-3">
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

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-custom-overlay d-flex align-items-center justify-content-center p-3" onClick={cancelDelete}>
          <div className="modal-custom-box w-100 shadow-lg border-0 bg-white" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-custom-header text-center border-0 pt-4">
              <h5 className="text-danger fw-bold mb-0">Confirm Delete</h5>
            </div>
            <div className="modal-custom-body text-center px-4 py-3">
              Are you sure you want to delete <strong>{selectedEvent?.name}</strong>?
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