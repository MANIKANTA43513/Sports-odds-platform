"""
Sports Odds Intelligence Platform - Python AI Service
Generates odds using a rating-based probability model
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from model import OddsModel, AgentReasoner
import time

app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

odds_model = OddsModel()
agent = AgentReasoner()


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "python-odds-engine", "version": "1.0.0"})


@app.route('/generate-odds', methods=['POST'])
def generate_odds():
    """
    Generate odds for a single match.
    """
    start_time = time.time()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body required"}), 400

    required = ['teamA', 'teamB']
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    team_a = data['teamA']
    team_b = data['teamB']
    team_a_rating = float(data.get('teamA_rating', 70))
    team_b_rating = float(data.get('teamB_rating', 70))
    team_a_wins = int(data.get('teamA_wins', 10))
    team_b_wins = int(data.get('teamB_wins', 10))
    team_a_losses = int(data.get('teamA_losses', 5))
    team_b_losses = int(data.get('teamB_losses', 5))
    league = data.get('league', 'Unknown')
    sport = data.get('sport', 'Football')

    result = odds_model.generate(
        team_a=team_a,
        team_b=team_b,
        team_a_rating=team_a_rating,
        team_b_rating=team_b_rating,
        team_a_wins=team_a_wins,
        team_b_wins=team_b_wins,
        team_a_losses=team_a_losses,
        team_b_losses=team_b_losses,
        sport=sport,
        league=league
    )

    elapsed = round((time.time() - start_time) * 1000, 2)
    result['generated_in_ms'] = elapsed

    logger.info(f"Odds generated for {team_a} vs {team_b} in {elapsed}ms")
    return jsonify(result)


@app.route('/generate-odds-batch', methods=['POST'])
def generate_odds_batch():
    """
    Generate odds for multiple matches in one call (bonus: batch processing).
    """
    start_time = time.time()
    data = request.get_json()

    if not data or 'matches' not in data:
        return jsonify({"error": "matches array required"}), 400

    matches = data['matches']
    if not isinstance(matches, list):
        return jsonify({"error": "matches must be an array"}), 400

    results = []
    for match in matches:
        try:
            result = odds_model.generate(
                team_a=match.get('teamA', 'Team A'),
                team_b=match.get('teamB', 'Team B'),
                team_a_rating=float(match.get('teamA_rating', 70)),
                team_b_rating=float(match.get('teamB_rating', 70)),
                team_a_wins=int(match.get('teamA_wins', 10)),
                team_b_wins=int(match.get('teamB_wins', 10)),
                team_a_losses=int(match.get('teamA_losses', 5)),
                team_b_losses=int(match.get('teamB_losses', 5)),
                sport=match.get('sport', 'Football'),
                league=match.get('league', 'Unknown')
            )
            result['match_id'] = match.get('match_id')
            results.append(result)
        except Exception as e:
            results.append({
                'match_id': match.get('match_id'),
                'error': str(e)
            })

    elapsed = round((time.time() - start_time) * 1000, 2)
    logger.info(f"Batch odds generated for {len(matches)} matches in {elapsed}ms")

    return jsonify({
        "results": results,
        "count": len(results),
        "generated_in_ms": elapsed
    })


@app.route('/agent/analyze', methods=['POST'])
def agent_analyze():
    """
    AI Agent endpoint: answers natural language queries about match odds.
    """
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "query field required"}), 400

    query = data['query']
    matches = data.get('matches', [])

    answer = agent.answer(query, matches)
    return jsonify(answer)


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
