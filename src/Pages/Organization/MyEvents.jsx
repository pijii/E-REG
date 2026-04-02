import '../../Styles/Organization.css';
import logo from '../../img/logo/E-Reg.png';

function myEvents({ onTabChange }) {
    const eventname = "Photography Contest";

    const goToCreateEvent = () => {
        onTabChange('create-events'); 
    };

     const goViewEvent = () => {
        onTabChange('event-view'); 
    };

    return (
        <div className="container-fluid">
            {/* Search and Filter Section */}
            <div className="row">
                <div className="col-lg-8 col-md-12">
                    <input type="text" className="search-box py-1 px-4" placeholder="Search events..." />
                </div>
                <div className="col-lg-2 col-md-6 mt-3 mt-lg-0 d-flex">
                    <p className='fw-bold py-1'>Category: </p>
                    <select className="form-select border-0 category-selector mx-2">
                        <option value="all">All</option>
                        <option value="performing">Performing Arts</option>
                        <option value="seminar">Seminar</option>
                        <option value="competition">Competition</option>
                    </select>
                    
                </div>
                <div className="col-lg-2 col-md-6 mt-sm-0 mt-md-3 mt-lg-0 d-flex">
                    <p className='fw-bold py-1'>Date: </p>
                    <input type="date" className="border-0 category-selector mx-2" id='datefilter'/>
                </div>
            </div>

            {/* Event List */}
            <div className="row mt-5 event-panel border px-1 shadow-lg">
                <div className="col-lg-12 pt-4 bg-red align-self-start eventlist-top">
                    <h1 className='fw-bold'>My Event Lists:</h1>
                    <hr />
                </div>
                <div className="col-lg-4 col-md-6 mb-4 overflow-hidden">
                    <button className="event-card p-3 bg-white border rounded shadow-lg" onClick={goViewEvent}>
                        <img src={logo} alt="Event" className="event-image mb-3 mw-100 mh-100" />
                        <h5 className='fw-bold'>{eventname}</h5>
                    </button>
                </div>  
                
                {/* Add more content here to ensure the page is long enough to scroll */}
            </div>

            {/* Create Event Button */}
            <div className="row pt-4 text-center text-md-end">
            <div className="col-12">
                <button className="create-btn py-3 px-5 shadow-lg btn-transform" onClick={goToCreateEvent}>
                    <h4 className='fw-bold'>Create Event</h4>
                </button>
            </div>
            </div>
        </div>
    );
}  

export default myEvents;