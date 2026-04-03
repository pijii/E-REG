import React, { useState } from 'react';
import '../../Styles/Admin.css';
import * as XLSX from 'xlsx';

function OrgCreate() {
  const [orgs, setOrgs] = useState([]);
  const [formData, setFormData] = useState({
    orgId: '',
    orgName: '',
    type: 'Internal',
    department: '',
    adviser: ''
  });
  const [selectedOrg, setSelectedOrg] = useState(null);
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
        id: orgs.length + index + 1,
        orgId: row["Org ID"],
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
    const { orgId, orgName, type, adviser } = formData;
    if (!orgId || !orgName || !type || !adviser) {
      alert("Please fill in all required fields!");
      return;
    }
    setShowAddConfirm(true);
  };

  const confirmAddOrg = () => {
    setOrgs(prev => [
      ...prev,
      { id: prev.length + 1, ...formData }
    ]);
    setFormData({ orgId: '', orgName: '', type: 'Internal', department: '', adviser: '' });
    setShowAddConfirm(false);
  };

  const handleEditSave = () => {
    setOrgs(prev =>
      prev.map(o => o.id === selectedOrg.id ? selectedOrg : o)
    );
    setSelectedOrg(null);
  };

  const handleDelete = () => {
    setOrgs(prev => prev.filter(o => o.id !== selectedOrg.id));
    setSelectedOrg(null);
  };

  // --- SEARCH ---
  const filteredOrgs = orgs.filter(o =>
    Object.keys(o).some(key => {
      if (['orgId','orgName','type','department','adviser'].includes(key)) {
        return o[key].toString().toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    })
  );

  // --- SORT ---
  const sortedOrgs = [...filteredOrgs].sort((a, b) => {
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
    const exportData = sortedOrgs.map(o => ({
      "Org ID": o.orgId,
      "Org Name": o.orgName,
      "Type": o.type,
      "Department": o.department,
      "Adviser": o.adviser
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
              Excel columns: Org ID, Org Name, Type (Internal/External), Department (if Internal), Adviser
            </p>
          </div>

          <div className="form-box shadow">
            <h4 className="fw-bold mb-3">Add Organization Individually</h4>
            <form>
              <div className="mb-2">
                <label className="form-label">Org ID</label>
                <input type="text" name="orgId" className="form-control" value={formData.orgId} onChange={handleInputChange} required />
              </div>
              <div className="mb-2">
                <label className="form-label">Org Name</label>
                <input type="text" name="orgName" className="form-control" value={formData.orgName} onChange={handleInputChange} required />
              </div>
              <div className="mb-2">
                <label className="form-label">Type</label>
                <select name="type" className="form-control" value={formData.type} onChange={handleInputChange}>
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
                </select>
              </div>
              {formData.type === "Internal" && (
                <div className="mb-2">
                  <label className="form-label">Department</label>
                  <input type="text" name="department" className="form-control" value={formData.department} onChange={handleInputChange} />
                </div>
              )}
              <div className="mb-2">
                <label className="form-label">Adviser</label>
                <input type="text" name="adviser" className="form-control" value={formData.adviser} onChange={handleInputChange} required />
              </div>
              <button type="button" className="submit-button mt-2 w-100" onClick={handleAddOrg}>Add Organization</button>
            </form>
          </div>
        </div>

        {/* Right Column: Table */}
        <div className="col-lg-8 col-md-12 mt-3 mt-lg-0 ">
          <div className="member-box bg-red">
            {/* Search + Download */}
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

            <div className="header-row text-center d-flex justify-content-center gap-2 bg-dark">
              <div className="d-none d-lg-block col-lg-2" onClick={() => requestSort('orgId')}>Org ID</div>
              <div className="col-6 col-lg-4" onClick={() => requestSort('orgName')}>Org Name</div>
              <div className="d-none d-lg-block col-lg-2" onClick={() => requestSort('type')}>Type</div>
              <div className="d-none d-lg-block col-lg-2" onClick={() => requestSort('adviser')}>Adviser</div>
              <div className="col-6 col-lg-2">Actions</div>
            </div>

            {sortedOrgs.length === 0 ? (
              <div className="text-center py-3">No organizations found.</div>
            ) : (
              sortedOrgs.map(o => (
                <div key={o.id} className="body-row text-center d-flex justify-content-center gap-2">
                  <div className="d-none d-lg-block col-lg-2">{o.orgId}</div>
                  <div className="col-6 col-lg-4">{o.orgName}</div>
                  <div className="d-none d-lg-block col-lg-2">{o.type}</div>
                  <div className="d-none d-lg-block col-lg-2">{o.adviser}</div>
                  <div className="col-5 col-lg-2">
                    <div className="dropdown w-100">
                      <button className="btn dropdown-toggle w-100" type="button" data-bs-toggle="dropdown">
                        Actions
                      </button>
                      <ul className="dropdown-menu">
                        <li><button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#viewModal" onClick={() => setSelectedOrg(o)}>View</button></li>
                        <li><button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#editModal" onClick={() => setSelectedOrg({...o})}>Edit</button></li>
                        <li><button className="dropdown-item text-danger" data-bs-toggle="modal" data-bs-target="#deleteModal" onClick={() => setSelectedOrg(o)}>Delete</button></li>
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
        <>
          <div className="modal-backdrop fade show"></div>
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
        </>
      )}

      {/* TODO: Add View, Edit, Delete Modals here like in Student Management */}
    </div>
  );
}

export default OrgCreate;