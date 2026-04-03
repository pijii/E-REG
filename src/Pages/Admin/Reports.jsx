import React, { useState } from 'react';
import '../../Styles/Admin.css';

function Reports() {
  const [events] = useState([
    { id: 1, name: 'Photography Contest', organizer: 'Media Club', status: 'Active' },
    { id: 2, name: 'Hackathon 2026', organizer: 'IT Org', status: 'Pending' },
    { id: 3, name: 'Coding Challenge', organizer: 'CS Club', status: 'Active' },
  ]);

  const [students] = useState([
    { id: 1, name: 'John Doe', department: 'IT' },
    { id: 2, name: 'Jane Smith', department: 'CS' },
    { id: 3, name: 'Alice Johnson', department: 'Media' },
  ]);

  // Metrics
  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.status === 'Active').length;
  const pendingEvents = events.filter(e => e.status === 'Pending').length;
  const totalStudents = students.length;

  return (
    <div className="container-fluid ">
        <h2 className='fw-bold mb-3'>Reports</h2>

      {/* ---------------- DASHBOARD CARDS ---------------- */}
      <div className="row g-3 mb-4 mt-2">
        <div className="col-12 col-md-3">
          <div className="dashboard-box text-center bg-red text-light">
            <h1>{totalEvents}</h1>
            <p>Total Events</p>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="dashboard-box text-center bg-red text-light">
            <h1>{activeEvents}</h1>
            <p>Active Events</p>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="dashboard-box text-center bg-red text-light">
            <h1>{pendingEvents}</h1>
            <p>Pending Events</p>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="dashboard-box text-center bg-red text-light">
            <h1>{totalStudents}</h1>
            <p>Total Students</p>
          </div>
        </div>
      </div>

      {/* ---------------- EVENTS TABLE ---------------- */}
      <div className="member-box bg-red mb-4 p-4 p-md-5">
        <div className="row header-row bg-dark text-light">
          <div className="col-6 col-md-3">Event Name</div>
          <div className="col-md-3 d-none d-md-block">Organizer</div>
          <div className="col-6 col-md-3 text-center">Status</div>
          <div className="d-none d-md-block col-md-3 text-center">Students Registered</div>
        </div>

        {events.map(event => (
          <div className="row body-row bg-white text-dark" key={event.id}>
            <div className="col-6 col-md-3">{event.name}</div>
            <div className="col-md-3 d-none d-md-block">{event.organizer}</div>
            <div className="col-6 col-md-3 text-center">
              <span
                className={`badge ${
                  event.status === 'Active' ? 'bg-dark text-light' : 'bg-red text-light'
                }`}
              >
                {event.status}
              </span>
            </div>
            <div className="d-none d-md-block col-md-3 text-center">
              {Math.floor(Math.random() * 50) + 1}
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- STUDENT SUMMARY ---------------- */}
      <div className="member-box shadow-lg text-dark p-3">
        <h2 className="mb-3">Student Departments</h2>
        <div className="row">
          {['IT', 'CS', 'Media'].map(dept => (
            <div className="col-12 col-md-4 mb-3" key={dept}>
              <div className="dashboard-box text-center bg-red text-light">
                <h1>{students.filter(s => s.department === dept).length}</h1>
                <p>{dept} Students</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Reports;