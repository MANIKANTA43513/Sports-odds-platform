"""
Odds Model & AI Agent Reasoner
Uses rating-based probability model with Elo-inspired adjustments.
"""

import math
import random
from typing import Dict, List, Optional
import re


class OddsModel:
    """
    Generates match odds using a multi-factor probability model.

    Factors considered:
      1. Team rating differential (primary signal)
      2. Win/loss record (form factor)
      3. Sport-specific draw probability (football has draws; basketball rarely does)
      4. Small stochastic noise to simulate market variance
    """

    # Draw likelihood by sport (football/soccer has draws; others rarely do)
    SPORT_DRAW_WEIGHT = {
        'football': 0.25,
        'soccer': 0.25,
        'hockey': 0.10,
        'basketball': 0.02,
        'baseball': 0.01,
        'tennis': 0.00,
        'cricket': 0.15,
    }

    # Bookmaker margin (overround) — keeps odds slightly below fair value
    OVERROUND = 1.05  # 5% margin

    def _sigmoid(self, x: float) -> float:
        """Standard logistic function mapped to [0, 1]."""
        return 1.0 / (1.0 + math.exp(-x))

    def _form_factor(self, wins: int, losses: int) -> float:
        """
        Compute a form score in [-1, 1] based on win/loss record.
        Returns 0 for equal records.
        """
        total = wins + losses
        if total == 0:
            return 0.0
        win_rate = wins / total
        return (win_rate - 0.5) * 2  # [-1, 1]

    def _rating_to_prob(
        self,
        rating_a: float,
        rating_b: float,
        form_a: float,
        form_b: float,
        draw_weight: float
    ) -> Dict[str, float]:
        """
        Convert ratings + form into win probabilities for both teams and draw.

        Uses a logistic model:
          - Base signal: rating differential normalised to [-1, 1]
          - Augmented by form factor (secondary signal, 30% weight)
        """
        # Normalise rating differential: ratings typically in [0, 100]
        raw_diff = (rating_a - rating_b) / 50.0  # scale to roughly [-2, 2]

        # Combine with form
        combined_diff = raw_diff + 0.3 * (form_a - form_b)

        # Logistic probability for team A winning a non-draw outcome
        p_a_wins_given_no_draw = self._sigmoid(combined_diff)
        p_b_wins_given_no_draw = 1.0 - p_a_wins_given_no_draw

        # Allocate some probability mass to draws
        p_no_draw = 1.0 - draw_weight
        p_a = p_a_wins_given_no_draw * p_no_draw
        p_b = p_b_wins_given_no_draw * p_no_draw
        p_draw = draw_weight

        # Sanity check: probabilities should sum to 1
        total = p_a + p_b + p_draw
        assert abs(total - 1.0) < 1e-6, f"Probabilities don't sum to 1: {total}"

        return {"teamA": p_a, "teamB": p_b, "draw": p_draw}

    def _prob_to_odds(self, prob: float) -> float:
        """
        Convert probability to decimal odds with bookmaker margin.
        Fair odds = 1/p; boosted by overround.
        """
        if prob <= 0:
            return 99.0
        fair_odds = 1.0 / prob
        # Apply overround (reduces payout slightly)
        market_odds = fair_odds / self.OVERROUND
        # Add tiny noise (±2%) to simulate live market
        noise = random.uniform(-0.02, 0.02)
        market_odds = market_odds * (1 + noise)
        return round(max(1.01, market_odds), 2)

    def generate(
        self,
        team_a: str,
        team_b: str,
        team_a_rating: float = 70,
        team_b_rating: float = 70,
        team_a_wins: int = 10,
        team_b_wins: int = 10,
        team_a_losses: int = 5,
        team_b_losses: int = 5,
        sport: str = "football",
        league: str = "Unknown"
    ) -> Dict:
        """
        Full odds generation pipeline for a match.
        """
        # Clamp ratings
        rating_a = max(0.0, min(100.0, team_a_rating))
        rating_b = max(0.0, min(100.0, team_b_rating))

        # Form factors
        form_a = self._form_factor(team_a_wins, team_a_losses)
        form_b = self._form_factor(team_b_wins, team_b_losses)

        # Draw weight based on sport
        sport_key = sport.lower()
        draw_weight = self.SPORT_DRAW_WEIGHT.get(sport_key, 0.15)

        # Compute probabilities
        probs = self._rating_to_prob(rating_a, rating_b, form_a, form_b, draw_weight)

        # Convert to odds
        odds = {
            "teamA": self._prob_to_odds(probs["teamA"]),
            "teamB": self._prob_to_odds(probs["teamB"]),
            "draw": self._prob_to_odds(probs["draw"]) if draw_weight > 0.01 else None,
        }

        # Compute confidence score (how lopsided the match is)
        max_prob = max(probs["teamA"], probs["teamB"])
        confidence = round((max_prob - 0.33) / 0.67 * 100, 1)  # 0-100
        confidence = max(0.0, min(100.0, confidence))

        result = {
            "teamA": team_a,
            "teamB": team_b,
            "sport": sport,
            "league": league,
            "teamA_win_prob": round(probs["teamA"], 4),
            "teamB_win_prob": round(probs["teamB"], 4),
            "draw_prob": round(probs["draw"], 4),
            "odds": odds,
            "model_inputs": {
                "teamA_rating": rating_a,
                "teamB_rating": rating_b,
                "teamA_form": round(form_a, 3),
                "teamB_form": round(form_b, 3),
                "sport": sport,
                "draw_weight": draw_weight,
            },
            "confidence_score": confidence,
            "favorite": team_a if probs["teamA"] > probs["teamB"] else team_b,
            "model": "rating-logistic-v1"
        }
        return result


class AgentReasoner:
    """
    Simple AI agent that answers natural language queries about match odds.
    Uses tool-calling approach: parses intent, selects tool, generates answer.
    """

    INTENTS = {
        "favorite": ["who will win", "favorite", "likely to win", "best chance", "predicted winner"],
        "close_odds": ["close", "tight", "even", "balanced", "competitive", "50/50"],
        "predictable": ["predictable", "certain", "safe bet", "most certain", "biggest gap"],
        "highest_odds": ["upset", "underdog", "biggest payout", "highest odds", "long shot"],
        "summary": ["summary", "overview", "all matches", "list", "show me"],
        "best_match": ["best match", "most exciting", "watch", "recommend"],
    }

    def _detect_intent(self, query: str) -> str:
        query_lower = query.lower()
        for intent, keywords in self.INTENTS.items():
            if any(kw in query_lower for kw in keywords):
                return intent
        return "summary"

    def _tool_get_favorite(self, matches: List[Dict]) -> Dict:
        """Tool: find the match with the most clear-cut favorite."""
        if not matches:
            return {"answer": "No match data available to determine a favorite."}

        best = None
        best_diff = -1
        for m in matches:
            probs = m.get('probabilities', {})
            p_a = probs.get('teamA', 0)
            p_b = probs.get('teamB', 0)
            diff = abs(p_a - p_b)
            if diff > best_diff:
                best_diff = diff
                best = m

        if not best:
            return {"answer": "Could not determine a favorite from the data."}

        probs = best.get('probabilities', {})
        odds = best.get('odds', {})
        team_a = best.get('teamA', 'Team A')
        team_b = best.get('teamB', 'Team B')
        p_a = probs.get('teamA', 0)
        p_b = probs.get('teamB', 0)

        if p_a > p_b:
            fav = team_a
            prob = round(p_a * 100, 1)
            fav_odds = odds.get('teamA', 'N/A')
        else:
            fav = team_b
            prob = round(p_b * 100, 1)
            fav_odds = odds.get('teamB', 'N/A')

        return {
            "answer": (
                f"The clearest favorite across all matches is **{fav}** "
                f"in the {team_a} vs {team_b} fixture, "
                f"with a {prob}% win probability (odds: {fav_odds}). "
                f"{'The rating differential between these teams is significant.' if best_diff > 0.2 else 'The match is relatively competitive despite the slight edge.'}"
            ),
            "match": best,
            "intent": "favorite"
        }

    def _tool_get_close_matches(self, matches: List[Dict]) -> Dict:
        """Tool: find matches where odds are most balanced."""
        if not matches:
            return {"answer": "No match data available."}

        close = []
        for m in matches:
            probs = m.get('probabilities', {})
            p_a = probs.get('teamA', 0)
            p_b = probs.get('teamB', 0)
            diff = abs(p_a - p_b)
            close.append((diff, m))

        close.sort(key=lambda x: x[0])
        top = close[:3]

        if not top:
            return {"answer": "No close matches found."}

        lines = []
        for diff, m in top:
            team_a = m.get('teamA', 'Team A')
            team_b = m.get('teamB', 'Team B')
            probs = m.get('probabilities', {})
            p_a = round(probs.get('teamA', 0) * 100, 1)
            p_b = round(probs.get('teamB', 0) * 100, 1)
            lines.append(f"• **{team_a} vs {team_b}** — {team_a}: {p_a}% | {team_b}: {p_b}%")

        answer = "Here are the most competitively balanced matches:\n\n" + "\n".join(lines)
        return {"answer": answer, "matches": [m for _, m in top], "intent": "close_odds"}

    def _tool_get_predictable(self, matches: List[Dict]) -> Dict:
        """Tool: find the most predictable (lopsided) match."""
        if not matches:
            return {"answer": "No match data available."}

        best = None
        best_conf = -1
        for m in matches:
            conf = m.get('confidence_score', 0)
            if conf > best_conf:
                best_conf = conf
                best = m

        if not best:
            return {"answer": "Could not determine predictability."}

        team_a = best.get('teamA', 'Team A')
        team_b = best.get('teamB', 'Team B')
        fav = best.get('favorite', team_a)
        probs = best.get('probabilities', {})
        p_a = round(probs.get('teamA', 0) * 100, 1)
        p_b = round(probs.get('teamB', 0) * 100, 1)

        return {
            "answer": (
                f"The most predictable match is **{team_a} vs {team_b}** "
                f"with a confidence score of {best_conf}%. "
                f"**{fav}** is the overwhelming favorite "
                f"({team_a}: {p_a}% | {team_b}: {p_b}%). "
                f"This match has the largest probability gap, suggesting it's the safest prediction."
            ),
            "match": best,
            "intent": "predictable"
        }

    def _tool_get_highest_odds(self, matches: List[Dict]) -> Dict:
        """Tool: find the biggest underdog (highest odds for a team)."""
        if not matches:
            return {"answer": "No match data available."}

        best = None
        best_odds_val = -1
        best_team = None
        for m in matches:
            odds = m.get('odds', {})
            for key in ['teamA', 'teamB']:
                o = odds.get(key, 0)
                if o and o > best_odds_val:
                    best_odds_val = o
                    best = m
                    team_a = m.get('teamA', 'Team A')
                    team_b = m.get('teamB', 'Team B')
                    best_team = team_a if key == 'teamA' else team_b

        if not best:
            return {"answer": "Could not find underdog data."}

        return {
            "answer": (
                f"The biggest potential upset is **{best_team}** in the "
                f"{best.get('teamA')} vs {best.get('teamB')} match, "
                f"with odds of **{best_odds_val}**. "
                f"High odds = low probability but high payout if they win. "
                f"Bet responsibly!"
            ),
            "match": best,
            "intent": "highest_odds"
        }

    def _tool_summarize(self, matches: List[Dict]) -> Dict:
        """Tool: give a full summary of all matches."""
        if not matches:
            return {"answer": "No matches are currently available."}

        lines = [f"Here's a summary of {len(matches)} upcoming match{'es' if len(matches) != 1 else ''}:\n"]
        for m in matches:
            team_a = m.get('teamA', 'Team A')
            team_b = m.get('teamB', 'Team B')
            fav = m.get('favorite', team_a)
            conf = m.get('confidence_score', 0)
            probs = m.get('probabilities', {})
            p_a = round(probs.get('teamA', 0) * 100, 1)
            p_b = round(probs.get('teamB', 0) * 100, 1)
            lines.append(
                f"• **{team_a} vs {team_b}** — Favorite: {fav} | "
                f"{team_a}: {p_a}% | {team_b}: {p_b}% | Confidence: {conf}%"
            )

        return {"answer": "\n".join(lines), "matches": matches, "intent": "summary"}

    def answer(self, query: str, matches: List[Dict]) -> Dict:
        """
        Main agent entry point: detect intent → call tool → return answer.
        """
        intent = self._detect_intent(query)

        tool_map = {
            "favorite": self._tool_get_favorite,
            "close_odds": self._tool_get_close_matches,
            "predictable": self._tool_get_predictable,
            "highest_odds": self._tool_get_highest_odds,
            "best_match": self._tool_get_close_matches,
            "summary": self._tool_summarize,
        }

        tool = tool_map.get(intent, self._tool_summarize)
        result = tool(matches)

        result['query'] = query
        result['intent_detected'] = intent
        result['tools_used'] = [tool.__name__]
        return result
