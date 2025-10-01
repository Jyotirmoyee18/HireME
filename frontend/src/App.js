import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [topN, setTopN] = useState(5);

  useEffect(() => {
    axios.get("http://localhost:8000/candidates")
      .then(res => {
        console.log("STEP 1: Candidates loaded from backend:", res.data);
        setCandidates(res.data);
      });
  }, []);

  const toggleSelect = (id) => {
    console.log(`STEP 2: Checkbox clicked for ID: ${id}`);
    setSelected(prev => {
      const isAlreadySelected = prev.includes(id);
      if (isAlreadySelected) {
        const newArray = prev.filter(x => x !== id);
        console.log(`STEP 3: New 'selected' array is now:`, newArray);
        return newArray;
      } else {
        const newArray = [...prev, id];
        console.log(`STEP 3: New 'selected' array is now:`, newArray);
        return newArray;
      }
    });
  };

  const fetchTopCandidates = () => {
    console.log(`STEP 4: Button clicked. Current 'selected' array is:`, selected);
    const payload = {
      selectedIds: selected,
      limit: topN
    };
    axios.post("http://localhost:8000/rank", payload)
      .then(res => {
        console.log("STEP 5: Received response from backend:", res.data);
        setRankedCandidates(res.data);
      })
      .catch(error => {
        console.error("ERROR during Axios request:", error);
      });
  };

  return (
    <div className="container">
      <h1>HireME-Candidate Dashboard</h1>
      <div className="my-3 d-flex align-items-center">
        <label htmlFor="topN-select" className="form-label me-2">Filter for:</label>
        <select
          id="topN-select"
          className="form-select me-3"
          style={{ width: '100px' }}
          value={topN}
          onChange={(e) => setTopN(Number(e.target.value))}
        >
          <option value="5">Top 5</option>
          <option value="10">Top 10</option>
          <option value="25">Top 25</option>
          <option value="30">Top 30</option>
        </select>
        <button onClick={fetchTopCandidates} className="btn btn-primary">
          Show Top {topN}
        </button>
      </div>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Select</th>
            <th>Name</th>
            <th>Skills</th>
            <th>Experience (yrs)</th>
            <th>Location</th>
            <th>Education</th>
            <th>Diversity</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map(c => (
            <tr key={c.id}>
              <td>
                <input type="checkbox" onChange={() => toggleSelect(c.id)} checked={selected.includes(c.id)} />
              </td>
              <td>{c.name}</td>
              <td>{c.skills.join(", ")}</td>
              <td>{c.experience}</td>
              <td>{c.location}</td>
              <td>
                {c.education.highest_level} {c.education.isTop50 && "(Top 50 School)"}
              </td>
              <td>{c.diversity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rankedCandidates.length > 0 && (
        <div>
          <h2>Top {topN} Hires</h2>
          <ul>
            {rankedCandidates.map(c => (
              <li key={c.id}><b>{c.name}</b> - Score: {c.score}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;