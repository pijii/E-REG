import React, { useState } from 'react';
import '../../Styles/Admin.css';
import * as XLSX from 'xlsx';

function Student() {
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    department: '',
    year: '',
    section: '',
    organization: ''
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Excel upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const formattedData = jsonData.map((row, index) => ({
        id: students.length + index + 1,
        studentId: row["Student ID"],
        name: row["Student Name"],
        department: row["Department"],
        year: row["Year Level"],
        section: row["Section"],
        organization: row["Organization"] || "None"
      }));
      setStudents(prev => [...prev, ...formattedData]);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    const { studentId, name, department, year, section } = formData;
    if (!studentId || !name || !department || !year || !section) {
      alert("Please fill in all required fields!");
      return;
    }
    setShowAddConfirm(true);
  };

  const confirmAddStudent = () => {
    setStudents(prev => [
      ...prev,
      { id: prev.length + 1, ...formData, organization: formData.organization || "None" }
    ]);
    setFormData({ studentId: '', name: '', department: '', year: '', section: '', organization: '' });
    setShowAddConfirm(false);
  };

  const handleEditSave = () => {
    setStudents(prev =>
      prev.map(s => s.id === selectedStudent.id ? selectedStudent : s)
    );
    setSelectedStudent(null);
  };

  const handleDelete = () => {
    setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
    setSelectedStudent(null);
  };

  // --- SEARCH ---
  const filteredStudents = students.filter(s =>
    Object.keys(s).some(key => {
      if (['id', 'studentId', 'name', 'department', 'year', 'section', 'organization'].includes(key)) {
        return s[key].toString().toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    })
  );

  // --- SORT ---
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const key = sortConfig.key;
    let valA = a[key];
    let valB = b[key];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // --- DOWNLOAD CURRENT TABLE ---
  const downloadCurrentTable = () => {
    const exportData = sortedStudents.map(s => ({
      "Student ID": s.studentId,
      "Name": s.name,
      "Section": s.section,
      "Email": `${s.studentId}@school.com`,
      "Password": Math.random().toString(36).slice(-6)
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "Students.xlsx");
  };

  return (
    <div className="container-fluid">
      <h2 className="fw-bold mb-3">Student Management</h2>
      <div className="row">
        {/* Left Column */}
        <div className="col-lg-4 col-md-12">
          <div className="form-box shadow mb-3">
            <h4 className="fw-bold mb-3">Upload Excel</h4>
            <input type="file" accept=".xlsx,.xls" className="form-control mb-2" onChange={handleFileUpload} />
            <p className="text-muted">
              Excel columns: Student ID, Student Name, Department, Year Level, Section, Organization (optional)
            </p>
          </div>

          <div className="form-box shadow">
            <h4 className="fw-bold mb-3">Add Student Individually</h4>
            <form>
              {['studentId','name','department','year','section','organization'].map(f => (
                <div className="mb-2" key={f}>
                  <label className="form-label">{f.charAt(0).toUpperCase()+f.slice(1)}</label>
                  <input
                    type="text"
                    name={f}
                    className="form-control"
                    value={formData[f]}
                    onChange={handleInputChange}
                    placeholder={f === 'organization' ? 'Organization (Optional)' : f.charAt(0).toUpperCase() + f.slice(1)}
                    required={f !== 'organization'}
                  />
                </div>
              ))}
              <button
                type="button"
                className="submit-button mt-2 w-100"
                onClick={handleAddStudent}
              >
                Add Student
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Search + Table */}
        <div className="col-lg-8 col-md-12 mt-3 mt-lg-0">
          <div className="member-box bg-red">
            {/* Search */}
            <div className="mb-2 d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search by any field..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-success" onClick={downloadCurrentTable}>Download Table</button>
            </div>

            {/* Table Header */}
            <div className="header-row text-center d-flex justify-content-center gap-2 bg-dark">
              <div className="d-none d-lg-block col-lg-1" onClick={() => requestSort('studentId')}>ID</div>
              <div className="col-6 col-lg-2" onClick={() => requestSort('name')}>Name</div>
              <div className="d-none d-lg-block col-lg-2" onClick={() => requestSort('department')}>Department</div>
              <div className="d-none d-lg-block col-lg-1" onClick={() => requestSort('year')}>Year</div>
              <div className="d-none d-lg-block col-lg-1" onClick={() => requestSort('section')}>Section</div>
              <div className="d-none d-lg-block col-lg-2" onClick={() => requestSort('organization')}>Organization</div>
              <div className="col-6 col-lg-2">Actions</div>
            </div>

            {/* Table Body */}
            {sortedStudents.length === 0 ? (
              <div className="text-center py-3">No students found.</div>
            ) : (
              sortedStudents.map(s => (
                <div key={s.id} className="body-row text-center d-flex justify-content-center gap-2">
                  <div className="col-6 d-md-block d-lg-none">{s.name}</div>
                  <div className="d-none d-lg-block col-lg-1">{s.studentId}</div>
                  <div className="d-none d-lg-block col-lg-2">{s.name}</div>
                  <div className="d-none d-lg-block col-lg-2">{s.department}</div>
                  <div className="d-none d-lg-block col-lg-1">{s.year}</div>
                  <div className="d-none d-lg-block col-lg-1">{s.section}</div>
                  <div className="d-none d-lg-block col-lg-2">{s.organization}</div>
                  <div className="col-5 col-lg-2">
                    <div className="dropdown w-100">
                      <button className="btn dropdown-toggle w-100" type="button" data-bs-toggle="dropdown">
                        Actions
                      </button>
                      <ul className="dropdown-menu">
                        <li><button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#viewModal" onClick={() => setSelectedStudent(s)}>View</button></li>
                        <li><button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#editModal" onClick={() => setSelectedStudent({...s})}>Edit</button></li>
                        <li><button className="dropdown-item text-danger" data-bs-toggle="modal" data-bs-target="#deleteModal" onClick={() => setSelectedStudent(s)}>Delete</button></li>
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Student Confirmation Modal */}
      {showAddConfirm && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Add Student</h5>
                  <button className="btn-close" onClick={() => setShowAddConfirm(false)}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to add <strong>{formData.name}</strong>?</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowAddConfirm(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={confirmAddStudent}>Confirm</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View, Edit, Delete Modals remain unchanged */}
      {/* ... same as before ... */}
    </div>
  );
}

export default Student;