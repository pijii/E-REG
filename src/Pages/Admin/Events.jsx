import React, { useState } from 'react';
import '../../Styles/Admin.css';

function EventsTable() {
  const [events, setEvents] = useState([
    { id: 1, name: 'Photography Contest', organizer: 'Media Club', status: 'Active' },
    { id: 2, name: 'Hackathon 2026', organizer: 'IT Org', status: 'Pending' },
    { id: 3, name: 'Coding Challenge', organizer: 'CS Club', status: 'Active' },
  ]);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // ------------------ DELETE ------------------
  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    setEvents(prev => prev.filter(event => event.id !== selectedId));
    setShowConfirm(false);
    setSelectedId(null);
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setSelectedId(null);
  };

  // ------------------ SEARCH ------------------
  const filteredEvents = events.filter(
    e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.organizer.toLowerCase().includes(search.toLowerCase()) ||
      e.status.toLowerCase().includes(search.toLowerCase())
  );

  // ------------------ SORT ------------------
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (!sortKey) return 0;
    const valA = a[sortKey].toLowerCase();
    const valB = b[sortKey].toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="container-fluid">
        <h2 className='fw-bold mb-2'>Event Management</h2>

      {/* ---------------- SEARCH ---------------- */}
      <div className="mb-3 mt-3">
        <input
          type="text"
          placeholder="Search events..."
          className="form-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="member-box bg-red p-lg-5 p-4">

        {/* ---------------- HEADER ---------------- */}
        <div className="row header-row bg-dark text-light">
          <div
            className="col-6 col-md-3"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSort('name')}
          >
            Event Name {sortKey === 'name' && (sortAsc ? '▲' : '▼')}
          </div>
          <div
            className="col-0 col-md-3 d-none d-md-block"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSort('organizer')}
          >
            Organizer {sortKey === 'organizer' && (sortAsc ? '▲' : '▼')}
          </div>
          <div
            className="col-0 d-none d-md-block col-md-3 text-center"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSort('status')}
          >
            Status {sortKey === 'status' && (sortAsc ? '▲' : '▼')}
          </div>
          <div className="col-6 col-md-3 text-center">Action</div>
        </div>

        {/* ---------------- TABLE BODY ---------------- */}
        {sortedEvents.length === 0 && (
          <div className="body-row bg-white">
            <div className="col text-center py-3">No events found.</div>
          </div>
        )}

        {sortedEvents.map((event) => (
          <div className="row body-row bg-white" key={event.id}>

            {/* EVENT NAME */}
            <div className="col-6 col-md-3">{event.name}</div>

            {/* ORGANIZER */}
            <div className="col-md-3 d-none d-md-block">{event.organizer}</div>

            {/* STATUS */}
            <div className="col-0 d-none d-md-block col-md-3 text-center">
              <span
                className={`badge ${
                  event.status === 'Active' ? 'bg-success' : 'bg-warning text-dark'
                }`}
              >
                {event.status}
              </span>
            </div>

            {/* ACTION */}
            <div className="col-6 col-md-3 text-center mt-2 mt-md-0">
              <button
                className="btn btn-danger px-3 py-1"
                onClick={() => handleDeleteClick(event.id)}
              >
                Delete
              </button>
            </div>

          </div>
        ))}

      </div>

      {/* ---------------- DELETE CONFIRMATION ---------------- */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this event?</p>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-danger" onClick={confirmDelete}>
                Delete
              </button>
              <button className="btn btn-secondary" onClick={cancelDelete}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default EventsTable;