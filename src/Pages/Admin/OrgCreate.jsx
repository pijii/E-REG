// src/Components/Admin/OrgCreate.jsx
import React, { useState, useEffect } from 'react';
import '../../Styles/Admin.css';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabaseClient';

function OrgCreate() {
  const [orgs, setOrgs] = useState([]);
  const [formData, setFormData] = useState({
    orgName: '',
    type: 'Internal',
    department: '',
    adviser: ''
  });
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Fetch existing organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      const { data, error } = await supabase
        .from('organization')
        .select('*');
      if (error) {
        console.error('Error fetching organizations:', error);
      } else {
        const mappedOrgs = data.map(org => ({
          id: org.id,
          orgName: org.name,
          type: org.type,
          department: org.department || '',
          adviser: org.adviser || '',
          account_id: org.account_id
        }));
        setOrgs(mappedOrgs);
      }
    };
    fetchOrgs();
  }, []);

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
        id: orgs.length + index + 1,
        orgName: row["Org Name"],
        type: row["Type"] || "Internal",
        department: row["Department"] || "",
        adviser: row["Adviser"] || ""
      }));
      setOrgs(prev => [...prev, ...formattedData]);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOrg = (e) => {
    e.preventDefault();
    const { orgName, type, adviser } = formData;
    if (!orgName || !type || !adviser) {
      alert("Please fill in all required fields!");
      return;
    }
    setShowAddConfirm(true);
  };

  // Generate email for organization
  const generateOrgEmail = (orgName) => {
    const names = orgName.trim().split(' ');
    if (names.length < 2) return `${orgName.toLowerCase()}@ereg.com`;
    const firstLetter = names[0][0].toLowerCase();
    const lastName = names[names.length - 1].toLowerCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${firstLetter}${lastName}${randomNum}@ereg.com`;
  };

  // Confirm add organization with automatic account & profile
  const confirmAddOrg = async () => {
    try {
      const email = generateOrgEmail(formData.orgName);

      // 1️⃣ Insert organization
      const { data: orgData, error: orgError } = await supabase
        .from('Organization')
        .insert([{
          name: formData.orgName,
          type: formData.type,
          department: formData.department,
          adviser: formData.adviser
        }])
        .select()
        .single();
      if (orgError) throw orgError;

      // 2️⃣ Insert account
      const { data: accountData, error: accountError } = await supabase
        .from('Account')
        .insert([{
          email,
          password: 'password123',
          role: 'organization'
        }])
        .select()
        .single();
      if (accountError) throw accountError;

      // 3️⃣ Update organization with account_id
      await supabase
        .from('Organization')
        .update({ account_id: accountData.account_id })
        .eq('id', orgData.id);

      // 4️⃣ Insert profile in UserProfiles
      const { error: profileError } = await supabase
        .from('UserProfiles')
        .insert([{
          profile_id: orgData.id,
          account_id: accountData.account_id,
          profile_type: 'organization',
          created_at: new Date()
        }]);
      if (profileError) throw profileError;

      setOrgs(prev => [...prev, { ...orgData, account_id: accountData.account_id }]);
      setFormData({ orgName: '', type: 'Internal', department: '', adviser: '' });
      setShowAddConfirm(false);
      alert(`Organization added!\nEmail: ${email}\nPassword: password123`);
    } catch (err) {
      console.error('Error adding organization:', err);
      alert('Failed to add organization.');
    }
  };

  // Edit & Delete
  const handleEditSave = () => {
    setOrgs(prev =>
      prev.map(org => org.id === selectedOrg.id ? selectedOrg : org)
    );
    setSelectedOrg(null);
  };
  const handleDelete = () => {
    setOrgs(prev => prev.filter(org => org.id !== selectedOrg.id));
    setSelectedOrg(null);
  };

  // SEARCH
  const filteredOrgs = orgs.filter(org =>
    ['orgName','type','department','adviser'].some(key =>
      org[key]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // SORT
  const sortedOrgs = [...filteredOrgs].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
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

  // DOWNLOAD TABLE
  const downloadCurrentTable = () => {
    const exportData = sortedOrgs.map(org => ({
      "Org Name": org.orgName,
      "Type": org.type,
      "Department": org.department,
      "Adviser": org.adviser
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Organizations");
    XLSX.writeFile(workbook, "Organizations.xlsx");
  };

  return (
    <div className="container-fluid">
      <h2 className="fw-bold mb-3">Organization Management</h2>
      <div className="row">
        {/* Left Column */}
        <div className="col-lg-4 col-md-12">
          <div className="form-box shadow mb-3">
            <h4 className="fw-bold mb-3">Upload Excel</h4>
            <input type="file" accept=".xlsx,.xls" className="form-control mb-2" onChange={handleFileUpload} />
            <p className="text-muted">
              Excel columns: Org Name, Type (Internal/External), Department (if Internal), Adviser
            </p>
          </div>
          <div className="form-box shadow">
            <h4 className="fw-bold mb-3">Add Organization Individually</h4>
            <form>
              {['orgName','type','department','adviser'].map(f => (
                <div className="mb-2" key={f}>
                  <label className="form-label">{f.charAt(0).toUpperCase()+f.slice(1)}</label>
                  {f === 'type' ? (
                    <select name={f} className="form-control" value={formData[f]} onChange={handleInputChange}>
                      <option value="Internal">Internal</option>
                      <option value="External">External</option>
                    </select>
                  ) : (
                    <input type="text" name={f} className="form-control" value={formData[f]} onChange={handleInputChange} />
                  )}
                </div>
              ))}
              <button type="button" className="submit-button mt-2 w-100" onClick={handleAddOrg}>Add Organization</button>
            </form>
          </div>
        </div>

        {/* Right Column: Table */}
        <div className="col-lg-8 col-md-12 mt-3 mt-lg-0">
          <div className="member-box bg-red">
            <div className="mb-2 d-flex gap-2">
              <input type="text" className="form-control" placeholder="Search by any field..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <button className="btn btn-success" onClick={downloadCurrentTable}>Download Table</button>
            </div>

            <div className="header-row text-center d-flex justify-content-center gap-2 bg-dark">
              <div className="col-6 col-lg-4" onClick={() => requestSort('orgName')}>Org Name</div>
              <div className="d-none d-lg-block col-lg-2" onClick={() => requestSort('type')}>Type</div>
              <div className="d-none d-lg-block col-lg-2" onClick={() => requestSort('adviser')}>Adviser</div>
              <div className="col-6 col-lg-2">Actions</div>
            </div>

            {sortedOrgs.length === 0 ? (
              <div className="text-center py-3">No organizations found.</div>
            ) : (
              sortedOrgs.map(org => (
                <div key={org.id} className="body-row text-center d-flex justify-content-center gap-2">
                  <div className="col-6 col-lg-4">{org.orgName}</div>
                  <div className="d-none d-lg-block col-lg-2">{org.type}</div>
                  <div className="d-none d-lg-block col-lg-2">{org.adviser}</div>
                  <div className="col-5 col-lg-2">
                    <div className="dropdown w-100">
                      <button className="btn dropdown-toggle w-100" type="button" data-bs-toggle="dropdown">Actions</button>
                      <ul className="dropdown-menu">
                        <li><button className="dropdown-item" onClick={() => setSelectedOrg(org)}>View</button></li>
                        <li><button className="dropdown-item" onClick={() => setSelectedOrg({...org})}>Edit</button></li>
                        <li><button className="dropdown-item text-danger" onClick={() => setSelectedOrg(org)}>Delete</button></li>
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Confirmation Modal */}
      {showAddConfirm && (
        <div className="modal-backdrop fade show">
          <div className="modal show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Add Organization</h5>
                  <button className="btn-close" onClick={() => setShowAddConfirm(false)}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to add <strong>{formData.orgName}</strong>?</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowAddConfirm(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={confirmAddOrg}>Confirm</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrgCreate;