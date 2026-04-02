import '../../Styles/Organization.css';

function Dashboard({ onTabChange }) {

    const orgname = "Tech Innovators";
    const totalevents = 1;
    const totalparticipants = 10;
    const totalorgmembers = 5;

    const goToCreateEvent = () => {
        onTabChange('create-events'); 
    };
        
   return (
    <div className="mt-5 container-fluid">
        {/* Welcome Section */}
        <div className="row">
            <div className="col-lg-12 mt-3">
                <h1 className="fw-bold">Welcome, {orgname}</h1>
                <h4>Create and manage school events and registrations.</h4>
            </div>
        </div>

        {/* Dashboard Cards Section */}
        <div className="row mt-5 pt-5">
            <div className="col-lg-4 col-md-12 mt-3">
                <div className="dashboard-box p-4 text-center shadow-lg">
                    <h4 className="dashboard-title fw-bold">Total Events</h4>
                    <h1 className="centered mt-5 fw-bold">{totalevents}</h1>
                </div>
            </div>
            <div className="col-lg-4 col-md-12 mt-3">
                <div className="dashboard-box p-4 text-center shadow-lg">
                    <h4 className="dashboard-title fw-bold">Total Participants</h4>
                    <h1 className="centered mt-5 fw-bold">{totalparticipants}</h1>
                </div>
            </div>
            <div className="col-lg-4 col-md-12 mt-3">
                <div className="dashboard-box p-4 text-center shadow-lg">
                    <h4 className="dashboard-title fw-bold">Total Org Members</h4>
                    <h1 className="centered mt-5 fw-bold">{totalorgmembers}</h1>
                </div>
            </div>
        </div>

        {/* Create Event Button */}
        <div className="row my-5 pt-lg-4 text-center">
          <div className="col-lg-12 mt-3">
              <button className="create-btn py-3 px-5 shadow-lg btn-transform"  onClick={goToCreateEvent}>
                  <h4 className='fw-bold'>Create Event</h4>
              </button>
          </div>
        </div>
    </div>
   );
}

export default Dashboard;