const LEAGUES = new Set(['eng.1', 'uefa.champions', 'eng.fa', 'eng.league_cup', 'eng.charity']);

// Public fixture data, served here because ESPN does not allow browser requests.
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const league = req.query.league;
  if (!LEAGUES.has(league)) return res.status(400).json({ error: 'Unknown competition' });
  try {
    const upstream = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/359/schedule?fixture=true`, { signal: AbortSignal.timeout(6000) });
    if (!upstream.ok) throw new Error('Fixture provider unavailable');
    const data = await upstream.json();
    if (!Array.isArray(data.events)) throw new Error('Invalid fixture response');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    return res.status(200).json({ events: data.events });
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'Fixture provider unavailable' });
  }
};
