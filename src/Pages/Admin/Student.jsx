// src/Pages/Admin/Student.jsx

import React, { useState, useEffect } from 'react';

import '../../Styles/Admin.css';

import * as XLSX from 'xlsx';

import { supabase } from '../../supabaseClient';



function Student() {

  const [students, setStudents] = useState([]);

  const [formData, setFormData] = useState({

    studentId: '', name: '', department: '', year: '', section: '', organization: ''

  });

  const [selectedStudent, setSelectedStudent] = useState(null);

  const [showAddConfirm, setShowAddConfirm] = useState(false);

  const [showProcessingModal, setShowProcessingModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(false);



  const generateEmail = (name) => {

    const cleanName = name.toLowerCase().replace(/\s+/g, '');

    const randomNums = Math.floor(100 + Math.random() * 900);

    return `${cleanName}${randomNums}@ereg.com`;

  };



  const generatePassword = () => Math.random().toString(36).slice(-8);



  useEffect(() => {

    fetchStudents();

  }, []);



  const fetchStudents = async () => {

    const { data, error } = await supabase

      .from('student')

      .select(`

        profile_id,

        name,

        department,

        year_level,

        section,

        organization_id,

        account_id,

        account:account_id(email, password, auth_id)

      `)

      .order('profile_id', { ascending: true });

   

    if (error) {

      console.error("Error fetching students:", error);

    } else {

      setStudents(data.map(s => ({

        id: s.profile_id,

        studentId: s.profile_id,

        name: s.name,

        department: s.department,

        year: s.year_level,

        section: s.section,

        organization: s.organization_id || 'None',

        accountId: s.account_id,

        authId: s.account?.auth_id,

        email: s.account?.email || '',

        password: s.account?.password || ''

      })));

    }

  };



  const processCreation = async (studentObj) => {

    const email = generateEmail(studentObj.name);

    const password = generatePassword();

   

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) throw authError;



    const { data: accData, error: accError } = await supabase

      .from('account')

      .insert([{ auth_id: authData.user.id, email: email, role: 'student', password: password }])

      .select().single();

    if (accError) throw accError;



    const { error: studError } = await supabase

      .from('student')

      .insert([{

        profile_id: parseInt(studentObj.studentId),

        name: studentObj.name,

        department: studentObj.department,

        year_level: studentObj.year ? parseInt(studentObj.year) : null,

        section: studentObj.section,

        organization_id: (studentObj.organization && studentObj.organization !== 'None') ? parseInt(studentObj.organization) : null,

        account_id: accData.account_id

      }]);

    if (studError) throw studError;

  };



  const downloadCurrentTable = () => {

    if (sortedStudents.length === 0) {

      alert("No data available to export.");

      return;

    }

    const dataToExport = sortedStudents.map(s => ({

      "Student ID": s.studentId,

      "Student Name": s.name,

      "Email": s.email,

      "Password": s.password

    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Credentials");

    XLSX.writeFile(workbook, "Student_Credentials.xlsx");

  };



  const handleFileUpload = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setShowProcessingModal(true);

    const reader = new FileReader();

    reader.onload = async (evt) => {

      const data = new Uint8Array(evt.target.result);

      const workbook = XLSX.read(data, { type: 'array' });

      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      for (const row of jsonData) {

        try {

          await processCreation({

            studentId: row["Student ID"],

            name: row["Student Name"],

            department: row["Department"],

            year: row["Year Level"],

            section: row["Section"],

            organization: row["Organization ID"]

          });

        } catch (err) { console.error(err); }

      }

      await fetchStudents();

      setShowProcessingModal(false);

    };

    reader.readAsArrayBuffer(file);

  };



  const confirmAddStudent = async () => {

    setLoading(true);

    try {

      await processCreation(formData);

      await fetchStudents();

      setFormData({ studentId: '', name: '', department: '', year: '', section: '', organization: '' });

      setShowAddConfirm(false);

    } catch (err) { alert(err.message); }

    finally { setLoading(false); }

  };



  const handleEditSave = async () => {

    if (!selectedStudent) return; // FIX: Prevent reading null properties

    setLoading(true);

   

    const { error } = await supabase.from('student').update({

      profile_id: parseInt(selectedStudent.studentId),

      name: selectedStudent.name,

      department: selectedStudent.department,

      year_level: parseInt(selectedStudent.year),

      section: selectedStudent.section,

    }).eq('profile_id', selectedStudent.id);

   

    if (error) {

      alert(error.message);

    } else {

      await fetchStudents();

      // Close modal first

      const modalElement = document.getElementById('editModal');

      const modalInstance = window.bootstrap?.Modal.getInstance(modalElement);

      modalInstance?.hide();

      // Set to null LAST

      setSelectedStudent(null);

    }

    setLoading(false);

  };



  const handleDelete = async () => {

    if (!selectedStudent) return;

    setLoading(true);

    try {

      // 1. Delete student row

      const { error: studentError } = await supabase

        .from('student')

        .delete()

        .eq('profile_id', selectedStudent.id);

      if (studentError) throw studentError;



      // 2. Delete account row

      if (selectedStudent.accountId) {

        const { error: accountError } = await supabase

          .from('account')

          .delete()

          .eq('account_id', selectedStudent.accountId);

        if (accountError) throw accountError;

      }



      await fetchStudents();

     

      const modalElement = document.getElementById('deleteModal');

      const modalInstance = window.bootstrap?.Modal.getInstance(modalElement);

      modalInstance?.hide();

     

      setSelectedStudent(null);

    } catch (err) {

      alert(err.message);

    } finally {

      setLoading(false);

    }

  };



  const sortedStudents = [...students].filter(s =>

    Object.values(s).some(val => val?.toString().toLowerCase().includes(searchTerm.toLowerCase()))

  );



  return (

    <div className="container-fluid py-4">

      <h2 className="fw-bold mb-3">Student Management</h2>

      <div className="row">

        <div className="col-lg-4 col-md-12">

          <div className="form-box shadow mb-3 p-3 bg-white rounded">

            <h4 className="fw-bold mb-1">Import Data</h4>

            <input type="file" accept=".xlsx,.xls" className="form-control mb-2" onChange={handleFileUpload} />

          </div>



          <div className="form-box shadow p-3 bg-white rounded">

            <h4 className="fw-bold mb-3">Manual Registration</h4>

            <form onSubmit={(e) => { e.preventDefault(); setShowAddConfirm(true); }}>

              <input type="number" placeholder="Student ID" className="form-control mb-2" value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})} required />

              <input type="text" placeholder="Full Name" className="form-control mb-2" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />

              <input type="text" placeholder="Department" className="form-control mb-2" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required />

              <div className="row g-2">

                <div className="col-6"><input type="number" placeholder="Year" className="form-control mb-2" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} required /></div>

                <div className="col-6"><input type="text" placeholder="Section" className="form-control mb-2" value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} required /></div>

              </div>

              <button type="submit" className="submit-button mt-2 w-100">Register Student</button>

            </form>

          </div>

        </div>



        <div className="col-lg-8 col-md-12">

          <div className="member-box bg-red p-3 rounded shadow">

            <div className="mb-2 d-flex flex-column flex-sm-row gap-2">

              <input type="text" className="form-control" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

              <button className="btn btn-success text-nowrap" onClick={downloadCurrentTable}>

                Download Credentials ({sortedStudents.length})

              </button>

            </div>



            <div className="header-row text-center d-flex justify-content-center gap-2 bg-dark text-white p-2 fw-bold">

              <div className="d-none d-lg-block col-lg-1">ID</div>

              <div className="col-4 col-lg-3">Name</div>

              <div className="d-none d-lg-block col-lg-2">Dept</div>

              <div className="d-none d-lg-block col-lg-1">Year</div>

              <div className="d-none d-lg-block col-lg-1">Sec</div>

              <div className="col-5 col-lg-2 text-end">Actions</div>

            </div>



            {sortedStudents.map(s => (

              <div key={s.id} className="body-row text-center d-flex justify-content-center gap-2 border-bottom p-2 align-items-center bg-white">

                <div className="d-none d-lg-block col-lg-1">{s.studentId}</div>

                <div className="col-4 col-lg-3 text-truncate">{s.name}</div>

                <div className="d-none d-lg-block col-lg-2">{s.department}</div>

                <div className="d-none d-lg-block col-lg-1">{s.year}</div>

                <div className="d-none d-lg-block col-lg-1 text-truncate">{s.section}</div>

                <div className="col-5 col-lg-2 text-end ">

                  <div className="dropdown w-100">

                    <button className="btn dropdown-toggle w-100 btn-sm" type="button" data-bs-toggle="dropdown">Action</button>

                    <ul className="dropdown-menu shadow">

                      <li><button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#editModal" onClick={() => setSelectedStudent({...s})}>Edit</button></li>

                      <li><button className="dropdown-item text-danger" data-bs-toggle="modal" data-bs-target="#deleteModal" onClick={() => setSelectedStudent(s)}>Delete</button></li>

                    </ul>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>



      {/* Manual Add Confirmation */}

      {showAddConfirm && (

        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content shadow border-0">

              <div className="modal-body py-4 text-center">

                <h5 className="fw-bold">Confirm Registration</h5>

                <p>Register <strong>{formData.name}</strong>?</p>

                <div className="d-flex gap-2 justify-content-center mt-3">

                  <button className="btn btn-light px-4" onClick={() => setShowAddConfirm(false)}>Cancel</button>

                  <button className="btn btn-primary px-4" onClick={confirmAddStudent} disabled={loading}>Confirm</button>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* Edit Student Modal */}

      <div className="modal fade" id="editModal" tabIndex="-1">

        <div className="modal-dialog modal-dialog-centered">

          <div className="modal-content border-0 shadow">

            <div className="modal-header fw-bold">

              <h5 className="modal-title">Edit Student Record</h5>

              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>

            </div>

            <div className="modal-body">

              {selectedStudent && (

                <>

                  <label className="small fw-bold">Student ID</label>

                  <input type="number" className="form-control mb-2" value={selectedStudent.studentId} onChange={e => setSelectedStudent({...selectedStudent, studentId: e.target.value})} />

                  <label className="small fw-bold">Full Name</label>

                  <input type="text" className="form-control mb-2" value={selectedStudent.name} onChange={e => setSelectedStudent({...selectedStudent, name: e.target.value})} />

                  <label className="small fw-bold">Department</label>

                  <input type="text" className="form-control mb-2" value={selectedStudent.department} onChange={e => setSelectedStudent({...selectedStudent, department: e.target.value})} />

                  <div className="row g-2">

                    <div className="col-6">

                      <label className="small fw-bold">Year Level</label>

                      <input type="number" className="form-control" value={selectedStudent.year} onChange={e => setSelectedStudent({...selectedStudent, year: e.target.value})} />

                    </div>

                    <div className="col-6">

                      <label className="small fw-bold">Section</label>

                      <input type="text" className="form-control" value={selectedStudent.section} onChange={e => setSelectedStudent({...selectedStudent, section: e.target.value})} />

                    </div>

                  </div>

                </>

              )}

            </div>

            <div className="modal-footer border-0">

              <button className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>

              <button className="btn btn-primary" onClick={handleEditSave} disabled={loading}>Save Changes</button>

            </div>

          </div>

        </div>

      </div>



      {/* Delete Confirmation Modal */}

      <div className="modal fade" id="deleteModal" tabIndex="-1">

        <div className="modal-dialog modal-dialog-centered">

          <div className="modal-content border-0 shadow">

            <div className="modal-body text-center p-4">

              <div className="text-danger mb-3">⚠️</div>

              <h5 className="fw-bold">Delete Record?</h5>

              <p>Permanently remove <strong>{selectedStudent?.name}</strong>? This action cannot be undone.</p>

              <div className="d-flex gap-2 justify-content-center mt-3">

                <button className="btn btn-secondary px-4" data-bs-dismiss="modal">Cancel</button>

                <button className="btn btn-danger px-4" onClick={handleDelete} disabled={loading}>Delete</button>

              </div>

            </div>

          </div>

        </div>

      </div>

     

      {showProcessingModal && (

        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content text-center p-5 border-0 shadow-lg">

              <div className="spinner-border text-primary mb-3 mx-auto"></div>

              <h4 className="fw-bold">Processing Bulk Import...</h4>

              <p className="text-muted">Please wait while we create accounts.</p>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}



export default Student;