import '../../Styles/Organization.css';

function createEvent() {
    
    const getTomorrowStr = () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        const offset = date.getTimezoneOffset() * 60000;

        return new Date(date - offset).toISOString().split("T")[0];
    };

    return (
        <div className="container-fluid">
            <div className="row shadow-lg form-box">
                <form action="">
                    <div className="col-12 mt-4 text-center">
                        <h2 className='fw-bold pt-3'>Create New Event</h2>
                        <h5 className='fw-bold mt-0'>Fill out the event information below</h5>
                    </div>
                    <div className="row mt-5 d-flex p-lg-5 pb-5">
                        <div className="col-12 col-lg-6">
                            <div className="col-12 d-flex">
                                <h5 className='fw-bold mt-0 ms-2'>Event Title:</h5>
                            </div>
                            <div className="col-12 d-flex">
                                <input type="text" className="form-control mx-1 px-3" placeholder='Enter event title here...' required/>
                            </div>
                        </div>
                        <div className="col-12 col-lg-6 mt-3 mt-lg-0">
                            <div className="col-12 d-flex">
                                <h5 className='fw-bold mt-0 ms-2'>Event Category:</h5>
                            </div>
                            <div className="col-12 d-flex">
                                <select className="form-select px-3 category-selector mx-1" required>
                                    <option value="" disabled selected hidden>Select Category</option>
                                    <option value="performing">Performing Arts</option>
                                    <option value="seminar">Seminar</option>
                                    <option value="competition">Competition</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-12 col-lg-6 mt-3">
                            <div className="col-12 d-flex">
                                <h5 className='fw-bold mt-0 ms-2' id='yes'>Team Match:</h5>
                                <label htmlFor="yes"></label>
                            </div>
                            <div className="col-12 d-flex text-center">
                                <input type="radio" className="mx-1 px-3" id="yes" name="teamMatch" value="yes"/>
                                <label htmlFor="yes" className="form-check-label fw-bold ms-1">Yes</label>
                                <input type="radio" className="ms-5 px-3" id="no" name="teamMatch" value="no"/>
                                <label htmlFor="no" className="form-check-label fw-bold ms-2">No</label>
                            </div>
                        </div>
                        <div className="col-12 col-lg-6 mt-3">
                            <div className="col-12 d-flex">
                                <h5 className='fw-bold mt-0 ms-2'>Maximum Participants:</h5>
                            </div>
                            <div className="col-12 d-flex">
                                <input type="number" className="form-control mx-1 px-3" placeholder='Enter maximum participants here...' required min="0" step="1"/>
                            </div>
                        </div>
                        <div className="col-12 col-lg-6 mt-3">
                            <div className="col-12 d-flex">
                                <h5 className='fw-bold mt-0 ms-2'>Date:</h5>
                            </div>
                            <div className="col-12 d-flex">
                                <input type="date" className="form-control mx-1 px-3" min={getTomorrowStr()} required/>
                            </div>
                        </div>
                        <div className="col-12 col-lg-6 mt-3">
                            <div className="col-12 d-flex">
                                <h5 className='fw-bold mt-0 ms-2'>Time:</h5>
                            </div>
                            <div className="col-12 d-flex">
                                <input type="time" className="form-control mx-1 px-3" required/>
                            </div>
                        </div>
                        <div className="col-12 mt-3">
                            <div className="col-12 d-flex">
                                <h5 className='fw-bold mt-0 ms-2'>Venue:</h5>
                            </div>
                            <div className="col-12 d-flex">
                                <input type="text" className="form-control mx-1 px-3" placeholder='Enter venue here...' required/>
                            </div>
                        </div>
                        <div className="col-12 col-lg-6 mt-3">
                            <div className="col-12 d-flex">
                                <h5 className='fw-bold mt-0 ms-2'>Upload Poster:</h5>
                            </div>
                            <div className="col-12 d-flex">
                                <input type="file" className="form-control mx-1 px-3" required accept="image/*"/>
                            </div>
                        </div>
                        <div className="col-12 col-lg-6 mt-3">
                            <div className="col-12 d-flex">
                                <h5 className='fw-bold mt-0 ms-2'>Organization / Department:</h5>
                            </div>
                            <div className="col-12 d-flex">
                                <input type="text" className="form-control mx-1 px-3" placeholder='Enter organization/department here...' list='Dept-List' required/>
                                <datalist id='Dept-List'>
                                    <option value="All" >All</option>
                                </datalist>
                            </div>
                        </div>
                        <div className="col-12 mt-3">
                            <div className="col-12 d-flex">
                                <h5 className='fw-bold mt-0 ms-2'>Description:</h5>
                            </div>
                            <div className="col-12 d-flex">
                                <textarea id="description" className='w-100 p-3 rounded' name="description" rows="4" cols="50" placeholder="Enter a detailed description here..." required></textarea>
                            </div>
                        </div>
                        <div className="col-12 mt-4 text-center">
                            <input type="submit" value="Create Event" className="submit-button mt-3 btn-transform" />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default createEvent;