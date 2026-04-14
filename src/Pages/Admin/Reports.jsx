import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 
import '../../Styles/Admin.css';

function Reports() {
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [eventSearch, setEventSearch] = useState("");
  const [orgSearch, setOrgSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: orgs } = await supabase.from('organization').select('*');
      const { data: studs } = await supabase.from('student').select('*');
      
      const { data: evs, error: fetchError } = await supabase
        .from('event')
        .select(`
          *, 
          organization ( 
            name,
            account_id
          )
        `);

      if (fetchError) throw fetchError;

      const { data: participants } = await supabase.from('event_participants').select('event_id');
      const eventsWithCounts = evs.map(event => ({
        ...event,
        current_participants: participants?.filter(p => p.event_id === event.event_id).length || 0
      }));

      setOrganizations(orgs || []);
      setStudents(studs || []);
      setEvents(eventsWithCounts || []);
    } catch (err) {
      console.error("Error loading report data:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper function to insert notifications.
   */
  const sendNotification = async (accountId, title, message, type = 'system') => {
    if (!accountId) {
      console.warn(`Notification skipped: No account ID found for title: "${title}"`);
      return; 
    }

    try {
      const { error } = await supabase.from('notification').insert([
        {
          user_id: accountId,
          title: title,
          message: message,
          type: type,
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;
      console.log(`Notification sent to Account ${accountId}: ${title}`);
    } catch (err) {
      console.error("Supabase Notification Error:", err.message);
    }
  };

  /**
   * Handles Approve and Revoke actions
   */
  const toggleApproval = async (event) => {
    const newStatus = !event.is_approve;
    try {
      const { error } = await supabase
        .from('event')
        .update({ is_approve: newStatus })
        .eq('event_id', event.event_id);

      if (error) throw error;

      // NOTIFY THE ORGANIZATION
      const targetAccountId = event.organization?.account_id;
      if (targetAccountId) {
        const actionTitle = newStatus ? "Event Approved" : "Event Revoked";
        const actionMessage = newStatus 
          ? `Great news! Your event "${event.title}" has been approved by the admin.` 
          : `The approval for your event "${event.title}" has been revoked by the admin.`;

        await sendNotification(targetAccountId, actionTitle, actionMessage, 'approval');
      }

      setEvents(events.map(e => e.event_id === event.event_id ? { ...e, is_approve: newStatus } : e));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  /**
   * Handles Event Deletion and multi-user notification
   */
  const confirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      const eventId = eventToDelete.event_id;
      const orgAccountId = eventToDelete.organization?.account_id;
      const eventTitle = eventToDelete.title || "Untitled Event";

      // 1. Fetch joined students' account_ids before deleting the event
      const { data: participants } = await supabase
        .from('event_participants')
        .select(`
          student (
            account_id
          )
        `)
        .eq('event_id', eventId);

      // 2. Delete the event record
      const { error } = await supabase.from('event').delete().eq('event_id', eventId);
      if (error) throw error;

      // 3. NOTIFY THE ORGANIZATION
      if (orgAccountId) {
        await sendNotification(
          orgAccountId, 
          "Event Deleted", 
          `Your event "${eventTitle}" was removed by the administrator.`, 
          'alert'
        );
      }

      // 4. NOTIFY ALL REGISTERED STUDENTS
      if (participants && participants.length > 0) {
        const studentNotifications = participants
          .filter(p => p.student?.account_id)
          .map(p => sendNotification(
            p.student.account_id,
            "Event Cancelled",
            `The event "${eventTitle}" you joined has been cancelled by the administrator.`,
            'alert'
          ));
        
        await Promise.all(studentNotifications);
      }

      setEvents(events.filter(e => e.event_id !== eventId));
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (err) {
      alert("Error deleting event: " + err.message);
    }
  };

  if (loading) return <div className="text-center p-5"><h3>Loading Analytics...</h3></div>;

  return (
    <div className="container-fluid py-4 px-md-4">
      <h2 className="fw-bold mb-4 text-dark">System Reports</h2>

      {/* METRICS */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3 mb-5">
        <div className="col">
          <div className="dashboard-box text-center bg-red text-light p-4 shadow-sm h-100 rounded-3">
            <h1 className="display-5 fw-bold">{events.length}</h1>
            <p className="mb-0 text-uppercase small fw-bold text-white-50">Total Events</p>
          </div>
        </div>
        <div className="col">
          <div className="dashboard-box text-center bg-dark text-light p-4 shadow-sm h-100 border border-warning rounded-3">
            <h1 className="display-5 fw-bold text-warning">{events.filter(e => !e.is_approve).length}</h1>
            <p className="mb-0 text-uppercase small fw-bold">Pending Approval</p>
          </div>
        </div>
        <div className="col">
          <div className="dashboard-box text-center bg-red text-light p-4 shadow-sm h-100 rounded-3">
            <h1 className="display-5 fw-bold">{events.filter(e => e.is_active).length}</h1>
            <p className="mb-0 text-uppercase small fw-bold text-white-50">Active Events</p>
          </div>
        </div>
        <div className="col">
          <div className="dashboard-box text-center bg-red text-light p-4 shadow-sm h-100 rounded-3">
            <h1 className="display-5 fw-bold">{students.length}</h1>
            <p className="mb-0 text-uppercase small fw-bold text-white-50">Total Students</p>
          </div>
        </div>
      </div>

      {/* EVENT TRACKING TABLE */}
      <div className="section-container mb-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
          <h4 className="fw-bold text-dark mb-2 mb-md-0">Event Participation Tracking</h4>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search"></i></span>
            <input 
              type="text" 
              className="form-control border-start-0" 
              placeholder="Search events..." 
              value={eventSearch} 
              onChange={(e) => setEventSearch(e.target.value)} 
            />
          </div>
        </div>

        <div className="member-box bg-red p-3 p-md-4 rounded shadow">
          <div className="row header-row bg-dark text-light py-2 fw-bold rounded-top text-center d-none d-lg-flex">
            <div className="col-lg-3">Event Title</div>
            <div className="col-lg-2">Organizer</div>
            <div className="col-lg-2">Status</div>
            <div className="col-lg-2">Joined</div>
            <div className="col-lg-3">Actions</div>
          </div>
          <div className="bg-white rounded-bottom overflow-hidden">
            {events.filter(e => (e.title || "").toLowerCase().includes(eventSearch.toLowerCase())).map(event => (
              <div className="row body-row text-dark align-items-center border-bottom mx-0 text-center py-2 py-lg-0" key={event.event_id}>
                <div className="col-lg-3 py-lg-3 fw-bold">{event.title}</div>
                <div className="col-lg-2 py-lg-3 text-secondary small text-lg-dark">{event.organization?.name}</div>
                <div className="col-lg-2 py-2 py-lg-3">
                  <span className={`badge rounded-pill ${event.is_approve ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {event.is_approve ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div className="col-lg-2 py-2 py-lg-3 fw-bold text-primary">
                  {event.current_participants} / {event.max_participants || '∞'}
                </div>
                <div className="col-lg-3 py-3">
                  <button className="btn btn-sm btn-outline-dark me-2" onClick={() => toggleApproval(event)}>
                    {event.is_approve ? 'Revoke' : 'Approve'}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => { setEventToDelete(event); setShowDeleteModal(true); }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ORGANIZATIONS LIST */}
      <div className="section-container">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
          <h4 className="fw-bold text-dark mb-2 mb-md-0">Organizations</h4>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <span className="input-group-text bg-white border-end-0"><i className="bi bi-funnel"></i></span>
            <input 
              type="text" 
              className="form-control border-start-0" 
              placeholder="Filter organizations..." 
              value={orgSearch} 
              onChange={(e) => setOrgSearch(e.target.value)} 
            />
          </div>
        </div>
        <div className="row g-3">
          {organizations.filter(o => (o.name || "").toLowerCase().includes(orgSearch.toLowerCase())).map(org => {
            const memberCount = students.filter(s => s.organization_id === org.id).length;
            return (
              <div className="col-12 col-sm-6 col-lg-4" key={org.id}>
                <div className="dashboard-box text-center bg-red text-light p-4 rounded-3 shadow-sm border-0">
                  <h2 className="fw-bold mb-1">{memberCount}</h2>
                  <p className="mb-0 fw-bold">{org.name}</p>
                  <small className="opacity-75">{org.type} Organization</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white border-0">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <p>Are you sure you want to delete <strong>{eventToDelete?.title}</strong>? This will notify the organization and all registered students.</p>
              </div>
              <div className="modal-footer border-0 pb-4 justify-content-center">
                <button className="btn btn-secondary px-4" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="btn btn-danger px-4" onClick={confirmDelete}>Delete Event</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;