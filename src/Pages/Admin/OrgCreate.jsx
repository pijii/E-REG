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
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrgs();
  }, []);

  // UPDATED: Fetching with Join to get the password from the account table
  const fetchOrgs = async () => {
    const { data, error } = await supabase
      .from('organization')
      .select(`
        *,
        account:account_id (
          password
        )
      `)
      .order('id', { ascending: true });
    
    if (error) {
      console.error("Error fetching organizations:", error);
    } else {
      setOrgs(data.map(org => ({
        id: org.id,
        orgName: org.name,
        type: org.type,
        department: org.department || '',
        adviser: org.adviser || '',
        accountId: org.account_id,
        // Accessing the password via the joined account object
        password: org.account?.password || 'No Password Set'
      })));
    }
  };

  const generateOrgEmail = (orgName) => {
    const cleanName = orgName.toLowerCase().replace(/\s+/g, '');
    const randomNums = Math.floor(100 + Math.random() * 900);
    return `${cleanName}${randomNums}@ereg.com`;
  };

  const processCreation = async (orgObj) => {
    const email = generateOrgEmail(orgObj.orgName);
    const password = 'password123'; // Default password

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    const { data: accData, error: accError } = await supabase
      .from('account')
      .insert([{ 
        auth_id: authData.user.id, 
        email: email, 
        role: 'organization', 
        password: password // Saving the password to the account table
      }])
      .select().single();
    if (accError) throw accError;

    const { data: newOrg, error: orgError } = await supabase
      .from('organization')
      .insert([{
        name: orgObj.orgName,
        type: orgObj.type,
        department: orgObj.type === 'Internal' ? orgObj.department : null,
        adviser: orgObj.adviser,
        account_id: accData.account_id
      }])
      .select().single();
    if (orgError) throw orgError;

    const { error: profileError } = await supabase
      .from('userprofiles')
      .insert([{
        profile_id: newOrg.id,
        account_id: accData.account_id,
        profile_type: 'organization'
      }]);
    if (profileError) throw profileError;
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
            orgName: row["Org Name"],
            type: row["Type"] || "Internal",
            department: row["Department"] || "",
            adviser: row["Adviser"] || ""
          });
        } catch (err) { console.error(err); }
      }
      await fetchOrgs();
      setShowProcessingModal(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmAddOrg = async () => {
    setLoading(true);
    try {
      await processCreation(formData);
      await fetchOrgs();
      setFormData({ orgName: '', type: 'Internal', department: '', adviser: '' });
      setShowAddConfirm(false);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleEditSave = async () => {
    if (!selectedOrg) return;
    setLoading(true);
    const { error } = await supabase
      .from('organization')
      .update({
        name: selectedOrg.orgName,
        type: selectedOrg.type,
        department: selectedOrg.type === 'Internal' ? selectedOrg.department : null,
        adviser: selectedOrg.adviser
      })
      .eq('id', selectedOrg.id);

    if (error) {
      alert(error.message);
    } else {
      await fetchOrgs();
      const modalInstance = window.bootstrap?.Modal.getInstance(document.getElementById('editOrgModal'));
      modalInstance?.hide();
      setSelectedOrg(null);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;
    setLoading(true);
    try {
      await supabase.from('organization').delete().eq('id', selectedOrg.id);
      if (selectedOrg.accountId) {
        await supabase.from('account').delete().eq('account_id', selectedOrg.accountId);
      }
      await fetchOrgs();
      const modalInstance = window.bootstrap?.Modal.getInstance(document.getElementById('deleteOrgModal'));
      modalInstance?.hide();
      setSelectedOrg(null);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  // UPDATED: Now includes Password in the exported Excel columns
  const downloadCurrentTable = () => {
    const dataToExport = sortedOrgs.map(o => ({
      "Org Name": o.orgName,
      "Type": o.type,
      "Adviser": o.adviser,
      "Department": o.department,
      "Password": o.password // Added this line
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Organizations");
    XLSX.writeFile(workbook, "Organization_Credentials.xlsx");
  };

  const sortedOrgs = [...orgs].filter(o =>
    Object.values(o).some(val => val?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container-fluid py-4">
      <h2 className="fw-bold mb-3">Organization Management</h2>
      <div className="row">
        {/* Left Form Section */}
        <div className="col-lg-4 col-md-12">
          <div className="form-box shadow mb-3 p-3 bg-white rounded">
            <h4 className="fw-bold mb-1">Import Data</h4>
            <input type="file" accept=".xlsx,.xls" className="form-control mb-2" onChange={handleFileUpload} />
          </div>

          <div className="form-box shadow p-3 bg-white rounded">
            <h4 className="fw-bold mb-3">Manual Registration</h4>
            <form onSubmit={(e) => { e.preventDefault(); setShowAddConfirm(true); }}>
              <input type="text" placeholder="Organization Name" className="form-control mb-2" value={formData.orgName} onChange={(e) => setFormData({...formData, orgName: e.target.value})} required />
              
              <select className="form-select mb-2" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="Internal">Internal</option>
                <option value="External">External</option>
              </select>

              {formData.type === 'Internal' && (
                <input type="text" placeholder="Department" className="form-control mb-2" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required />
              )}

              <input type="text" placeholder="Adviser Name" className="form-control mb-2" value={formData.adviser} onChange={(e) => setFormData({...formData, adviser: e.target.value})} required />
              
              <button type="submit" className="submit-button mt-2 w-100">Register Org</button>
            </form>
          </div>
        </div>

        {/* Right Table Section */}
        <div className="col-lg-8 col-md-12">
          <div className="member-box bg-red p-3 rounded shadow">
            <div className="mb-2 d-flex flex-column flex-sm-row gap-2">
              <input type="text" className="form-control" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <button className="btn btn-success text-nowrap" onClick={downloadCurrentTable}>
                Download Table ({sortedOrgs.length})
              </button>
            </div>

            <div className="header-row text-center d-flex justify-content-center gap-2 bg-dark text-white p-2 fw-bold">
              <div className="col-6 col-lg-4">Org Name</div>
              <div className="d-none d-lg-block col-lg-2">Type</div>
              <div className="d-none d-lg-block col-lg-2">Adviser</div>
              <div className="col-6 col-lg-2">Actions</div>
            </div>

            {sortedOrgs.map(o => (
              <div key={o.id} className="body-row text-center d-flex justify-content-center gap-2 border-bottom p-2 align-items-center bg-white">
                <div className="col-5 col-lg-4 text-truncate">{o.orgName}</div>
                <div className="d-none d-lg-block col-lg-2">{o.type}</div>
                <div className="d-none d-lg-block col-lg-2 text-truncate">{o.adviser}</div>
                <div className="col-5 col-lg-2 text-end">
                  <div className="dropdown w-100">
                    <button className="btn dropdown-toggle w-100 btn-sm" type="button" data-bs-toggle="dropdown">Action</button>
                    <ul className="dropdown-menu shadow">
                      <li><button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#editOrgModal" onClick={() => setSelectedOrg({...o})}>Edit</button></li>
                      <li><button className="dropdown-item text-danger" data-bs-toggle="modal" data-bs-target="#deleteOrgModal" onClick={() => setSelectedOrg(o)}>Delete</button></li>
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
                <p>Register <strong>{formData.orgName}</strong>?</p>
                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button className="btn btn-light px-4" onClick={() => setShowAddConfirm(false)}>Cancel</button>
                  <button className="btn btn-primary px-4" onClick={confirmAddOrg} disabled={loading}>Confirm</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <div className="modal fade" id="editOrgModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header fw-bold">
              <h5 className="modal-title">Edit Organization</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              {selectedOrg && (
                <>
                  <label className="small fw-bold">Org Name</label>
                  <input type="text" className="form-control mb-2" value={selectedOrg.orgName} onChange={e => setSelectedOrg({...selectedOrg, orgName: e.target.value})} />
                  
                  <label className="small fw-bold">Type</label>
                  <select className="form-select mb-2" value={selectedOrg.type} onChange={e => setSelectedOrg({...selectedOrg, type: e.target.value})}>
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>

                  {selectedOrg.type === 'Internal' && (
                    <>
                      <label className="small fw-bold">Department</label>
                      <input type="text" className="form-control mb-2" value={selectedOrg.department} onChange={e => setSelectedOrg({...selectedOrg, department: e.target.value})} />
                    </>
                  )}

                  <label className="small fw-bold">Adviser</label>
                  <input type="text" className="form-control mb-2" value={selectedOrg.adviser} onChange={e => setSelectedOrg({...selectedOrg, adviser: e.target.value})} />
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

      {/* Delete Modal */}
      <div className="modal fade" id="deleteOrgModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-body text-center p-4">
              <div className="text-danger mb-3">⚠️</div>
              <h5 className="fw-bold">Delete Organization?</h5>
              <p>Permanently remove <strong>{selectedOrg?.orgName}</strong>?</p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                <button className="btn btn-danger px-4" onClick={handleDelete} disabled={loading}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Modal for Bulk Import */}
      {showProcessingModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-5 border-0 shadow-lg">
              <div className="spinner-border text-primary mb-3 mx-auto"></div>
              <h4 className="fw-bold">Processing Bulk Import...</h4>
              <p className="text-muted">Please wait while accounts are being created.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrgCreate;