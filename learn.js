// Renders the Learn curriculum (learn-content.js), the real fee comparison table
// (fund-facts.js), and a dollar-cost-averaging calculator backed by real historical
// data (/api/adjusted-history). Same "no fabricated numbers" discipline as the rest
// of this app: every dollar figure the calculator shows is computed from Alpha
// Vantage's actual dividend-adjusted monthly price series, never invented.

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showApiKeyBanner(message) {
  const banner = document.getElementById('apiKeyBanner');
  banner.textContent = message;
  banner.classList.remove('hidden');
}

// ============================================================================
// FOUNDATION TRACK — "The Foundation of Money and Trade" (free, shared track)
// Renders window.SCERE_FOUNDATION_CONTENT (foundation-content.js) into
// #foundationRoot, above the existing Stocks/ETF curriculum. Same escapeHtml/
// data-read-unit/data-lesson-section conventions as the lesson cards below, so
// the existing TTS system (initSpeechControls, ttsStart, etc. further down
// this file) picks up foundation content automatically with zero changes to
// the TTS engine itself — see the widened `mainReadScope` change in
// initSpeechControls() for the one change that WAS needed (the page-wide
// "Listen to this page" button now reads both tracks, not just #lessonsRoot).
// ============================================================================

// Small inline SVG library for foundation lesson diagrams, dark-theme colored
// to match this app (vs. the light-cream version used in the course style
// guide docs) — keyed by the `svg` field on an { type: 'image' } block.
const FOUNDATION_SVGS = {
  'barter-diagram': `
    <svg viewBox="0 0 700 340" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif" role="img" aria-label="Diagram of the double coincidence of wants in barter">
      <rect width="700" height="340" fill="#0f172a" rx="12"/>
      <text x="350" y="34" text-anchor="middle" font-size="16" font-weight="700" fill="#e2e8f0">The Double Coincidence of Wants</text>

      <rect x="40" y="70" width="230" height="100" rx="10" fill="rgba(239,68,68,0.10)" stroke="#ef4444" stroke-width="1.5"/>
      <text x="155" y="98" text-anchor="middle" font-size="13" font-weight="700" fill="#fecaca">Farmer</text>
      <text x="155" y="120" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Has: Vegetables</text>
      <text x="155" y="138" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Wants: Shoes</text>

      <line x1="288" y1="105" x2="312" y2="135" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
      <line x1="312" y1="105" x2="288" y2="135" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>

      <rect x="330" y="70" width="230" height="100" rx="10" fill="rgba(239,68,68,0.10)" stroke="#ef4444" stroke-width="1.5"/>
      <text x="445" y="98" text-anchor="middle" font-size="13" font-weight="700" fill="#fecaca">Shoemaker</text>
      <text x="445" y="120" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Has: Shoes</text>
      <text x="445" y="138" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Wants: Meat</text>

      <text x="350" y="196" text-anchor="middle" font-size="12" font-style="italic" fill="#fca5a5">No match — trade fails</text>

      <line x1="350" y1="215" x2="350" y2="235" stroke="#475569" stroke-width="2"/>

      <rect x="130" y="245" width="440" height="70" rx="10" fill="rgba(34,197,94,0.10)" stroke="#22c55e" stroke-width="1.5"/>
      <text x="350" y="270" text-anchor="middle" font-size="12.5" font-weight="700" fill="#bbf7d0">With money: no matching wants needed</text>
      <text x="350" y="290" text-anchor="middle" font-size="11" fill="#e2e8f0">Both trades happen separately — money is accepted by everyone</text>
    </svg>
  `,

  'fractional-reserve': `
    <svg viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif" role="img" aria-label="Diagram of fractional reserve banking and the bank run risk it creates">
      <rect width="700" height="400" fill="#0f172a" rx="12"/>
      <text x="350" y="32" text-anchor="middle" font-size="15" font-weight="700" fill="#e2e8f0">Fractional Reserve Banking — The Risk</text>

      <rect x="40" y="55" width="280" height="85" rx="10" fill="rgba(59,130,246,0.10)" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="180" y="82" text-anchor="middle" font-size="12.5" font-weight="700" fill="#93c5fd">Bank Vault</text>
      <text x="180" y="104" text-anchor="middle" font-size="11.5" fill="#e2e8f0">100 gold coins actually held</text>
      <text x="180" y="122" text-anchor="middle" font-size="11" fill="#94a3b8">but 500 IOUs promised on demand</text>

      <rect x="380" y="55" width="280" height="85" rx="10" fill="rgba(234,179,8,0.10)" stroke="#eab308" stroke-width="1.5"/>
      <text x="520" y="82" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fde68a">The Risk</text>
      <text x="520" y="104" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Only 1 in 5 IOUs could be paid</text>
      <text x="520" y="122" text-anchor="middle" font-size="11" fill="#94a3b8">if everyone showed up the same day</text>

      <line x1="350" y1="150" x2="350" y2="175" stroke="#ef4444" stroke-width="3"/>
      <rect x="90" y="185" width="520" height="75" rx="10" fill="rgba(239,68,68,0.10)" stroke="#ef4444" stroke-width="1.5"/>
      <text x="350" y="212" text-anchor="middle" font-size="13" font-weight="700" fill="#fca5a5">Bank Run</text>
      <text x="350" y="234" text-anchor="middle" font-size="11" fill="#e2e8f0">If many holders demand gold at once, the bank runs out —</text>
      <text x="350" y="250" text-anchor="middle" font-size="11" fill="#e2e8f0">even though it did nothing differently that day.</text>

      <line x1="350" y1="260" x2="350" y2="285" stroke="#22c55e" stroke-width="3"/>
      <rect x="60" y="295" width="580" height="80" rx="10" fill="rgba(34,197,94,0.10)" stroke="#22c55e" stroke-width="1.5"/>
      <text x="350" y="322" text-anchor="middle" font-size="13" font-weight="700" fill="#bbf7d0">Central Bank (e.g. Bank of England, 1694)</text>
      <text x="350" y="344" text-anchor="middle" font-size="11" fill="#e2e8f0">Centralizes note issuance and sets reserve rules —</text>
      <text x="350" y="360" text-anchor="middle" font-size="11" fill="#e2e8f0">one trusted currency replaces hundreds of competing notes.</text>
    </svg>
  `,

  'gold-standard-timeline': `
    <svg viewBox="0 0 700 300" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif" role="img" aria-label="Timeline of the classical gold standard from 1879 through the Great Depression">
      <rect width="700" height="300" fill="#0f172a" rx="12"/>
      <text x="350" y="30" text-anchor="middle" font-size="14" font-weight="700" fill="#e2e8f0">The Classical Gold Standard — Rise and Fall</text>

      <line x1="55" y1="130" x2="645" y2="130" stroke="#3b82f6" stroke-width="3"/>

      <circle cx="100" cy="130" r="7" fill="#3b82f6"/>
      <text x="100" y="112" text-anchor="middle" font-size="11" font-weight="700" fill="#93c5fd">1879</text>
      <rect x="45" y="145" width="110" height="70" rx="6" fill="rgba(59,130,246,0.10)" stroke="#3b82f6" stroke-width="1.2"/>
      <text x="100" y="164" text-anchor="middle" font-size="10" font-weight="700" fill="#e2e8f0">U.S. Adopts Gold</text>
      <text x="100" y="180" text-anchor="middle" font-size="9" fill="#94a3b8">Dollars convertible</text>
      <text x="100" y="193" text-anchor="middle" font-size="9" fill="#94a3b8">to gold on demand</text>

      <circle cx="270" cy="130" r="7" fill="#ef4444"/>
      <text x="270" y="112" text-anchor="middle" font-size="11" font-weight="700" fill="#fca5a5">1914</text>
      <rect x="215" y="145" width="110" height="70" rx="6" fill="rgba(239,68,68,0.10)" stroke="#ef4444" stroke-width="1.2"/>
      <text x="270" y="164" text-anchor="middle" font-size="10" font-weight="700" fill="#e2e8f0">WWI Suspension</text>
      <text x="270" y="180" text-anchor="middle" font-size="9" fill="#94a3b8">War spending forces</text>
      <text x="270" y="193" text-anchor="middle" font-size="9" fill="#94a3b8">nations off gold</text>

      <circle cx="440" cy="130" r="7" fill="#ef4444"/>
      <text x="440" y="112" text-anchor="middle" font-size="11" font-weight="700" fill="#fca5a5">1929–33</text>
      <rect x="385" y="145" width="110" height="70" rx="6" fill="rgba(239,68,68,0.10)" stroke="#ef4444" stroke-width="1.2"/>
      <text x="440" y="164" text-anchor="middle" font-size="10" font-weight="700" fill="#e2e8f0">Great Depression</text>
      <text x="440" y="180" text-anchor="middle" font-size="9" fill="#94a3b8">Defend the peg, or</text>
      <text x="440" y="193" text-anchor="middle" font-size="9" fill="#94a3b8">ease the crisis</text>

      <circle cx="610" cy="130" r="8" fill="#22c55e"/>
      <text x="610" y="112" text-anchor="middle" font-size="11" font-weight="700" fill="#bbf7d0">1933–34</text>
      <rect x="550" y="145" width="115" height="70" rx="6" fill="rgba(34,197,94,0.10)" stroke="#22c55e" stroke-width="1.2"/>
      <text x="610" y="164" text-anchor="middle" font-size="10" font-weight="700" fill="#e2e8f0">Roosevelt Breaks Away</text>
      <text x="610" y="180" text-anchor="middle" font-size="9" fill="#94a3b8">Dollar reset to</text>
      <text x="610" y="193" text-anchor="middle" font-size="9" fill="#94a3b8">$35 per ounce</text>

      <text x="350" y="250" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">That same $35/oz rate is exactly what Bretton</text>
      <text x="350" y="266" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">Woods formalized internationally ten years later.</text>
    </svg>
  `,

  'bretton-woods-system': `
    <svg viewBox="0 0 700 380" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif" role="img" aria-label="Diagram of the Bretton Woods system: gold pegged to the U.S. dollar, and other currencies pegged to the dollar">
      <rect width="700" height="380" fill="#0f172a" rx="12"/>
      <text x="350" y="30" text-anchor="middle" font-size="14" font-weight="700" fill="#e2e8f0">The Bretton Woods System (1944–1971)</text>

      <circle cx="350" cy="85" r="34" fill="rgba(234,179,8,0.15)" stroke="#eab308" stroke-width="1.5"/>
      <text x="350" y="81" text-anchor="middle" font-size="11" font-weight="700" fill="#fde68a">GOLD</text>
      <text x="350" y="95" text-anchor="middle" font-size="9" fill="#fde68a">$35/oz</text>

      <line x1="350" y1="119" x2="350" y2="145" stroke="#3b82f6" stroke-width="2.5"/>
      <text x="380" y="135" font-size="9.5" fill="#94a3b8">convertible</text>

      <rect x="250" y="150" width="200" height="55" rx="8" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="2"/>
      <text x="350" y="173" text-anchor="middle" font-size="13" font-weight="700" fill="#93c5fd">U.S. Dollar (USD)</text>
      <text x="350" y="190" text-anchor="middle" font-size="10" fill="#e2e8f0">The world's anchor currency</text>

      <line x1="350" y1="205" x2="160" y2="240" stroke="#64748b" stroke-width="1.5"/>
      <line x1="350" y1="205" x2="350" y2="240" stroke="#64748b" stroke-width="1.5"/>
      <line x1="350" y1="205" x2="540" y2="240" stroke="#64748b" stroke-width="1.5"/>

      <rect x="80" y="245" width="160" height="60" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
      <text x="160" y="268" text-anchor="middle" font-size="11" font-weight="700" fill="#e2e8f0">British Pound</text>
      <text x="160" y="286" text-anchor="middle" font-size="9.5" fill="#94a3b8">pegged to USD</text>

      <rect x="270" y="245" width="160" height="60" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
      <text x="350" y="268" text-anchor="middle" font-size="11" font-weight="700" fill="#e2e8f0">French Franc</text>
      <text x="350" y="286" text-anchor="middle" font-size="9.5" fill="#94a3b8">pegged to USD</text>

      <rect x="460" y="245" width="160" height="60" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
      <text x="540" y="268" text-anchor="middle" font-size="11" font-weight="700" fill="#e2e8f0">Japanese Yen</text>
      <text x="540" y="286" text-anchor="middle" font-size="9.5" fill="#94a3b8">pegged to USD</text>

      <text x="350" y="335" text-anchor="middle" font-size="10.5" fill="#94a3b8">Only the U.S. dollar was directly convertible to gold —</text>
      <text x="350" y="352" text-anchor="middle" font-size="10.5" fill="#94a3b8">and only for foreign central banks, not individuals.</text>
    </svg>
  `,
  'stop-loss-long-vs-short': `
    <svg viewBox="0 0 800 460" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="800" height="460" fill="#0f172a"/>
  <text x="400" y="38" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">Where Your Stop-Loss Goes — Long vs. Short</text>

  <!-- LONG side -->
  <text x="190" y="75" text-anchor="middle" font-size="16" font-weight="bold" fill="#e2e8f0">Long Position (buy)</text>
  <line x1="190" y1="95" x2="190" y2="400" stroke="#475569" stroke-width="3"/>

  <!-- Take-profit (top, green) -->
  <rect x="80" y="100" width="220" height="55" rx="8" fill="rgba(34,197,94,0.10)" stroke="#22c55e" stroke-width="2"/>
  <text x="190" y="122" text-anchor="middle" font-size="13" font-weight="bold" fill="#22c55e">Take-Profit</text>
  <text x="190" y="142" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Price rises — you exit in profit</text>

  <!-- Entry (middle, blue) -->
  <rect x="80" y="222" width="220" height="55" rx="8" fill="rgba(59,130,246,0.10)" stroke="#3b82f6" stroke-width="2"/>
  <text x="190" y="244" text-anchor="middle" font-size="13" font-weight="bold" fill="#e2e8f0">Entry Price</text>
  <text x="190" y="264" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Where you buy in</text>

  <!-- Stop-loss (bottom, red) -->
  <rect x="80" y="345" width="220" height="55" rx="8" fill="rgba(239,68,68,0.10)" stroke="#ef4444" stroke-width="2"/>
  <text x="190" y="367" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">Stop-Loss</text>
  <text x="190" y="387" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Price falls — you exit, capped loss</text>

  <!-- arrows showing direction -->
  <text x="190" y="195" text-anchor="middle" font-size="20" fill="#22c55e">↑</text>
  <text x="190" y="320" text-anchor="middle" font-size="20" fill="#ef4444">↓</text>

  <!-- Divider -->
  <line x1="400" y1="70" x2="400" y2="420" stroke="#334155" stroke-width="2"/>

  <!-- SHORT side -->
  <text x="610" y="75" text-anchor="middle" font-size="16" font-weight="bold" fill="#e2e8f0">Short Position (sell)</text>
  <line x1="610" y1="95" x2="610" y2="400" stroke="#475569" stroke-width="3"/>

  <!-- Stop-loss (top, red) -->
  <rect x="500" y="100" width="220" height="55" rx="8" fill="rgba(239,68,68,0.10)" stroke="#ef4444" stroke-width="2"/>
  <text x="610" y="122" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">Stop-Loss</text>
  <text x="610" y="142" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Price rises — you exit, capped loss</text>

  <!-- Entry (middle, blue) -->
  <rect x="500" y="222" width="220" height="55" rx="8" fill="rgba(59,130,246,0.10)" stroke="#3b82f6" stroke-width="2"/>
  <text x="610" y="244" text-anchor="middle" font-size="13" font-weight="bold" fill="#e2e8f0">Entry Price</text>
  <text x="610" y="264" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Where you sell/short</text>

  <!-- Take-profit (bottom, green) -->
  <rect x="500" y="345" width="220" height="55" rx="8" fill="rgba(34,197,94,0.10)" stroke="#22c55e" stroke-width="2"/>
  <text x="610" y="367" text-anchor="middle" font-size="13" font-weight="bold" fill="#22c55e">Take-Profit</text>
  <text x="610" y="387" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Price falls — you exit in profit</text>

  <text x="610" y="195" text-anchor="middle" font-size="20" fill="#ef4444">↑</text>
  <text x="610" y="320" text-anchor="middle" font-size="20" fill="#22c55e">↓</text>

  <text x="400" y="440" text-anchor="middle" font-size="12.5" font-style="italic" fill="#94a3b8">The direction flips completely — because in a short, you profit when price falls, not rises.</text>
</svg>
  `,
  'inflation-three-markets': `
    <svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="520" fill="#0f172a"/>
  <text x="450" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#e2e8f0">Inflation Rises — Three Different Ripples</text>

  <!-- Center node -->
  <rect x="350" y="65" width="200" height="60" rx="10" fill="rgba(234,179,8,0.10)" stroke="#eab308" stroke-width="2.5"/>
  <text x="450" y="90" text-anchor="middle" font-size="15" font-weight="bold" fill="#fde68a">Inflation Rises</text>
  <text x="450" y="108" text-anchor="middle" font-size="11" fill="#fde68a">Central bank likely reacts</text>

  <!-- Lines down -->
  <line x1="450" y1="125" x2="180" y2="175" stroke="#475569" stroke-width="2.5"/>
  <line x1="450" y1="125" x2="450" y2="175" stroke="#475569" stroke-width="2.5"/>
  <line x1="450" y1="125" x2="720" y2="175" stroke="#475569" stroke-width="2.5"/>

  <!-- Forex column -->
  <rect x="60" y="180" width="240" height="105" rx="10" fill="rgba(59,130,246,0.10)" stroke="#3b82f6" stroke-width="2"/>
  <text x="180" y="205" text-anchor="middle" font-size="15" font-weight="bold" fill="#3b82f6">Forex</text>
  <text x="180" y="226" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Rate hikes often attract</text>
  <text x="180" y="242" text-anchor="middle" font-size="11.5" fill="#e2e8f0">foreign capital → currency</text>
  <text x="180" y="258" text-anchor="middle" font-size="11.5" fill="#e2e8f0">often strengthens...</text>
  <text x="180" y="276" text-anchor="middle" font-size="11" font-style="italic" fill="#ef4444">...unless sentiment overrides it</text>

  <!-- Stocks column -->
  <rect x="330" y="180" width="240" height="105" rx="10" fill="rgba(59,130,246,0.10)" stroke="#3b82f6" stroke-width="2"/>
  <text x="450" y="205" text-anchor="middle" font-size="15" font-weight="bold" fill="#3b82f6">Stocks</text>
  <text x="450" y="226" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Higher discount rate on</text>
  <text x="450" y="242" text-anchor="middle" font-size="11.5" fill="#e2e8f0">future earnings → short-term</text>
  <text x="450" y="258" text-anchor="middle" font-size="11.5" fill="#e2e8f0">headwind, growth stocks hit hardest</text>
  <text x="450" y="276" text-anchor="middle" font-size="11" font-style="italic" fill="#22c55e">Long run: often a hedge</text>

  <!-- Crypto column -->
  <rect x="600" y="180" width="240" height="105" rx="10" fill="rgba(59,130,246,0.10)" stroke="#3b82f6" stroke-width="2"/>
  <text x="720" y="205" text-anchor="middle" font-size="15" font-weight="bold" fill="#3b82f6">Crypto</text>
  <text x="720" y="226" text-anchor="middle" font-size="11.5" fill="#e2e8f0">"Digital gold" narrative vs.</text>
  <text x="720" y="242" text-anchor="middle" font-size="11.5" fill="#e2e8f0">rate hikes pulling speculative</text>
  <text x="720" y="258" text-anchor="middle" font-size="11.5" fill="#e2e8f0">capital back out — mixed signal</text>
  <text x="720" y="276" text-anchor="middle" font-size="11" font-style="italic" fill="#ef4444">Volatility undermines the theory</text>

  <!-- Bottom unifying message -->
  <rect x="130" y="330" width="640" height="140" rx="12" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6,4"/>
  <text x="450" y="360" text-anchor="middle" font-size="15" font-weight="bold" fill="#e2e8f0">The Same Signal, Three Different Reads</text>
  <text x="450" y="386" text-anchor="middle" font-size="12.5" fill="#e2e8f0">Inflation is one signal — but it moves each market through a different</text>
  <text x="450" y="405" text-anchor="middle" font-size="12.5" fill="#e2e8f0">mechanism, and none of them are guaranteed. In every case, the "textbook"</text>
  <text x="450" y="424" text-anchor="middle" font-size="12.5" fill="#e2e8f0">direction can be overridden by sentiment, timing, or a stronger competing factor.</text>
  <text x="450" y="450" text-anchor="middle" font-size="12" font-style="italic" fill="#94a3b8">Learning to read a market well means learning its specific mechanism —</text>
  <text x="450" y="467" text-anchor="middle" font-size="12" font-style="italic" fill="#94a3b8">not just memorizing a rule that sometimes breaks.</text>

  <text x="450" y="500" text-anchor="middle" font-size="11.5" fill="#94a3b8">This is exactly what the Forex, Stocks, and Crypto tracks each go on to teach in depth.</text>
</svg>
  `,
  'diversifier-hedge-safe-haven': `
    <svg viewBox="0 0 900 480" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="480" fill="#0f172a"/>
  <text x="450" y="40" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">Diversifier vs. Hedge vs. Safe Haven</text>
  <text x="450" y="62" text-anchor="middle" font-size="12.5" font-style="italic" fill="#94a3b8">Three different relationships — not three names for the same thing</text>

  <!-- Diversifier column -->
  <rect x="40" y="90" width="255" height="330" rx="12" fill="rgba(59,130,246,0.10)" stroke="#3b82f6" stroke-width="2"/>
  <text x="167" y="122" text-anchor="middle" font-size="16" font-weight="bold" fill="#3b82f6">Diversifier</text>
  <line x1="70" y1="140" x2="265" y2="140" stroke="#475569" stroke-width="1.5"/>
  <text x="167" y="165" text-anchor="middle" font-size="12" fill="#e2e8f0">Average correlation:</text>
  <text x="167" y="185" text-anchor="middle" font-size="14" font-weight="bold" fill="#3b82f6">Positive, but imperfect</text>
  <text x="167" y="215" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Still tends to move with</text>
  <text x="167" y="233" text-anchor="middle" font-size="11.5" fill="#e2e8f0">your other holdings —</text>
  <text x="167" y="251" text-anchor="middle" font-size="11.5" fill="#e2e8f0">just not in lockstep.</text>
  <text x="167" y="281" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Smooths day-to-day</text>
  <text x="167" y="299" text-anchor="middle" font-size="11.5" fill="#e2e8f0">swings. No special</text>
  <text x="167" y="317" text-anchor="middle" font-size="11.5" fill="#e2e8f0">promise during a crisis.</text>
  <rect x="65" y="345" width="205" height="55" rx="8" fill="#FFFFFF" stroke="#475569" stroke-width="1.2"/>
  <text x="167" y="368" text-anchor="middle" font-size="10.5" fill="#94a3b8">Example claim in the</text>
  <text x="167" y="384" text-anchor="middle" font-size="10.5" fill="#94a3b8">literature: crypto, per the</text>
  <text x="167" y="398" text-anchor="middle" font-size="10.5" fill="#3b82f6" font-weight="bold">2021 Dutch thesis finding</text>

  <!-- Hedge column -->
  <rect x="322" y="90" width="255" height="330" rx="12" fill="rgba(234,179,8,0.10)" stroke="#eab308" stroke-width="2"/>
  <text x="449" y="122" text-anchor="middle" font-size="16" font-weight="bold" fill="#fde68a">Hedge</text>
  <line x1="352" y1="140" x2="547" y2="140" stroke="rgba(234,179,8,0.35)" stroke-width="1.5"/>
  <text x="449" y="165" text-anchor="middle" font-size="12" fill="#e2e8f0">Average correlation:</text>
  <text x="449" y="185" text-anchor="middle" font-size="14" font-weight="bold" fill="#fde68a">Zero or negative</text>
  <text x="449" y="215" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Holds across ALL</text>
  <text x="449" y="233" text-anchor="middle" font-size="11.5" fill="#e2e8f0">conditions — calm</text>
  <text x="449" y="251" text-anchor="middle" font-size="11.5" fill="#e2e8f0">markets and turbulent</text>
  <text x="449" y="269" text-anchor="middle" font-size="11.5" fill="#e2e8f0">ones alike, on average.</text>
  <text x="449" y="299" text-anchor="middle" font-size="11.5" fill="#e2e8f0">Does not guarantee it</text>
  <text x="449" y="317" text-anchor="middle" font-size="11.5" fill="#e2e8f0">reduces losses in any</text>
  <text x="449" y="335" text-anchor="middle" font-size="11.5" fill="#e2e8f0">one specific event.</text>
  <rect x="347" y="345" width="205" height="55" rx="8" fill="#FFFFFF" stroke="rgba(234,179,8,0.35)" stroke-width="1.2"/>
  <text x="449" y="368" text-anchor="middle" font-size="10.5" fill="#94a3b8">Example claim in the</text>
  <text x="449" y="384" text-anchor="middle" font-size="10.5" fill="#94a3b8">literature: gold, in the</text>
  <text x="449" y="398" text-anchor="middle" font-size="10.5" fill="#fde68a" font-weight="bold">2026 CBCG journal study</text>

  <!-- Safe Haven column -->
  <rect x="604" y="90" width="255" height="330" rx="12" fill="rgba(34,197,94,0.10)" stroke="#22c55e" stroke-width="2"/>
  <text x="731" y="122" text-anchor="middle" font-size="16" font-weight="bold" fill="#22c55e">Safe Haven</text>
  <line x1="634" y1="140" x2="829" y2="140" stroke="rgba(34,197,94,0.35)" stroke-width="1.5"/>
  <text x="731" y="165" text-anchor="middle" font-size="12" fill="#e2e8f0">Correlation specifically</text>
  <text x="731" y="183" text-anchor="middle" font-size="12" fill="#e2e8f0">during market stress:</text>
  <text x="731" y="205" text-anchor="middle" font-size="14" font-weight="bold" fill="#22c55e">Zero or negative</text>
  <text x="731" y="235" text-anchor="middle" font-size="11.5" fill="#e2e8f0">May behave completely</text>
  <text x="731" y="253" text-anchor="middle" font-size="11.5" fill="#e2e8f0">differently outside of a</text>
  <text x="731" y="271" text-anchor="middle" font-size="11.5" fill="#e2e8f0">crisis — the promise is</text>
  <text x="731" y="289" text-anchor="middle" font-size="11.5" fill="#e2e8f0">narrow and specific.</text>
  <rect x="629" y="345" width="205" height="55" rx="8" fill="#FFFFFF" stroke="rgba(34,197,94,0.35)" stroke-width="1.2"/>
  <text x="731" y="368" text-anchor="middle" font-size="10.5" fill="#94a3b8">Example claim in the</text>
  <text x="731" y="384" text-anchor="middle" font-size="10.5" fill="#94a3b8">literature: Bitcoin, in the</text>
  <text x="731" y="398" text-anchor="middle" font-size="10.5" fill="#22c55e" font-weight="bold">2026 CBCG journal study</text>

  <text x="450" y="440" text-anchor="middle" font-size="12" fill="#e2e8f0">Two separate academic studies reached different conclusions about Bitcoin — not because one is wrong,</text>
  <text x="450" y="458" text-anchor="middle" font-size="12" fill="#e2e8f0">but because the underlying relationship genuinely shifts over time. Treat any single "safe haven" claim with care.</text>
</svg>
  `,
  'trend-support-resistance': `
    <svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="460" fill="#0f172a"/>
  <text x="450" y="38" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">Trend, Support &amp; Resistance</text>

  <!-- Uptrend panel -->
  <text x="220" y="70" text-anchor="middle" font-size="16" font-weight="bold" fill="#22c55e">Uptrend — Higher Highs, Higher Lows</text>
  <rect x="60" y="85" width="320" height="180" rx="10" fill="rgba(34,197,94,0.10)" stroke="#22c55e" stroke-width="1.5"/>
  <polyline points="80,240 130,160 160,190 210,120 240,150 290,90 340,110" fill="none" stroke="#22c55e" stroke-width="3"/>
  <circle cx="130" cy="160" r="4" fill="#22c55e"/>
  <circle cx="210" cy="120" r="4" fill="#22c55e"/>
  <circle cx="290" cy="90" r="4" fill="#22c55e"/>
  <text x="130" y="150" text-anchor="middle" font-size="9.5" fill="#22c55e">High 1</text>
  <text x="210" y="110" text-anchor="middle" font-size="9.5" fill="#22c55e">High 2</text>
  <text x="290" y="80" text-anchor="middle" font-size="9.5" fill="#22c55e">High 3</text>
  <circle cx="160" cy="190" r="4" fill="#3b82f6"/>
  <circle cx="240" cy="150" r="4" fill="#3b82f6"/>
  <text x="160" y="210" text-anchor="middle" font-size="9.5" fill="#3b82f6">Low 1</text>
  <text x="240" y="170" text-anchor="middle" font-size="9.5" fill="#3b82f6">Low 2</text>
  <text x="220" y="255" text-anchor="middle" font-size="11" font-style="italic" fill="#e2e8f0">Each high and low tops the last</text>

  <!-- Downtrend panel -->
  <text x="680" y="70" text-anchor="middle" font-size="16" font-weight="bold" fill="#ef4444">Downtrend — Lower Highs, Lower Lows</text>
  <rect x="520" y="85" width="320" height="180" rx="10" fill="rgba(239,68,68,0.10)" stroke="#ef4444" stroke-width="1.5"/>
  <polyline points="540,110 590,150 620,130 670,190 700,170 750,230 800,215" fill="none" stroke="#ef4444" stroke-width="3"/>
  <circle cx="590" cy="150" r="4" fill="#ef4444"/>
  <circle cx="670" cy="190" r="4" fill="#ef4444"/>
  <circle cx="750" cy="230" r="4" fill="#ef4444"/>
  <text x="590" y="140" text-anchor="middle" font-size="9.5" fill="#ef4444">Low 1</text>
  <text x="670" y="180" text-anchor="middle" font-size="9.5" fill="#ef4444">Low 2</text>
  <text x="750" y="220" text-anchor="middle" font-size="9.5" fill="#ef4444">Low 3</text>
  <circle cx="620" cy="130" r="4" fill="#3b82f6"/>
  <circle cx="700" cy="170" r="4" fill="#3b82f6"/>
  <text x="620" y="120" text-anchor="middle" font-size="9.5" fill="#3b82f6">High 1</text>
  <text x="700" y="160" text-anchor="middle" font-size="9.5" fill="#3b82f6">High 2</text>
  <text x="680" y="255" text-anchor="middle" font-size="11" font-style="italic" fill="#e2e8f0">Each high and low falls below the last</text>

  <!-- Support/Resistance panel -->
  <text x="450" y="300" text-anchor="middle" font-size="16" font-weight="bold" fill="#e2e8f0">Support and Resistance — Levels Price Reacts To</text>
  <rect x="150" y="315" width="600" height="120" rx="10" fill="rgba(59,130,246,0.10)" stroke="#3b82f6" stroke-width="1.5"/>
  <line x1="180" y1="345" x2="720" y2="345" stroke="#ef4444" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="730" y="349" font-size="11" fill="#ef4444" font-weight="bold">Resistance</text>
  <line x1="180" y1="410" x2="720" y2="410" stroke="#22c55e" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="730" y="414" font-size="11" fill="#22c55e" font-weight="bold">Support</text>
  <polyline points="190,378 230,347 270,378 310,410 350,380 390,347 430,378 470,410 510,380 550,347 590,378 630,410 670,380" fill="none" stroke="#e2e8f0" stroke-width="2.5"/>
  <text x="450" y="453" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">Price repeatedly reverses at these levels — a probability built from history, not a guaranteed wall.</text>
</svg>
  `,
  'verify-a-claim': `
    <svg viewBox="0 0 900 500" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="500" fill="#0f172a"/>
  <text x="450" y="38" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">Verifying an "It Works" Claim</text>

  <!-- Left: unverified -->
  <rect x="50" y="65" width="370" height="330" rx="12" fill="rgba(239,68,68,0.10)" stroke="#ef4444" stroke-width="2"/>
  <text x="235" y="95" text-anchor="middle" font-size="16" font-weight="bold" fill="#ef4444">Unverified Claim</text>
  <text x="235" y="118" text-anchor="middle" font-size="12" font-style="italic" fill="#fca5a5">"70% success rate" — seen on a blog</text>

  <text x="75" y="150" font-size="12.5" fill="#e2e8f0">✗ No named author or institution</text>
  <text x="75" y="178" font-size="12.5" fill="#e2e8f0">✗ No journal, no link, no DOI</text>
  <text x="75" y="206" font-size="12.5" fill="#e2e8f0">✗ Market/time period unspecified</text>
  <text x="75" y="234" font-size="12.5" fill="#e2e8f0">✗ Number shifts between sources</text>
  <text x="75" y="262" font-size="12.5" fill="#e2e8f0">✗ Repeated as fact, never re-tested</text>

  <rect x="75" y="290" width="320" height="85" rx="8" fill="#FFFFFF" stroke="rgba(239,68,68,0.35)" stroke-width="1.2"/>
  <text x="235" y="313" text-anchor="middle" font-size="11" fill="#94a3b8">Example: Bulkowski's pattern statistics —</text>
  <text x="235" y="331" text-anchor="middle" font-size="11" fill="#94a3b8">a private investor's own backtest, not peer-</text>
  <text x="235" y="349" text-anchor="middle" font-size="11" fill="#94a3b8">reviewed, admittedly regime-dependent —</text>
  <text x="235" y="367" text-anchor="middle" font-size="11" fill="#fca5a5" font-weight="bold">yet quoted everywhere as settled fact.</text>

  <!-- Right: verified -->
  <rect x="480" y="65" width="370" height="330" rx="12" fill="rgba(34,197,94,0.10)" stroke="#22c55e" stroke-width="2"/>
  <text x="665" y="95" text-anchor="middle" font-size="16" font-weight="bold" fill="#22c55e">Peer-Reviewed Finding</text>
  <text x="665" y="118" text-anchor="middle" font-size="12" font-style="italic" fill="#bbf7d0">Published, verifiable research</text>

  <text x="505" y="150" font-size="12.5" fill="#e2e8f0">✓ Named authors, institution</text>
  <text x="505" y="178" font-size="12.5" fill="#e2e8f0">✓ Named journal, real DOI/link</text>
  <text x="505" y="206" font-size="12.5" fill="#e2e8f0">✓ Market, dates, method specified</text>
  <text x="505" y="234" font-size="12.5" fill="#e2e8f0">✓ Consistent across citing sources</text>
  <text x="505" y="262" font-size="12.5" fill="#e2e8f0">✓ Reviewed by independent experts</text>

  <rect x="505" y="290" width="320" height="85" rx="8" fill="#FFFFFF" stroke="rgba(34,197,94,0.35)" stroke-width="1.2"/>
  <text x="665" y="313" text-anchor="middle" font-size="11" fill="#94a3b8">Example: Lo, Mamaysky &amp; Wang (2000),</text>
  <text x="665" y="331" text-anchor="middle" font-size="11" fill="#94a3b8">Journal of Finance — found real signal,</text>
  <text x="665" y="349" text-anchor="middle" font-size="11" fill="#94a3b8">but explicitly noted statistical significance</text>
  <text x="665" y="367" text-anchor="middle" font-size="11" fill="#22c55e" font-weight="bold">≠ guaranteed trading profit.</text>

  <text x="450" y="425" text-anchor="middle" font-size="13" fill="#e2e8f0">Both can exist for the same pattern. The question is never just "does it work" —</text>
  <text x="450" y="447" text-anchor="middle" font-size="13" fill="#e2e8f0">it's "how do I know, and how sure can I actually be?"</text>
</svg>
  `,
};

function renderLessonBlock(block, idBase, index) {
  const readId = `ru-${idBase}-b${index}`;
  switch (block.type) {
    case 'paragraph':
      return `<p class="text-sm text-slate-300 leading-relaxed mb-3" data-read-unit id="${readId}">${escapeHtml(block.text)}</p>`;

    case 'definition':
      return `
        <div class="lesson-block lesson-block-definition">
          <span class="lesson-block-label">Definition</span>
          <p class="text-sm font-semibold text-slate-100 mb-1">${escapeHtml(block.term)}</p>
          <p class="text-sm text-slate-300 leading-relaxed" data-read-unit id="${readId}">${escapeHtml(block.text)}</p>
        </div>`;

    case 'example':
      return `
        <div class="lesson-block lesson-block-example">
          <span class="lesson-block-label">Example</span>
          <p class="text-sm text-slate-300 leading-relaxed" data-read-unit id="${readId}">${escapeHtml(block.text)}</p>
        </div>`;

    case 'warning':
      return `
        <div class="lesson-block lesson-block-warning">
          <span class="lesson-block-label">Worth Noting</span>
          <p class="text-sm text-slate-300 leading-relaxed" data-read-unit id="${readId}">${escapeHtml(block.text)}</p>
        </div>`;

    case 'practice':
      return `
        <div class="lesson-block lesson-block-practice">
          <span class="lesson-block-label">Think It Through</span>
          <p class="text-sm text-slate-300 leading-relaxed" data-read-unit id="${readId}">${escapeHtml(block.text)}</p>
        </div>`;

    case 'image': {
      // Diagrams arrive inlined on the block from /api/course — the build step
      // resolves them — so a paid diagram cannot leak via a public lookup table.
      // The window.* maps stay as a fallback for the legacy single-page render
      // paths that still read the old static bundles.
      const svgMarkup = block.svgMarkup
        || (typeof FOUNDATION_SVGS !== 'undefined' ? FOUNDATION_SVGS[block.svg] : '')
        || (window.SCERE_FOREX_SVGS || {})[block.svg]
        || (window.SCERE_CRYPTO_SVGS || {})[block.svg]
        || (window.SCERE_STOCKS_SVGS || {})[block.svg]
        || '';
      return `
        <figure class="lesson-image-card">
          ${svgMarkup}
          <figcaption class="lesson-image-caption">${escapeHtml(block.caption || '')}</figcaption>
        </figure>`;
    }

    default:
      return '';
  }
}

// ---------- quiz ----------
// Not marked with data-read-unit on purpose: quiz questions are interactive
// practice, not passive reading content, so the page-wide "Listen to this
// page" pass skips over them. A learner can still tap into a question and
// read it themselves — this just keeps read-aloud focused on prose.

function renderQuizQuestion(q, lessonId, qIndex) {
  const optionsHtml = q.options.map((opt, i) => `
    <button type="button" class="quiz-option" data-quiz-option data-quiz-index="${i}">
      <span>${escapeHtml(opt)}</span>
      <span class="quiz-option-icon" data-quiz-icon></span>
    </button>
  `).join('');

  return `
    <div class="quiz-card" data-quiz data-quiz-lesson="${escapeHtml(lessonId)}" data-quiz-question="${qIndex}" data-correct-index="${q.correctIndex}">
      <span class="quiz-label">Practice</span>
      <p class="quiz-question">${escapeHtml(q.question)}</p>
      <div class="quiz-options" data-quiz-options>${optionsHtml}</div>
      <div class="quiz-feedback" data-quiz-feedback
           data-feedback-correct="${escapeHtml(q.feedbackCorrect)}"
           data-feedback-wrong="${escapeHtml(q.feedbackWrong)}"></div>
    </div>`;
}

function wireQuizInteractivity(root) {
  root.querySelectorAll('[data-quiz]').forEach((quizEl) => {
    if (quizEl.dataset.wired) return;
    quizEl.dataset.wired = 'true';

    const correctIndex = parseInt(quizEl.dataset.correctIndex, 10);
    const feedbackEl = quizEl.querySelector('[data-quiz-feedback]');
    const optionButtons = quizEl.querySelectorAll('[data-quiz-option]');

    optionButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosenIndex = parseInt(btn.dataset.quizIndex, 10);
        const isCorrect = chosenIndex === correctIndex;

        optionButtons.forEach((b) => {
          b.disabled = true;
          const iconEl = b.querySelector('[data-quiz-icon]');
          const bIndex = parseInt(b.dataset.quizIndex, 10);
          if (bIndex === correctIndex) {
            b.classList.add('correct');
            if (iconEl) iconEl.textContent = '✓';
          } else if (bIndex === chosenIndex) {
            b.classList.add('incorrect');
            if (iconEl) iconEl.textContent = '✗';
          }
        });

        feedbackEl.textContent = isCorrect
          ? feedbackEl.dataset.feedbackCorrect
          : feedbackEl.dataset.feedbackWrong;
        feedbackEl.classList.add('show', isCorrect ? 'correct' : 'incorrect');
      });
    });
  });
}

// ---------- key terms recap ----------

function renderKeyTerms(terms) {
  if (!terms || !terms.length) return '';
  const rows = terms.map((t) => `
    <div class="key-term-row">
      <p class="key-term-name">${escapeHtml(t.term)}</p>
      <p class="key-term-def">${escapeHtml(t.def)}</p>
    </div>
  `).join('');
  return `
    <div class="key-terms-card">
      <span class="key-terms-label">Key Terms Recap</span>
      ${rows}
    </div>`;
}

// ---------- foundation lesson card ----------

function renderFoundationLessonCard(lesson) {
  const blocksHtml = lesson.blocks.map((b, i) => renderLessonBlock(b, lesson.id, i)).join('');
  const quizHtml = (lesson.quiz || []).map((q, i) => renderQuizQuestion(q, lesson.id, i)).join('');
  const keyTermsHtml = renderKeyTerms(lesson.keyTerms);

  return `
    <section id="lesson-${escapeHtml(lesson.id)}" class="current-card bg-slate-800 rounded-2xl p-5 shadow-lg" data-lesson-section>
      <div class="flex items-start justify-between gap-3 mb-1">
        <p class="text-xs uppercase tracking-wider text-blue-300">Chapter ${lesson.chapterNumber} &middot; Lesson ${lesson.lessonNumber}</p>
        <button type="button" class="lesson-listen-btn hidden" data-lesson-listen="${escapeHtml(lesson.id)}">🔊 Listen</button>
      </div>
      <h2 class="text-lg font-bold mb-2" data-read-unit id="ru-${escapeHtml(lesson.id)}-title">${escapeHtml(lesson.title)}</h2>
      <p class="text-sm text-blue-200 font-medium mb-3" data-read-unit id="ru-${escapeHtml(lesson.id)}-keyidea">${escapeHtml(lesson.keyIdea)}</p>
      <div class="space-y-1">${blocksHtml}</div>
      ${quizHtml}
      ${keyTermsHtml}
    </section>
  `;
}

function renderChapterDivider(lesson) {
  return `
    <div class="pt-2 pb-1">
      <div class="flex items-center gap-3">
        <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1">Chapter ${lesson.chapterNumber}</span>
        <div class="h-px flex-1 bg-slate-700"></div>
      </div>
      <h3 class="text-base font-bold text-slate-100 mt-2">${escapeHtml(lesson.chapterTitle || '')}</h3>
    </div>`;
}

function renderFoundationTrack() {
  const track = window.SCERE_FOUNDATION_TRACK || {};
  const lessons = window.SCERE_FOUNDATION_CONTENT || [];
  const root = document.getElementById('foundationRoot');
  if (!root || !lessons.length) return;

  const header = `
    <div class="mb-2">
      <span class="foundation-badge">Free</span>
      <p class="text-[11px] uppercase tracking-[0.15em] text-slate-400 mt-2">${escapeHtml(track.trackTitle || '')}</p>
      <p class="text-xs text-slate-400 mt-1">${escapeHtml(track.trackTagline || '')}</p>
    </div>`;

  let lastChapter = null;
  const lessonsHtml = lessons.map((lesson) => {
    let dividerHtml = '';
    if (lesson.chapterNumber !== lastChapter) {
      dividerHtml = renderChapterDivider(lesson);
      lastChapter = lesson.chapterNumber;
    }
    return dividerHtml + renderFoundationLessonCard(lesson);
  }).join('');

  root.innerHTML = header + lessonsHtml;
  wireQuizInteractivity(root);
}

// ---------- forex track (paid) ----------
// Same content model, block renderer, chapter dividers, quiz wiring and read-aloud
// markup as the foundation track — the lesson card renderer is generic. Only the
// data source (SCERE_FOREX_*), the mount point (#forexRoot) and the badge differ.
// Diagrams resolve via window.SCERE_FOREX_SVGS (see the 'image' case above).
function renderForexTrack() {
  const track = window.SCERE_FOREX_TRACK || {};
  const lessons = window.SCERE_FOREX_CONTENT || [];
  const root = document.getElementById('forexRoot');
  if (!root || !lessons.length) return;

  const header = `
    <div class="mb-2">
      <span class="paid-badge">Paid track</span>
      <p class="text-[11px] uppercase tracking-[0.15em] text-slate-400 mt-2">${escapeHtml(track.trackTitle || '')}</p>
      <p class="text-xs text-slate-400 mt-1">${escapeHtml(track.trackTagline || '')}</p>
    </div>`;

  let lastChapter = null;
  const lessonsHtml = lessons.map((lesson) => {
    let dividerHtml = '';
    if (lesson.chapterNumber !== lastChapter) {
      dividerHtml = renderChapterDivider(lesson);
      lastChapter = lesson.chapterNumber;
    }
    return dividerHtml + renderFoundationLessonCard(lesson);
  }).join('');

  root.innerHTML = header + lessonsHtml;
  wireQuizInteractivity(root);
}

// ---------- crypto track (paid) ----------
// Same generic lesson-card renderer as the Foundation and Forex tracks; only the data
// source (SCERE_CRYPTO_*), the mount point (#cryptoRoot) and the badge differ.
// Diagrams resolve via window.SCERE_CRYPTO_SVGS (see the 'image' case above).
function renderCryptoTrack() {
  const track = window.SCERE_CRYPTO_TRACK || {};
  const lessons = window.SCERE_CRYPTO_CONTENT || [];
  const root = document.getElementById('cryptoRoot');
  if (!root || !lessons.length) return;

  const header = `
    <div class="mb-2">
      <span class="paid-badge">Paid track</span>
      <p class="text-[11px] uppercase tracking-[0.15em] text-slate-400 mt-2">${escapeHtml(track.trackTitle || '')}</p>
      <p class="text-xs text-slate-400 mt-1">${escapeHtml(track.trackTagline || '')}</p>
    </div>`;

  let lastChapter = null;
  const lessonsHtml = lessons.map((lesson) => {
    let dividerHtml = '';
    if (lesson.chapterNumber !== lastChapter) {
      dividerHtml = renderChapterDivider(lesson);
      lastChapter = lesson.chapterNumber;
    }
    return dividerHtml + renderFoundationLessonCard(lesson);
  }).join('');

  root.innerHTML = header + lessonsHtml;
  wireQuizInteractivity(root);
}

// ---------- lesson cards ----------

function renderLessonCard(lesson, index) {
  return `
    <section id="lesson-${escapeHtml(lesson.id)}" class="current-card bg-slate-800 rounded-2xl p-5 shadow-lg" data-lesson-section>
      <div class="flex items-start justify-between gap-3 mb-1">
        <p class="text-xs uppercase tracking-wider text-blue-300">Lesson ${index + 1}</p>
        <button type="button" class="lesson-listen-btn hidden" data-lesson-listen="${escapeHtml(lesson.id)}">🔊 Listen</button>
      </div>
      <h2 class="text-lg font-bold mb-2" data-read-unit id="ru-${escapeHtml(lesson.id)}-title">${escapeHtml(lesson.title)}</h2>
      <p class="text-sm text-blue-200 font-medium mb-3" data-read-unit id="ru-${escapeHtml(lesson.id)}-keyidea">${escapeHtml(lesson.keyIdea)}</p>
      <div class="space-y-3 text-sm text-slate-300 leading-relaxed">
        ${lesson.body.map((p, i) => `<p data-read-unit id="ru-${escapeHtml(lesson.id)}-p${i}">${escapeHtml(p)}</p>`).join('')}
      </div>
    </section>
  `;
}

// ---------- real fee comparison table (Expense Ratios lesson) ----------

function renderFeeTable() {
  const facts = window.SCERE_FUND_FACTS || {};
  const rows = Object.entries(facts)
    .map(([symbol, f]) => ({ symbol, ...f }))
    .sort((a, b) => a.expenseRatioPct - b.expenseRatioPct);

  if (!rows.length) return '';

  return `
    <section class="advisory-card !items-start flex-col !flex">
      <p class="font-semibold text-sm mb-1">Real fee comparison</p>
      <p class="text-xs opacity-80 mb-3">Sourced from each fund issuer's own page, lowest fee first. "asOf" is when this was last checked — expense ratios change rarely, but verify against the source link for anything beyond a rough comparison.</p>
      <div class="w-full overflow-x-auto">
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr class="text-left text-slate-400 uppercase tracking-wide">
              <th class="pb-2 pr-3 font-semibold">Fund</th>
              <th class="pb-2 pr-3 font-semibold">Tracks</th>
              <th class="pb-2 pr-3 font-semibold">Expense ratio</th>
              <th class="pb-2 pr-3 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r) => `
              <tr class="border-t border-slate-700/60 align-top">
                <td class="py-2 pr-3 text-slate-200 font-medium">${escapeHtml(r.symbol)} <span class="block text-slate-400 font-normal">${escapeHtml(r.name)}</span></td>
                <td class="py-2 pr-3 text-slate-300">${escapeHtml(r.indexTracked)}</td>
                <td class="py-2 pr-3 text-slate-100 font-semibold">${r.expenseRatioPct}%</td>
                <td class="py-2 pr-3"><a href="${escapeHtml(r.source)}" target="_blank" rel="noopener noreferrer" class="text-sky-400 underline decoration-sky-700 underline-offset-2">as of ${escapeHtml(r.asOf)}</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ---------- dollar-cost-averaging calculator (DCA lesson) ----------

function dcaEligibleInstruments() {
  return (window.SCERE_INSTRUMENTS || []).filter((i) => i.type === 'equity_index');
}

function renderDcaCalculatorShell() {
  const instruments = dcaEligibleInstruments();
  return `
    <section class="advisory-card !items-start flex-col !flex">
      <p class="font-semibold text-sm mb-1">See what regular contributions would have grown to</p>
      <p class="text-xs opacity-80 mb-3">Real historical prices and dividends, computed live. Not a prediction — this shows what already happened, not what will happen.</p>
      <div class="w-full grid grid-cols-2 gap-2 mb-3">
        <label class="text-xs text-slate-400 col-span-2 sm:col-span-1">
          Fund
          <select id="dcaSymbol" class="mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500">
            ${instruments.map((i) => `<option value="${escapeHtml(i.symbol)}">${escapeHtml(i.label)} (${escapeHtml(i.symbol)})</option>`).join('')}
          </select>
        </label>
        <label class="text-xs text-slate-400">
          Monthly amount (USD)
          <input id="dcaAmount" type="number" min="1" step="1" value="150" class="mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500">
        </label>
        <label class="text-xs text-slate-400">
          Years back
          <select id="dcaYears" class="mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500">
            <option value="5">5 years</option>
            <option value="10" selected>10 years</option>
            <option value="20">20 years (or full history)</option>
          </select>
        </label>
      </div>
      <button id="dcaCalculate" type="button" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg py-2.5 transition">Calculate</button>
      <div id="dcaResult" class="w-full mt-3"></div>
    </section>
  `;
}

function computeDca(points, monthlyAmount, yearsBack) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - yearsBack);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const inRange = points.filter((p) => p.date >= cutoffStr && p.adjustedClose > 0);
  if (!inRange.length) return null;

  let totalShares = 0;
  for (const p of inRange) {
    totalShares += monthlyAmount / p.adjustedClose;
  }
  const totalContributed = monthlyAmount * inRange.length;
  const lastPoint = inRange[inRange.length - 1];
  const finalValue = totalShares * lastPoint.adjustedClose;
  const gain = finalValue - totalContributed;
  const gainPct = totalContributed > 0 ? (gain / totalContributed) * 100 : 0;

  return {
    months: inRange.length,
    startDate: inRange[0].date,
    endDate: lastPoint.date,
    totalContributed,
    finalValue,
    gain,
    gainPct,
  };
}

function formatUsd(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

async function runDcaCalculation() {
  const symbol = document.getElementById('dcaSymbol').value;
  const amount = parseFloat(document.getElementById('dcaAmount').value) || 0;
  const years = parseInt(document.getElementById('dcaYears').value, 10);
  const resultEl = document.getElementById('dcaResult');

  if (amount <= 0) {
    resultEl.innerHTML = '<p class="text-xs text-red-300">Enter a monthly amount greater than zero.</p>';
    return;
  }

  resultEl.innerHTML = '<p class="text-xs text-slate-400">Calculating from real historical data…</p>';

  try {
    const res = await fetch(`/api/adjusted-history?symbol=${encodeURIComponent(symbol)}`);
    const data = await res.json();

    if (data.error === 'not_configured') {
      showApiKeyBanner(data.message || 'This deployment has no ALPHA_VANTAGE_API_KEY set yet, so the calculator can\'t load historical data. See README.md.');
      resultEl.innerHTML = '<p class="text-xs text-red-300">Historical data unavailable — see the notice above.</p>';
      return;
    }
    if (data.error || !data.points || !data.points.length) {
      resultEl.innerHTML = `<p class="text-xs text-red-300">Could not load historical data for ${escapeHtml(symbol)}${data.detail ? `: ${escapeHtml(data.detail)}` : '.'}</p>`;
      return;
    }

    const result = computeDca(data.points, amount, years);
    if (!result) {
      resultEl.innerHTML = '<p class="text-xs text-red-300">Not enough historical data for that time range.</p>';
      return;
    }

    const gainClass = result.gain >= 0 ? 'text-emerald-400' : 'text-red-400';
    resultEl.innerHTML = `
      <div class="bg-slate-900/40 rounded-lg p-3 space-y-1.5">
        <div class="flex justify-between text-xs"><span class="text-slate-400">Contributed (${result.months} months, ${escapeHtml(result.startDate)} to ${escapeHtml(result.endDate)})</span><span class="text-slate-200 font-medium">${formatUsd(result.totalContributed)}</span></div>
        <div class="flex justify-between text-xs"><span class="text-slate-400">Would be worth today</span><span class="text-slate-100 font-semibold">${formatUsd(result.finalValue)}</span></div>
        <div class="flex justify-between text-xs"><span class="text-slate-400">Gain / loss</span><span class="${gainClass} font-semibold">${result.gain >= 0 ? '+' : ''}${formatUsd(result.gain)} (${result.gainPct >= 0 ? '+' : ''}${result.gainPct.toFixed(1)}%)</span></div>
      </div>
      <p class="text-[11px] text-slate-500 mt-2">Computed from ${escapeHtml(symbol)}'s real, dividend-adjusted monthly price history. Past performance is not a guarantee of future results — this is what happened historically, not a forecast. Doesn't account for taxes, brokerage fees, or currency conversion.</p>
    `;
  } catch (err) {
    console.error('DCA calculation failed:', err);
    resultEl.innerHTML = '<p class="text-xs text-red-300">Something went wrong loading historical data. Try again shortly.</p>';
  }
}

// ---------- Your Country at a Glance (World Bank Indicators API) ----------
// Real macro context — inflation, GDP per capita, GDP growth, financial inclusion —
// for whatever country the user selects, via a keyless World Bank API proxy
// (/api/countries, /api/country-indicators). Covers every country the World Bank
// tracks (~217), not a hardcoded shortlist, and the indicator set is a small config
// array on the server (WB_INDICATORS in api/markets-hub.js) specifically so more
// indicators can be added later without touching this file's structure. Placed right
// after Lesson 1 (Investing vs. Gambling) so the "why not just hold cash" argument
// gets grounded in the user's own real economic environment before the index/ETF
// lessons explain the solution.

const COUNTRY_STORAGE_KEY = 'scere-learn-country';

function formatIndicatorValue(indicator) {
  if (indicator.value === null || indicator.value === undefined) return null;
  if (indicator.format === 'percent') return `${indicator.value.toFixed(1)}%`;
  if (indicator.format === 'usd') {
    return indicator.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }
  return String(indicator.value);
}

function renderCountryPanelShell() {
  return `
    <section class="advisory-card !items-start flex-col !flex">
      <p class="font-semibold text-sm mb-1">Your country at a glance</p>
      <p class="text-xs opacity-80 mb-3">Real data from the World Bank's Indicators API — pick any country to see its most recent published figures. Not tied to any recommendation; just real context for the environment you're investing from.</p>
      <label class="text-xs text-slate-400 w-full">
        Country
        <select id="countrySelect" class="mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500">
          <option value="">Loading countries…</option>
        </select>
      </label>
      <div id="countryIndicatorsResult" class="w-full mt-3"></div>
    </section>
  `;
}

function renderCountryIndicatorCards(data) {
  const countryName = data.countryName || 'this country';
  const copy = window.SCERE_COUNTRY_INDICATOR_COPY || {};

  const cards = (data.indicators || []).map((ind) => {
    const formatted = formatIndicatorValue(ind);
    const blurb = (copy[ind.key] || '').replace(/\{country\}/g, escapeHtml(countryName));

    if (formatted === null) {
      return `
        <div class="bg-slate-900/40 rounded-lg p-3">
          <p class="text-xs text-slate-400">${escapeHtml(ind.label)}</p>
          <p class="text-sm text-slate-500 mt-1">Not available for ${escapeHtml(countryName)} in the World Bank's recent data.</p>
        </div>
      `;
    }

    return `
      <div class="bg-slate-900/40 rounded-lg p-3">
        <div class="flex items-baseline justify-between gap-2">
          <p class="text-xs text-slate-400">${escapeHtml(ind.label)}</p>
          <span class="text-[11px] text-slate-500">${escapeHtml(ind.year)}</span>
        </div>
        <p class="text-lg font-semibold text-slate-100 mt-0.5">${escapeHtml(formatted)}</p>
        ${blurb ? `<p class="text-xs text-slate-400 mt-1.5">${blurb}</p>` : ''}
        ${ind.note ? `<p class="text-[11px] text-slate-500 mt-1">${escapeHtml(ind.note)}</p>` : ''}
        <a href="${escapeHtml(ind.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="text-[11px] text-sky-400 underline decoration-sky-700 underline-offset-2 mt-1 inline-block">World Bank source</a>
      </div>
    `;
  }).join('');

  return `<div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">${cards}</div>`;
}

async function loadCountryIndicators(countryId) {
  const resultEl = document.getElementById('countryIndicatorsResult');
  if (!resultEl) return;

  if (!countryId) {
    resultEl.innerHTML = '';
    return;
  }

  resultEl.innerHTML = '<p class="text-xs text-slate-400">Loading real data…</p>';

  try {
    const res = await fetch(`/api/country-indicators?country=${encodeURIComponent(countryId)}`);
    const data = await res.json();

    if (data.error && !data.indicators?.length) {
      resultEl.innerHTML = `<p class="text-xs text-red-300">Could not load data for this country${data.detail ? `: ${escapeHtml(data.detail)}` : '.'}</p>`;
      return;
    }

    resultEl.innerHTML = renderCountryIndicatorCards(data);
  } catch (err) {
    console.error('country indicators failed:', err);
    resultEl.innerHTML = '<p class="text-xs text-red-300">Something went wrong loading country data. Try again shortly.</p>';
  }
}

async function loadCountryList() {
  const select = document.getElementById('countrySelect');
  if (!select) return;

  try {
    const res = await fetch('/api/countries');
    const data = await res.json();
    const countries = data.countries || [];

    if (!countries.length) {
      select.innerHTML = '<option value="">Country list unavailable — try again later</option>';
      return;
    }

    let saved = '';
    try { saved = localStorage.getItem(COUNTRY_STORAGE_KEY) || ''; } catch (e) { /* ignore */ }

    const options = ['<option value="">Select your country…</option>']
      .concat(countries.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`));
    select.innerHTML = options.join('');

    if (saved && countries.some((c) => c.id === saved)) {
      select.value = saved;
      loadCountryIndicators(saved);
    }

    select.addEventListener('change', () => {
      const value = select.value;
      try { localStorage.setItem(COUNTRY_STORAGE_KEY, value); } catch (e) { /* ignore */ }
      loadCountryIndicators(value);
    });
  } catch (err) {
    console.error('country list failed:', err);
    select.innerHTML = '<option value="">Could not load country list</option>';
  }
}

// ---------- read-aloud (Web Speech API) ----------
// Uses the browser's free, built-in speech synthesis — no API key, no server
// round-trip, works for anyone whose browser supports it. Scoped to Learn
// only, and only to lesson prose (title, key idea, body paragraphs) — the fee
// table and DCA calculator are numbers and form inputs, not something to read
// aloud, so they're never added to the queue.
//
// Known limitation, documented honestly rather than overpromised: iOS Safari's
// speechSynthesis.pause()/resume() is unreliable in some versions. Stop is
// always offered alongside Pause so a stuck pause never traps the user.

const TTS_SUPPORTED = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
const TTS_RATE_KEY = 'scere-learn-tts-speed';

const ttsState = {
  queue: [],
  index: -1,
  playing: false,
  paused: false,
};

function ttsRateForSpeed(speed) {
  if (speed === 'slow') return 0.8;
  if (speed === 'fast') return 1.3;
  return 1;
}

function ttsLoadSavedSpeed() {
  try {
    return localStorage.getItem(TTS_RATE_KEY) || 'normal';
  } catch (e) {
    return 'normal';
  }
}

function ttsSaveSpeed(speed) {
  try {
    localStorage.setItem(TTS_RATE_KEY, speed);
  } catch (e) {
    // Storage unavailable (private browsing, etc.) — speed just won't persist.
  }
}

function ttsClearHighlight() {
  document.querySelectorAll('.reading-highlight').forEach((el) => el.classList.remove('reading-highlight'));
}

function ttsHighlight(el) {
  ttsClearHighlight();
  el.classList.add('reading-highlight');
  if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function ttsUpdateLessonButtons() {
  document.querySelectorAll('[data-lesson-listen]').forEach((btn) => {
    const section = btn.closest('[data-lesson-section]');
    const current = ttsState.queue[ttsState.index];
    const isReadingThis = ttsState.playing && section && current && section.contains(current);
    btn.classList.toggle('is-reading', !!isReadingThis);
    btn.textContent = isReadingThis ? '🔊 Reading…' : '🔊 Listen';
  });
}

function ttsUpdatePageBar() {
  const playLabel = document.getElementById('speechPlayLabel');
  const playIcon = document.getElementById('speechPlayIcon');
  const stopBtn = document.getElementById('speechStopBtn');
  if (!playLabel || !playIcon || !stopBtn) return;

  if (ttsState.playing && !ttsState.paused) {
    playIcon.textContent = '⏸';
    playLabel.textContent = 'Pause';
  } else if (ttsState.playing && ttsState.paused) {
    playIcon.textContent = '▶';
    playLabel.textContent = 'Resume';
  } else {
    playIcon.textContent = '🔊';
    playLabel.textContent = 'Listen to this page';
  }
  stopBtn.classList.toggle('hidden', !ttsState.playing);
}

function ttsStop() {
  window.speechSynthesis.cancel();
  ttsState.queue = [];
  ttsState.index = -1;
  ttsState.playing = false;
  ttsState.paused = false;
  ttsClearHighlight();
  ttsUpdatePageBar();
  ttsUpdateLessonButtons();
}

function ttsAdvance() {
  ttsState.index += 1;
  if (ttsState.index >= ttsState.queue.length) {
    ttsStop();
    return;
  }
  ttsSpeakCurrent();
}

function ttsSpeakCurrent() {
  const el = ttsState.queue[ttsState.index];
  if (!el) {
    ttsStop();
    return;
  }
  const text = (el.textContent || '').trim();
  if (!text) {
    ttsAdvance();
    return;
  }

  const speedSelect = document.getElementById('speechSpeedSelect');
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = ttsRateForSpeed((speedSelect && speedSelect.value) || ttsLoadSavedSpeed());
  utterance.onstart = () => {
    ttsHighlight(el);
    ttsUpdatePageBar();
    ttsUpdateLessonButtons();
  };
  utterance.onend = () => {
    if (ttsState.playing) ttsAdvance();
  };
  utterance.onerror = () => {
    if (ttsState.playing) ttsAdvance();
  };
  window.speechSynthesis.speak(utterance);
}

function ttsStart(rootEl) {
  if (!TTS_SUPPORTED) return;
  window.speechSynthesis.cancel();
  // learn.html's read scope is now the <main> landmark itself (the wrapper became a
  // real landmark and cannot carry two ids); lesson.html still has its own
  // #mainReadScope around just the lesson body.
  const scope = rootEl || document.getElementById('mainReadScope') || document.getElementById('mainContent') || document.getElementById('lessonsRoot') || document;
  const units = Array.from(scope.querySelectorAll('[data-read-unit]'));
  if (!units.length) return;

  ttsState.queue = units;
  ttsState.index = 0;
  ttsState.playing = true;
  ttsState.paused = false;
  ttsUpdatePageBar();
  ttsUpdateLessonButtons();
  ttsSpeakCurrent();
}

function ttsTogglePlayPause(rootEl) {
  if (!TTS_SUPPORTED) return;
  if (!ttsState.playing) {
    ttsStart(rootEl);
    return;
  }
  if (ttsState.paused) {
    window.speechSynthesis.resume();
    ttsState.paused = false;
  } else {
    window.speechSynthesis.pause();
    ttsState.paused = true;
  }
  ttsUpdatePageBar();
}

function initSpeechControls() {
  const speechBar = document.getElementById('speechBar');

  if (!TTS_SUPPORTED) {
    // Graceful degradation: hide all read-aloud UI, leave the rest of the
    // page fully usable. No error shown — reading the page yourself still works.
    if (speechBar) speechBar.classList.add('hidden');
    return;
  }

  if (speechBar) speechBar.classList.remove('hidden');
  document.querySelectorAll('[data-lesson-listen]').forEach((btn) => btn.classList.remove('hidden'));

  const speedSelect = document.getElementById('speechSpeedSelect');
  if (speedSelect) {
    speedSelect.value = ttsLoadSavedSpeed();
    speedSelect.addEventListener('change', () => {
      ttsSaveSpeed(speedSelect.value);
      // Applies from the next paragraph onward — changing the rate of speech
      // already in progress isn't reliably supported across browsers.
    });
  }

  const playBtn = document.getElementById('speechPlayBtn');
  if (playBtn) {
    // Widened from #lessonsRoot to #mainReadScope (wraps both #foundationRoot
    // and #lessonsRoot in learn.html) so "Listen to this page" reads the free
    // Foundation lessons and the Stocks/ETF lessons in one continuous pass,
    // in document order. Per-lesson "Listen" buttons are unaffected — they
    // already scope to their own [data-lesson-section] via ttsStart(section).
    playBtn.addEventListener('click', () => ttsTogglePlayPause(document.getElementById('mainReadScope') || document.getElementById('mainContent')));
  }

  const stopBtn = document.getElementById('speechStopBtn');
  if (stopBtn) stopBtn.addEventListener('click', ttsStop);

  document.querySelectorAll('[data-lesson-listen]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.closest('[data-lesson-section]');
      ttsStart(section);
    });
  });

  // Don't leave the device talking to a tab the user has left.
  window.addEventListener('beforeunload', () => window.speechSynthesis.cancel());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && ttsState.playing) ttsStop();
  });
}

// ---------- orchestration ----------

function renderLessons() {
  const lessons = window.SCERE_LEARN_CONTENT || [];
  const root = document.getElementById('lessonsRoot');

  const html = lessons.map((lesson, index) => {
    let block = renderLessonCard(lesson, index);
    if (lesson.id === 'investing-vs-gambling') block += renderCountryPanelShell();
    if (lesson.id === 'expense-ratios') block += renderFeeTable();
    if (lesson.id === 'dollar-cost-averaging') block += renderDcaCalculatorShell();
    return block;
  }).join('');

  root.innerHTML = html;

  const calcBtn = document.getElementById('dcaCalculate');
  if (calcBtn) calcBtn.addEventListener('click', runDcaCalculation);

  loadCountryList();

  initSpeechControls();
}

// ============================================================
// Per-lesson pages
// The course used to render every track onto one endless page. It now splits
// into a table of contents (learn.html → #courseIndexRoot) and a single-lesson
// viewer (lesson.html → #lessonRoot), both built from one canonical ordered
// list across all three tracks, reusing the lesson renderers above.
// ============================================================

// The syllabus comes from /api/course?fn=index — metadata only, and public, so the
// course stays browsable before payment. Lesson BODIES are fetched one at a time and
// are what the paywall actually guards. Order is fixed server-side (free Foundation
// first, then the paid tracks) so the index and the viewer agree on prev/next.
let courseIndexCache = null;

async function fetchCourseIndex() {
  if (courseIndexCache) return courseIndexCache;
  const res = await fetch('/api/course?fn=index');
  if (!res.ok) throw new Error(`course index failed: ${res.status}`);
  const data = await res.json();
  courseIndexCache = (data.lessons || []).map((l) => ({
    track: l.track,
    trackTitle: l.trackTitle,
    tagline: l.trackTagline || '',
    free: !!l.free,
    badge: l.free ? 'Free' : 'Course',
    badgeClass: l.free ? 'foundation-badge' : 'paid-badge',
    id: l.id,
    chapterNumber: l.chapterNumber,
    chapterTitle: l.chapterTitle,
    lessonNumber: l.lessonNumber,
    title: l.title,
    keyIdea: l.keyIdea,
    minutes: l.minutes || null,
    type: l.type,
  }));
  return courseIndexCache;
}

// Returns { lesson, locked }. A 402 is an expected outcome, not an error: it means
// the lesson exists and is simply not paid for, and it still carries enough metadata
// to render a useful locked state.
async function fetchLesson(id) {
  const res = await fetch(`/api/course?fn=lesson&id=${encodeURIComponent(id)}`);
  if (res.status === 402) {
    const data = await res.json().catch(() => ({}));
    return { lesson: data.lesson || null, locked: true };
  }
  if (!res.ok) throw new Error(`lesson failed: ${res.status}`);
  const data = await res.json();
  return { lesson: data.lesson, locked: false };
}

function lessonHref(id) { return `./lesson.html?id=${encodeURIComponent(id)}`; }

// The lesson data already prefixes chapter titles with "Chapter N:", and both the TOC
// divider and the lesson breadcrumb added their own — producing "Chapter 1: Chapter 1:
// The History of Money" on all 12 chapters of the course. Stripped at the point of
// display so the content files stay as they were authored.
function chapterLabel(number, title, sep) {
  const clean = String(title || '').replace(/^\s*chapter\s*\d+\s*[:.\u2013\u2014-]\s*/i, '').trim();
  if (number == null) return clean;
  return clean ? `Chapter ${number}${sep || ': '}${clean}` : `Chapter ${number}`;
}

// "3 min" reads better than "3 minutes" in a dense row, and an unknown estimate should
// render as nothing rather than as "0 min".
function minutesLabel(m) {
  return m ? `${m} min` : '';
}

function totalMinutes(lessons) {
  return lessons.reduce((n, l) => n + (l.minutes || 0), 0);
}

function formatDuration(mins) {
  if (!mins) return '';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  return r ? `${h} hr ${r} min` : `${h} hr`;
}

// progress.js loads before this file. The fallback keeps the course usable if a stale
// service-worker cache misses it — every lesson simply reads as unread.
const progress = window.SCERE_PROGRESS || {
  supported: false, isDone: () => false, setDone: () => false, toggle: () => false,
  touch() {}, lastLesson: () => null, stats: (ids) => ({ done: 0, total: ids.length, pct: 0 }),
  nextIncomplete: (ids) => ids[0] || null, anyProgress: () => false, clearAll() {},
};

function trackHref(slug) { return `./track.html?track=${encodeURIComponent(slug)}`; }

// Grouped once and reused by the hub, the track pages and the lesson viewer.
function groupTracks(index) {
  const tracks = [];
  index.forEach((e) => {
    let t = tracks.find((x) => x.track === e.track);
    if (!t) {
      t = { track: e.track, trackTitle: e.trackTitle, tagline: e.tagline, badge: e.badge, badgeClass: e.badgeClass, free: e.free, lessons: [] };
      tracks.push(t);
    }
    t.lessons.push(e);
  });
  return tracks;
}

// A bar for the glance and a number for the record. A bar alone is invisible to a
// screen reader, which is why the whole thing carries an aria-label.
function renderProgressBar(pct, label) {
  return `
    <div class="prog" role="img" aria-label="${escapeHtml(label)}">
      <div class="prog-bar"><span class="prog-fill" style="width:${pct}%"></span></div>
      <span class="prog-num">${pct}%</span>
    </div>`;
}

// ---------- learn.html: the course hub ----------
//
// This page used to be the entire syllabus in one flat list: 58 rows, 10,248px tall on
// a 390px phone — over twelve screens of scrolling before you reached the end. It is
// now four track cards. The lesson list moved to a page per track, which is a shallower
// hierarchy AND makes each track linkable, resumable and separately measurable.

let hubIndexCache = null;

async function renderCourseIndex() {
  const root = document.getElementById('courseIndexRoot');
  if (!root) return;
  root.innerHTML = ui.skeleton(4);

  let index;
  try {
    index = await fetchCourseIndex();
  } catch (err) {
    root.innerHTML = failureState({
      title: 'The syllabus could not be loaded',
      message: navigator.onLine === false
        ? 'You appear to be offline. The course will load once your connection returns.'
        : 'Something went wrong at our end. Trying again usually fixes it.',
      retry: 'Try again',
    });
    wireRetry(root, renderCourseIndex);
    ui.say('The syllabus could not be loaded.', true);
    return;
  }

  hubIndexCache = index;
  const tracks = groupTracks(index);
  const allIds = index.map((l) => l.id);
  const overall = progress.stats(allIds);

  root.innerHTML =
    renderPurchaseOutcome() +
    renderContinueBanner(index) +
    renderSearchBox() +
    (progress.supported && overall.done
      ? `<p class="hub-overall">${overall.done} of ${overall.total} lessons read across the whole course · ${renderProgressBar(overall.pct, `${overall.pct}% of the course read`)}</p>`
      : '') +
    tracks.map((t, i) => renderTrackCard(t, i === tracks.findIndex((x) => !x.free))).join('') +
    renderProgressFootnote();

  wireCourseButtons(root);
  wireSearch(root, index);
  wireProgressReset(root);
  ui.say(purchaseOutcome === 'success'
    ? 'Payment received. The whole course is unlocked.'
    : `Course loaded — ${tracks.length} tracks, ${index.length} lessons.`, purchaseOutcome === 'success');
}

// The dominant action for anyone who has already started. Deliberately above the track
// cards: someone returning to lesson 7 should not have to find it again.
function renderContinueBanner(index) {
  if (!progress.supported) return '';
  const lastId = progress.lastLesson();
  const target = index.find((l) => l.id === lastId) || null;
  const next = target && progress.isDone(target.id)
    ? index.find((l) => !progress.isDone(l.id))
    : target;
  const pick = next || (progress.anyProgress() ? index.find((l) => !progress.isDone(l.id)) : null);
  if (!pick) return '';
  return `
    <a class="continue-card" href="${lessonHref(pick.id)}">
      <span class="continue-eyebrow">Continue where you left off</span>
      <span class="continue-title">${escapeHtml(pick.title)}</span>
      <span class="continue-meta">${escapeHtml(pick.trackTitle)}${pick.minutes ? ` · ${minutesLabel(pick.minutes)}` : ''}</span>
    </a>`;
}

function renderSearchBox() {
  return `
    <div class="hub-search">
      <label class="sr-only" for="lessonSearch">Search lessons</label>
      <input id="lessonSearch" type="search" class="ui-input" placeholder="Search all ${58} lessons…" autocomplete="off">
      <div id="searchResults" class="search-results" role="status" aria-live="polite"></div>
    </div>`;
}

function renderTrackCard(t, isFirstPaid) {
  const ids = t.lessons.map((l) => l.id);
  const st = progress.stats(ids);
  const mins = totalMinutes(t.lessons);
  const locked = !t.free && courseAccess.configured && !courseAccess.ownsCourse;
  const nextId = progress.nextIncomplete(ids);
  const cta = !progress.supported || st.done === 0
    ? 'Open track'
    : st.done === st.total ? 'Review track' : 'Continue track';

  return (isFirstPaid ? renderCourseOffer() : '') + `
    <a class="track-card${t.free ? ' is-free' : ''}${locked ? ' is-locked' : ''}" href="${trackHref(t.track)}">
      <div class="track-card-top">
        <span class="${t.badgeClass}">${escapeHtml(t.badge)}</span>
        ${locked ? '<span class="track-lock"><span aria-hidden="true">🔒</span> Part of the course</span>' : ''}
      </div>
      <h2 class="track-card-title">${escapeHtml(t.trackTitle)}</h2>
      <p class="track-card-tag">${escapeHtml(t.tagline || '')}</p>
      <p class="track-card-meta">${t.lessons.length} lesson${t.lessons.length === 1 ? '' : 's'}${mins ? ` · ${formatDuration(mins)}` : ''}</p>
      ${progress.supported && st.done ? renderProgressBar(st.pct, `${st.done} of ${st.total} lessons read`) : ''}
      ${progress.supported && st.done ? `<p class="track-card-prog">${st.done} of ${st.total} read</p>` : ''}
      <span class="track-card-cta">${cta} →</span>
    </a>`;
}

function renderProgressFootnote() {
  if (!progress.supported) {
    return '<p class="hub-note">Progress tracking is unavailable in this browser (private browsing blocks local storage), so lessons will not be marked as read.</p>';
  }
  if (!progress.anyProgress()) return '';
  return `<p class="hub-note">Your progress is saved in this browser only — it is not tied to an account and will not follow you to another device.
    <button type="button" id="resetProgress" class="link-btn">Reset progress</button></p>`;
}

function wireProgressReset(root) {
  const btn = root.querySelector('#resetProgress');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    // Destructive and irreversible, so it asks first — the one place in this app that
    // genuinely warrants a confirmation step.
    const confirmed = await ui.openDialog({
      title: 'Reset your progress?',
      message: 'Every lesson will be marked unread again. This only affects this browser, and it cannot be undone.',
      submitLabel: 'Reset progress',
      cancelLabel: 'Keep it',
      tone: 'error',
    });
    if (confirmed === null) return;
    progress.clearAll();
    ui.say('Progress reset.', true);
    renderCourseIndex();
  });
}

// Search across titles and key ideas. 58 lessons is past the point where scanning
// works, and the key idea is often what someone remembers rather than the title.
function wireSearch(root, index) {
  const input = root.querySelector('#lessonSearch');
  const out = root.querySelector('#searchResults');
  if (!input || !out) return;

  let timer = null;
  const run = () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { out.innerHTML = ''; out.classList.remove('is-open'); return; }
    const hits = index.filter((l) =>
      l.title.toLowerCase().includes(q) || (l.keyIdea || '').toLowerCase().includes(q)
    ).slice(0, 12);
    out.classList.add('is-open');
    if (!hits.length) {
      out.innerHTML = `<p class="search-empty">No lesson matches “${escapeHtml(input.value.trim())}”. Try a broader word — the search covers lesson titles and key ideas.</p>`;
      return;
    }
    out.innerHTML =
      `<p class="search-count">${hits.length} lesson${hits.length === 1 ? '' : 's'} found</p>` +
      hits.map((l) => `
        <a class="search-hit" href="${lessonHref(l.id)}">
          <span class="search-hit-title">${escapeHtml(l.title)}${!l.free ? '<span class="sr-only"> — locked, part of the paid course</span>' : ''}</span>
          <span class="search-hit-meta">${escapeHtml(l.trackTitle)}${l.minutes ? ` · ${minutesLabel(l.minutes)}` : ''}${!l.free ? ' · 🔒' : ''}</span>
        </a>`).join('');
  };

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 120);   // debounce so the live region is not spammed
  });
  input.addEventListener('search', run);
}

// ---------- track.html: one track, its chapters, its progress ----------
async function renderTrackPage() {
  const root = document.getElementById('trackRoot');
  if (!root) return;
  const slug = new URLSearchParams(window.location.search).get('track');
  root.innerHTML = ui.skeleton(5);

  let index;
  try {
    index = await fetchCourseIndex();
  } catch (err) {
    root.innerHTML = failureState({
      title: 'This track could not be loaded',
      message: navigator.onLine === false
        ? 'You appear to be offline. The track will load once your connection returns.'
        : 'Something went wrong at our end. Trying again usually fixes it.',
      retry: 'Try again',
    });
    wireRetry(root, renderTrackPage);
    return;
  }

  const track = groupTracks(index).find((t) => t.track === slug);
  if (!track) {
    root.innerHTML = `
      <div class="state-card">
        <span class="state-icon" aria-hidden="true">🔍</span>
        <p class="state-title">That track could not be found</p>
        <p class="state-msg">It may have been renamed or moved. The course page lists every track available.</p>
        <a href="./learn.html" class="upgrade-btn">Back to the course</a>
      </div>`;
    document.title = 'Track not found — Scere Markets';
    ui.say('That track could not be found.', true);
    return;
  }

  const ids = track.lessons.map((l) => l.id);
  const st = progress.stats(ids);
  const nextId = progress.nextIncomplete(ids);
  const mins = totalMinutes(track.lessons);
  const locked = !track.free && courseAccess.configured && !courseAccess.ownsCourse;

  // Chapters collapse by default; the one holding the next unread lesson opens, so the
  // page lands you where you are rather than at the top of a wall.
  const chapters = [];
  track.lessons.forEach((l) => {
    const key = l.chapterNumber == null ? '_' : String(l.chapterNumber);
    let c = chapters.find((x) => x.key === key);
    if (!c) { c = { key, number: l.chapterNumber, title: l.chapterTitle, lessons: [] }; chapters.push(c); }
    c.lessons.push(l);
  });

  const header = `
    <header class="track-head">
      <a class="track-back" href="./learn.html">← All tracks</a>
      <span class="${track.badgeClass}">${escapeHtml(track.badge)}</span>
      <h1 class="track-title">${escapeHtml(track.trackTitle)}</h1>
      <p class="track-tag">${escapeHtml(track.tagline || '')}</p>
      <p class="track-meta">${track.lessons.length} lessons${mins ? ` · ${formatDuration(mins)} of reading` : ''}</p>
      ${progress.supported ? renderProgressBar(st.pct, `${st.done} of ${st.total} lessons read`) : ''}
      ${progress.supported ? `<p class="track-prog-label">${st.done} of ${st.total} read</p>` : ''}
      ${nextId ? `<a class="upgrade-btn track-continue" href="${lessonHref(nextId)}">${st.done ? 'Continue' : 'Start'} — ${escapeHtml((track.lessons.find((l) => l.id === nextId) || {}).title || '')}</a>`
        : '<p class="track-done">✓ Every lesson in this track is read.</p>'}
    </header>`;

  const body = chapters.map((c, i) => {
    const openThis = chapters.length === 1 || (nextId && c.lessons.some((l) => l.id === nextId)) || (!nextId && i === 0);
    const cst = progress.stats(c.lessons.map((l) => l.id));
    const rows = c.lessons.map((l) => renderTrackRow(l, track)).join('');
    if (c.number == null) return `<div class="chapter-rows">${rows}</div>`;
    return `
      <details class="chapter" ${openThis ? 'open' : ''}>
        <summary class="chapter-summary">
          <span class="chapter-name">${escapeHtml(chapterLabel(c.number, c.title))}</span>
          <span class="chapter-count">${progress.supported && cst.done ? `${cst.done}/${cst.total}` : `${cst.total} lesson${cst.total === 1 ? '' : 's'}`}</span>
        </summary>
        <div class="chapter-rows">${rows}</div>
      </details>`;
  }).join('');

  root.innerHTML = renderPurchaseOutcome() + header + (locked ? renderCourseOffer() : '') + body;
  wireCourseButtons(root);
  document.title = `${track.trackTitle} — Scere Markets`;
  ui.say(`${track.trackTitle}. ${track.lessons.length} lessons, ${st.done} read.`);
}

function renderTrackRow(l, track) {
  const done = progress.supported && progress.isDone(l.id);
  const label = l.chapterNumber != null ? `${l.chapterNumber}.${l.lessonNumber}` : `${l.lessonNumber}`;
  const lockedNote = l.free ? '' : '<span class="sr-only"> — locked, part of the paid course</span>';
  const statusIcon = done ? '✓' : (l.free ? '→' : '🔒');
  const statusText = done ? '<span class="sr-only"> — read</span>' : '';
  return `
    <a class="toc-row${done ? ' is-done' : ''}" href="${lessonHref(l.id)}">
      <span class="toc-num"><span class="sr-only">Lesson </span>${escapeHtml(label)}</span>
      <span class="toc-body">
        <span class="toc-title">${escapeHtml(l.title)}${lockedNote}${statusText}</span>
        <span class="toc-key">${escapeHtml(l.keyIdea || '')}</span>
        ${l.minutes ? `<span class="toc-time">${minutesLabel(l.minutes)}</span>` : ''}
      </span>
      <span class="toc-go" aria-hidden="true">${statusIcon}</span>
    </a>`;
}

// ---------- buying the course ----------
//
// The course is sold from wherever someone meets a locked lesson, because that is the
// moment they have decided they want it. The price is read from Stripe via
// /api/billing rather than written here, so there is exactly one place it can be wrong.

const courseAccess = { configured: false, available: false, priceLabel: null, ownsCourse: false, promo: null };

// ui.js loads before this file. The fallback exists only so a stale service-worker
// cache that misses ui.js degrades to a plain page instead of a blank one.
const ui = window.SCERE_UI || {
  say() {}, setBusy() { return function () {}; }, skeleton() { return ''; },
  alertDialog(o) { window.alert(o.message); }, openDialog() { return Promise.resolve(null); },
  focusHeading() {}, isEmail() { return true; },
};

// Every failure gets the same shape: what happened, what it means, and a way out.
// A dead end with no action is the state people abandon the product from.
function failureState({ title, message, retry }) {
  return `
    <div class="state-card is-error">
      <span class="state-icon" aria-hidden="true">⚠️</span>
      <p class="state-title">${escapeHtml(title)}</p>
      <p class="state-msg">${escapeHtml(message)}</p>
      ${retry ? `<button type="button" class="ui-btn ui-btn-primary" data-retry>${escapeHtml(retry)}</button>` : ''}
    </div>`;
}

function wireRetry(root, fn) {
  const btn = root.querySelector('[data-retry]');
  if (btn) btn.addEventListener('click', () => { fn(); });
}

async function loadCourseBilling() {
  try {
    // A campaign link (?code=LAUNCH50) is resolved server-side so the price shown here
    // is the price actually charged. Showing €200 and then €100 on Stripe's page would
    // be a pleasant surprise once and a trust problem thereafter.
    const code = ui.promoCode ? ui.promoCode() : null;
    const res = await fetch('/api/billing?fn=config' + (code ? `&code=${encodeURIComponent(code)}` : ''));
    if (!res.ok) return;
    const c = await res.json();
    courseAccess.configured = !!c.configured;
    courseAccess.ownsCourse = !!c.ownsCourse;
    courseAccess.promo = c.promo || null;
    const course = c.course || {};
    courseAccess.available = !!course.available;
    courseAccess.priceLabel = course.priceLabel || null;
  } catch (e) {
    // Leave the defaults: the locked state still renders and still explains itself,
    // it just cannot show a price or a buy button.
  }
}

// The discounted figure wins wherever a code applies — the button must state what
// will actually be charged.
function coursePriceNow() {
  const p = courseAccess.promo;
  if (p && p.valid && p.course) return p.course.label;
  return courseAccess.priceLabel;
}

function courseBuyLabel() {
  const price = coursePriceNow();
  return price ? `Get the course · ${price}` : 'Get the course';
}

// Says what the code did, including when it did nothing. A code that is silently
// ignored is how someone pays full price believing it was applied.
function renderPromoNote() {
  const p = courseAccess.promo;
  if (!p || courseAccess.ownsCourse) return '';
  if (!p.valid) {
    return `<p class="promo-note is-bad">Code <b>${escapeHtml(p.code)}</b> isn’t valid or has expired — the price shown is the standard one.</p>`;
  }
  if (!p.course) {
    return `<p class="promo-note">Code <b>${escapeHtml(p.code)}</b> doesn’t apply to the course.</p>`;
  }
  const wasLabel = p.course.wasLabel ? `<s class="promo-was">${escapeHtml(p.course.wasLabel)}</s> ` : '';
  return `<p class="promo-note is-good">✓ Code <b>${escapeHtml(p.code)}</b> applied — ${wasLabel}<b>${escapeHtml(p.course.label)}</b>${p.course.free ? ' (free)' : ''}</p>`;
}

async function startCourseCheckout(btn) {
  // setBusy disables the button as well as relabelling it. The old version only
  // swapped the text, so a double-click could open two Checkout Sessions — and the
  // change was invisible to anyone not looking at the button.
  const restore = ui.setBusy(btn, 'Taking you to checkout…');
  try {
    const res = await fetch('/api/billing?fn=createCheckout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: 'course', code: (ui.promoCode ? ui.promoCode() : null) || undefined }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.url) { window.location.href = d.url; return; }  // leave it busy; we're navigating away
    // Already bought it in another tab or on another device — the page is simply out
    // of date, so reload into the unlocked view rather than showing an error.
    if (d.error === 'already_owned') { window.location.reload(); return; }
    restore();
    ui.alertDialog({
      tone: 'error',
      title: 'Checkout is unavailable',
      message: 'We couldn’t open the payment page just now. Nothing has been charged. Please try again in a moment.',
    });
  } catch (e) {
    restore();
    ui.alertDialog({
      tone: 'error',
      title: navigator.onLine === false ? 'You’re offline' : 'Couldn’t start checkout',
      message: navigator.onLine === false
        ? 'Reconnect and try again — nothing has been charged.'
        : 'Something went wrong before we reached the payment page. Nothing has been charged.',
    });
  }
}

function wireCourseButtons(root) {
  (root || document).querySelectorAll('[data-buy-course]').forEach((btn) => {
    btn.addEventListener('click', () => startCourseCheckout(btn));
  });
  // Someone who already owns the course and has lost their cookie needs a way back in
  // from the page they are actually looking at. Until now the course pages had none —
  // they pointed at the Ideas page, which is a strange place to recover a course.
  (root || document).querySelectorAll('[data-restore-access]').forEach((btn) => {
    btn.addEventListener('click', () => ui.requestAccessLink());
  });
}

// The markup is identical in the offer card and on a locked lesson, so it is written
// once — two copies of the sentence is how they end up saying different things.
function renderRestoreLine() {
  if (!courseAccess.configured || courseAccess.ownsCourse) return '';
  return `<p class="text-[11px] text-slate-500 mt-3">Already paid? <button type="button" data-restore-access class="underline hover:text-slate-300">Restore access</button></p>`;
}

// Coming back from Stripe: verify the session so the entitlement cookie is set BEFORE
// anything re-reads the lesson, then strip only our own query keys — on lesson.html
// the ?id= must survive, or the redirect would land on "lesson not found".
// What the buyer sees on return. Paying €200 and landing on a page that simply looks
// slightly different is the moment doubt sets in ("did that work? was I charged?"),
// so the outcome is stated explicitly rather than implied by the absence of padlocks.
let purchaseOutcome = null; // 'success' | 'cancelled' | 'unconfirmed' | 'restored'

async function handleCourseCheckoutReturn() {
  const p = new URLSearchParams(window.location.search);
  const buy = p.get('buy');
  // api/auth redirects here after a magic link is consumed. The cookies are already
  // set by then, so there is nothing to verify — only something to say, because
  // landing on a page that merely looks unlocked is exactly the moment someone
  // wonders whether it actually worked.
  if (p.get('restored')) {
    purchaseOutcome = 'restored';
    p.delete('restored');
    const rest = p.toString();
    window.history.replaceState({}, '', window.location.pathname + (rest ? `?${rest}` : ''));
  }
  if (buy === 'cancelled' || buy === 'cancel') purchaseOutcome = 'cancelled';
  if (buy === 'success' && p.get('session_id')) {
    try {
      const res = await fetch('/api/billing?fn=activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: p.get('session_id') }),
      });
      const d = await res.json().catch(() => ({}));
      // "Unconfirmed" is not "failed". Stripe has the money either way; the cookie can
      // lag. Saying so beats implying the payment did not happen.
      purchaseOutcome = res.ok && (d.ownsCourse || d.entitled) ? 'success' : 'unconfirmed';
    } catch (e) {
      purchaseOutcome = 'unconfirmed';
    }
  }
  if (buy) {
    p.delete('buy');
    p.delete('session_id');
    const qs = p.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }
}

function renderPurchaseOutcome() {
  if (!purchaseOutcome) return '';
  if (purchaseOutcome === 'restored') {
    return `
      <div class="state-card toc-offer is-owned" role="status">
        <span class="state-icon" aria-hidden="true">✓</span>
        <p class="state-title">Access restored</p>
        <p class="state-msg">You are signed in on this device and the course is unlocked again. The link you used has now been retired.</p>
      </div>`;
  }
  if (purchaseOutcome === 'success') {
    return `
      <div class="state-card toc-offer is-owned" role="status">
        <span class="state-icon" aria-hidden="true">✓</span>
        <p class="state-title">You own the course</p>
        <p class="state-msg">Payment received. Every lesson is unlocked permanently, and the daily high-conviction ideas are included for the next three months.</p>
      </div>`;
  }
  if (purchaseOutcome === 'cancelled') {
    return `
      <div class="state-card" role="status">
        <p class="state-title">Checkout cancelled</p>
        <p class="state-msg">Nothing was charged. The free Foundation track is still open, and the course is here whenever you want it.</p>
      </div>`;
  }
  return `
    <div class="state-card" role="status">
      <p class="state-title">Payment received — still unlocking</p>
      <p class="state-msg">Your payment went through, but we couldn’t confirm access on this device just yet. Refresh in a moment, or choose “Restore access” below and we’ll email you a sign-in link.</p>
      <p class="state-msg"><button type="button" data-restore-access class="underline hover:text-slate-300">Restore access</button></p>
    </div>`;
}

// The offer, shown on the syllabus above the paid tracks. Someone browsing the
// contents needs a way to buy without first walking into a locked lesson.
function renderCourseOffer() {
  if (!courseAccess.configured) return '';
  if (courseAccess.ownsCourse) {
    return `
      <div class="toc-offer is-owned">
        <p class="text-sm font-semibold text-emerald-300">✓ You own the course</p>
        <p class="text-xs text-slate-400 mt-1">Every lesson below is yours permanently.</p>
      </div>`;
  }
  if (!courseAccess.available) return '';
  const price = courseAccess.priceLabel ? escapeHtml(courseAccess.priceLabel) : '';
  return `
    <div class="toc-offer">
      <p class="text-sm font-semibold text-white">The course${price ? ` — ${price}` : ''}</p>
      <p class="text-xs text-slate-400 mt-1 mb-3 max-w-md">
        Crypto, Forex and Stocks &amp; ETFs. One payment, yours permanently — and it includes
        three months of the daily high-conviction ideas so you can watch the method work while
        you learn it.
      </p>
      <button type="button" data-buy-course class="upgrade-btn">${escapeHtml(courseBuyLabel())}</button>
      ${renderPromoNote()}
      ${renderRestoreLine()}
    </div>`;
}

// Shown in place of a lesson body the visitor has not paid for. It deliberately
// still says what the lesson covers — someone deciding whether to buy the course
// needs to be able to see what they would be buying.
function renderLockedLesson(e) {
  return `
    <section class="current-card bg-slate-800 rounded-2xl p-6 shadow-lg text-center">
      <span class="paid-badge">Part of the course</span>
      <h2 class="text-xl font-bold mt-3 mb-1">${escapeHtml(e.title)}</h2>
      ${e.keyIdea ? `<p class="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">${escapeHtml(e.keyIdea)}</p>` : ''}
      <p class="text-xs text-slate-500 mt-4 max-w-sm mx-auto">
        This lesson is part of the course — Crypto, Forex and Stocks &amp; ETFs. One payment, yours permanently, and it includes three months of daily high-conviction ideas.
      </p>
      ${courseAccess.available
        ? `<button type="button" data-buy-course class="upgrade-btn inline-block mt-4">${escapeHtml(courseBuyLabel())}</button>${renderPromoNote()}`
        : ''}
      ${renderRestoreLine()}
      <p class="mt-4 text-xs text-slate-500">
        <a href="./learn.html" class="underline decoration-slate-600 underline-offset-2 hover:text-sky-400">Browse the free Foundation track</a>
      </p>
    </section>`;
}

function wireMarkRead(root, entry, next) {
  const btn = root.querySelector('#markRead');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const nowDone = progress.toggle(entry.id);
    btn.setAttribute('aria-pressed', String(nowDone));
    btn.textContent = nowDone ? '\u2713 Read' : 'Mark as read';
    btn.className = `ui-btn ${nowDone ? 'ui-btn-ghost' : 'ui-btn-primary'}`;
    // Toggling is the whole interaction, so say what changed AND what it enables —
    // a silent state flip on a button is exactly the case aria-pressed alone under-serves.
    ui.say(nowDone
      ? `Marked as read.${next ? ` Next: ${next.title}.` : ' That was the last lesson in this track.'}`
      : 'Marked as unread.', true);
  });
}

// ---------- lesson.html: single lesson + prev/next ----------
async function renderSingleLesson() {
  const root = document.getElementById('lessonRoot');
  if (!root) return;
  const id = new URLSearchParams(window.location.search).get('id');

  root.innerHTML = ui.skeleton(4);

  let index;
  try {
    index = await fetchCourseIndex();
  } catch (err) {
    root.innerHTML = failureState({
      title: 'This lesson could not be loaded',
      message: navigator.onLine === false
        ? 'You appear to be offline. The lesson will load once your connection returns.'
        : 'Something went wrong at our end. Trying again usually fixes it.',
      retry: 'Try again',
    });
    wireRetry(root, renderSingleLesson);
    ui.say('This lesson could not be loaded.', true);
    return;
  }
  const pos = index.findIndex((e) => e.id === id);

  if (pos < 0) {
    root.innerHTML = `
      <div class="state-card">
        <span class="state-icon" aria-hidden="true">🔍</span>
        <p class="state-title">That lesson could not be found</p>
        <p class="state-msg">It may have been renamed or moved. The full syllabus lists every lesson currently available.</p>
        <a href="./learn.html" class="upgrade-btn">Back to all lessons</a>
      </div>`;
    ui.say('That lesson could not be found.', true);
    document.title = 'Lesson not found — Scere Markets';
    return;
  }

  const e = index[pos];
  const prev = pos > 0 ? index[pos - 1] : null;
  const next = pos < index.length - 1 ? index[pos + 1] : null;

  const crumb = [e.trackTitle];
  if (e.chapterNumber != null) crumb.push(chapterLabel(e.chapterNumber, e.chapterTitle));
  const breadcrumb = `
    <div class="lesson-crumb">
      <span class="${e.badgeClass}">${escapeHtml(e.badge)}</span>
      <span class="lesson-crumb-text">${crumb.map(escapeHtml).join(' &middot; ')}</span>
      <span class="lesson-crumb-count">Lesson ${pos + 1} of ${index.length}</span>
    </div>`;

  // The body is fetched separately from the index: the index is public metadata,
  // this call is the one the paywall guards.
  let fetched;
  try {
    fetched = await fetchLesson(id);
  } catch (err) {
    root.innerHTML = breadcrumb + failureState({
      title: 'This lesson could not be loaded',
      message: navigator.onLine === false
        ? 'You appear to be offline. The lesson will load once your connection returns.'
        : 'Something went wrong at our end. Trying again usually fixes it.',
      retry: 'Try again',
    });
    wireRetry(root, renderSingleLesson);
    ui.say('This lesson could not be loaded.', true);
    return;
  }

  let lessonHtml;
  let tools = '';
  if (fetched.locked) {
    lessonHtml = renderLockedLesson(e);
  } else {
    lessonHtml = e.type === 'structured'
      ? renderFoundationLessonCard(fetched.lesson)
      : renderLessonCard(fetched.lesson, (fetched.lesson.lessonNumber || 1) - 1);

    if (e.id === 'investing-vs-gambling') tools = renderCountryPanelShell();
    if (e.id === 'expense-ratios') tools = renderFeeTable();
    if (e.id === 'dollar-cost-averaging') tools = renderDcaCalculatorShell();
    // Interactive crypto labs (crypto-labs.js) — real SHA-256 hashing, nonce mining and
    // a tamperable chain, attached to the lessons that teach those mechanics.
    const labsAvailable = window.SCERE_CRYPTO_LABS;
    if (labsAvailable && labsAvailable.hasLab(e.id)) tools += labsAvailable.render(e.id);
  }
  const labs = window.SCERE_CRYPTO_LABS;

  const navBtn = (l, dir) => l
    ? `<a class="lesson-nav-btn ${dir}" href="${lessonHref(l.id)}"><span class="lnav-dir">${dir === 'prev' ? '← Previous' : 'Next →'}</span><span class="lnav-title">${escapeHtml(l.title)}</span></a>`
    : '<span class="lesson-nav-btn is-empty" aria-hidden="true"></span>';
  const nav = `<nav class="lesson-nav">${navBtn(prev, 'prev')}${navBtn(next, 'next')}</nav>`;

  // Track-relative position, not course-relative: "lesson 3 of 10" inside Foundation is
  // a number someone can act on; "lesson 3 of 58" is discouraging and less true.
  const trackLessons = index.filter((l) => l.track === e.track);
  const trackPos = trackLessons.findIndex((l) => l.id === e.id) + 1;
  const trackStats = progress.stats(trackLessons.map((l) => l.id));

  const positionBar = `
    <div id="readingControls"></div>
    <div class="lesson-pos">
      <a class="lesson-pos-track" href="${trackHref(e.track)}">${escapeHtml(e.trackTitle)}</a>
      <span class="lesson-pos-count">Lesson ${trackPos} of ${trackLessons.length}${e.minutes ? ` · ${minutesLabel(e.minutes)}` : ''}</span>
      ${progress.supported ? renderProgressBar(trackStats.pct, `${trackStats.done} of ${trackStats.total} lessons read in this track`) : ''}
    </div>`;

  const markBar = (!fetched.locked && progress.supported) ? `
    <div class="lesson-mark">
      <button type="button" id="markRead" class="ui-btn ${progress.isDone(e.id) ? 'ui-btn-ghost' : 'ui-btn-primary'}" aria-pressed="${progress.isDone(e.id)}">
        ${progress.isDone(e.id) ? '✓ Read' : 'Mark as read'}
      </button>
      ${next ? `<a class="lesson-mark-next" href="${lessonHref(next.id)}">Next: ${escapeHtml(next.title)} →</a>` : ''}
    </div>` : '';

  root.innerHTML = renderPurchaseOutcome() + positionBar + breadcrumb + lessonHtml + tools + markBar + nav;

  // Record the visit even for a locked lesson: it is still where the reader was.
  progress.touch(e.id);
  wireMarkRead(root, e, next);
  // Only on an unlocked lesson: there is no prose to resize behind a paywall.
  if (!fetched.locked && ui.mountReadingControls) ui.mountReadingControls(root.querySelector('#readingControls'));

  // Unconditional: the purchase-outcome card can carry a "Restore access" button even
  // on an unlocked lesson (payment taken, cookie not yet confirmed), and gating the
  // wiring on `locked` left that button dead.
  wireCourseButtons(root);

  // Interactive wiring only applies to a body that actually rendered — a locked
  // lesson has no quiz, no calculator and no lab to attach to.
  if (!fetched.locked) {
    wireQuizInteractivity(root);
    const calcBtn = document.getElementById('dcaCalculate');
    if (calcBtn) calcBtn.addEventListener('click', runDcaCalculation);
    if (e.id === 'investing-vs-gambling') loadCountryList();
    if (labs && labs.hasLab(e.id)) labs.wire(e.id, root);
    initSpeechControls();
  }

  document.title = `${e.title} — Scere Markets`;
  // Announce the outcome. The region fills in after page load, so without this a
  // screen-reader user who has already read past it never learns it arrived — and,
  // for a locked lesson, never learns why there is no lesson text.
  if (purchaseOutcome === 'success') ui.say('Payment received. The whole course is unlocked.', true);
  if (purchaseOutcome === 'restored') ui.say('Access restored. The course is unlocked on this device.', true);
  else if (fetched.locked) ui.say(`${e.title}. This lesson is locked — it is part of the paid course.`);
  else ui.say(`${e.title} loaded. Lesson ${pos + 1} of ${index.length}.`);
}

document.addEventListener('DOMContentLoaded', async () => {
  // Page-aware dispatch. Legacy single-page render (#foundationRoot etc.) still
  // works if those mounts are present, so nothing else that includes learn.js breaks.
  const sellingPage = document.getElementById('lessonRoot') || document.getElementById('courseIndexRoot') || document.getElementById('trackRoot');
  if (sellingPage) {
    // Order matters: activate the Checkout session first so the entitlement cookie
    // exists before the lesson is fetched, or a buyer would land back on the locked
    // view they just paid to leave.
    await handleCourseCheckoutReturn();
    await loadCourseBilling();
  }
  if (document.getElementById('lessonRoot')) { renderSingleLesson(); return; }
  if (document.getElementById('trackRoot')) { renderTrackPage(); return; }
  if (document.getElementById('courseIndexRoot')) { renderCourseIndex(); return; }
  renderFoundationTrack();
  renderForexTrack();
  renderCryptoTrack();
  renderLessons();
});
