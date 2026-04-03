import '../../Styles/Organization.css';

function Dashboard({ onTabChange }) {

    const totalStudents = 120;
    const totalOrganizations = 15;
    const totalEvents = 8;
    const totalRegistrations = 230;

    const goToCreateOrg = () => {
        onTabChange('organizations');
    };

    const goToCreateStudent = () => {
        onTabChange('students');
    };

    return (
        <div className="mt-5 container-fluid">

            {/* Welcome */}
            <div className="row">
                <div className="col-lg-12 mt-3">
                    <h1 className="fw-bold">Welcome, Admin</h1>
                    <h4>Manage students, organizations, events, and registrations.</h4>
                </div>
            </div>

            {/* Dashboard Boxes */}
            <div className="row mt-5 pt-5">

                <div className="col-lg-3 col-md-6 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="fw-bold">Students</h4>
                        <h1 className="mt-5 fw-bold">{totalStudents}</h1>
                    </div>
                </div>

                <div className="col-lg-3 col-md-6 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="fw-bold">Organizations</h4>
                        <h1 className="mt-5 fw-bold">{totalOrganizations}</h1>
                    </div>
                </div>

                <div className="col-lg-3 col-md-6 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="fw-bold">Events</h4>
                        <h1 className="mt-5 fw-bold">{totalEvents}</h1>
                    </div>
                </div>

                <div className="col-lg-3 col-md-6 mt-3">
                    <div className="dashboard-box p-4 text-center shadow-lg">
                        <h4 className="fw-bold">Registrations</h4>
                        <h1 className="mt-5 fw-bold">{totalRegistrations}</h1>
                    </div>
                </div>

            </div>

            {/* Buttons */}
            <div className="row my-5 pt-lg-4 text-center">

                <div className="col-lg-6 col-md-12 mt-3">
                    <button 
                        className="create-btn py-3 px-5 btn-transform"
                        onClick={goToCreateOrg}
                    >
                        <h4 className="fw-bold">Create Org Account</h4>
                    </button>
                </div>

                <div className="col-lg-6 col-md-12 mt-3">
                    <button 
                        className="create-btn py-3 px-5 btn-transform"
                        onClick={goToCreateStudent}
                    >
                        <h4 className="fw-bold">Create Student Account</h4>
                    </button>
                </div>

            </div>

        </div>
    );
}

export default Dashboard;