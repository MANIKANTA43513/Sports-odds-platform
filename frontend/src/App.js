import { useEffect, useState } from "react";

const getBorder = (favorite, teamA, teamB) => {
  if (favorite === teamA) return "3px solid green";
  if (favorite === teamB) return "3px solid blue";
  return "1px solid gray";
};

function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:4000/api/matches")
      .then(res => res.json())
      .then(data => {
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading matches...</h2>;
  }

  return (
  <div
    style={{
      padding: "30px",
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      minHeight: "100vh",
      fontFamily: "Arial",
      color: "#fff"
    }}
  >
    <h1
      style={{
        textAlign: "center",
        marginBottom: "30px",
        fontSize: "32px",
        fontWeight: "bold",
        letterSpacing: "1px"
      }}
    >
      ⚽ Sports Odds Intelligence
    </h1>

    {matches.map(match => (
      <div
        key={match.match_id}
        style={{
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "20px",
          margin: "20px auto",
          borderRadius: "16px",
          maxWidth: "800px",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(10px)",
          transition: "all 0.3s ease",
          cursor: "pointer"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-5px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>
          {match.teamA === match.favorite ? "🔥 " : ""}
          {match.teamA} vs {match.teamB}
          {match.teamB === match.favorite ? " 🔥" : ""}
        </h2>

        <p style={{ opacity: 0.8 }}>
          <b>Favorite:</b>{" "}
          <span style={{ color: "#22c55e" }}>{match.favorite}</span>
        </p>

        <div style={{ marginTop: "10px" }}>
          <p style={{ fontSize: "14px", opacity: 0.7 }}>Odds</p>
          <p>
            A: {match.odds.teamA} | B: {match.odds.teamB} | Draw: {match.odds.draw}
          </p>
        </div>

        <div style={{ marginTop: "10px" }}>
          <p style={{ fontSize: "14px", opacity: 0.7 }}>Probability</p>
          <p>
            A: {(match.probabilities.teamA * 100).toFixed(1)}% | 
            B: {(match.probabilities.teamB * 100).toFixed(1)}% | 
            Draw: {(match.probabilities.draw * 100).toFixed(1)}%
          </p>
        </div>

        <div style={{ marginTop: "10px" }}>
          <p style={{ fontSize: "14px", opacity: 0.7 }}>Confidence</p>
          <p
            style={{
              color: match.confidence_score > 6 ? "#22c55e" : "#f59e0b",
              fontWeight: "bold"
            }}
          >
            {match.confidence_score}
          </p>
        </div>
      </div>
    ))}
  </div>
);
}

export default App;
