// Curriculum content for the Forex track (paid) of the Scere Markets course.
// Compiled from the markdown lessons in course/forex/*.en.md into the same typed-block
// model as foundation-content.js (paragraph / definition / example / warning / practice /
// image blocks, plus interactive quiz and keyTerms). Rendered by renderForexTrack() in
// learn.js into #forexRoot, below the free Foundation track. Diagrams resolve via
// window.SCERE_FOREX_SVGS (dark-theme variants, defined at the bottom of this file).
//
// Shown fully open with a "Paid track" badge; real payment gating is a separate build.
// Chapters 1-3 complete plus Chapter 4 Lesson 1; further Chapter 4 lessons land later.

window.SCERE_FOREX_TRACK = {
  "trackTitle": "Forex",
  "trackTagline": "Paid track — currency trading from first principles: the mechanics of a trade, then reading the market with honest evidence."
};

window.SCERE_FOREX_CONTENT = [
  {
    "id": "how-traders-profit-from-exchange-rates",
    "lessonNumber": 1,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: The Mechanics of a Trade",
    "title": "How Traders Profit From Exchange Rates",
    "keyIdea": "You profit in forex by holding one currency while it strengthens against another, then converting back — no travel required.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "In \"The Foundation of Money and Trade,\" we covered why currencies exist and why their values float freely today rather than being pegged to gold. This lesson is where that history becomes practical."
      },
      {
        "type": "paragraph",
        "text": "Every country issues its own currency. A Canadian dollar is legal tender in Canada — but it's just a piece of paper anywhere else. Cross a border, and you need the local currency to buy anything."
      },
      {
        "type": "definition",
        "term": "Exchange Rate",
        "text": "The price of one currency expressed in terms of another. It tells you how much of one currency you'd get for one unit of the other."
      },
      {
        "type": "paragraph",
        "text": "Because currencies float — their values set by supply and demand, not fixed to gold or to each other — exchange rates are never still. They move constantly, sometimes by the minute."
      },
      {
        "type": "paragraph",
        "text": "Picture this: you live in the U.S. and you're heading to Mexico for a week. Right now, the exchange rate is 1 USD = 20 MXN (Mexican pesos)."
      },
      {
        "type": "example",
        "text": "You bring $100 USD to the exchange counter and convert it: 100 × 20 = 2,000 pesos. You spend the week in Mexico — but your friends cover everything. You don't spend a single peso. When you fly home, you still have all 2,000 pesos, and you convert them back to dollars. But the exchange rate has moved while you were away. It's no longer 20 — it's now 1 USD = 16 MXN. To convert back: 2,000 ÷ 16 = $125 USD. You left with $100. You came back with $125. You made $25 — without spending a cent, without working, and without any plan to trade at all. It happened purely because the exchange rate moved in your favor while you held pesos."
      },
      {
        "type": "paragraph",
        "text": "That $25 didn't come from nowhere. It came from a real shift in relative value between two currencies."
      },
      {
        "type": "definition",
        "term": "Appreciation / Depreciation",
        "text": "When a currency can buy more of another currency than before, it has appreciated (strengthened). When it can buy less, it has depreciated (weakened). In the example above, the peso appreciated against the dollar — it took fewer pesos to equal one dollar, which meant each peso was now worth more."
      },
      {
        "type": "practice",
        "text": "If the rate had instead moved from 1 USD = 20 MXN to 1 USD = 25 MXN while you were away, would you have made money or lost money converting your 2,000 pesos back? Work out the math before reading the next section."
      },
      {
        "type": "paragraph",
        "text": "Here's the part that actually matters for this course: nothing about that $25 profit required an actual vacation. The only thing that mattered was holding one currency while it strengthened against another, then converting back."
      },
      {
        "type": "definition",
        "term": "Speculation",
        "text": "Taking a position in something — in this case, a currency — based on the expectation that its value will move in a particular direction, in order to profit from that move."
      },
      {
        "type": "paragraph",
        "text": "If you'd had a reason to believe the peso was about to strengthen against the dollar, you could have converted dollars to pesos, held them, and converted back later — no flight, no vacation, no suitcase required."
      },
      {
        "type": "warning",
        "text": "A currency exchange counter at an airport is a real but inefficient way to do this — there are fees, poor rates, and you physically have to show up. Nobody trading forex seriously does it this way."
      },
      {
        "type": "paragraph",
        "text": "This is exactly the gap a forex broker fills."
      },
      {
        "type": "definition",
        "term": "Broker",
        "text": "A licensed firm that gives traders access to the currency market and executes their buy/sell orders — in this context, without any physical exchange of cash."
      },
      {
        "type": "paragraph",
        "text": "Through a broker, the entire vacation-trade scenario above — buy pesos, hold, convert back — happens with a few taps on a phone, in seconds, without a plane ticket, a suitcase, or a currency exchange counter. The broker gives you direct access to the same exchange rate movements that made that $25 vacation profit possible, on demand, for any pair of currencies you choose."
      },
      {
        "type": "practice",
        "text": "At the time of recording, a real quick check showed 1 USD ≈ 18.77 MXN. By the time you read this, that number will already be different. That's not a mistake — it's the entire point of this lesson. Go check today's actual USD/MXN rate right now. How different is it?"
      },
      {
        "type": "practice",
        "text": "As you look at any currency quote, ask yourself: which direction is the currency moving — is it strengthening or weakening against the one you're comparing it to? What would make you expect that movement to continue, reverse, or hold steady? And what does it actually cost to convert — fees, spread, timing — versus the size of the move you're expecting?"
      }
    ],
    "quiz": [
      {
        "question": "You convert $100 USD to pesos at a rate of 1 USD = 20 MXN, then convert back when the rate is 1 USD = 16 MXN. What happened?",
        "options": [
          "You lost money because the peso weakened",
          "You gained money because the peso strengthened",
          "You broke even — exchange rates always average out",
          "You lost money, but only because of broker fees"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — the peso strengthened (it took fewer pesos to equal a dollar), so your pesos converted back to more dollars than you started with.",
        "feedbackWrong": "Not quite — the peso strengthened, so the same 2,000 pesos convert back to more dollars than you started with."
      },
      {
        "question": "True or False: to profit from a currency's exchange rate movement, you must physically travel and exchange cash in person.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — a broker gives you the same exposure to exchange rate movement without any physical travel or cash exchange — that's the entire reason retail forex trading exists.",
        "feedbackWrong": "Not quite — a broker delivers the same exposure to exchange rate movement without any travel or physical cash, which is why retail forex exists."
      }
    ],
    "keyTerms": [
      {
        "term": "Exchange Rate",
        "def": "The price of one currency expressed in terms of another."
      },
      {
        "term": "Appreciation / Depreciation",
        "def": "A currency strengthening (buying more) or weakening (buying less) relative to another."
      },
      {
        "term": "Speculation",
        "def": "Taking a position expecting a price move, in order to profit from it."
      },
      {
        "term": "Broker",
        "def": "A licensed firm giving traders access to the market and executing their orders."
      }
    ]
  },
  {
    "id": "currency-pairs-iso-codes-and-quote-conventions",
    "lessonNumber": 2,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: The Mechanics of a Trade",
    "title": "Currency Pairs, ISO Codes, and Quote Conventions",
    "keyIdea": "Every quote is a currency pair with a base and a quote currency, written in a specific historically rooted order — not an arbitrary combination.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "In Lesson 1, converting dollars to pesos meant working with two currencies at once. There's a specific term for that relationship."
      },
      {
        "type": "definition",
        "term": "Currency Pair",
        "text": "Two currencies quoted against each other, expressing the value of one in terms of the other."
      },
      {
        "type": "definition",
        "term": "Base Currency",
        "text": "The first currency listed in a pair. It's the currency being measured — always treated as a single unit (\"1\") for the purpose of the quote."
      },
      {
        "type": "definition",
        "term": "Quote Currency",
        "text": "The second currency listed in a pair. It's the currency the price is expressed in — how much of it one unit of the base currency costs."
      },
      {
        "type": "example",
        "text": "In USD/MXN, USD is the base currency and MXN is the quote currency. A quote of 1 USD/MXN = 20 means one U.S. dollar costs 20 Mexican pesos. The base currency always answers \"how much is one of this worth?\" — the quote currency is the answer."
      },
      {
        "type": "paragraph",
        "text": "The three-letter codes you see in every currency pair aren't arbitrary abbreviations — they follow a real, formally maintained international standard."
      },
      {
        "type": "definition",
        "term": "ISO 4217",
        "text": "The international standard defining three-letter alphabetic codes (and three-digit numeric codes) for every active currency, first published in 1978 and maintained by SIX Financial Information AG on behalf of the International Organization for Standardization (ISO)."
      },
      {
        "type": "paragraph",
        "text": "The construction is logical once you know the rule: the first two letters usually match the currency's country under a separate country-code standard (ISO 3166), and the third letter is typically the first letter of the currency's name. JPY breaks down as JP (Japan) + Y (Yen). CAD is CA (Canada) + D (Dollar)."
      },
      {
        "type": "warning",
        "text": "\"Dollar,\" \"peso,\" and \"franc\" are used by many different, unrelated currencies — the peso alone belongs to Mexico, Argentina, Chile, Colombia, the Philippines, and several other countries, each a completely separate currency. A currency name is genuinely ambiguous. A three-letter ISO code is not — which is the entire reason the standard exists."
      },
      {
        "type": "paragraph",
        "text": "One correction worth making carefully: China's currency is officially called the renminbi (RMB), meaning \"the people's currency\" — the yuan is the base unit of the renminbi, the same relationship as \"sterling\" and \"pound\" in the UK. The ISO code CNY refers specifically to the yuan unit. In practice, \"yuan\" and \"renminbi\" are used almost interchangeably in everyday conversation, but the formal distinction is: renminbi is the currency, yuan is the unit it's counted in."
      },
      {
        "type": "example",
        "text": "USD/CAD = 1.35 means the U.S. dollar is the base currency, the Canadian dollar is the quote currency, and one U.S. dollar costs 1.35 Canadian dollars."
      },
      {
        "type": "paragraph",
        "text": "It would be easy to assume a pair could be written in either order — USD/EUR or EUR/USD, whichever you prefer. In practice, the market has settled on one specific order for each major pair, and it's genuinely not arbitrary."
      },
      {
        "type": "image",
        "svg": "forex-ch1-base-quote-pecking-order",
        "alt": "Diagram showing the base/quote breakdown of a currency pair and the historical pecking order that determines which currency is listed first",
        "caption": "A currency pair splits into a base and a quote currency, and a historical pecking order decides which one is listed first."
      },
      {
        "type": "paragraph",
        "text": "There's a long-standing hierarchy — sometimes called a \"pecking order\" — that determines which currency conventionally sits as the base when two major currencies are paired: the euro outranks the British pound, which outranks the Australian and New Zealand dollars, which outrank the U.S. dollar itself, which outranks the Canadian dollar, Swiss franc, and Japanese yen. That's why the market quotes EUR/USD and USD/CAD, but never USD/EUR or CAD/USD."
      },
      {
        "type": "warning",
        "text": "This ordering isn't based on economic size or trading volume — it's rooted in history. The British pound \"sat on top\" of the hierarchy because sterling was the world's dominant reserve currency before the U.S. dollar took over that role. When euro trading launched on January 4, 1999, brokers initially supported both EUR/GBP and GBP/EUR quote conventions and let the market decide — EUR/GBP won out almost immediately, with the euro effectively inheriting the German mark's position in the pecking order. The convention persists today for reasons of market habit and consistency, not because it's the only logical way to write it."
      },
      {
        "type": "paragraph",
        "text": "This matters practically: if you ever read a quote that looks \"backwards\" compared to what you expect, it's not necessarily wrong — check which convention is actually being used before assuming a mistake."
      },
      {
        "type": "paragraph",
        "text": "According to the Bank for International Settlements' 2025 Triennial Central Bank Survey — the most authoritative, comprehensive measurement of global currency trading, conducted every three years by central banks worldwide — global foreign exchange turnover reached $9.6 trillion per day in April 2025, up 28% from three years earlier. The U.S. dollar appeared on one side of 89% of all trades. EUR/USD remains the single largest currency pair by volume, though the Chinese yuan's share has been steadily rising — USD/CNY is now the third most-traded pair globally, ahead of GBP/USD."
      },
      {
        "type": "warning",
        "text": "Correction: an earlier version of this lesson stated USD/CNY was the \"fourth\" most-traded pair. Checking the precise 2025 BIS breakdown (EUR/USD 21.2%, USD/JPY 14.3%, USD/CNY 8.1%, GBP/USD 7.6%), it's actually third, ahead of GBP/USD. Flagging this directly rather than quietly fixing it — checking a specific number against the actual data, even your own course's earlier claim, is exactly the habit this course is trying to build."
      },
      {
        "type": "practice",
        "text": "Given everything in this lesson: for the pair GBP/JPY, which currency would you expect to be the base, and which the quote — based purely on the pecking order? Check your answer against the hierarchy diagram above."
      },
      {
        "type": "practice",
        "text": "As you look at any quote, ask yourself: can you immediately identify which side is the base and which is the quote, and what that means for the price shown? If a currency code looks unfamiliar, check it against the ISO 4217 standard rather than guessing from the currency's common name. If a quote looks \"backwards,\" check the convention before assuming an error. And when citing FX statistics like total volume or which pairs dominate, is the source authoritative like the BIS survey, or an unsourced blog claim?"
      }
    ],
    "quiz": [
      {
        "question": "In the pair USD/JPY = 149.50, which currency is the base currency?",
        "options": [
          "USD",
          "JPY",
          "Both, equally",
          "Neither — \"base\" doesn't apply here"
        ],
        "correctIndex": 0,
        "feedbackCorrect": "Correct — USD is listed first, making it the base; JPY is the quote, meaning one US dollar costs 149.50 yen.",
        "feedbackWrong": "Not quite — the base is always the currency listed first, so here it's USD; JPY is the quote."
      },
      {
        "question": "True or False: currency pairs can be written in any order — there's no real convention governing which currency comes first.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — there's a genuine, historically rooted pecking order (EUR > GBP > AUD/NZD > USD > CAD/CHF/JPY, roughly) that determines the conventional order for major pairs — it's market history, not arbitrary choice.",
        "feedbackWrong": "Not quite — a historically rooted pecking order (EUR > GBP > AUD/NZD > USD > CAD/CHF/JPY) sets the conventional order for major pairs."
      }
    ],
    "keyTerms": [
      {
        "term": "Currency Pair",
        "def": "Two currencies quoted against each other."
      },
      {
        "term": "Base Currency",
        "def": "The first currency in a pair — the one being measured as \"1.\""
      },
      {
        "term": "Quote Currency",
        "def": "The second currency in a pair — the price of one unit of the base."
      },
      {
        "term": "ISO 4217",
        "def": "The international standard defining three-letter currency codes."
      }
    ]
  },
  {
    "id": "major-currencies-and-pairs",
    "lessonNumber": 3,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: The Mechanics of a Trade",
    "title": "Major Currencies, Major Pairs & Cross Pairs",
    "keyIdea": "A handful of major currencies dominate trading, and pairs sort into precise categories — major, minor (cross), and exotic — based on whether USD is present and how liquid the other side is.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Currencies aren't traded in equal volume. Some are involved in a huge share of global trading; most barely register."
      },
      {
        "type": "definition",
        "term": "Major Currencies",
        "text": "The most heavily traded currencies globally: the U.S. dollar, euro, Japanese yen, British pound, Australian dollar, Canadian dollar, and Swiss franc (with the New Zealand dollar sometimes included as an eighth)."
      },
      {
        "type": "example",
        "text": "According to the Bank for International Settlements' 2025 Triennial Survey — the definitive, authoritative measurement of global currency trading — the U.S. dollar was on one side of 89% of all FX trades. The euro was second at 28.9%. That works out to the dollar being traded roughly three times more than the euro — a real, current, precisely sourced number, not a rough guess."
      },
      {
        "type": "definition",
        "term": "Major Currency Pairs",
        "text": "Currency pairs pairing the U.S. dollar with another major currency. These are the most liquid, most widely traded pairs in the market."
      },
      {
        "type": "image",
        "svg": "forex-ch1-major-minor-exotic-pairs",
        "alt": "Diagram showing major, minor, and exotic currency pair classification, plus the actual current 2025 BIS ranking of major pairs",
        "caption": "Pairs split into major, minor, and exotic classes, alongside the current 2025 BIS ranking of the major pairs by turnover."
      },
      {
        "type": "paragraph",
        "text": "Here's the real, current ranking by share of global turnover, from the same 2025 BIS survey: EUR/USD leads at 21.2%, followed by USD/JPY at 14.3%. The genuinely interesting shift: USD/CNY (the Chinese yuan) has climbed to third place at 8.1%, overtaking GBP/USD (now fourth, at 7.6%) — a dramatic rise from just 0.8% in 2010. USD/CAD, AUD/USD, and USD/CHF round out the majors, each in the 4–5% range."
      },
      {
        "type": "warning",
        "text": "That ranking shifts over time — the yuan's rise from 0.8% to 8.1% in fifteen years is proof of that. Don't treat any pair ranking as permanent; check current data rather than relying on a number that may be years out of date."
      },
      {
        "type": "paragraph",
        "text": "Major pairs have informal nicknames that traders use constantly — worth recognizing even if you never use them yourself."
      },
      {
        "type": "example",
        "text": "GBP/USD is \"Cable\" — dating to the mid-1800s, when exchange rates between London and New York were transmitted via transatlantic telegraph cable (the first successful one completed in 1866). USD/CAD is \"the Loonie\" — after the loon bird on Canada's one-dollar coin, introduced in 1987. AUD/USD is \"the Aussie,\" NZD/USD is \"the Kiwi,\" and USD/CHF is \"the Swissy\" — each simply shortened from the country name."
      },
      {
        "type": "paragraph",
        "text": "Recall from Lesson 2: which currency is listed first in a major pair isn't arbitrary — it follows the historical pecking order (EUR, then GBP, then AUD/NZD, then USD, then CAD/CHF/JPY) rooted in sterling's former reserve-currency dominance."
      },
      {
        "type": "paragraph",
        "text": "This is where casual explanations (including informal trading lectures) often blur three genuinely distinct terms."
      },
      {
        "type": "definition",
        "term": "Minor Pair (Cross Pair)",
        "text": "A pair combining two major currencies, with no U.S. dollar involved — for example, EUR/GBP, GBP/JPY, or CAD/JPY. \"Minor\" and \"cross pair\" refer to the same thing."
      },
      {
        "type": "definition",
        "term": "Exotic Pair",
        "text": "A major currency paired with the currency of a smaller or emerging economy — for example, USD/MXN, USD/TRY, or USD/ZAR."
      },
      {
        "type": "warning",
        "text": "It's easy to casually call a pair like USD/MXN a \"minor\" pair, since it's less liquid than a major — but by standard classification, it's actually an exotic pair. A true minor (cross) pair never involves USD at all — it's two majors paired directly, like CAD/JPY. Precision matters here because exotic pairs carry meaningfully different risk (lower liquidity, wider spreads, higher volatility) than true minors."
      },
      {
        "type": "practice",
        "text": "Classify each of these: EUR/GBP, USD/ZAR, GBP/JPY, USD/CHF. Which are majors, which are minors (cross pairs), and which are exotics? Work through the definitions above before checking — the rule is simply whether USD is present, and if so, whether the other side is a major or an emerging-market currency."
      },
      {
        "type": "practice",
        "text": "As you look at any pair or liquidity claim, ask yourself: is a \"most traded\" or \"most liquid\" claim backed by a specific, current, named source — or just stated as common knowledge? For an unfamiliar pair, does it include USD, and if so is the other side a major or an emerging currency? If there's no USD at all, it's a minor/cross pair. And remember that rankings change over time — treat any specific ranking as a snapshot, not a permanent fact."
      }
    ],
    "quiz": [
      {
        "question": "Which of these correctly describes an exotic currency pair?",
        "options": [
          "Two major currencies paired without USD",
          "A major currency paired with an emerging-market currency",
          "Any pair that includes USD",
          "The most liquid pairs in the market"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — exotic pairs combine a major currency with a smaller or emerging-market currency — lower liquidity, wider spreads, more volatility.",
        "feedbackWrong": "Not quite — an exotic pair is a major currency paired with a smaller or emerging-market currency; two majors without USD is a minor/cross pair."
      },
      {
        "question": "True or False: according to the 2025 BIS survey, USD/CNY has overtaken GBP/USD as the third most-traded currency pair globally.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 0,
        "feedbackCorrect": "Correct — USD/CNY reached 8.1% market share, edging past GBP/USD at 7.6% — a real, current shift reflecting the yuan's rising role in global trade.",
        "feedbackWrong": "Not quite — USD/CNY did overtake GBP/USD, reaching 8.1% against GBP/USD's 7.6% in the 2025 BIS survey."
      }
    ],
    "keyTerms": [
      {
        "term": "Major Currencies",
        "def": "The most heavily traded currencies globally (USD, EUR, JPY, GBP, AUD, CAD, CHF)."
      },
      {
        "term": "Major Currency Pairs",
        "def": "Pairs combining USD with another major currency."
      },
      {
        "term": "Minor Pair (Cross Pair)",
        "def": "A pair combining two major currencies, with no USD involved."
      },
      {
        "term": "Exotic Pair",
        "def": "A major currency paired with an emerging-market currency."
      }
    ]
  },
  {
    "id": "bid-ask-spread-and-pips",
    "lessonNumber": 4,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: The Mechanics of a Trade",
    "title": "Bid/Ask Spread & Pips",
    "keyIdea": "The bid-ask spread is a real, research-backed cost of trading — not just broker profit — and a pip is the unit you measure price moves in.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Every price you'll look at needs a unit small enough to talk about precisely. That unit is the pip."
      },
      {
        "type": "definition",
        "term": "Pip",
        "text": "The standard unit for measuring a price move in most currency pairs. For most pairs, one pip is the fourth decimal place (0.0001)."
      },
      {
        "type": "example",
        "text": "If EUR/USD moves from 1.0800 to 1.0815, that's a 15-pip move."
      },
      {
        "type": "paragraph",
        "text": "The term's exact origin is genuinely disputed — some say it stands for \"Percentage in Point,\" others \"Price Interest Point,\" and several serious sources note this may be a case of false etymology, a plausible-sounding backronym invented after the fact rather than the term's true origin. What's better established: the word came into wide use among European forex traders in the 1970s and 80s, as electronic trading standardized currency quotes to four decimal places and traders needed a fast, unambiguous way to talk about tiny price changes."
      },
      {
        "type": "warning",
        "text": "Yen pairs break the pattern. Because the yen has a much lower per-unit value than currencies like the dollar or euro, USD/JPY and other yen pairs are quoted to only two decimal places — so a pip there is the second decimal place (0.01), not the fourth. If USD/JPY moves from 149.50 to 150.00, that's a 50-pip move, not a 0.5-pip move. This trips up nearly every beginner at least once."
      },
      {
        "type": "image",
        "svg": "forex-ch1-bid-ask-spread-pips",
        "alt": "Diagram showing bid, ask, and spread mechanics, plus where the pip sits for standard pairs versus yen pairs",
        "caption": "The bid, the ask, and the spread between them — and how the pip shifts decimal place for yen pairs."
      },
      {
        "type": "definition",
        "term": "Pipette",
        "text": "A tenth of a pip — one decimal place further than the standard pip. Many modern brokers quote an extra decimal (e.g., EUR/USD to five decimals instead of four) for finer pricing precision."
      },
      {
        "type": "paragraph",
        "text": "Technically, the pip is no longer always \"the smallest possible price move\" the way it was when this terminology was set — pipettes now offer finer resolution. But \"pip\" remains the standard unit traders actually think and talk in."
      },
      {
        "type": "paragraph",
        "text": "Every quote you see is actually two prices, not one."
      },
      {
        "type": "definition",
        "term": "Bid Price",
        "text": "The price the market will pay you to sell the base currency."
      },
      {
        "type": "definition",
        "term": "Ask Price",
        "text": "The price the market will charge you to buy the base currency."
      },
      {
        "type": "definition",
        "term": "Bid-Ask Spread",
        "text": "The gap between the bid and ask price. This is the built-in cost of entering and exiting a trade."
      },
      {
        "type": "example",
        "text": "EUR/USD shows a bid of 1.08500 and an ask of 1.08510. The spread is 0.00010 — one pip. On a standard lot (100,000 units), one pip is worth roughly $10, so this trade costs about $10 the moment you open it, before the market has moved at all in either direction."
      },
      {
        "type": "paragraph",
        "text": "It's tempting to assume the spread is simply how a broker makes money — and that's part of the picture, but not the deepest explanation. There's a genuine, well-established body of academic research on exactly this question, going back to a landmark 1985 paper."
      },
      {
        "type": "definition",
        "term": "Adverse Selection",
        "text": "In a market-making context, the risk a market maker faces that the person on the other side of a trade knows something they don't, and is trading on that advantage."
      },
      {
        "type": "example",
        "text": "Glosten & Milgrom (1985), published in the Journal of Financial Economics, proved something genuinely counterintuitive: a positive bid-ask spread emerges even when the market maker is making zero expected profit on average. The reason is adverse selection. A market maker quoting prices to a stream of traders can't tell in advance who's trading on real information (an \"informed\" trader who knows something about where the price is headed) and who's just trading for ordinary reasons (an \"uninformed\" trader). Since informed traders systematically win at the market maker's expense, the market maker must widen the spread just to break even against that risk — even with no profit motive at all. This paper remains foundational; researchers were still directly building on and citing it in market microstructure papers as recently as 2026."
      },
      {
        "type": "paragraph",
        "text": "The spread isn't only about adverse selection, though — the broader research on this (often traced to work by Hans Stoll and others) identifies a few real components stacked together: order-processing costs (the genuine overhead of running the infrastructure that executes trades), inventory risk (a market maker holding currency exposure they didn't necessarily want, and pricing in the risk of holding it), and adverse selection (the Glosten-Milgrom effect above). The spread you see quoted is these forces combined into one number."
      },
      {
        "type": "practice",
        "text": "If a market maker widens the spread specifically around a major news release (like a central bank rate decision), which of the three cost components above do you think is driving that — and why would uncertainty about upcoming news make that component larger?"
      },
      {
        "type": "paragraph",
        "text": "Real, current spread data (2026) gives a useful sense of scale. On EUR/USD — the most liquid pair in the world — the industry-average spread across retail brokers sits around 0.88 pips on a standard, commission-free account, working out to roughly $8.80 per standard lot round-trip. On \"raw\" or ECN-style accounts, the quoted spread often drops close to 0.0–0.2 pips, but the broker charges a separate commission (typically $3–7 per lot round-trip) instead — the total cost usually lands in a similar range either way, just structured differently."
      },
      {
        "type": "warning",
        "text": "Spreads are not fixed. They widen measurably during low-liquidity periods (the Asian trading session, for instance) and around major scheduled news events, exactly when uncertainty about the \"true\" price is highest — a direct, practical echo of the adverse-selection and inventory-risk theory above. A spread that looks tight on a demo account during the London session can widen noticeably at other times."
      },
      {
        "type": "practice",
        "text": "Before trading, put it into practice: check the actual current spread on the pair you're using rather than a marketing headline number, which is often a best-case minimum that doesn't hold at all hours. Compare the all-in cost (spread plus any commission), not just the quoted spread — a \"0.0 pip spread\" account with a large commission can cost the same as, or more than, a wider-spread account with no commission. And notice when spreads widen around news events or thin trading hours, factoring that into when you enter or exit a position."
      }
    ],
    "quiz": [
      {
        "question": "EUR/USD shows a bid of 1.08500 and an ask of 1.08510. What is the spread?",
        "options": [
          "0.1 pip",
          "1 pip",
          "10 pips",
          "100 pips"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — the difference (1.08510 − 1.08500 = 0.00010) equals one pip for a standard pair.",
        "feedbackWrong": "Not quite — the difference is 1.08510 − 1.08500 = 0.00010, which is exactly one pip for a standard pair."
      },
      {
        "question": "True or False: according to Glosten and Milgrom's (1985) research, bid-ask spreads exist purely because market makers want to profit, with no other cause.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — their landmark finding was that a positive spread emerges even at zero expected profit, purely from the need to protect against adverse selection. Real-world spreads also reflect order-processing costs and inventory risk, not profit motive alone.",
        "feedbackWrong": "Not quite — Glosten and Milgrom showed a positive spread emerges even at zero expected profit, from the need to protect against adverse selection, plus order-processing costs and inventory risk."
      }
    ],
    "keyTerms": [
      {
        "term": "Pip",
        "def": "The standard unit for measuring a price move — the 4th decimal place for most pairs, 2nd for yen pairs."
      },
      {
        "term": "Pipette",
        "def": "A tenth of a pip — finer modern pricing precision."
      },
      {
        "term": "Bid Price",
        "def": "The price the market will pay you to sell."
      },
      {
        "term": "Ask Price",
        "def": "The price the market will charge you to buy."
      },
      {
        "term": "Bid-Ask Spread",
        "def": "The gap between bid and ask — the built-in cost of a trade."
      },
      {
        "term": "Adverse Selection",
        "def": "The risk a market maker faces from trading against better-informed counterparties."
      }
    ]
  },
  {
    "id": "lot-sizes-and-position-sizing",
    "lessonNumber": 5,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: The Mechanics of a Trade",
    "title": "Lot Sizes & Position Sizing",
    "keyIdea": "Position sizing turns your stop-loss distance and risk percentage into an exact trade size, so a losing trade costs exactly what you decided in advance.",
    "blocks": [
      {
        "type": "definition",
        "term": "Lot",
        "text": "A standardized unit of trade size in forex. One standard lot equals 100,000 units of the base currency."
      },
      {
        "type": "paragraph",
        "text": "Lots come in four standard sizes: a standard lot is 100,000 units (about $10 per pip on USD-quoted pairs), a mini lot is 10,000 units (about $1), a micro lot is 1,000 units (about $0.10), and a nano lot is 100 units (about $0.01)."
      },
      {
        "type": "example",
        "text": "If you trade 1 standard lot of EUR/USD, you're controlling €100,000. A 1-pip move in your favor or against you is worth roughly $10. Trade 1 micro lot instead (1,000 units), and that same 1-pip move is worth $0.10 — a hundred times smaller."
      },
      {
        "type": "warning",
        "text": "The 100,000-unit standard lot isn't an arbitrary round number — it reflects the historical scale of interbank trading, where banks moved large sums to settle international trade, long before individual retail traders had any access to the market. Mini, micro, and nano lots were introduced later specifically to make the market accessible to smaller accounts."
      },
      {
        "type": "paragraph",
        "text": "This is the calculation Foundations Chapter 2 flagged but never actually solved: once you know your stop-loss distance (Chapter 2, Lesson 2) and pip value (Chapter 1, Lesson 4), you can calculate exactly how large a position should be."
      },
      {
        "type": "definition",
        "term": "Position Sizing",
        "text": "Calculating exactly how much of a currency to buy or sell in a trade, based on your account size, your risk tolerance, and your stop-loss distance."
      },
      {
        "type": "paragraph",
        "text": "The formula: Lot Size = (Account Balance × Risk %) ÷ (Stop-Loss in Pips × Pip Value)."
      },
      {
        "type": "image",
        "svg": "forex-ch1-position-sizing",
        "alt": "Diagram showing the position sizing formula worked through with a real example, and why fixed-percentage risk is preferred over theoretically optimal sizing",
        "caption": "The position sizing formula worked through step by step, turning account size, risk percentage, and stop-loss into an exact lot size."
      },
      {
        "type": "example",
        "text": "You have a $10,000 account, and you've decided (per Foundations Chapter 2) to risk 1% per trade — that's $100. You're planning a trade with a 50-pip stop-loss. On a standard lot, each pip is worth $10, so you need to find the lot size where 50 pips of movement costs exactly $100. $100 ÷ 50 pips = $2 of risk per pip needed. Since a standard lot is $10 per pip, $2 ÷ $10 = 0.2 standard lots — 20,000 units, or 2 mini lots. If the trade hits your stop-loss, you lose exactly $100. Not roughly $100. Exactly $100, because you sized the position specifically to make that true."
      },
      {
        "type": "practice",
        "text": "Using the same $10,000 account and 1% risk, work out the correct lot size for a trade with a 25-pip stop-loss instead of 50. (Hint: a tighter stop-loss means you can afford a larger position for the same dollar risk.)"
      },
      {
        "type": "paragraph",
        "text": "There's a genuine, well-established academic answer to \"how much should I risk,\" developed decades before retail forex trading existed."
      },
      {
        "type": "definition",
        "term": "Kelly Criterion",
        "text": "A formula for calculating the mathematically optimal fraction of capital to risk on a bet or trade, in order to maximize long-term growth, developed by John L. Kelly Jr. at Bell Labs in 1956."
      },
      {
        "type": "example",
        "text": "Kelly's original paper, \"A New Interpretation of Information Rate,\" was published in the Bell System Technical Journal — and wasn't even primarily about gambling or trading. Kelly was extending Claude Shannon's information theory, and discovered that the same math describing optimal information transmission also describes optimal bet sizing. The formula requires knowing your real win rate and your reward-to-risk ratio precisely; given those, it tells you exactly what fraction of your capital to risk to grow fastest over time."
      },
      {
        "type": "warning",
        "text": "Kelly's formula is well-proven, but it has a serious practical problem for real trading: it requires you to already know your true win rate and reward-to-risk ratio — numbers a beginner (and honestly, most traders) can't estimate reliably. Worse, \"full Kelly\" is aggressive enough that even with a genuine edge, it can produce 50–80% drawdowns along the way. This is precisely why professional traders and quants typically use \"fractional Kelly\" — a half or quarter of the full formula — trading some theoretical growth for dramatically less volatility."
      },
      {
        "type": "paragraph",
        "text": "The fixed-percentage risk approach from Foundations Chapter 2 (risking 1–2% per trade) is, in effect, a simplified, beginner-safe cousin of the same underlying idea: risk a small, controlled fraction of your capital rather than a large, theoretically \"optimal\" one you can't actually calculate with confidence."
      },
      {
        "type": "practice",
        "text": "Put the sizing discipline into practice: before entering any trade, can you state the exact lot size the formula produces — not a round number you picked by feel? Does your position size actually make your maximum loss equal your intended risk percentage, or just approximately? And stay skeptical of any sizing approach — including \"optimal\" formulas — that requires knowing numbers, like your true win rate, that you can't actually know in advance with real confidence."
      }
    ],
    "quiz": [
      {
        "question": "You have a $5,000 account and want to risk 2% on a trade with a 40-pip stop-loss on a standard-lot pip value of $10. What lot size gives you exactly that risk?",
        "options": [
          "0.1 standard lots",
          "0.25 standard lots",
          "0.5 standard lots",
          "1.0 standard lots"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — $5,000 × 2% = $100 risk. $100 ÷ 40 pips = $2.50 per pip needed. $2.50 ÷ $10 = 0.25 standard lots.",
        "feedbackWrong": "Not quite — $5,000 × 2% = $100 risk. $100 ÷ 40 pips = $2.50 per pip needed, and $2.50 ÷ $10 = 0.25 standard lots."
      },
      {
        "question": "True or False: professional traders typically use the full Kelly Criterion bet size because it's mathematically optimal.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — full Kelly is known to produce severe drawdowns (50–80%) even with a real edge, and requires knowing your true win rate and reward-to-risk ratio precisely. Most professionals use \"fractional Kelly\" or a simpler fixed-percentage approach instead.",
        "feedbackWrong": "Not quite — full Kelly can produce 50–80% drawdowns and requires numbers you can't know precisely, so most professionals use fractional Kelly or a fixed-percentage approach."
      }
    ],
    "keyTerms": [
      {
        "term": "Lot",
        "def": "A standardized trade size — 100,000 units for a standard lot."
      },
      {
        "term": "Position Sizing",
        "def": "Calculating trade size based on account size, risk tolerance, and stop-loss distance."
      },
      {
        "term": "Kelly Criterion",
        "def": "A 1956 formula for the mathematically optimal fraction of capital to risk per bet."
      }
    ]
  },
  {
    "id": "leverage-and-margin",
    "lessonNumber": 6,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: The Mechanics of a Trade",
    "title": "Leverage & Margin",
    "keyIdea": "Leverage lets you control a position far larger than your capital — amplifying losses by exactly the same factor as gains, which is why regulators cap it for retail traders.",
    "blocks": [
      {
        "type": "definition",
        "term": "Leverage",
        "text": "Borrowed buying power that lets a trader control a position much larger than their own capital alone would allow, expressed as a ratio (e.g., 50:1)."
      },
      {
        "type": "definition",
        "term": "Margin",
        "text": "The trader's own capital, held by the broker as collateral, required to open and maintain a leveraged position."
      },
      {
        "type": "paragraph",
        "text": "Leverage and margin are two sides of the same relationship: margin is expressed as a percentage of the full position size, and leverage is simply the inverse of that percentage."
      },
      {
        "type": "example",
        "text": "With 50:1 leverage, the required margin is 1/50 = 2% of the position size. To open a $50,000 EUR/USD position, you'd need $1,000 of your own capital as margin — the broker effectively fronts the remaining $49,000 of exposure."
      },
      {
        "type": "paragraph",
        "text": "Your account doesn't just sit at a fixed margin requirement — it moves as the trade moves."
      },
      {
        "type": "definition",
        "term": "Margin Level",
        "text": "A live percentage measure of account equity relative to margin currently in use, calculated as (Equity ÷ Used Margin) × 100."
      },
      {
        "type": "definition",
        "term": "Margin Call",
        "text": "A broker's demand for additional funds, or automatic closure of positions, when a losing trade pushes margin level down to a critical threshold."
      },
      {
        "type": "example",
        "text": "You open the $50,000 position above with $1,000 margin, on a $5,000 account. The other $4,000 is \"free margin,\" available to absorb losses. If the trade moves against you enough to erode that cushion, your broker will issue a margin call — and if you don't add funds, they'll start closing your positions automatically to protect themselves from your account going negative."
      },
      {
        "type": "warning",
        "text": "Leverage cuts identically in both directions. It doesn't just amplify potential gains — it amplifies losses by exactly the same factor. A 2% adverse move against a fully leveraged 50:1 position wipes out 100% of the margin backing it. This is the single most important thing to understand about leverage before using it."
      },
      {
        "type": "image",
        "svg": "forex-ch1-leverage-margin",
        "alt": "Diagram showing leverage/margin mechanics, real regulatory leverage caps by region, and the measured effect of capping leverage",
        "caption": "How margin backs a leveraged position, the regulatory caps by region, and the measured effect of capping leverage."
      },
      {
        "type": "paragraph",
        "text": "Because of that amplification risk, financial regulators around the world cap how much leverage brokers can offer retail traders. These aren't arbitrary numbers:"
      },
      {
        "type": "example",
        "text": "In the United States, the CFTC has capped retail forex leverage at 50:1 for major currency pairs (20:1 for others) since October 2010, under authority granted by the Dodd-Frank Act. In the European Union, ESMA capped retail leverage at 30:1 for major pairs in 2018 — a rule the UK's FCA kept in place independently after Brexit, and Australia's ASIC adopted a similar 30:1 cap in 2021."
      },
      {
        "type": "paragraph",
        "text": "The EU's cap wasn't a guess. ESMA published its actual reasoning:"
      },
      {
        "type": "warning",
        "text": "ESMA's own 2018 analysis of national regulators' data found that 74–89% of retail CFD accounts lose money, with average losses per client ranging from €1,600 to €29,000. That statistic — not just general caution — is the documented basis for the EU's leverage restriction."
      },
      {
        "type": "paragraph",
        "text": "Regulatory reasoning is one thing. Real, measured evidence of what a leverage cap actually does to trader outcomes is rarer — but it exists."
      },
      {
        "type": "example",
        "text": "Heimer & Simsek (2019), published in the Journal of Financial Economics, studied exactly this question using a natural experiment: when the US imposed its 50:1/20:1 leverage cap in 2010, the researchers compared American traders (now capped) against otherwise-similar European traders (still uncapped at the time) using a difference-in-differences approach. They found the leverage constraint reduced trading volume by 23%, and — the key result — improved high-leverage traders' portfolio returns by 18 percentage points per month, alleviating their losses by roughly 40%. Their conclusion: the trading the cap eliminated was disproportionately speculative rather than informed, meaning the restriction removed harmful activity rather than useful market participation."
      },
      {
        "type": "practice",
        "text": "Based on this study, if a broker markets \"500:1 leverage available!\" as an unambiguous benefit, how would you respond to that claim using what you now know? What's the difference between what leverage lets you do and what it's actually wise to do?"
      },
      {
        "type": "practice",
        "text": "Put it into practice before using leverage: calculate your actual required margin and confirm your account can absorb realistic adverse moves without a margin call. Remember that leverage changes how much capital you need to open a position — it does not by itself determine how much you're risking; position sizing and stop-loss placement are what actually control that. And treat \"maximum available leverage\" marketing claims with real skepticism, since regulators cap leverage precisely because higher leverage is associated with worse trader outcomes, not better ones."
      }
    ],
    "quiz": [
      {
        "question": "You want to open a $50,000 EUR/USD position using 50:1 leverage. How much margin is required?",
        "options": [
          "$500",
          "$1,000",
          "$2,500",
          "$5,000"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — margin = position size ÷ leverage ratio = $50,000 ÷ 50 = $1,000.",
        "feedbackWrong": "Not quite — margin = position size ÷ leverage ratio = $50,000 ÷ 50 = $1,000."
      },
      {
        "question": "True or False: according to Heimer and Simsek's (2019) study, capping leverage for US retail forex traders had no measurable effect on trader outcomes.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — the study found the leverage cap reduced high-leverage traders' losses by approximately 40% and cut trading volume by 23% — a real, measured, causal effect, not a null result.",
        "feedbackWrong": "Not quite — the study found a real, measured effect: it reduced high-leverage traders' losses by roughly 40% and cut trading volume by 23%."
      }
    ],
    "keyTerms": [
      {
        "term": "Leverage",
        "def": "Borrowed buying power letting a trader control a position larger than their capital."
      },
      {
        "term": "Margin",
        "def": "The trader's own capital held as collateral for a leveraged position."
      },
      {
        "term": "Margin Level",
        "def": "Account equity relative to margin in use, as a percentage."
      },
      {
        "term": "Margin Call",
        "def": "A broker's demand for funds or forced closure when margin level falls too low."
      }
    ]
  },
  {
    "id": "order-types-and-trade-execution",
    "lessonNumber": 7,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: The Mechanics of a Trade",
    "title": "Order Types & Trade Execution",
    "keyIdea": "Each order type guarantees something different — execution, price, or neither — and a stop-loss guarantees only a trigger, not the fill price you set.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Foundations Chapter 2 introduced entry price, stop-loss, and take-profit as concepts. This lesson covers the actual order types that implement them."
      },
      {
        "type": "definition",
        "term": "Market Order",
        "text": "An instruction to buy or sell immediately at the best available current price. Guarantees execution. Does not guarantee price."
      },
      {
        "type": "definition",
        "term": "Limit Order",
        "text": "An instruction to buy or sell only at a specified price or better. Guarantees price. Does not guarantee execution — it may never fill if the market doesn't reach your level."
      },
      {
        "type": "definition",
        "term": "Stop Order",
        "text": "An order that sits inactive until price reaches a trigger level, at which point it becomes a market order. Once triggered, it carries a market order's guarantee: execution, not price."
      },
      {
        "type": "image",
        "svg": "forex-ch1-order-types-snb-case-study",
        "alt": "Diagram comparing order types and the SNB 2015 case study showing when stop-loss protection fails",
        "caption": "The order types side by side, plus the 2015 SNB case study showing when a stop-loss fails to protect."
      },
      {
        "type": "warning",
        "text": "That last point is easy to miss and matters enormously: a triggered stop order is not guaranteed to fill at your stop price. It's guaranteed to fill — at whatever price is actually available once it converts to a market order. In a fast-moving or illiquid market, those can be very different numbers. The slippage section below covers exactly how different."
      },
      {
        "type": "definition",
        "term": "Stop-Limit Order",
        "text": "A hybrid: once the stop price triggers, it becomes a limit order rather than a market order, giving you price control at the cost of a real chance it doesn't fill at all."
      },
      {
        "type": "example",
        "text": "A stop-limit sell at 1.0800 with a limit of 1.0795 will only execute between those two prices. If the market gaps straight through both levels, the order simply doesn't fill — you keep the position, for better or worse."
      },
      {
        "type": "definition",
        "term": "Trailing Stop",
        "text": "A stop-loss that automatically moves with the price as a trade becomes more profitable, locking in gains without requiring you to manually adjust it."
      },
      {
        "type": "example",
        "text": "You buy EUR/USD at 1.1050 with a 30-pip trailing stop. If price rises to 1.1080, your stop automatically rises to 1.1050 (breakeven). If price continues to 1.1120, your stop rises again to 1.1090 — now locking in 40 pips of profit even if price reverses. The stop only ever moves in your favor; it never moves back."
      },
      {
        "type": "definition",
        "term": "OCO (One-Cancels-the-Other) Order",
        "text": "Two linked orders — typically a take-profit and a stop-loss — where the execution of either one automatically cancels the other."
      },
      {
        "type": "example",
        "text": "You hold a position with a take-profit limit order at one price and a stop-loss order at another. Whichever level price reaches first executes; the other order is automatically removed. You don't have to manually cancel anything or monitor the position constantly."
      },
      {
        "type": "paragraph",
        "text": "This is standard practice for traders who can't watch a screen all day — the exit plan is built into the order itself, decided in advance, exactly the discipline Foundations Chapter 2 established as the foundation of real risk management."
      },
      {
        "type": "definition",
        "term": "Slippage",
        "text": "The difference between the price you expected an order to fill at and the price it actually filled at."
      },
      {
        "type": "paragraph",
        "text": "Most of the time, slippage is a minor, routine cost — a fraction of a pip here or there as prices move in the instant between your order and its execution. Academic research tracking real retail futures orders end-to-end, from submission to fill, found execution is generally fast and not systematically biased against retail traders, contrary to a common complaint that \"the system\" favors professionals."
      },
      {
        "type": "warning",
        "text": "But \"usually minor\" isn't \"always minor\" — and the exception matters enough to know in detail."
      },
      {
        "type": "example",
        "text": "On January 15, 2015, the Swiss National Bank unexpectedly removed a floor it had defended for over three years, promising to hold EUR/CHF at 1.20 \"with the utmost determination.\" Without warning, they abandoned it — and cut interest rates further into negative territory in the same announcement. EUR/CHF collapsed from 1.20 to as low as 0.85 within minutes. Every stop-loss order set anywhere near 1.20 triggered correctly and converted to a market order exactly as designed — but there was no buyer waiting nearby to fill them. Orders that should have closed near 1.19 or 1.15 instead filled at 0.90 or worse, if they filled at all. Alpari UK declared insolvency that same day. FXCM absorbed $225 million in client losses and needed an emergency bailout to survive. Many individual traders discovered they owed their broker more than their entire account balance, from a single trade."
      },
      {
        "type": "warning",
        "text": "This single event is the real-world reason \"negative balance protection\" — mentioned in Lesson 6 as a regulatory requirement in the EU, UK, and Australia — exists as a rule at all. A stop-loss order is a real risk-management tool, not a guarantee. In a genuine liquidity gap, it can fail to protect you at exactly the moment you need it most."
      },
      {
        "type": "practice",
        "text": "Given everything in this lesson: is the right response to this event \"never use a stop-loss, since it might not work,\" or something more precise? What role does position sizing (Lesson 5) play in surviving an event like this even when a stop-loss doesn't fill where expected?"
      },
      {
        "type": "practice",
        "text": "Put it into practice: before placing an order, know exactly what it guarantees — execution, price, or neither absolutely. Recognize which pairs carry unusual gap risk, since a pair tied to a central bank policy peg (like EUR/CHF was) can behave very differently from a normal floating pair. Confirm whether your broker offers negative balance protection before trading with real leverage. And remember that a rare, catastrophic event doesn't invalidate a risk-management tool — it's a reason position sizing and broker protections matter as a second layer, not a substitute for the first."
      }
    ],
    "quiz": [
      {
        "question": "Which order type guarantees execution but not price?",
        "options": [
          "Limit order",
          "Market order",
          "Stop-limit order",
          "OCO order"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — a market order fills immediately at whatever price is available: guaranteed execution, unguaranteed price. A triggered stop order carries this same guarantee once it converts.",
        "feedbackWrong": "Not quite — a market order fills immediately at whatever price is available: guaranteed execution, but not price."
      },
      {
        "question": "True or False: a standard stop-loss order guarantees your position will close at exactly the price you set, even during extreme volatility.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — the 2015 SNB event is the clearest possible proof: stop-losses triggered correctly but filled far from their set price because no liquidity was available nearby — a stop-loss guarantees a trigger, not a fill price.",
        "feedbackWrong": "Not quite — the 2015 SNB event proved the opposite: stop-losses triggered correctly but filled far from their set price. A stop-loss guarantees a trigger, not a fill price."
      }
    ],
    "keyTerms": [
      {
        "term": "Market Order",
        "def": "Executes immediately at the best available price."
      },
      {
        "term": "Limit Order",
        "def": "Executes only at a specified price or better."
      },
      {
        "term": "Stop Order",
        "def": "Becomes a market order once a trigger price is reached."
      },
      {
        "term": "Stop-Limit Order",
        "def": "Becomes a limit order (not market order) once triggered."
      },
      {
        "term": "Trailing Stop",
        "def": "A stop-loss that automatically moves in your favor as price moves."
      },
      {
        "term": "OCO Order",
        "def": "Two linked orders where one executing cancels the other."
      },
      {
        "term": "Slippage",
        "def": "The difference between expected and actual fill price."
      }
    ]
  },
  {
    "id": "technical-indicators-moving-averages-crossovers-macd",
    "lessonNumber": 1,
    "chapterNumber": 2,
    "chapterTitle": "Chapter 2: Reading the Forex Market",
    "title": "Technical Indicators I — Moving Averages, Crossovers & MACD",
    "keyIdea": "A technical indicator is computed entirely from price, so it can only make a pattern already in the chart easier to see — never reveal something the price doesn't already contain.",
    "blocks": [
      {
        "type": "definition",
        "term": "Technical Indicator",
        "text": "A calculation derived entirely from an instrument's price history and/or trading volume, plotted on or below a chart. It uses nothing else: no news, no economic data, no opinion — only the chart in front of you."
      },
      {
        "type": "paragraph",
        "text": "That definition contains the most important honest sentence in this entire chapter: an indicator can only ever highlight something that is already visible in price itself. Since every indicator is computed from the prices on your screen, it cannot know anything the chart doesn't already contain. The reason traders use them anyway is practical, not magical — a good indicator makes a pattern easier to see and act on consistently."
      },
      {
        "type": "warning",
        "text": "There are hundreds of indicators, and anyone can invent a new one — many are redundant or worthless. Piling many onto one chart doesn't add insight; it adds conflict. This mirrors a general principle from statistics: adding more and more weakly-informative variables to a prediction degrades it rather than improving it. Pick a small number of tools you genuinely understand. Fifteen out of twenty indicators \"agreeing\" means far less than it sounds like — many are computing near-identical things from the same prices."
      },
      {
        "type": "definition",
        "term": "Simple Moving Average (SMA)",
        "text": "The average of the last N closing prices, recalculated as each new period closes. Plotted as a line over the price chart."
      },
      {
        "type": "example",
        "text": "A 4-period SMA on a daily chart, with closes of 10, 11, 12, 14: the average is (10+11+12+14) ÷ 4 = 11.75. Next day the price drops to 9. The window slides: the oldest value (10) drops out, the new close (9) enters, and the new average is (11+12+14+9) ÷ 4 = 11.50. That sliding window is the entire mechanism — the average \"moves\" because its data window moves."
      },
      {
        "type": "paragraph",
        "text": "The window length is the whole personality of the indicator. In a short SMA (say 20 periods), each new candle is 1/20 of the data, so the line reacts quickly and hugs price. In a long SMA (say 50), each new candle is only 1/50 of the data, so the line is smoother and slower — it filters out noise at the cost of reacting late. Neither is \"better\"; they answer different questions: what has price done recently versus what has price done over the longer stretch."
      },
      {
        "type": "paragraph",
        "text": "For forex, a practical, widely-used pairing is the 20-period and 50-period SMA (stock traders often add the 200-day; that's a different market's convention). What a single SMA gives you is a cleaner read of the trend direction than raw candles — a downward-sloping 20 SMA says the last 20 periods have, on average, been falling."
      },
      {
        "type": "paragraph",
        "text": "A note on the exponential moving average (EMA): it's a variant that weights recent prices more heavily. Some traders prefer it; the simple version teaches the same concepts and is what this course uses. MACD (below) is built from EMAs — worth knowing the term exists."
      },
      {
        "type": "definition",
        "term": "Moving Average Crossover",
        "text": "A signal generated when a shorter-period moving average crosses a longer-period one. Short crossing above long = recent prices outperforming the longer stretch (buy signal). Short crossing below long = recent prices underperforming (sell signal)."
      },
      {
        "type": "paragraph",
        "text": "The logic is genuinely intuitive: if the 20-period average falls below the 50-period average, the last 20 periods were worse than the last 50 — recent momentum has turned down relative to the bigger picture. The crossover marks that shift."
      },
      {
        "type": "image",
        "svg": "forex-ch2-sma-crossover",
        "alt": "Diagram showing the SMA rolling-window calculation and a 20/50 crossover chart including a whipsaw losing trade",
        "caption": "The window slides one close at a time, and where the 20 crosses the 50 marks the signal — with the occasional whipsaw baked in."
      },
      {
        "type": "example",
        "text": "On a 4-hour NZD/USD chart with a 20 and 50 SMA: the 20 crosses below the 50 → enter short. Price falls; the 20 eventually crosses back above → close the short at a profit, and optionally go long. But the very next long gets stopped almost immediately when a large red candle drags the 20 back below the 50 — a small, quick loss. Then another short signal, another profitable leg. This sequence — several winning trades punctuated by small whipsaw losses — is what crossover trading actually looks like."
      },
      {
        "type": "warning",
        "text": "That losing trade in the middle is called a whipsaw, and it is not a malfunction — it's the known cost of the method. Crossovers work when price trends and bleed small losses when price moves sideways, because a flat market makes the two averages braid around each other, generating false signals. No setting eliminates this; risk management (Chapter 1, Lessons 5–7) is what makes the losses survivable and small relative to the trending wins."
      },
      {
        "type": "paragraph",
        "text": "What does the evidence say? One of the most-cited academic studies of technical analysis — Brock, Lakonishok & LeBaron (1992), Journal of Finance — tested exactly these moving-average rules on nearly a century of Dow Jones data and found they showed genuine predictive ability. But the follow-up literature matters just as much: later research questioned how well those results survive transaction costs and the risk of data-snooping (testing many rules and reporting the ones that happened to work). Meanwhile the recent FX-specific study you met in Foundations Chapter 3 — Ghanem et al. (2024), 497 rules, 10 currencies, 22 years — found technical rules do significantly predict currency movements. The honest summary: crossovers are one of the few indicator families with real academic support, and also one where the support comes with genuine caveats. Use them as a tool, not a truth."
      },
      {
        "type": "definition",
        "term": "MACD (Moving Average Convergence Divergence)",
        "text": "An indicator (created by Gerald Appel in the 1970s) that plots the difference between two exponential moving averages (typically 12- and 26-period), plus a 9-period \"signal line\" of that difference. When the MACD line crosses its signal line, that's the buy/sell trigger."
      },
      {
        "type": "paragraph",
        "text": "Here's the demystifying truth: MACD is measuring how two moving averages converge and diverge — which is exactly what you just learned to see directly on the chart with the 20/50 pair. When people talk about MACD crossovers, they're talking about the same underlying event as a moving-average crossover, expressed as an oscillating line below the chart instead of two lines on it. If you understand the crossover section, you already understand MACD. Some traders prefer its presentation (the histogram makes momentum shifts visually loud); others just read the averages directly. There is no extra information in it that the moving averages don't contain."
      },
      {
        "type": "practice",
        "text": "Pull up any major pair on a free charting tool, add a 20 and a 50 SMA, and scroll back through six months of history. Count the crossover signals. How many would have been profitable trades, and how many were whipsaws? Notice where the whipsaws cluster — trending stretches or sideways stretches?"
      },
      {
        "type": "practice",
        "text": "As you weigh a signal, run three checks: Is the market trending or ranging right now? Crossover signals earn their keep in trends and bleed in ranges. When one indicator \"confirms\" another, are they actually independent, or two calculations of the same thing (like MACD and an MA crossover)? And would you take this signal if the indicator weren't there — can you see the shift in raw price? If not, be suspicious."
      }
    ],
    "quiz": [
      {
        "question": "A 20-period SMA crosses below a 50-period SMA. What does this literally mean?",
        "options": [
          "The price is guaranteed to fall",
          "The average of the last 20 closes has dropped below the average of the last 50 closes",
          "Volume is declining",
          "The market is oversold"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — that's all a crossover is: recent average prices underperforming the longer-window average. It's read as a bearish shift, but it guarantees nothing.",
        "feedbackWrong": "Not quite — a crossover only means the last 20 closes now average below the last 50. It's read as bearish, but guarantees nothing about what price does next."
      },
      {
        "question": "True or False: MACD provides fundamentally different information than a moving average crossover.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — MACD is built from moving averages and measures their convergence/divergence, the same underlying event as a crossover, just presented differently. No indicator computed from price can contain information price doesn't.",
        "feedbackWrong": "Not quite — MACD is built from moving averages and measures the same convergence/divergence event as a crossover, only shown as a line below the chart."
      }
    ],
    "keyTerms": [
      {
        "term": "Technical Indicator",
        "def": "A calculation derived solely from price and/or volume, plotted on a chart."
      },
      {
        "term": "Simple Moving Average (SMA)",
        "def": "The average of the last N closes, recalculated each period."
      },
      {
        "term": "Moving Average Crossover",
        "def": "A signal from a short-period MA crossing a long-period MA."
      },
      {
        "term": "Whipsaw",
        "def": "A false crossover signal in a sideways market producing a quick small loss."
      },
      {
        "term": "MACD",
        "def": "The difference between two EMAs plus a signal line — a formalized crossover."
      }
    ]
  },
  {
    "id": "mean-reversion-bollinger-rsi-fibonacci",
    "lessonNumber": 2,
    "chapterNumber": 2,
    "chapterTitle": "Chapter 2: Reading the Forex Market",
    "title": "Mean Reversion & Levels — Bollinger Bands, RSI & Fibonacci",
    "keyIdea": "Mean-reversion tools bet a stretched price will snap back to its average — powerful when the market is ranging, but built on tidy bell-curve statistics that real prices routinely break.",
    "blocks": [
      {
        "type": "definition",
        "term": "Bollinger Bands",
        "text": "An indicator (developed by John Bollinger in the 1980s) consisting of a 20-period moving average with an upper and lower band drawn a set number of standard deviations above and below it — 2 by default."
      },
      {
        "type": "definition",
        "term": "Standard Deviation",
        "text": "A statistical measure of how spread out values are around their average. The more volatile the prices, the larger the standard deviation — so the bands automatically widen in volatile markets and tighten in calm ones."
      },
      {
        "type": "paragraph",
        "text": "The construction borrows a famous idea from statistics: in a normal distribution (the \"bell curve\"), about 68% of values fall within one standard deviation of the average, about 95% within two, and about 99.7% within three. Apply that to the last 20 closing prices, and bands at ±2 standard deviations \"should\" contain roughly 95% of price action — so a touch of the outer band suggests price is statistically stretched."
      },
      {
        "type": "example",
        "text": "The intuitive mean-reversion play: price touches the lower band (stretched low) → buy → exit at the middle band. Price touches the upper band (stretched high) → short → exit at the middle. Tighter bands (2 SD) give more frequent, earlier signals; wider bands (3 SD) give fewer, more extreme ones. This logic works best on instruments that genuinely oscillate around a mean — for example, currency pairs between similar, linked economies (CAD and AUD-style pairs), which tend to deviate and re-converge — and works badly on anything in a strong trend, where \"stretched\" just keeps stretching."
      },
      {
        "type": "image",
        "svg": "forex-ch2-meanreversion-evidence",
        "alt": "Diagram showing Bollinger Band construction with the normal distribution, the fat-tail reality, and RSI overbought/oversold zones with the wait-for-exit entry rule",
        "caption": "The bell curve the bands assume, the fat-tailed reality that breaks it, and RSI's wait-for-the-exit discipline, side by side."
      },
      {
        "type": "warning",
        "text": "Here's the honest problem, and it's a big one: financial prices do not actually follow a bell curve. This isn't a technicality — it's one of the most important findings in the history of finance. Benoit Mandelbrot demonstrated it in 1963 (\"The Variation of Certain Speculative Prices,\" Journal of Business 36, 394–419): real price changes have fat tails — extreme moves occur far, far more often than the normal distribution predicts. Moves the bell curve calls once-in-thousands-of-years events happen every few years. You've already met the perfect example: the 2015 EUR/CHF collapse from Chapter 1, Lesson 7 — a move so far outside the bands that the clean \"95% containment\" math becomes meaningless. Practical consequence: price will pierce your bands more often than the statistics imply, sometimes violently. Bollinger Bands remain a genuinely useful volatility-adaptive tool — but never size a position as if the 95% figure were literally true."
      },
      {
        "type": "definition",
        "term": "RSI (Relative Strength Index)",
        "text": "A momentum oscillator, introduced by J. Welles Wilder Jr. in his 1978 book New Concepts in Technical Trading Systems, that measures the relative size of recent gains versus recent losses over the last 14 periods, producing a value between 0 and 100."
      },
      {
        "type": "paragraph",
        "text": "The intuition: if recent up-candles are much larger than recent down-candles, buyers are dominating and RSI pushes toward 100. If down-candles dominate, RSI falls toward 0. (The precise formula averages the gains and losses of closing prices over 14 periods, but the candle intuition is faithful to what it measures.)"
      },
      {
        "type": "definition",
        "term": "Overbought / Oversold",
        "text": "Conventional RSI thresholds: above 70 = overbought (buying has been unusually one-sided), below 30 = oversold (selling has been unusually one-sided). More conservative traders use 80/20."
      },
      {
        "type": "warning",
        "text": "The single most important RSI discipline — and the mistake that costs beginners the most: do not buy simply because something is oversold, and do not short simply because it's overbought. Markets can stay overbought or oversold for a very long time while continuing in the same direction — an oversold currency can keep getting more oversold, day after day. Buying it on the way down is catching a falling knife with a statistics label on it."
      },
      {
        "type": "example",
        "text": "The disciplined version: wait for the RSI to exit the extreme zone. Price falls, RSI drops below 30 (oversold) — you wait. Only when RSI crosses back above 30 — meaning the selling pressure has actually broken — do you buy. Same mirrored for shorts: wait for RSI to fall back below 70 rather than shorting the moment it becomes overbought. You sacrifice a little of the move in exchange for confirmation that the reversal has actually begun, rather than betting that it will."
      },
      {
        "type": "definition",
        "term": "Fibonacci Sequence",
        "text": "The series 0, 1, 1, 2, 3, 5, 8, 13, 21... where each number is the sum of the previous two. Dividing a number by its successor converges to ≈0.618 — the \"golden ratio\" relationship; dividing by the number two positions later gives ≈0.382, and three later ≈0.236."
      },
      {
        "type": "definition",
        "term": "Fibonacci Retracement",
        "text": "A charting tool that stretches from a swing low to a swing high (or vice versa) and marks horizontal levels at 23.6%, 38.2%, 50%, 61.8%, and 78.6% of that move — proposed as likely places for a pullback (retracement) to pause or reverse before the trend resumes."
      },
      {
        "type": "paragraph",
        "text": "One honest detail worth knowing: the 50% level isn't a Fibonacci ratio at all. It's included by convention because prices are often observed to retrace about half a move — an observation going back to early Dow-era technical analysis — not because the sequence produces it. (The ratios do have genuinely elegant mathematical relationships — √0.382 ≈ 0.618, √0.618 ≈ 0.786 — which is part of the tool's aesthetic appeal.)"
      },
      {
        "type": "paragraph",
        "text": "How traders use it: in an uptrend you expect to continue, rather than buying immediately, you wait for the pullback and place staggered orders at the retracement levels — for example, part of your position at 38.2%, more at 50%, the rest at 61.8% — expecting a bounce from one of them. Scaling in across levels like this is sometimes called pyramid entry."
      },
      {
        "type": "warning",
        "text": "Now the evidence — because Fibonacci retracements are exactly the kind of widely-repeated claim this course has taught you to check. The research is genuinely mixed, and knowing the shape of that disagreement is more useful than either blind faith or blanket dismissal. As early as 1977, Arthur Merrill's systematic study of market swings found no reliably standard retracement level. A rigorous 2021 study in Expert Systems with Applications built an algorithm to detect retracements objectively across Dow Jones, NASDAQ, and DAX stocks and found prices do bounce at Fibonacci levels somewhat more often than at arbitrary levels — but the authors explicitly note this doesn't necessarily translate into a profitable trading strategy. And multiple reviews find that standalone Fibonacci levels perform about as well as random levels, improving only when combined with independent evidence like support/resistance or trend. The most defensible reading: Fibonacci levels work partly because thousands of traders watch the same levels and place orders there — a self-fulfilling coordination point, not market magic. Treat them as zones where a reaction is plausible and other traders are paying attention — never as a guarantee, and never as a standalone system."
      },
      {
        "type": "paragraph",
        "text": "Step back from the individual tools and the deeper pattern of this chapter emerges:"
      },
      {
        "type": "definition",
        "term": "Mean Reversion",
        "text": "A trading approach betting that a stretched price will return toward its average. Bollinger Bands and RSI are mean-reversion tools. Crossovers (Lesson 1) are the opposite — trend-following tools, betting that movement will continue."
      },
      {
        "type": "paragraph",
        "text": "These two families make opposite bets. A mean-reversion tool in a strong trend loses repeatedly (\"it's stretched!\" — it stretches further). A trend-following tool in a sideways market whipsaws to death. Neither tool is broken in those moments — it's being asked the wrong question. Diagnosing which kind of market you're in is the judgment that sits above every indicator, and no indicator can make it for you — which is exactly where this chapter goes next."
      },
      {
        "type": "practice",
        "text": "Pull up two charts: one in an obvious strong trend, one moving sideways in a range. Apply Bollinger Bands to both. Count how many lower-band touches would have been profitable mean-reversion buys on each chart. The difference you'll see is this lesson's core point."
      },
      {
        "type": "practice",
        "text": "As you apply these tools, keep four checks in mind: Is the instrument actually ranging, or trending? The same signal means opposite things in the two regimes. When any tool invokes probability (\"95% of price action stays inside the bands\"), remember fat tails — markets break statistical containment far more often than the bell curve promises. With RSI, the signal isn't entering the extreme zone, it's exiting it. And when a level \"works,\" ask why: genuine market structure, or many traders watching the same line? Both are tradeable, but the second can evaporate."
      }
    ],
    "quiz": [
      {
        "question": "According to the RSI discipline in this lesson, when is the higher-quality moment to buy an oversold currency?",
        "options": [
          "The instant RSI drops below 30",
          "When RSI crosses back above 30 after being oversold",
          "Whenever RSI is below 50",
          "RSI cannot be used for buy decisions"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — entering the oversold zone shows one-sided selling; exiting it shows that pressure has actually broken. Waiting for the exit trades a little upside for real confirmation — markets can stay oversold far longer than your account can stay solvent.",
        "feedbackWrong": "Not quite — dropping below 30 only shows one-sided selling. The higher-quality signal is RSI crossing back above 30, confirming the selling pressure has actually broken."
      },
      {
        "question": "True or False: because Bollinger Bands are set at 2 standard deviations, there is genuinely only about a 5% chance of price moving outside them.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — that figure assumes prices follow a normal distribution, and Mandelbrot's 1963 research established that real financial prices have fat tails: extreme moves far outside the bands occur much more often than the bell curve predicts. The 2015 EUR/CHF collapse is the textbook example.",
        "feedbackWrong": "Not quite — the 5% figure assumes a normal distribution. Real prices have fat tails (Mandelbrot, 1963), so they break outside the bands far more often, as the 2015 EUR/CHF collapse showed."
      }
    ],
    "keyTerms": [
      {
        "term": "Bollinger Bands",
        "def": "A 20-period MA with bands ±2 standard deviations, widening with volatility."
      },
      {
        "term": "Standard Deviation",
        "def": "A measure of how spread out values are around their average."
      },
      {
        "term": "Fat Tails",
        "def": "The reality that extreme price moves occur far more often than the bell curve predicts."
      },
      {
        "term": "RSI",
        "def": "Wilder's 0–100 oscillator measuring recent gains vs. losses over 14 periods."
      },
      {
        "term": "Overbought / Oversold",
        "def": "RSI above 70 / below 30 — one-sided recent buying or selling."
      },
      {
        "term": "Fibonacci Retracement",
        "def": "Levels at 23.6/38.2/50/61.8/78.6% of a move, watched as pullback zones."
      },
      {
        "term": "Mean Reversion",
        "def": "Betting a stretched price returns to its average — the opposite of trend-following."
      }
    ]
  },
  {
    "id": "fundamental-analysis-interest-rates-central-banks",
    "lessonNumber": 3,
    "chapterNumber": 2,
    "chapterTitle": "Chapter 2: Reading the Forex Market",
    "title": "Fundamental Analysis — Interest Rates & Central Banks",
    "keyIdea": "Interest-rate decisions are the biggest fundamental driver of a currency, but price moves on the surprise versus expectations — and even the textbook \"higher rates strengthen a currency\" rule is contradicted by decades of evidence.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Everything in this chapter so far — moving averages, Bollinger Bands, RSI, Fibonacci — has been technical analysis: reading price itself. This lesson introduces the opposite lens."
      },
      {
        "type": "definition",
        "term": "Fundamental Analysis",
        "text": "Evaluating a currency based on the underlying economic forces that drive its value — interest rates, inflation, growth, employment, and central bank policy — rather than on chart patterns."
      },
      {
        "type": "paragraph",
        "text": "Technical analysis asks \"what is price doing?\" Fundamental analysis asks \"why would price move at all?\" Neither replaces the other — many traders use technicals for timing and fundamentals for direction. And for currencies specifically, one fundamental force sits above all others."
      },
      {
        "type": "paragraph",
        "text": "Foundations Chapter 1 introduced central banks historically (the Bank of England, 1694; the Fed). Here's why they matter to a trader every single week."
      },
      {
        "type": "definition",
        "term": "Central Bank",
        "text": "The institution responsible for a nation's monetary system: issuing currency, overseeing commercial banks, managing reserves, acting as lender of last resort, and — most importantly for traders — setting monetary policy to balance inflation against growth and employment."
      },
      {
        "type": "paragraph",
        "text": "The eight central banks tied to the most-traded currencies: the US Federal Reserve (USD), European Central Bank (EUR), Bank of England (GBP), Bank of Japan (JPY), Swiss National Bank (CHF), Bank of Canada (CAD), Reserve Bank of Australia (AUD), and Reserve Bank of New Zealand (NZD). When any of these speaks, its currency can move sharply."
      },
      {
        "type": "definition",
        "term": "Base Interest Rate",
        "text": "The rate a central bank sets as its primary policy tool. It ripples through the whole economy: it's effectively the price of money, shaping what banks charge for loans and pay on savings."
      },
      {
        "type": "paragraph",
        "text": "The balancing act, echoing Foundations Chapter 2's inflation lesson: raise rates to cool an overheating economy and fight inflation; lower rates to encourage borrowing and spending when growth stalls. Too fast, and inflation erodes the currency; too slow, and unemployment rises."
      },
      {
        "type": "paragraph",
        "text": "Here's the textbook transmission chain, and it follows directly from supply and demand:"
      },
      {
        "type": "image",
        "svg": "forex-ch2-central-banks-rates",
        "alt": "Diagram showing the interest-rate-to-currency transmission chain, hawkish vs dovish stances, and the academic complication from the forward premium puzzle",
        "caption": "Higher rates are supposed to pull in foreign demand and lift a currency — the clean chain the evidence then complicates."
      },
      {
        "type": "paragraph",
        "text": "When a central bank raises rates, that currency offers investors a higher return. To capture it, foreign investors must buy that currency — raising demand, and with it, the price. So the standard expectation is: higher rates → currency appreciates; lower rates → currency depreciates. This is the single most-cited relationship in forex fundamental analysis."
      },
      {
        "type": "example",
        "text": "This is also why a rate cut — or even a signal of future cuts — can weaken a currency. If the Fed unexpectedly holds rates low when markets expected a hike, the dollar often falls, because the anticipated demand boost doesn't arrive. In a pair like GBP/USD, a falling USD (the quote currency) pushes the pair up."
      },
      {
        "type": "paragraph",
        "text": "Traders rarely wait for the actual announcement. They read the language and the personalities."
      },
      {
        "type": "definition",
        "term": "Hawkish / Dovish",
        "text": "A hawkish stance favours higher interest rates to fight inflation; a dovish stance favours lower rates to promote growth. Individual policymakers, and a central bank's overall tone, are described this way."
      },
      {
        "type": "warning",
        "text": "The single most important nuance in this entire lesson: an expected rate move is usually \"priced in\" before it happens. If the whole market already expects a hike, the currency has largely already moved by the time the announcement lands. The big, violent moves come from surprises — when a central bank confounds expectations. This is why two traders can watch the same rate hike and see the currency fall: if the market expected an even larger hike, the \"smaller than expected\" hike is effectively dovish. You're not trading the rate. You're trading the gap between the decision and what was already expected."
      },
      {
        "type": "definition",
        "term": "Carry Trade",
        "text": "A strategy of borrowing (or selling) a low-interest-rate currency to buy a high-interest-rate one, aiming to pocket the interest rate difference — provided the exchange rate doesn't move enough to wipe out that gain."
      },
      {
        "type": "paragraph",
        "text": "Here's where this course's habit of checking the textbook against real evidence pays off. The clean \"higher rates → stronger currency\" story runs into one of the most famous anomalies in all of financial economics."
      },
      {
        "type": "definition",
        "term": "Uncovered Interest Parity (UIP)",
        "text": "The economic theory that a currency with higher interest rates should depreciate over time by exactly enough to cancel out its interest advantage — so that, in theory, there's no free profit in simply chasing high-rate currencies."
      },
      {
        "type": "paragraph",
        "text": "UIP is the elegant theory. The data says something startlingly different:"
      },
      {
        "type": "warning",
        "text": "Decades of evidence show UIP fails badly over short horizons — and fails in the opposite direction to what it predicts. Rather than depreciating, high-interest-rate currencies have historically tended to keep appreciating in the short run. Economist Eugene Fama documented this in 1984, and it's been known ever since as the \"forward premium puzzle\" (or \"Fama puzzle\") — described in the literature as one of the most robust empirical regularities in international finance. In plain terms: the simple story isn't just imperfect, the real world has often done the reverse of what the clean theory predicts."
      },
      {
        "type": "paragraph",
        "text": "This isn't an academic footnote — it's why the carry trade has historically made money at all. If high-rate currencies fell as UIP predicts, carry trades wouldn't work. They've worked precisely because the theory fails. But there's a sting in the tail:"
      },
      {
        "type": "example",
        "text": "Menkhoff, Sarno, Schmeling & Schrimpf (2012), published in The Journal of Finance, showed that carry trade returns are strongly tied to global foreign-exchange volatility. The strategy earns steady profits in calm periods — then suffers sharp, correlated losses precisely when global volatility spikes (crises, panics). In other words, carry trade returns behave like compensation for taking on crash risk, not a free lunch. The interest edge is real, but you're being paid to hold a currency that can drop violently at the worst possible moment — a direct, real-world echo of the fat-tails warning from Lesson 2 and the SNB collapse from Chapter 1."
      },
      {
        "type": "paragraph",
        "text": "The honest takeaway, and the reason this lesson matters: \"higher rates strengthen a currency\" is a genuinely useful starting instinct — but it is not a reliable mechanical rule. Whether a move is already priced in, which direction the surprise breaks, and what global volatility is doing can all override it. Fundamentals tell you where pressure is building; they don't hand you a guaranteed outcome."
      },
      {
        "type": "practice",
        "text": "Around any central bank meeting, hold these habits: ask not \"will they hike?\" but \"what does the market already expect, and what would surprise it?\" Watch for hawkish/dovish language in policymaker speeches between meetings — markets move on these long before any decision. When you hear \"high interest rates mean a strong currency,\" remember the forward premium puzzle: true as an instinct, unreliable as a rule. And treat carry-trade interest income as compensation for real crash risk, not free money — size positions accordingly (Chapter 1, Lesson 5)."
      }
    ],
    "quiz": [
      {
        "question": "The market strongly expects a central bank to raise rates by 0.5%. The bank raises by only 0.25%. What's the most likely reaction in that currency?",
        "options": [
          "It rises sharply, because rates went up",
          "It may fall, because the hike was smaller than expected (\"dovish surprise\")",
          "Nothing changes, because rates rose as predicted",
          "It always depends only on the raw rate, not expectations"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — a smaller-than-expected hike is effectively dovish relative to expectations. Markets trade the surprise, not the raw decision — a hike can weaken a currency if a bigger hike was already priced in.",
        "feedbackWrong": "Not quite — markets trade the surprise, not the raw decision. A hike smaller than expected is effectively a dovish surprise and can weaken the currency."
      },
      {
        "question": "True or False: the \"forward premium puzzle\" refers to the empirical finding that high-interest-rate currencies reliably depreciate, exactly as Uncovered Interest Parity predicts.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — it's the opposite: the puzzle is that UIP fails, with high-rate currencies historically tending to keep appreciating in the short run, contradicting the theory. Eugene Fama documented it in 1984.",
        "feedbackWrong": "Not quite — the puzzle is the reverse. UIP fails: high-rate currencies have tended to keep appreciating in the short run, contradicting the theory (Fama, 1984)."
      }
    ],
    "keyTerms": [
      {
        "term": "Fundamental Analysis",
        "def": "Evaluating a currency by underlying economic forces, not chart patterns."
      },
      {
        "term": "Base Interest Rate",
        "def": "A central bank's primary policy tool — effectively the price of money."
      },
      {
        "term": "Hawkish / Dovish",
        "def": "Favouring higher rates (to fight inflation) / lower rates (to boost growth)."
      },
      {
        "term": "Carry Trade",
        "def": "Borrowing a low-rate currency to buy a high-rate one, to earn the rate difference."
      },
      {
        "term": "Uncovered Interest Parity",
        "def": "The theory that high-rate currencies should depreciate to cancel their rate advantage."
      },
      {
        "term": "Forward Premium Puzzle",
        "def": "The robust empirical finding that UIP fails — high-rate currencies often appreciate instead."
      }
    ]
  },
  {
    "id": "the-economic-calendar",
    "lessonNumber": 4,
    "chapterNumber": 2,
    "chapterTitle": "Chapter 2: Reading the Forex Market",
    "title": "The Economic Calendar — What to Watch, and When",
    "keyIdea": "Because market-moving events are scheduled, the economic calendar tells you in advance when a currency is likely to move — and price reacts to the gap between the forecast and the actual number, not to the event itself.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Lesson 3 ended on a specific idea: markets trade the surprise, not the raw decision. The economic calendar is the tool that makes that idea usable in practice."
      },
      {
        "type": "definition",
        "term": "Economic Calendar",
        "text": "A schedule of upcoming economic data releases and policy announcements, listing the time, the currency affected, the expected impact, and the market's forecast for each."
      },
      {
        "type": "paragraph",
        "text": "Because these events are scheduled, you know in advance when a currency is likely to move violently. That's an unusual gift in trading — most risk arrives unannounced. Several free calendars cover this well: ForexFactory, Investing.com, TradingEconomics, DailyFX, and MarketWatch all publish essentially the same underlying schedule with different interfaces."
      },
      {
        "type": "warning",
        "text": "Checking the calendar isn't an advanced technique — it's basic hygiene, like checking the weather before sailing. Any good trader looks at it every single day, before anything else, to know whether the currencies they're holding have a scheduled event coming."
      },
      {
        "type": "image",
        "svg": "forex-ch2-economic-calendar",
        "alt": "Diagram showing how to read each column of an economic calendar entry, the impact colour coding, the research on announcement surprises, and the beginner workflow",
        "caption": "How to read a calendar entry, and why the surprise — not the event — is what moves price."
      },
      {
        "type": "paragraph",
        "text": "Every entry gives you the same core fields. Time — when the data drops, usually to the minute; currency pairs can move within seconds of it. Currency — which currency the event affects; critically, check both sides of your pair, because a EUR event moves EUR/USD just as surely as a USD event does. Impact — a colour-coded severity rating (typically yellow = low, orange = medium, red = high). Actual / Forecast / Previous — the released number, what analysts expected, and last period's reading."
      },
      {
        "type": "definition",
        "term": "Forecast (Consensus)",
        "text": "The market's aggregated expectation for an upcoming data release, compiled from economists' and analysts' predictions. It's the benchmark the actual number gets judged against."
      },
      {
        "type": "example",
        "text": "A calendar shows: 10:00am, CAD, HIGH impact, \"Overnight Rate,\" Forecast 1.75%, Previous 1.75%. That tells you a lot before anything happens. The forecast matches the previous rate, so no change is expected — if the actual lands at 1.75%, the reaction is likely muted, because it's already priced in. But if the Bank of Canada surprises and hikes, every CAD pair can move sharply within seconds. Same event, wildly different outcomes, decided entirely by the gap between actual and forecast."
      },
      {
        "type": "paragraph",
        "text": "Most calendars let you click through for detail: the source institution, what the indicator measures, why traders care, and the historical record of actual-vs-forecast. That history is genuinely useful — it shows you whether a given release tends to surprise or reliably lands on consensus."
      },
      {
        "type": "paragraph",
        "text": "This is one of those claims that gets repeated everywhere in trading education. Unusually, it's also been rigorously tested — and it holds up."
      },
      {
        "type": "example",
        "text": "Andersen, Bollerslev, Diebold & Vega (2003), published in the American Economic Review, examined six years of real-time exchange rate quotes alongside the matching macroeconomic expectations and actual realizations, across the dollar versus the German mark, pound, yen, Swiss franc, and euro. Their central finding: announcement surprises — the divergence between what was expected and what arrived — produce immediate jumps in exchange rates. Not the announcements themselves. The gap between expectation and reality is what moves price, confirming with high-frequency data exactly what Lesson 3 argued."
      },
      {
        "type": "warning",
        "text": "The market reacts asymmetrically: bad news moves prices more than equally-sized good news. A disappointing number tends to produce a bigger move than an equally-surprising positive one. Practically, this means downside surprises deserve more respect than upside ones when you're judging how much room to give an event — and it's another quiet echo of the fat-tails theme from Lesson 2 and the SNB collapse in Chapter 1."
      },
      {
        "type": "paragraph",
        "text": "Not every red entry is equal. The events that most reliably move currencies: central bank rate decisions (Fed FOMC, ECB, BoE, BoJ), the highest-impact events in forex; inflation data (CPI), because it shapes what the central bank does next; employment data, especially US Non-Farm Payrolls (NFP), released monthly; GDP releases, the broad growth picture; and central bank speeches and minutes, often as market-moving as decisions themselves, since traders parse them for hawkish/dovish hints."
      },
      {
        "type": "paragraph",
        "text": "Notice the pattern: nearly everything on that list matters because it changes expectations about future interest rates. Short-term rates are the dominant factor in currency valuation, and most other indicators are watched mainly as clues to where rates are heading."
      },
      {
        "type": "warning",
        "text": "While you're learning, the correct move around high-impact events is simple: don't be in the trade. Not because you can't ever trade news, but because you have no personal evidence yet for how a given event behaves — and an event that gaps the market is exactly where a stop-loss can fail to protect you (Chapter 1, Lesson 7)."
      },
      {
        "type": "paragraph",
        "text": "But avoidance alone wastes the opportunity. The genuinely valuable habit is to watch the events you're sitting out."
      },
      {
        "type": "practice",
        "text": "Pick one high-impact event this week on a pair you follow. Before it lands, note the forecast. When the actual arrives, record: (1) was it a surprise, and in which direction? (2) where was price 5 minutes later? (3) 1 hour later? (4) the next day? Do this for a few events and you'll have something no article can give you — your own evidence base for how that specific release behaves. That's how you earn the right to trade news later, rather than guessing."
      },
      {
        "type": "paragraph",
        "text": "This is the same principle from Foundations Chapter 3: build your judgement from evidence you've actually verified, not from claims you've been handed."
      },
      {
        "type": "practice",
        "text": "When you use the calendar: check it for both currencies in your pair, not just the one you're focused on; compare forecast against previous before the release, since that gap shows what's already priced in; give downside surprises extra respect, because the research says bad news hits harder; and keep a personal log of how specific events behave, because your own data beats generic advice."
      }
    ],
    "quiz": [
      {
        "question": "A calendar shows a high-impact event with Forecast 1.75% and Previous 1.75%. The actual arrives at exactly 1.75%. What's the most likely currency reaction?",
        "options": [
          "A large move upward, because rates are high",
          "A large move downward",
          "A relatively muted reaction, because the result matched expectations",
          "The currency always moves sharply on high-impact events regardless of the number"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — no surprise means the outcome was already priced in. Big moves come from the gap between actual and forecast, not from the event happening.",
        "feedbackWrong": "Not quite — the actual matched the forecast, so there's no surprise. Big moves come from the gap between actual and forecast, not from the event itself."
      },
      {
        "question": "True or False: Andersen, Bollerslev, Diebold & Vega (2003) found that markets respond symmetrically — good and bad news of equal size move prices by equal amounts.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — they documented a sign effect: bad news has a greater impact than good news of comparable magnitude.",
        "feedbackWrong": "Not quite — Andersen, Bollerslev, Diebold & Vega (2003) found an asymmetry: bad news moves prices more than equally-sized good news."
      }
    ],
    "keyTerms": [
      {
        "term": "Economic Calendar",
        "def": "A schedule of upcoming data releases and policy announcements, with expected impact."
      },
      {
        "term": "Forecast (Consensus)",
        "def": "The market's aggregated expectation for a release — the benchmark the actual is judged against."
      },
      {
        "term": "Announcement Surprise",
        "def": "The gap between the forecast and the actual result — what actually moves price."
      },
      {
        "term": "Non-Farm Payrolls (NFP)",
        "def": "Monthly US employment release; one of the highest-impact scheduled events in forex."
      }
    ]
  },
  {
    "id": "multi-timeframe-analysis",
    "lessonNumber": 5,
    "chapterNumber": 2,
    "chapterTitle": "Chapter 2: Reading the Forex Market",
    "title": "Multi-Timeframe Analysis",
    "keyIdea": "Read the same pair across three timeframes in a fixed top-down order — direction, then setup, then entry — instead of shopping charts for the one that agrees with the trade you already want.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Here's a situation every new trader hits. You spot a clean uptrend on the 15-minute chart, go long — and the trade immediately dies. You pull up the daily chart and discover the pair has been in a steady downtrend for three weeks. Your \"uptrend\" was a small bounce inside a much larger fall."
      },
      {
        "type": "paragraph",
        "text": "Nothing was wrong with your chart reading. You were reading a chart that couldn't answer the question you were asking."
      },
      {
        "type": "definition",
        "term": "Multi-Timeframe Analysis (MTFA)",
        "text": "Examining the same currency pair across several chart timeframes to understand both the broader trend and the immediate price action before committing to a trade."
      },
      {
        "type": "warning",
        "text": "A single timeframe gives you an incomplete picture by construction. A 5-minute chart cannot show you a three-month trend, and a weekly chart cannot show you a good entry price. These aren't competing views to pick between — they're different questions, and you need all of them answered in the right order."
      },
      {
        "type": "paragraph",
        "text": "The order is the entire technique. You move from slowest to fastest, and each timeframe has exactly one job."
      },
      {
        "type": "image",
        "svg": "forex-ch2-multi-timeframe",
        "alt": "Diagram showing the three-timeframe top-down workflow, the rule of four for choosing timeframes, and the data-snooping caution against timeframe-shopping",
        "caption": "The top-down workflow: long-term sets direction, medium-term finds the setup, short-term times the entry."
      },
      {
        "type": "paragraph",
        "text": "Step 1 — Long-term chart: establish direction. Weekly or daily. This filters out short-term noise and shows the dominant trend plus major support and resistance (Foundations Ch3, Lesson 1). Whatever this chart says, that's the direction you're permitted to trade. Decide it here, before looking at anything faster."
      },
      {
        "type": "paragraph",
        "text": "Step 2 — Medium-term chart: find the setup. Typically 4-hour or 1-hour. This is your main working chart, and it should roughly match how long you actually hold trades. You're looking for a setup that agrees with the direction established in Step 1. If nothing agrees, there is no trade — that's a valid, complete outcome."
      },
      {
        "type": "paragraph",
        "text": "Step 3 — Short-term chart: time the entry. 15-minute or 5-minute. This is only for execution: pinpointing entry and placing a tighter stop-loss. It never decides direction."
      },
      {
        "type": "example",
        "text": "Daily chart: EUR/USD in a clear uptrend, higher highs and higher lows. Direction established — you're looking for longs only. Down to the 1-hour: price has pulled back to a support level that held twice before. That's a setup consistent with the daily trend. Down to the 15-minute: you wait for price to stop falling and turn up, then enter — with your stop just below that support level. Because the 15-minute chart let you enter close to your invalidation point, your stop distance is smaller, which by the position-sizing formula from Chapter 1, Lesson 5 means you can take a properly sized position for the same fixed dollar risk."
      },
      {
        "type": "paragraph",
        "text": "That last point is worth making explicit: a sharper entry doesn't just feel better — it mathematically reduces the distance to your stop, which is a direct input to how much you're risking. MTFA isn't just about being right more often; it's about being wrong more cheaply."
      },
      {
        "type": "definition",
        "term": "The Rule of Four",
        "text": "A convention for selecting complementary timeframes: choose your medium-term chart first (it should reflect your typical holding period), then set the long-term at roughly four times that interval, and the short-term at roughly a quarter of it."
      },
      {
        "type": "example",
        "text": "Medium = 1-hour → long = 4-hour, short = 15-minute. Medium = daily → long = weekly, short = 4-hour. The exact multiplier isn't sacred (some traders use six), but the principle is: each timeframe should be far enough apart to tell you something genuinely different."
      },
      {
        "type": "paragraph",
        "text": "Why three, specifically? Fewer than three and you lose context — you end up trading against a trend you can't see. More than three and you get contradictory signals, over-analysis, and paralysis. This is the same trap Lesson 1 warned about with indicators: more inputs is not more insight."
      },
      {
        "type": "paragraph",
        "text": "There's a failure mode specific to this technique, and it's worth naming clearly because it feels like diligence."
      },
      {
        "type": "warning",
        "text": "Timeframe-shopping is cycling through charts until you find one that agrees with a trade you already want to make. If the daily says down, the 4-hour says down, and the 9-minute says up — and you take the long — you haven't done multi-timeframe analysis. You've searched a set of options for the answer you wanted. The direction of travel must be top-down, decided in sequence, and you have to accept the answer the higher timeframe gives you."
      },
      {
        "type": "paragraph",
        "text": "That failure has a formal name in the research literature, and a famous cautionary study:"
      },
      {
        "type": "example",
        "text": "Sullivan, Timmermann & White (1999), published in The Journal of Finance, examined the data-snooping problem directly: they took a huge universe of technical trading rules and tested them against 100 years of daily Dow Jones data. The best-performing rule genuinely did beat the benchmark over the original sample period, even after statistically accounting for data-snooping. But when they applied that same best rule to the following ten years of out-of-sample data, it failed to outperform. The rule hadn't found a durable truth about markets — it had found a pattern that fit the data it was selected on."
      },
      {
        "type": "definition",
        "term": "Data Snooping",
        "text": "The error of searching a large set of possibilities for one that fits your data, then treating the winner as a genuine discovery — when it may just be the best-fitting coincidence."
      },
      {
        "type": "paragraph",
        "text": "Timeframe-shopping is that exact error in miniature: you search a set of charts for the one that fits your bias, then treat it as confirmation. The discipline of a fixed, pre-chosen sequence exists precisely to stop you from doing this."
      },
      {
        "type": "warning",
        "text": "None of this means MTFA doesn't work. Ghanem, Harasheh, Sbaih & Ajmal (2024) — the same study cited back in Foundations Chapter 3 — found that technical analysis can be effective across multiple timeframes, from daily to weekly. The point is narrower and more useful: the method has support; the shopping does not. Choose your timeframes in advance and hold yourself to them."
      },
      {
        "type": "practice",
        "text": "As you apply MTFA: always start on the highest timeframe, and if you catch yourself opening the 5-minute chart first, stop and go back up; if the higher timeframe disagrees with the trade you want, the correct action is no trade, not a smaller timeframe; fix your three timeframes before you start looking and don't change them mid-analysis to justify an entry; and notice that a better entry shrinks your stop distance — a direct, quantifiable benefit, not just a feeling."
      }
    ],
    "quiz": [
      {
        "question": "Using the rule of four, if your medium-term chart is the 1-hour, which pair of timeframes best completes the set?",
        "options": [
          "30-minute and 2-hour",
          "15-minute and 4-hour",
          "5-minute and 1-hour",
          "1-minute and weekly"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — 15-minute and 4-hour. The short-term is roughly a quarter of the medium (60 ÷ 4 = 15) and the long-term roughly four times it (60 × 4 = 240 minutes = 4 hours).",
        "feedbackWrong": "Not quite — by the rule of four the short-term is about a quarter of the medium and the long-term about four times it: 15-minute and 4-hour."
      },
      {
        "question": "True or False: if your daily chart shows a downtrend but the 15-minute shows an uptrend, the correct move is to take the long trade because the shorter timeframe is more current.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — that's timeframe-shopping. The higher timeframe sets the direction you're permitted to trade; the short-term chart is only for timing entries in that established direction.",
        "feedbackWrong": "Not quite — taking the long there is timeframe-shopping. The higher timeframe sets the permitted direction; the short-term chart only times the entry."
      }
    ],
    "keyTerms": [
      {
        "term": "Multi-Timeframe Analysis",
        "def": "Examining one pair across several chart timeframes before committing to a trade."
      },
      {
        "term": "The Rule of Four",
        "def": "Choosing the medium timeframe first, then long ≈ ×4 and short ≈ ÷4."
      },
      {
        "term": "Timeframe-Shopping",
        "def": "Searching charts until one agrees with a trade you already wanted — a bias, not a method."
      },
      {
        "term": "Data Snooping",
        "def": "Searching many possibilities for one that fits your data, then mistaking it for a real discovery."
      }
    ]
  },
  {
    "id": "price-action-trading-from-the-chart-alone",
    "lessonNumber": 6,
    "chapterNumber": 2,
    "chapterTitle": "Chapter 2: Reading the Forex Market",
    "title": "Price Action — Trading From the Chart Alone",
    "keyIdea": "Price action reads the raw chart without indicators — and the evidence is strong for support and resistance (they have a real order-flow cause) but weak and contested for candlestick patterns.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Every lesson in this chapter so far has added a tool on top of the chart: moving averages, MACD, Bollinger Bands, RSI, Fibonacci levels. Price action trading goes the other way. It strips all of that off and reads the raw price movement directly."
      },
      {
        "type": "definition",
        "term": "Price Action",
        "text": "An approach to trading that bases decisions on the movement of price itself — its highs, lows, and the shapes it forms — without using indicators derived from that price."
      },
      {
        "type": "definition",
        "term": "Naked Chart",
        "text": "A price chart carrying no indicators at all: just the candles, and often a few hand-drawn support and resistance lines. The name signals what has been removed."
      },
      {
        "type": "paragraph",
        "text": "The practitioner slogan for this school is \"price is king.\" Its followers argue that indicators lag, clutter the screen, and distract from the only thing that actually settles a trade — the price. So they trade from a naked chart instead."
      },
      {
        "type": "paragraph",
        "text": "Here is the honest part, and it connects straight back to Lesson 1. You learned there that an indicator can only ever highlight something already visible in price, because every indicator is computed from price and nothing else. Price action traders take that same fact to its logical end: if the indicator only echoes the price, read the price directly and skip the echo. The philosophy is not mystical. It is the Lesson 1 principle, followed one step further."
      },
      {
        "type": "warning",
        "text": "\"Price is king\" is itself a claim, and this course does not accept claims because they sound confident. Reading a naked chart removes indicator clutter, but it does not remove the hard problem — deciding what the price is likely to do next. The rest of this lesson tests where that decision has real evidence behind it and where it does not."
      },
      {
        "type": "paragraph",
        "text": "Price action reading rests on three things you have largely met already. This lesson assembles them into one method rather than re-teaching them."
      },
      {
        "type": "paragraph",
        "text": "Support and resistance. You met these in Foundations Chapter 3, Lesson 1: support is a level where falling prices have repeatedly reversed upward, and resistance is a level where rising prices have repeatedly reversed downward. On a naked chart these levels are the primary map. A price-action trader marks them and watches how price behaves as it approaches."
      },
      {
        "type": "paragraph",
        "text": "Market structure. This is just the shape of the trend, also from Foundations Chapter 3: an uptrend is a series of higher highs and higher lows, a downtrend a series of lower highs and lower lows. Each recent high or low is a swing point — a local peak or trough. When price stops making higher highs and starts making lower lows, the structure has shifted. That shift, read from the bare chart, is the price-action trader's core signal."
      },
      {
        "type": "paragraph",
        "text": "Candlestick patterns. These are the finest-grained tool in the kit."
      },
      {
        "type": "definition",
        "term": "Candlestick Pattern",
        "text": "A short sequence of one to three candlesticks — such as a pin bar, an engulfing pair, or a morning star — claimed to signal a likely reversal or continuation in price."
      },
      {
        "type": "paragraph",
        "text": "Note the difference from the candlestick chart you already know: the chart is the display format, while a candlestick pattern is a specific claim that a particular little shape predicts what comes next. That claim is exactly the kind this course insists on testing rather than repeating — which is Sections 3 and 4."
      },
      {
        "type": "image",
        "svg": "forex-ch2-price-action",
        "alt": "Diagram of a naked candlestick chart bouncing at a round-number support level, with the order-flow mechanism annotated, above a verdict strip contrasting the strong forex-specific evidence for support and resistance against the contested evidence for candlestick patterns",
        "caption": "Strong forex-specific evidence backs support and resistance; the evidence for candlestick patterns is contested."
      },
      {
        "type": "example",
        "text": "A naked-chart trade reads like this. On the 4-hour EUR/USD chart, price has twice reversed upward near 1.0975 — that is support. Price falls to it a third time and forms a bullish reversal candle. A price-action trader enters long at 1.1005 with a stop just below the level at 1.0975 — a distance of 30 pips (1.1005 − 1.0975 = 0.0030). No indicator was used; the decision came from the level and the candle alone. Whether that decision has an edge is the question the evidence has to answer."
      },
      {
        "type": "paragraph",
        "text": "This is the part of price action with the best academic support, and — unusually for this course — the strongest evidence is forex-specific rather than borrowed from stock markets."
      },
      {
        "type": "example",
        "text": "Osler (2000), published in the Federal Reserve Bank of New York's Economic Policy Review, tested the support and resistance levels that six real forex firms published to their customers. The finding was positive: the levels genuinely helped predict where intraday exchange-rate trends would be interrupted. The predictive power was not uniform — it was stronger for dollar-yen and dollar-pound than for dollar-mark, and it varied by firm — but for most firms it lasted at least five business days after the levels were published."
      },
      {
        "type": "paragraph",
        "text": "That is real, measured evidence that a core price-action tool carries information. But evidence that something works is more trustworthy when there is also a reason why it works. Osler supplied that too."
      },
      {
        "type": "example",
        "text": "Osler (2003), published in The Journal of Finance, examined the actual order books behind the market. Stop-loss and take-profit orders turned out to be strongly clustered at round numbers — almost 10 percent of all such orders sat at rates ending in \"00,\" such as 1.1000. Those round numbers are exactly the levels traders draw as support and resistance. Take-profit orders bunched at a level push price back from it, which is why trends reverse at support and resistance. Stop-loss orders bunched just beyond it accelerate price once the level breaks, which is why a decisive break tends to run."
      },
      {
        "type": "definition",
        "term": "Order Clustering",
        "text": "The tendency for many traders' stop-loss and take-profit orders to pile up at the same round-number price levels, making those levels act as real support and resistance."
      },
      {
        "type": "paragraph",
        "text": "This is a satisfying result because it is not circular. The levels are not self-fulfilling magic; they work because of a concrete, measurable feature of how orders (Chapter 1, Lesson 7) are actually placed. Support and resistance earn their place on the naked chart."
      },
      {
        "type": "warning",
        "text": "Real predictive power is not certainty. Osler's levels predicted reversals better than chance, not every time — and the strength varied by pair. Treat a support or resistance level as raising the odds of a reversal, not guaranteeing one. This is the same honesty Foundations Chapter 3 applied to these levels: a probability, never a wall."
      },
      {
        "type": "paragraph",
        "text": "Candlestick patterns are the most heavily marketed part of price action, and they are where the evidence is weakest and most contested. Two well-known studies show the problem clearly."
      },
      {
        "type": "example",
        "text": "Caginalp and Laurent (1998), in Applied Mathematical Finance, tested candlestick reversal patterns on S&P 500 stocks from 1992 to 1996 and found them profitable — a return of roughly 0.9 percent over a two-day holding period, a result they reported as strongly significant. Eight years later, Marshall, Young and Rose (2006), in the Journal of Banking & Finance, tested candlestick strategies on Dow Jones stocks over 1992 to 2001 using a bootstrap method and found no value at all."
      },
      {
        "type": "paragraph",
        "text": "Two careful studies, major US stocks, overlapping years, opposite conclusions. How? A large part of the answer is methodology — and in particular the exit rule. Caginalp and Laurent closed each trade at an averaged price over a fixed short holding period; Marshall, Young and Rose tested differently. The pattern entry was similar; the rule for getting out differed, and the profitability flipped with it."
      },
      {
        "type": "warning",
        "text": "You have seen this exact trap before. In Lesson 5, Sullivan, Timmermann and White showed that a trading rule can look profitable purely because it was the best-fitting choice among many — the data-snooping problem. Candlestick results that hinge on which exit rule you happen to pick are that same warning in a new place. If a strategy's profit appears or vanishes depending on an arbitrary exit choice, the profit was never solid ground."
      },
      {
        "type": "paragraph",
        "text": "None of this means candlestick reading is worthless. It means the confident claims — \"this three-candle shape predicts reversals\" — rest on far thinner and more contested evidence than the support-and-resistance core. The wider technical-analysis literature is mixed in the same honest way: Brock, Lakonishok and LeBaron (Lesson 1) found real predictive ability in moving-average rules on a century of Dow data, while the forex-specific Ghanem et al. study you met in Foundations Chapter 3 found technical rules do predict currency moves. Support has a mechanism and forex-specific evidence; candlestick patterns have neither at the same strength. Weight them accordingly."
      },
      {
        "type": "warning",
        "text": "Finally, remember what no chart-reading skill can do. When the Swiss National Bank abandoned its currency floor in 2015 (Chapter 1, Lesson 7), EUR/CHF gapped straight through every support level on every chart, and no candlestick warned anyone. Price action reads the normal market well at its best; it offers no protection against the fat-tailed jumps that do the most damage. That is why risk management, not chart-reading, remains the thing that keeps you in the game."
      },
      {
        "type": "practice",
        "text": "Before taking a price-action trade, check: is the level a genuine round number or repeatedly-tested price, where orders actually cluster — or a line you drew after the fact to fit what already happened? Are you treating support or resistance as raising the odds of a reversal, not as a guarantee? For a candlestick pattern, ask what happens to its edge if you change the exit rule, and be skeptical if it's fragile to that. And have you set your stop and size for the case where the level simply breaks — including a violent gap that no chart could have flagged?"
      }
    ],
    "quiz": [
      {
        "question": "According to Osler's forex research, why do support and resistance levels tend to work?",
        "options": [
          "The levels are self-fulfilling magic with no real cause",
          "Stop-loss and take-profit orders cluster at round-number levels, so price genuinely reacts there",
          "Indicators confirm them",
          "Central banks defend those exact prices"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — Osler (2003) found orders bunch at round numbers used as support and resistance: take-profit orders reverse price at the level, stop-loss orders accelerate it once broken. The levels have a concrete order-flow cause, not a mystical one.",
        "feedbackWrong": "Not quite — Osler (2003) showed the cause is order clustering: stop-loss and take-profit orders bunch at round-number levels, so price genuinely reacts there."
      },
      {
        "question": "Two studies tested candlestick patterns on major US stocks over overlapping periods and reached opposite conclusions on profitability. What does this best illustrate?",
        "options": [
          "One study was simply fraudulent",
          "Candlestick patterns always work",
          "A result that flips with the exit rule chosen is fragile — the same data-snooping caution from Lesson 5",
          "Forex and stocks are identical markets"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — Caginalp and Laurent (1998) found candlesticks profitable; Marshall, Young and Rose (2006) did not, largely because of differing methodology including the exit rule. An edge that depends on an arbitrary exit choice is exactly the fragility Lesson 5 warned about.",
        "feedbackWrong": "Not quite — the two studies reached opposite conclusions largely because of methodology like the exit rule. A result that flips with the exit chosen is the data-snooping fragility from Lesson 5."
      },
      {
        "question": "True or False: because indicators are computed from price, a price-action trader who reads the naked chart is looking at less information than an indicator user.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — from Lesson 1, an indicator can only highlight what's already in price. The price-action trader reads the same underlying information directly, not less of it.",
        "feedbackWrong": "Not quite — indicators add no information price doesn't already contain. The naked-chart trader reads the same information directly, not less of it."
      }
    ],
    "keyTerms": [
      {
        "term": "Price Action",
        "def": "Trading from the movement of price itself, without indicators derived from it."
      },
      {
        "term": "Naked Chart",
        "def": "A price chart with no indicators — just candles and drawn levels."
      },
      {
        "term": "Candlestick Pattern",
        "def": "A one-to-three-candle shape claimed to signal a reversal or continuation."
      },
      {
        "term": "Order Clustering",
        "def": "The bunching of stop-loss and take-profit orders at round-number levels, which makes those levels act as support and resistance."
      }
    ]
  },
  {
    "id": "position-sizing-with-pip-value",
    "lessonNumber": 1,
    "chapterNumber": 3,
    "chapterTitle": "Chapter 3: Risk Management for Forex Traders",
    "title": "Position Sizing With Pip Value",
    "keyIdea": "The \"one pip = $10\" rule is only exact when the quote currency is your account currency; getting pip value right for every pair is what makes your risk control real.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Chapter 1, Lesson 5 gave you the position-sizing formula, and it used a simple figure: on a standard lot, one pip is worth about 10 dollars. That lesson was careful to label it — \"USD-quoted pairs\" — because it is not the whole story. This lesson tells the whole story."
      },
      {
        "type": "paragraph",
        "text": "The reason it matters is precise. The sizing formula turns your account size, your risk percentage, and your stop-loss into an exact position. Every input has to be exact for the output to be exact. Pip value is the one input that quietly changes from pair to pair, and getting it wrong is the most common way a carefully planned \"one percent risk\" turns into something else entirely."
      },
      {
        "type": "definition",
        "term": "Pip Value",
        "text": "The amount of money gained or lost for each pip of price movement, for a given position size, expressed in your account's currency."
      },
      {
        "type": "paragraph",
        "text": "The last three words are the ones beginners skip: in your account's currency. A pip is a movement in the quote currency of a pair. Your profit and loss, though, are counted in whatever currency your account is held in. Pip value is the bridge between those two, and the bridge is only \"10 dollars\" in one specific case."
      },
      {
        "type": "paragraph",
        "text": "The full calculation is always the same two steps, whatever the pair. Step 1 is to find the pip value in the quote currency: multiply the pip size by the number of units you are trading."
      },
      {
        "type": "example",
        "text": "On a four-decimal pair, one pip is 0.0001. A standard lot is 100,000 units. So 0.0001 x 100,000 = 10 units of the quote currency per pip. On a yen pair, one pip is 0.01, so 0.01 x 100,000 = 1,000 units of the quote currency (yen) per pip. Notice this is denominated in the quote currency, not dollars."
      },
      {
        "type": "paragraph",
        "text": "Step 2 is to convert the quote currency into your account currency at the current exchange rate."
      },
      {
        "type": "definition",
        "term": "Account Currency",
        "text": "The currency your trading account is denominated in. Every risk figure, in the end, has to be expressed in it, because that is the currency you actually win or lose."
      },
      {
        "type": "paragraph",
        "text": "Whether Step 2 does anything depends on the pair. There are three cases, and only the first gives you the familiar 10 dollars."
      },
      {
        "type": "paragraph",
        "text": "Case A — the quote currency is your account currency. For a US-dollar account trading EUR/USD, Step 1 already gives 10 US dollars per pip. Step 2 changes nothing. Pip value is exactly 10 dollars. This is the case Chapter 1 used, and it is the only one where the shortcut is exact."
      },
      {
        "type": "paragraph",
        "text": "Case B — the base currency is your account currency. For a US-dollar account trading USD/JPY, Step 1 gives 1,000 yen per pip. You must convert yen into dollars."
      },
      {
        "type": "example",
        "text": "USD/JPY is trading at 150.00. Pip value = 1,000 yen / 150.00 = 6.67 US dollars per pip on a standard lot. Not 10 dollars — about a third less."
      },
      {
        "type": "paragraph",
        "text": "Case C — neither currency is your account currency, which is any cross pair. For a US-dollar account trading EUR/GBP, Step 1 gives 10 British pounds per pip, and you must convert pounds into dollars using GBP/USD."
      },
      {
        "type": "example",
        "text": "GBP/USD is trading at 1.27. Pip value = 10 pounds x 1.27 = 12.70 US dollars per pip on a standard lot. Not 10 dollars — about a quarter more."
      },
      {
        "type": "image",
        "svg": "forex-ch3-position-sizing-pip-value",
        "alt": "Diagram showing the two-step pip value calculation and the three cases: quote currency equals account currency (exactly 10 dollars), base currency equals account currency (convert, about 6.67), and a cross pair (convert, about 12.70), then the effect on position size",
        "caption": "Pip value in two steps, the three cases for a US-dollar account, and how the $10 shortcut mis-sizes a trade."
      },
      {
        "type": "warning",
        "text": "In Cases B and C, pip value is not fixed — it floats with the exchange rate you convert through. As USD/JPY moves, the dollar value of a pip on that pair moves too. This means your dollar risk drifts slightly as rates change, so recompute pip value at the current rate rather than reusing a number from last week. This is a genuine, if small, way that \"fixed\" risk in forex is never perfectly fixed."
      },
      {
        "type": "paragraph",
        "text": "Now put the correct pip value back into the Chapter 1, Lesson 5 formula and watch what the shortcut does to your risk. Lot Size = (Account Balance x Risk %) / (Stop-Loss in Pips x Pip Value)."
      },
      {
        "type": "example",
        "text": "Take a 10,000 dollar account, risking 1% (100 dollars), with a 50-pip stop-loss. On USD/JPY, true pip value is 6.67 dollars, so the correct size is 100 / (50 x 6.67) = 0.30 standard lots. If you had used the 10-dollar shortcut, you would have traded 0.20 lots — and actually risked only 0.20 x 50 x 6.67 = 66.70 dollars. You under-sized: your real risk was two-thirds of what you intended, quietly leaving return on the table. On EUR/GBP, true pip value is 12.70 dollars, so the correct size is 100 / (50 x 12.70) = 0.157 standard lots. Using the 10-dollar shortcut would have given 0.20 lots — and a real risk of 0.20 x 50 x 12.70 = 127 dollars. You over-sized: you risked 27% more than the 1% you decided on."
      },
      {
        "type": "paragraph",
        "text": "That is the whole point of the lesson in one example. The shortcut does not just round a little. On one pair it made you risk a third less than planned; on another, a quarter more. The careful \"exactly 100 dollars\" guarantee from Chapter 1 only holds if the pip value feeding the formula is the real one."
      },
      {
        "type": "warning",
        "text": "Your broker's platform usually shows a pip-value or position-size calculator, and you should use it — it does this arithmetic for you at live rates. Understanding the mechanism is still worth it for one reason: it lets you sanity-check the tool. The most common calculator error is having it set to the wrong account currency, which produces exactly the kind of silent mis-sizing above. A number you can check is safer than a number you have to trust."
      },
      {
        "type": "paragraph",
        "text": "It is fair to ask whether this much care over a few dollars of pip value really matters. The answer comes from the mathematics of losing, not winning."
      },
      {
        "type": "definition",
        "term": "Risk of Ruin",
        "text": "The probability that a series of losing trades reduces an account to the point where it can no longer recover or continue. It is the trading form of the classical \"gambler's ruin\" problem in probability."
      },
      {
        "type": "paragraph",
        "text": "The gambler's ruin problem is old and well understood: a player with limited money making repeated bets has a calculable chance of eventually losing everything, and the single biggest lever on that chance is not the win rate — it is the fraction of the account risked on each bet. Ralph Vince brought this framework to trading in The Mathematics of Money Management (Wiley, 1992), formalising the \"fixed fractional\" approach this course has used since Foundations: risk a small, constant fraction of the account each time."
      },
      {
        "type": "paragraph",
        "text": "The robust result, the part that holds regardless of the exact assumptions, is directional and stark: even a strategy with a genuine edge has a high probability of ruin if it is over-sized, while risking a small fixed fraction — the 1% to 2% from Foundations Chapter 2 — drives the probability of ruin toward zero. Position size is the lever. And position size is exactly what a wrong pip value corrupts."
      },
      {
        "type": "warning",
        "text": "Be honest about the limits here, in the spirit of the Kelly caution from Chapter 1, Lesson 5. The precise risk-of-ruin number for a real strategy depends on inputs — your true win rate, your average win and loss, how correlated your trades are — that most traders cannot pin down reliably. So do not chase a specific ruin percentage from a calculator as if it were fact. Respect the direction the mathematics points, which is not in doubt: a smaller fraction risked per trade means dramatically lower odds of ruin."
      },
      {
        "type": "paragraph",
        "text": "This is why the arithmetic earlier is not pedantry. When the Swiss National Bank floor collapsed in 2015 (Chapter 1, Lesson 7), the traders who survived were not the ones who predicted it — they were the ones whose positions were small enough that a violent move could not end them. Correct pip value feeds correct position size, and correct position size is what keeps you at the table long enough for an edge to matter."
      },
      {
        "type": "practice",
        "text": "Before you size a trade, run these checks: Do you actually know the pip value for this pair in your account currency, or are you assuming 10 dollars out of habit? For any USD/XXX pair or any cross pair, did you recompute pip value at the current rate rather than reusing an old figure? After sizing, does the stop-loss really cost your intended risk percentage when you check it with the true pip value — exactly, not approximately? And is your fraction small enough that a run of losses, or a single gap through your stop, cannot take you out of the game?"
      }
    ],
    "quiz": [
      {
        "question": "On a US-dollar account, is the pip value of USD/JPY on a standard lot exactly 10 dollars?",
        "options": [
          "Yes, pip value is always 10 dollars on a standard lot",
          "No — it must be converted from yen, and at a rate near 150 it is about 6.67 dollars",
          "No — it is always higher than 10 dollars for yen pairs",
          "Only on Fridays"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — a standard lot on a yen pair is 1,000 yen per pip; converting at USD/JPY near 150 gives about 6.67 dollars. The 10-dollar figure only holds when the quote currency is your account currency.",
        "feedbackWrong": "Not quite — a standard lot on a yen pair is 1,000 yen per pip, which converts to about 6.67 dollars near a rate of 150. The 10-dollar figure only holds when the quote currency is your account currency."
      },
      {
        "question": "You size a EUR/GBP trade using a 10-dollar pip value, but the true pip value is 12.70 dollars. Compared with your intended 1% risk, what actually happens?",
        "options": [
          "You risk exactly 1%",
          "You risk less than 1%",
          "You risk more than 1% — about 27% more than intended",
          "The trade cannot be placed"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — a higher true pip value than the one you sized with means each pip costs more than you assumed, so the same lot size risks more: 127 dollars instead of 100.",
        "feedbackWrong": "Not quite — the true pip value is higher than the one you used, so each pip costs more and the same lot size risks more: about 127 dollars instead of 100."
      },
      {
        "question": "According to the risk-of-ruin idea, what is the single biggest lever on the chance of blowing up an account?",
        "options": [
          "The win rate",
          "The fraction of the account risked per trade",
          "The broker you choose",
          "The number of indicators on your chart"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — both the classical gambler's-ruin result and Vince's fixed-fractional framework point to position size, the fraction risked per trade, as the dominant factor, ahead of win rate.",
        "feedbackWrong": "Not quite — the dominant lever is position size, the fraction of the account risked per trade, ahead of the win rate."
      }
    ],
    "keyTerms": [
      {
        "term": "Pip Value",
        "def": "The money gained or lost per pip, for a given position size, in your account currency."
      },
      {
        "term": "Account Currency",
        "def": "The currency your account is denominated in — the currency all risk is finally measured in."
      },
      {
        "term": "Risk of Ruin",
        "def": "The probability that losses reduce an account past recovery; driven mainly by the fraction risked per trade."
      }
    ]
  },
  {
    "id": "margin-calls-and-leverage-risk",
    "lessonNumber": 2,
    "chapterNumber": 3,
    "chapterTitle": "Chapter 3: Risk Management for Forex Traders",
    "title": "Margin Calls and Leverage Risk",
    "keyIdea": "A margin call is set off by your equity, not your balance, and it is almost always a symptom of committing too much of the account — using too much effective leverage.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Chapter 1, Lesson 6 gave you the fixed parts: leverage, margin, the margin level formula, and the idea of a margin call. This lesson watches those numbers move in real time, because that is where the risk actually lives."
      },
      {
        "type": "paragraph",
        "text": "The first thing to separate is your balance from your equity."
      },
      {
        "type": "definition",
        "term": "Equity",
        "text": "Your account balance plus or minus the running profit or loss of any open positions. It is the real, live value of your account at this moment."
      },
      {
        "type": "paragraph",
        "text": "Your balance is settled cash — it only changes when a trade is closed. Equity is balance plus the floating profit or loss of trades still open. The moment you open a position, the two can diverge, and every risk measure that matters is built on equity, not balance."
      },
      {
        "type": "definition",
        "term": "Free Margin",
        "text": "Your equity minus the margin currently used by open positions. It is the cushion available to absorb further losses and to open new trades."
      },
      {
        "type": "paragraph",
        "text": "So the account splits cleanly: used margin (locked as collateral for your open positions) plus free margin (everything else) equals your equity. When a trade moves against you, its floating loss lowers your equity, which shrinks your free margin, which drives your margin level down. Watching that chain is the whole skill of this lesson."
      },
      {
        "type": "paragraph",
        "text": "Chapter 1 described the margin call as one event. In a live account there are usually two levels, and knowing the difference matters."
      },
      {
        "type": "paragraph",
        "text": "The margin call level (commonly a margin level of 100%) is the warning: your equity has fallen until it only just covers the margin your positions require. The broker asks you to add funds or reduce the position."
      },
      {
        "type": "definition",
        "term": "Stop-Out Level",
        "text": "The margin level at which the broker stops asking and starts acting: it automatically closes your positions, usually the largest loser first, to stop your equity falling below the margin backing them. It sits below the margin call level."
      },
      {
        "type": "paragraph",
        "text": "The stop-out level (commonly a margin level of 50%) is the forced exit. It exists to protect the broker from your account going negative, and it will close your trades whether you want it to or not."
      },
      {
        "type": "warning",
        "text": "The exact percentages are set by each broker, not by law — 100% and 50% are common, but yours may differ. Find your broker's real margin call and stop-out levels before you trade, not during your first losing position."
      },
      {
        "type": "example",
        "text": "You have a 2,000 dollar account and open a 50,000 dollar EUR/USD position at 50:1 leverage. Used margin is 50,000 / 50 = 1,000 dollars, leaving 1,000 dollars of free margin, and your margin level starts at 2,000 / 1,000 = 200%. Now price moves against you. A 1,000 dollar floating loss — a 2% move, about 200 pips — drops equity to 1,000 dollars, so margin level hits 100%: the margin call. If the loss reaches 1,500 dollars — a 3% move, about 300 pips — equity is 500 dollars, margin level is 50%, and the stop-out closes the trade for you. A 300-pip move has ended this position, whatever you wanted."
      },
      {
        "type": "image",
        "svg": "forex-ch3-margin-calls-leverage",
        "alt": "Diagram showing the live account split into equity, used margin and free margin; the margin call level around 100 percent and the stop-out level around 50 percent; and two accounts holding the same position where the over-committed one is called after 200 pips and the well-sized one survives to 1,800 pips",
        "caption": "Equity, used margin and free margin; the two thresholds; and how the same position calls a small account at 200 pips but a well-sized one only at 1,800."
      },
      {
        "type": "paragraph",
        "text": "Here is the misunderstanding that this lesson exists to fix. The broker advertises a maximum leverage — 30:1, 50:1, sometimes far more. That number is a ceiling on what you are allowed to do. It says nothing about the risk you are actually running. That is a different number."
      },
      {
        "type": "definition",
        "term": "Effective Leverage",
        "text": "The total size of your open positions divided by your account equity. Unlike the broker's maximum offered leverage, this is the leverage you are actually using right now."
      },
      {
        "type": "example",
        "text": "Take the same 50,000 dollar position, at the same 50:1 broker leverage, on two different accounts. On the 2,000 dollar account above, effective leverage is 50,000 / 2,000 = 25:1, and you saw the margin call arrive after just 200 pips. On a 10,000 dollar account, the identical position is only 50,000 / 10,000 = 5:1 effective leverage — and now the margin call does not arrive until a floating loss of 9,000 dollars, an 18% move of about 1,800 pips. Same broker, same leverage cap, same trade. One account dies at 200 pips; the other survives to 1,800. The only difference is how much of the account was committed."
      },
      {
        "type": "paragraph",
        "text": "That is the honest core of \"leverage risk.\" The danger was never the broker's headline ratio on its own — it is how much of that ceiling you choose to use. And that choice is exactly position sizing from Lesson 1. A correctly sized position leaves a large free-margin cushion, which keeps effective leverage low and the margin call far away. A margin call is, almost always, a position-sizing mistake showing up one step later."
      },
      {
        "type": "warning",
        "text": "Treat \"500:1 leverage available\" as marketing, not a feature. The number tells you the most rope the broker will hand you; it says nothing about how much you should take. Your effective leverage, set by your position size, is the figure to watch — and to keep small."
      },
      {
        "type": "paragraph",
        "text": "It is tempting to treat the stop-out as a guaranteed floor: the worst that happens is you get closed at 50%. Usually true. Not always."
      },
      {
        "type": "warning",
        "text": "The stop-out closes your position at the best price available when it fires — and in a violent gap, there may be no price nearby, exactly as you saw with stop-loss orders in Chapter 1, Lesson 7. When the Swiss National Bank floor broke in 2015, stop-outs triggered correctly but filled far below their levels, and many accounts went negative — traders ended up owing money they never deposited. This is precisely why negative balance protection exists as a rule in the EU, UK, and Australia (Chapter 1, Lesson 6)."
      },
      {
        "type": "paragraph",
        "text": "So the layering is: correct position size keeps you far from the margin call in the first place; the broker's stop-out is a second line that usually works; and negative balance protection is a legal backstop for the rare case where a gap defeats the stop-out. The first line is the one you control, and it is the one that matters most."
      },
      {
        "type": "practice",
        "text": "Before and during a leveraged trade, check: Do you actually know your broker's margin call and stop-out levels, in numbers, before you need them? What is your effective leverage right now — total open position size divided by equity — a small number or a large one? Could your free-margin cushion absorb a realistic adverse move without triggering a margin call? And are you relying on the stop-out as a safety net, or sizing your positions so that you never come close to it?"
      }
    ],
    "quiz": [
      {
        "question": "A margin call is triggered when which value falls to meet the margin your positions require?",
        "options": [
          "Your account balance",
          "Your account equity (balance plus floating profit and loss)",
          "The broker's leverage cap",
          "The spread"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — margin level is measured from equity, not balance. It is the live value including open trades' floating loss that determines when a margin call or stop-out fires.",
        "feedbackWrong": "Not quite — margin level is measured from equity (balance plus floating profit and loss), not from balance alone."
      },
      {
        "question": "Two accounts hold the exact same 50,000 dollar position at the same 50:1 broker leverage — one with 2,000 dollars of equity, one with 10,000 dollars. Which faces a margin call after a much smaller move against it?",
        "options": [
          "The 10,000 dollar account",
          "The 2,000 dollar account, because its effective leverage (25:1) is far higher",
          "Neither — they are identical because the broker leverage is the same",
          "It depends only on the spread"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — effective leverage is position size divided by equity: 25:1 versus 5:1. The smaller account has a thinner free-margin cushion, so a 200-pip move calls it while the larger account can absorb about 1,800.",
        "feedbackWrong": "Not quite — effective leverage is position divided by equity, so the 2,000 dollar account runs 25:1 versus 5:1 and is called after a far smaller move."
      },
      {
        "question": "True or False: the broker's stop-out level is a guaranteed floor, so your account can never go below it.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — in a violent gap the stop-out can fill far from its level; the 2015 Swiss franc move pushed many accounts negative. That is why negative balance protection exists — the stop-out is a strong safeguard, not an absolute guarantee.",
        "feedbackWrong": "Not quite — a violent gap can push the stop-out fill far below its level (the 2015 Swiss franc move sent accounts negative), which is exactly why negative balance protection exists."
      }
    ],
    "keyTerms": [
      {
        "term": "Equity",
        "def": "Account balance plus or minus the floating profit and loss of open positions."
      },
      {
        "term": "Free Margin",
        "def": "Equity minus used margin — the cushion available to absorb losses and open trades."
      },
      {
        "term": "Stop-Out Level",
        "def": "The margin level at which the broker forcibly closes positions, below the margin call level."
      },
      {
        "term": "Effective Leverage",
        "def": "Total open position size divided by account equity — the leverage you are actually running."
      }
    ]
  },
  {
    "id": "risk-to-reward-ratio-in-practice",
    "lessonNumber": 3,
    "chapterNumber": 3,
    "chapterTitle": "Chapter 3: Risk Management for Forex Traders",
    "title": "Risk-to-Reward Ratio in Practice",
    "keyIdea": "The risk-to-reward ratio sets the win rate you need to break even, which is why a trader who is wrong more often than right can still make money — and a high win rate can still lose.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Every trade you place has two distances built into it: how far price can go against you before your stop-loss closes it, and how far it can go in your favour before you take profit. The relationship between those two distances is the most important number in a trading plan that Foundations Chapter 2 kept pointing toward without naming."
      },
      {
        "type": "definition",
        "term": "Risk-to-Reward Ratio",
        "text": "The size of the loss you take if a trade hits its stop, compared with the size of the gain if it hits its target. Written risk-to-reward, so 1:2 means risking one unit to make two."
      },
      {
        "type": "paragraph",
        "text": "It is cleanest to measure both in the \"R\" unit from Foundations Chapter 2. Your risk on the trade — the stop distance, turned into money by the pip value and position size from Lessons 1 and 2 — is one R. A target twice as far away is two R; three times as far is three R."
      },
      {
        "type": "example",
        "text": "You go long EUR/USD at 1.1000 with your stop at 1.0970, a 30-pip risk. That stop distance is your 1R. If you set your target at 1.1060 — 60 pips away, twice the stop distance — the trade is a 1:2 risk-to-reward. If price reaches the target you gain 2R; if it hits the stop you lose 1R."
      },
      {
        "type": "paragraph",
        "text": "The ratio matters because it decides how often you actually have to be right just to stay level. Wins have to pay for losses, and a bigger reward per win means each win pays for more losses."
      },
      {
        "type": "definition",
        "term": "Break-even Win Rate",
        "text": "The fraction of trades you must win, at a given risk-to-reward ratio, simply to end up flat. It equals 1 divided by (1 + R), where R is the reward as a multiple of the risk."
      },
      {
        "type": "example",
        "text": "At 1:1, break-even win rate = 1 / (1 + 1) = 50%. At 1:2, it is 1 / (1 + 2) = 33.3%. At 1:3, it is 1 / (1 + 3) = 25%. So with a 1:3 ratio, you can lose three trades out of four and still break even. Going the other way, if your reward is only half your risk (you take 15-pip profits behind a 30-pip stop), R is 0.5 and the break-even win rate climbs to 1 / 1.5 = 66.7% — you now have to win two out of every three trades just to stand still."
      },
      {
        "type": "warning",
        "text": "The reasoning is simple enough to hold in your head: to break even, total winnings must equal total losses, so (win rate times reward) must equal (loss rate times risk). Solve that and the winning fraction is 1 / (1 + R). You do not need to memorise the algebra — you need to remember that a better reward-to-risk ratio lowers the win rate you need, and a worse one raises it, fast."
      },
      {
        "type": "paragraph",
        "text": "This is where the whole course's most repeated idea becomes arithmetic instead of a slogan. Foundations Chapter 2 said being right often is not the same as trading well. Here is the proof."
      },
      {
        "type": "example",
        "text": "Trader A wins 40% of trades at 1:2. Out of 10 trades, 4 wins pay 2R each (+8R) and 6 losses cost 1R each (-6R), for +2R overall — a profit, from being wrong more often than right. Trader B wins 60% at 1:1: 6 wins (+6R) and 4 losses (-4R) also make +2R. Same result from opposite-looking records. Now Trader C wins 70% of trades but takes profits half the size of the risk (1:0.5): 7 wins pay 0.5R each (+3.5R) and 3 losses cost 1R each (-3R), for just +0.5R over 10 trades. Trader C is right far more often than A or B and makes a quarter as much."
      },
      {
        "type": "image",
        "svg": "forex-ch3-risk-reward",
        "alt": "Diagram showing one trade measured in R with a stop at minus 1R and target at plus 2R, a table of break-even win rates (1:1 needs 50 percent, 1:2 needs 33.3 percent, 1:3 needs 25 percent), and three traders over ten trades where a 40 percent win rate at 1:2 and a 60 percent win rate at 1:1 both make plus 2R while a 70 percent win rate at 1:0.5 makes only plus 0.5R",
        "caption": "The break-even win rate for each ratio, and three traders whose win rates hide who actually makes money."
      },
      {
        "type": "paragraph",
        "text": "That is why a win rate quoted on its own is close to meaningless — it is a vanity number. A strategy that wins 90% of the time can still bleed an account dry if the occasional loss is larger than many wins combined. What determines whether you make money is the win rate and the risk-to-reward ratio together, never either alone."
      },
      {
        "type": "paragraph",
        "text": "A full accounting of this — combining win rate and average sizes into a single \"expectancy\" number, and building a plan around it — is the subject of Chapter 4, Lesson 2. For now, the practical takeaway is enough: protect the ratio, and you can be wrong a lot and still win."
      },
      {
        "type": "paragraph",
        "text": "A risk-to-reward ratio is only real if both prices in it are real. It is easy to draw a target three times as far as your stop and announce a 1:3 trade — but if price has almost no chance of travelling that far before turning, the ratio is a fiction."
      },
      {
        "type": "paragraph",
        "text": "The disciplined sequence uses tools you already have. Put the stop where the trade idea is actually wrong — the invalidation level from Foundations Chapter 2 and the multi-timeframe method in Chapter 2, Lesson 5. Put the target at a genuine obstacle — a support or resistance level from Foundations Chapter 3 that price would realistically reach and stall at. Then read off the ratio those two honest prices produce, and only take the trade if that ratio clears your minimum given a win rate you can actually expect."
      },
      {
        "type": "warning",
        "text": "Never move the target closer, or the stop wider, after entry to rescue a trade — that quietly destroys the ratio you planned. Widening a stop to avoid being closed turns a 1:2 trade into a 1:1 or worse, and the arithmetic above shows exactly what that does to the win rate you now need. The ratio is a decision made before the trade, and then defended."
      },
      {
        "type": "paragraph",
        "text": "There is a strong pull to do the opposite — to grab small profits quickly and give losing trades room to recover. That instinct feels like winning because it raises your win rate, but it is Trader C above, and it is a losing pattern with a comforting face. The psychology behind it, and how to build a plan that resists it, is Chapter 4."
      },
      {
        "type": "practice",
        "text": "Before entering, run these checks: Can you state the trade's risk-to-reward ratio as a number, from a real stop price and a real target price? Does that ratio clear its break-even win rate with room to spare, given a win rate you can honestly expect rather than a hoped-for one? Are your stop and target placed at meaningful levels — invalidation, support, resistance — or chosen to manufacture a nice-looking ratio? And do you ever widen a stop or pull in a target mid-trade? That is the ratio quietly collapsing, the one habit this lesson most wants you to catch."
      }
    ],
    "quiz": [
      {
        "question": "What is the break-even win rate for a trade with a 1:3 risk-to-reward ratio?",
        "options": [
          "50%",
          "33.3%",
          "25%",
          "75%"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — break-even win rate = 1 / (1 + R) = 1 / (1 + 3) = 25%. At 1:3 you can lose three of every four trades and still break even.",
        "feedbackWrong": "Not quite — break-even win rate = 1 / (1 + R) = 1 / 4 = 25% at 1:3."
      },
      {
        "question": "Trader A wins 40% of trades at a 1:2 ratio; Trader B wins 40% at a 1:1 ratio. Who is profitable?",
        "options": [
          "Both, equally",
          "Only Trader A",
          "Only Trader B",
          "Neither"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — at 1:2, break-even is 33.3%, so a 40% win rate is profitable (+0.2R per trade). At 1:1, break-even is 50%, so the same 40% win rate loses. The ratio, not the win rate, flips the outcome.",
        "feedbackWrong": "Not quite — at 1:2 break-even is 33.3% (A profits), but at 1:1 break-even is 50% (B loses at 40%). The ratio flips the outcome."
      },
      {
        "question": "True or False: a trading strategy with a 70% win rate is guaranteed to be profitable.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — if the reward per win is smaller than the risk per loss, even a 70% win rate can barely break even or lose. Win rate is only half the story; the risk-to-reward ratio is the other half.",
        "feedbackWrong": "Not quite — with a poor risk-to-reward ratio, even a 70% win rate can barely break even or lose. Win rate alone does not decide profitability."
      }
    ],
    "keyTerms": [
      {
        "term": "Risk-to-Reward Ratio",
        "def": "The loss if a trade hits its stop versus the gain if it hits its target (e.g., 1:2)."
      },
      {
        "term": "Break-even Win Rate",
        "def": "The win fraction needed to break even at a given ratio — equal to 1 / (1 + R)."
      }
    ]
  },
  {
    "id": "trading-psychology-fear-greed-discipline",
    "lessonNumber": 1,
    "chapterNumber": 4,
    "chapterTitle": "Chapter 4: Trading Psychology & Building a Plan",
    "title": "Trading Psychology — Fear, Greed, and Discipline",
    "keyIdea": "Most accounts are lost not to bad analysis but to two documented behaviours — the disposition effect and overtrading — and the only reliable defence is a pre-committed plan, not willpower.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Chapters 1 through 3 gave you the mechanics and the mathematics: pairs and pips, position sizing, margin, the risk-to-reward ratio. If trading were only those things, a careful beginner would do fine. Most accounts are not lost to bad arithmetic, though. They are lost to good rules abandoned under emotion."
      },
      {
        "type": "paragraph",
        "text": "Two feelings do most of the damage, and they are worth naming plainly. Fear, in trading, is the pull to cut a gain short before it can turn, or to avoid the discomfort of admitting a loss. Greed is the pull to want more — a bigger position, one more trade, a target stretched further out. The rest of this lesson is really about the specific, documented mistakes those two feelings produce, and the one thing that actually defends against them."
      },
      {
        "type": "paragraph",
        "text": "The reason this matters more in forex than in slow investing is speed and leverage. A leveraged position (Chapter 3, Lesson 2) moves fast enough to trigger fear in real time, and cheap, instant trades make it easy to act on greed. The emotions are ordinary. The environment amplifies what they cost you."
      },
      {
        "type": "paragraph",
        "text": "The single best-documented trading mistake has a name, and once you know it you will see it everywhere — including in your own account."
      },
      {
        "type": "definition",
        "term": "Disposition Effect",
        "text": "The tendency to sell winning positions too early, to lock in a sure gain, while holding losing positions too long, hoping they recover. The term was coined by Shefrin and Statman (1985)."
      },
      {
        "type": "paragraph",
        "text": "The emotional logic is easy to feel. A winning trade offers the pleasure of being right, available right now if you close it — so you do. A losing trade would force you to admit you were wrong, so you wait, and hope. Both impulses push directly against the risk-to-reward discipline from Chapter 3, Lesson 3: they shrink your winners and let your losers run — exactly backwards."
      },
      {
        "type": "example",
        "text": "Odean (1998), in The Journal of Finance, examined the trading records of 10,000 real discount-brokerage accounts. Investors were 1.5 to 2 times more likely to sell a winning stock than a losing one, even after accounting for taxes and portfolio rebalancing. And it was not shrewd: the winning stocks they sold went on to outperform the losing stocks they held. The instinct to bank the sure profit and give the loser room to recover measurably cost these investors money."
      },
      {
        "type": "paragraph",
        "text": "Look back at Chapter 3, Lesson 3 and you will recognise this. The disposition effect is Trader C — grabbing small wins while letting losses run — turned from a diagram into a documented pattern across thousands of real people. It is the psychological engine that manufactures a bad risk-to-reward ratio, one trade at a time."
      },
      {
        "type": "warning",
        "text": "The fix is structural, not emotional. You will not reliably out-argue an instinct this strong in the heat of an open trade. What works is deciding the exit before you enter — a stop and a target set as orders, ideally linked so one cancels the other (the OCO order from Chapter 1, Lesson 7) — and then letting them execute without your interference. Pre-commitment beats willpower."
      },
      {
        "type": "paragraph",
        "text": "The second engine is greed's quieter form: the belief that more activity means more profit."
      },
      {
        "type": "definition",
        "term": "Overtrading",
        "text": "Trading more frequently, or in larger size, than a strategy actually justifies — usually driven by overconfidence, the sense that you can read the market well enough to act often."
      },
      {
        "type": "example",
        "text": "Barber and Odean (2000), in The Journal of Finance, tracked 66,465 households at a discount broker over 1991 to 1996. Their finding is one of the most cited in behavioural finance: the households that traded the most earned 11.4% a year, while the market itself returned 17.9%. Same market, same years — the gap was activity. They concluded that overconfidence drives the excessive trading, and the excessive trading drives the underperformance. Their title puts it bluntly: trading is hazardous to your wealth."
      },
      {
        "type": "paragraph",
        "text": "That study is on stock investors, and it is worth being honest about that — but the mechanism transfers directly, and forex makes it worse. Every trade pays the bid-ask spread (Chapter 1, Lesson 4), so more trades means more guaranteed cost before you are even right or wrong. Add leverage (Chapter 3, Lesson 2), and the damage from acting too often compounds faster than it would in a plain stock account."
      },
      {
        "type": "warning",
        "text": "Activity feels like work, and work feels like it should be rewarded. Trading inverts that intuition: beyond the trades your rules actually call for, each extra one is a cost, not an effort. For most retail traders, doing less is the higher-skill move."
      },
      {
        "type": "image",
        "svg": "forex-ch4-trading-psychology",
        "alt": "Diagram of the two documented behaviours that drain trading accounts — the disposition effect (Odean 1998: investors 1.5 to 2 times more likely to sell winners than losers) and overtrading (Barber and Odean 2000: the most active traders earned 11.4 percent a year versus the market's 17.9 percent) — and discipline as the structural fix using pre-committed OCO orders and preset position size",
        "caption": "The two documented engines of loss and their evidence, and discipline as a structural fix rather than an act of willpower."
      },
      {
        "type": "paragraph",
        "text": "\"Discipline\" gets used as if it means staying calm, or having nerves of steel. That is the wrong definition, and chasing it sets you up to fail — because you will not always feel calm."
      },
      {
        "type": "definition",
        "term": "Discipline",
        "text": "In trading, following a pre-committed plan — entry, stop, target, and size — regardless of what you feel in the moment. It is a system for removing in-the-moment decisions, not a personality trait."
      },
      {
        "type": "paragraph",
        "text": "This reframes everything the course has built. The whole point of Chapters 1 through 3 was to let you decide the things that matter — position size, stop, target, the ratio — in advance, while you are calm and thinking clearly. Discipline is simply honouring those decisions when fear and greed show up, which they will. That is why the tools are the answer, not gritted teeth: an OCO order (Chapter 1, Lesson 7) executes your exit whether or not you can bring yourself to click; a pre-set position size (Chapter 3, Lesson 1) removes the greedy \"go bigger just this once.\" The plan is your defence against your own psychology — and building that plan properly is the subject of the next lesson."
      },
      {
        "type": "warning",
        "text": "Be honest about the limit: no one eliminates fear and greed, professionals included. The difference is that experienced traders build rules and automation that make the feelings irrelevant to the decision, rather than trying to win an emotional battle in real time. Aim for a process that does not depend on you being calm at the worst possible moment."
      },
      {
        "type": "practice",
        "text": "Watch for these in your own trading: When you close a trade early, ask honestly — is this my plan executing, or the disposition effect offering me a sure small win? When you are still holding a position past where your stop should have been, ask the same question in reverse — plan, or hope? Count your trades over a week: are you trading because a setup genuinely met your rules, or because you were bored, confident, or chasing a loss back? And is each trade's exit placed as an order before you enter, so the decision is already made and not left to you to fumble in the moment?"
      }
    ],
    "quiz": [
      {
        "question": "What does the \"disposition effect\" describe?",
        "options": [
          "Selling losing trades quickly and letting winners run",
          "Selling winning trades too early while holding losing trades too long",
          "Trading only once per day",
          "Always using maximum leverage"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — Shefrin and Statman named it, and Odean (1998) measured it: investors were 1.5 to 2 times more likely to sell winners than losers, shrinking gains and letting losses run — the opposite of good risk-to-reward.",
        "feedbackWrong": "Not quite — the disposition effect is selling winners too early and holding losers too long, the opposite of good risk-to-reward. Odean (1998) measured it directly."
      },
      {
        "question": "Barber and Odean (2000) found the households that traded the most earned about 11.4% a year while the market returned about 17.9%. What does this best demonstrate?",
        "options": [
          "Active trading reliably beats the market",
          "Overtrading, driven by overconfidence, tends to lower returns",
          "The market always returns 17.9%",
          "Spreads do not matter"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — same market and period, yet the most active traders underperformed by more than six percentage points a year. The study attributes the excessive trading to overconfidence.",
        "feedbackWrong": "Not quite — the most active traders underperformed the market by over six points a year; the study ties the excessive trading to overconfidence."
      },
      {
        "question": "True or False: discipline in trading means staying calm and unemotional while you decide what to do in a live trade.",
        "options": [
          "True",
          "False"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — discipline means following a plan committed to in advance, so the important decisions are not made live at all. It is a system that removes in-the-moment choices, not a feeling you summon.",
        "feedbackWrong": "Not quite — discipline is following a pre-committed plan so the key decisions are not made live. It is a system, not a calm feeling you have to summon."
      }
    ],
    "keyTerms": [
      {
        "term": "Disposition Effect",
        "def": "Selling winners too early and holding losers too long (Shefrin & Statman, 1985)."
      },
      {
        "term": "Overtrading",
        "def": "Trading more often or larger than a strategy justifies, usually from overconfidence."
      },
      {
        "term": "Overconfidence",
        "def": "Overrating your own judgement — the driver behind overtrading and its cost to returns."
      },
      {
        "term": "Discipline",
        "def": "Following a pre-committed plan regardless of feeling — a system, not a personality trait."
      }
    ]
  }
];

// Dark-theme forex lesson diagrams (ported from course/images/forex-*.svg).
// Looked up by the `svg` field on image blocks in learn.js.
window.SCERE_FOREX_SVGS = {
  'forex-ch1-base-quote-pecking-order': `
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="520" fill="#0f172a"/>
  <text x="450" y="38" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">Currency Pairs: Base, Quote &amp; the Pecking Order</text>

  <!-- Top: base/quote breakdown -->
  <rect x="150" y="65" width="600" height="130" rx="12" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="2"/>
  <text x="450" y="95" text-anchor="middle" font-size="20" font-weight="bold" fill="#e2e8f0">EUR / USD = 1.0850</text>

  <rect x="185" y="115" width="200" height="60" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="285" y="138" text-anchor="middle" font-size="13" font-weight="bold" fill="#3b82f6">EUR — Base</text>
  <text x="285" y="157" text-anchor="middle" font-size="11" fill="#cbd5e1">The "1" — what's being priced</text>

  <rect x="515" y="115" width="200" height="60" rx="8" fill="#1e293b" stroke="#22c55e" stroke-width="1.5"/>
  <text x="615" y="138" text-anchor="middle" font-size="13" font-weight="bold" fill="#22c55e">USD — Quote</text>
  <text x="615" y="157" text-anchor="middle" font-size="11" fill="#cbd5e1">The price, per 1 base unit</text>

  <text x="450" y="180" text-anchor="middle" font-size="12" font-style="italic" fill="#94a3b8">1 euro costs 1.0850 US dollars</text>

  <!-- Pecking order -->
  <text x="450" y="230" text-anchor="middle" font-size="16" font-weight="bold" fill="#e2e8f0">The Pecking Order — Why Pairs Aren't Written "Any Old Way"</text>
  <text x="450" y="250" text-anchor="middle" font-size="11.5" font-style="italic" fill="#94a3b8">Higher-ranked currency is conventionally listed first (as base) against a lower-ranked one</text>

  <g>
    <rect x="80" y="270" width="110" height="50" rx="8" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="135" y="300" text-anchor="middle" font-size="14" font-weight="bold" fill="#3b82f6">EUR</text>

    <rect x="215" y="270" width="110" height="50" rx="8" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="270" y="300" text-anchor="middle" font-size="14" font-weight="bold" fill="#3b82f6">GBP</text>

    <rect x="350" y="270" width="145" height="50" rx="8" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="422" y="300" text-anchor="middle" font-size="13" font-weight="bold" fill="#3b82f6">AUD / NZD</text>

    <rect x="520" y="270" width="110" height="50" rx="8" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="1.5"/>
    <text x="575" y="300" text-anchor="middle" font-size="14" font-weight="bold" fill="#fde68a">USD</text>

    <rect x="655" y="270" width="165" height="50" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
    <text x="737" y="300" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#94a3b8">CAD / CHF / JPY</text>

    <line x1="190" y1="295" x2="215" y2="295" stroke="#475569" stroke-width="2" marker-end="url(#arr)"/>
    <line x1="325" y1="295" x2="350" y2="295" stroke="#475569" stroke-width="2" marker-end="url(#arr)"/>
    <line x1="495" y1="295" x2="520" y2="295" stroke="#475569" stroke-width="2" marker-end="url(#arr)"/>
    <line x1="630" y1="295" x2="655" y2="295" stroke="#475569" stroke-width="2" marker-end="url(#arr)"/>
    <defs>
      <marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="2" orient="auto">
        <path d="M0,0 L4,2 L0,4 z" fill="#475569"/>
      </marker>
    </defs>
  </g>

  <text x="450" y="345" text-anchor="middle" font-size="11.5" fill="#cbd5e1">So the market quotes EUR/USD and USD/CAD — never USD/EUR or CAD/USD — by long-standing convention.</text>

  <!-- History note -->
  <rect x="100" y="370" width="700" height="70" rx="10" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="1.5"/>
  <text x="450" y="395" text-anchor="middle" font-size="12.5" fill="#fde68a" font-weight="bold">Where this comes from: history, not logic</text>
  <text x="450" y="415" text-anchor="middle" font-size="11.5" fill="#fde68a">The British pound "sat on top" because sterling was the world's reserve currency before the dollar.</text>
  <text x="450" y="430" text-anchor="middle" font-size="11.5" fill="#fde68a">The euro inherited that priority from the German mark when EUR/GBP was set as convention in 1999.</text>

  <!-- Current data -->
  <text x="450" y="470" text-anchor="middle" font-size="12.5" fill="#cbd5e1">2025 BIS Triennial Survey: $9.6 trillion traded daily · USD on one side of 89% of all trades · EUR/USD still the largest single pair</text>
  <text x="450" y="492" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">Source: Bank for International Settlements, Triennial Central Bank Survey, April 2025</text>
</svg>
`,
  'forex-ch1-bid-ask-spread-pips': `
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="520" fill="#0f172a"/>
  <text x="450" y="38" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">Bid, Ask &amp; the Spread</text>

  <!-- Bid/Ask visual -->
  <text x="450" y="70" text-anchor="middle" font-size="14" fill="#cbd5e1">EUR/USD quote right now:</text>

  <rect x="150" y="85" width="230" height="80" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="2"/>
  <text x="265" y="112" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">BID: 1.08500</text>
  <text x="265" y="132" text-anchor="middle" font-size="11" fill="#cbd5e1">What the market will</text>
  <text x="265" y="148" text-anchor="middle" font-size="11" fill="#cbd5e1">pay you to sell</text>

  <rect x="520" y="85" width="230" height="80" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2"/>
  <text x="635" y="112" text-anchor="middle" font-size="13" font-weight="bold" fill="#22c55e">ASK: 1.08510</text>
  <text x="635" y="132" text-anchor="middle" font-size="11" fill="#cbd5e1">What the market charges</text>
  <text x="635" y="148" text-anchor="middle" font-size="11" fill="#cbd5e1">you to buy</text>

  <rect x="380" y="180" width="140" height="50" rx="8" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="2"/>
  <text x="450" y="203" text-anchor="middle" font-size="12" font-weight="bold" fill="#fde68a">Spread = 1 pip</text>
  <text x="450" y="219" text-anchor="middle" font-size="10" fill="#fde68a">= $10 per standard lot</text>

  <!-- Pip position illustration -->
  <text x="450" y="270" text-anchor="middle" font-size="15" font-weight="bold" fill="#e2e8f0">Where the Pip Sits</text>

  <rect x="80" y="285" width="330" height="95" rx="10" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="245" y="308" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#3b82f6">Most Pairs (EUR/USD, GBP/USD...)</text>
  <text x="245" y="335" text-anchor="middle" font-size="18" font-family="monospace" fill="#cbd5e1">1.0850<tspan fill="#ef4444" font-weight="bold">0</tspan></text>
  <text x="245" y="358" text-anchor="middle" font-size="11" fill="#94a3b8">Pip = 4th decimal place (0.0001)</text>

  <rect x="490" y="285" width="330" height="95" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="1.5"/>
  <text x="655" y="308" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#ef4444">Yen Pairs (USD/JPY, EUR/JPY...)</text>
  <text x="655" y="335" text-anchor="middle" font-size="18" font-family="monospace" fill="#cbd5e1">149.<tspan fill="#ef4444" font-weight="bold">5</tspan>0</text>
  <text x="655" y="358" text-anchor="middle" font-size="11" fill="#94a3b8">Pip = 2nd decimal place (0.01)</text>

  <!-- Why it exists -->
  <rect x="80" y="400" width="740" height="100" rx="10" fill="#1e293b" stroke="#64748b" stroke-width="1.2" stroke-dasharray="5,4"/>
  <text x="450" y="425" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#e2e8f0">Why Does the Spread Exist?</text>
  <text x="450" y="448" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Glosten &amp; Milgrom (1985) — a landmark market microstructure paper — showed a positive spread</text>
  <text x="450" y="466" text-anchor="middle" font-size="11.5" fill="#cbd5e1">emerges even when the market maker takes zero average profit: it's protection against traders</text>
  <text x="450" y="484" text-anchor="middle" font-size="11.5" fill="#cbd5e1">who know more than they do. Not just a fee — a real, mathematically-grounded cost of uncertainty.</text>
</svg>
`,
  'forex-ch1-leverage-margin': `
<svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="600" fill="#0f172a"/>
  <text x="450" y="38" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">Leverage &amp; Margin</text>

  <!-- Mechanics -->
  <rect x="60" y="60" width="360" height="110" rx="10" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="2"/>
  <text x="240" y="85" text-anchor="middle" font-size="14" font-weight="bold" fill="#3b82f6">50:1 Leverage</text>
  <text x="240" y="108" text-anchor="middle" font-size="12" fill="#cbd5e1">Control $50,000 of currency</text>
  <text x="240" y="126" text-anchor="middle" font-size="12" fill="#cbd5e1">with just $1,000 of your own</text>
  <text x="240" y="144" text-anchor="middle" font-size="12" fill="#cbd5e1">capital held as margin</text>
  <text x="240" y="162" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">Margin % = 1  /  Leverage (here, 2%)</text>

  <rect x="480" y="60" width="360" height="110" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="2"/>
  <text x="660" y="85" text-anchor="middle" font-size="14" font-weight="bold" fill="#ef4444">The Catch</text>
  <text x="660" y="108" text-anchor="middle" font-size="12" fill="#cbd5e1">A 2% adverse move wipes out</text>
  <text x="660" y="126" text-anchor="middle" font-size="12" fill="#cbd5e1">100% of that $1,000 margin —</text>
  <text x="660" y="144" text-anchor="middle" font-size="12" fill="#cbd5e1">leverage amplifies losses exactly</text>
  <text x="660" y="162" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">as much as it amplifies gains</text>

  <!-- Regulatory table -->
  <text x="450" y="205" text-anchor="middle" font-size="15" font-weight="bold" fill="#e2e8f0">Real Regulatory Leverage Caps (Major FX Pairs)</text>

  <g font-size="12.5">
    <rect x="100" y="220" width="700" height="34" fill="#334155"/>
    <text x="150" y="242" font-weight="bold" fill="#e2e8f0">Regulator</text>
    <text x="400" y="242" font-weight="bold" fill="#e2e8f0">Region</text>
    <text x="620" y="242" font-weight="bold" fill="#e2e8f0">Max Leverage</text>

    <text x="150" y="272" fill="#cbd5e1">CFTC / NFA</text>
    <text x="400" y="272" fill="#cbd5e1">United States</text>
    <text x="620" y="272" fill="#3b82f6" font-weight="bold">50:1</text>

    <text x="150" y="298" fill="#cbd5e1">ESMA</text>
    <text x="400" y="298" fill="#cbd5e1">European Union</text>
    <text x="620" y="298" fill="#3b82f6" font-weight="bold">30:1</text>

    <text x="150" y="324" fill="#cbd5e1">FCA</text>
    <text x="400" y="324" fill="#cbd5e1">United Kingdom</text>
    <text x="620" y="324" fill="#3b82f6" font-weight="bold">30:1</text>

    <text x="150" y="350" fill="#cbd5e1">ASIC</text>
    <text x="400" y="350" fill="#cbd5e1">Australia</text>
    <text x="620" y="350" fill="#3b82f6" font-weight="bold">30:1</text>
  </g>

  <!-- Why capped -->
  <rect x="70" y="380" width="760" height="90" rx="10" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="1.5"/>
  <text x="450" y="405" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#fde68a">Why Regulators Cap It</text>
  <text x="450" y="428" text-anchor="middle" font-size="11.5" fill="#fde68a">ESMA's own 2018 analysis found 74–89% of retail CFD accounts lose money, with average losses</text>
  <text x="450" y="446" text-anchor="middle" font-size="11.5" fill="#fde68a">of €1,600–€29,000 per client — the direct evidence behind the EU's 30:1 cap.</text>
  <text x="450" y="464" text-anchor="middle" font-size="11.5" fill="#fde68a">This isn't a guess — it's documented, regulator-published outcome data.</text>

  <!-- Academic finding -->
  <rect x="70" y="485" width="760" height="100" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2"/>
  <text x="450" y="510" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#22c55e">What Happened When the US Actually Capped Leverage (2010)</text>
  <text x="450" y="533" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Heimer &amp; Simsek (2019), Journal of Financial Economics — a natural-experiment study comparing</text>
  <text x="450" y="551" text-anchor="middle" font-size="11.5" fill="#cbd5e1">US traders (newly capped at 50:1) against otherwise-similar European traders (uncapped) found the</text>
  <text x="450" y="569" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#22c55e">cap reduced high-leverage traders' losses by 40% — real, measured, causal evidence.</text>
</svg>
`,
  'forex-ch1-major-minor-exotic-pairs': `
<svg viewBox="0 0 900 560" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="560" fill="#0f172a"/>
  <text x="450" y="38" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">Major, Minor &amp; Exotic Currency Pairs</text>

  <!-- Major -->
  <rect x="40" y="65" width="260" height="150" rx="12" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="2"/>
  <text x="170" y="92" text-anchor="middle" font-size="16" font-weight="bold" fill="#3b82f6">Major Pairs</text>
  <text x="170" y="114" text-anchor="middle" font-size="11.5" fill="#cbd5e1">USD + another major currency</text>
  <text x="170" y="134" text-anchor="middle" font-size="11" fill="#cbd5e1">EUR/USD · USD/JPY · GBP/USD</text>
  <text x="170" y="152" text-anchor="middle" font-size="11" fill="#cbd5e1">USD/CAD · AUD/USD · USD/CHF</text>
  <text x="170" y="180" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">Highest liquidity,</text>
  <text x="170" y="197" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">tightest spreads</text>

  <!-- Minor / Cross -->
  <rect x="320" y="65" width="260" height="150" rx="12" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2"/>
  <text x="450" y="92" text-anchor="middle" font-size="16" font-weight="bold" fill="#22c55e">Minor Pairs (Cross Pairs)</text>
  <text x="450" y="114" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Two major currencies, no USD</text>
  <text x="450" y="134" text-anchor="middle" font-size="11" fill="#cbd5e1">EUR/GBP · GBP/JPY · CAD/JPY</text>
  <text x="450" y="152" text-anchor="middle" font-size="11" fill="#cbd5e1">EUR/JPY</text>
  <text x="450" y="180" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">Moderate liquidity,</text>
  <text x="450" y="197" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">wider spreads than majors</text>

  <!-- Exotic -->
  <rect x="600" y="65" width="260" height="150" rx="12" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="2"/>
  <text x="730" y="92" text-anchor="middle" font-size="16" font-weight="bold" fill="#ef4444">Exotic Pairs</text>
  <text x="730" y="114" text-anchor="middle" font-size="11.5" fill="#cbd5e1">A major + emerging-market currency</text>
  <text x="730" y="134" text-anchor="middle" font-size="11" fill="#cbd5e1">USD/MXN · USD/TRY · USD/ZAR</text>
  <text x="730" y="152" text-anchor="middle" font-size="11" fill="#cbd5e1">USD/PLN</text>
  <text x="730" y="180" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">Lowest liquidity,</text>
  <text x="730" y="197" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">widest spreads, most volatile</text>

  <!-- Ranking table -->
  <text x="450" y="255" text-anchor="middle" font-size="16" font-weight="bold" fill="#e2e8f0">Actual Ranking — 2025 BIS Triennial Survey</text>
  <text x="450" y="275" text-anchor="middle" font-size="11.5" font-style="italic" fill="#94a3b8">Share of global FX turnover, April 2025</text>

  <g font-size="12.5">
    <text x="120" y="305" fill="#cbd5e1" font-weight="bold">1. EUR/USD</text>
    <text x="280" y="305" fill="#3b82f6" font-weight="bold">21.2%</text>
    <text x="450" y="305" fill="#cbd5e1" font-weight="bold">2. USD/JPY</text>
    <text x="610" y="305" fill="#3b82f6" font-weight="bold">14.3%</text>

    <text x="120" y="335" fill="#cbd5e1" font-weight="bold">3. USD/CNY</text>
    <text x="280" y="335" fill="#eab308" font-weight="bold">8.1%</text>
    <text x="450" y="335" fill="#cbd5e1" font-weight="bold">4. GBP/USD</text>
    <text x="610" y="335" fill="#3b82f6" font-weight="bold">7.6%</text>

    <text x="120" y="365" fill="#cbd5e1" font-weight="bold">5. USD/CAD</text>
    <text x="280" y="365" fill="#3b82f6" font-weight="bold">5.3%</text>
    <text x="450" y="365" fill="#cbd5e1" font-weight="bold">6. AUD/USD</text>
    <text x="610" y="365" fill="#3b82f6" font-weight="bold">4.9%</text>

    <text x="120" y="395" fill="#cbd5e1" font-weight="bold">7. USD/CHF</text>
    <text x="280" y="395" fill="#3b82f6" font-weight="bold">4.9%</text>
  </g>

  <rect x="90" y="415" width="720" height="45" rx="8" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="1.2"/>
  <text x="450" y="443" text-anchor="middle" font-size="11.5" fill="#fde68a" font-weight="bold">Notable shift: USD/CNY (yuan) has overtaken GBP/USD as the 3rd most-traded pair — up from just 0.8% in 2010.</text>

  <!-- Nicknames -->
  <text x="450" y="490" text-anchor="middle" font-size="15" font-weight="bold" fill="#e2e8f0">A Few Nicknames You'll Hear</text>
  <text x="450" y="512" text-anchor="middle" font-size="11.5" fill="#cbd5e1">GBP/USD = "Cable" (1866 transatlantic telegraph)  ·  USD/CAD = "Loonie" (1987 loon coin)</text>
  <text x="450" y="530" text-anchor="middle" font-size="11.5" fill="#cbd5e1">AUD/USD = "Aussie"  ·  USD/CHF = "Swissy"  ·  NZD/USD = "Kiwi"</text>
</svg>
`,
  'forex-ch1-majors-minors-cross-pairs': `
<svg viewBox="0 0 900 560" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="560" fill="#0f172a"/>
  <text x="450" y="38" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">Not All Currencies Are Equally Liquid</text>

  <!-- Liquidity bars -->
  <text x="80" y="70" font-size="13" font-weight="bold" fill="#e2e8f0">Share of global FX trades currency appears in (2025 BIS data)</text>

  <text x="80" y="95" font-size="12" fill="#cbd5e1">USD</text>
  <rect x="120" y="82" width="620" height="18" rx="3" fill="#3b82f6"/>
  <text x="750" y="96" font-size="11" fill="#cbd5e1">~89%</text>

  <text x="80" y="120" font-size="12" fill="#cbd5e1">EUR</text>
  <rect x="120" y="107" width="215" height="18" rx="3" fill="#2563eb"/>
  <text x="345" y="121" font-size="11" fill="#cbd5e1">~31%</text>

  <text x="80" y="145" font-size="12" fill="#cbd5e1">JPY</text>
  <rect x="120" y="132" width="135" height="18" rx="3" fill="#3b82f6"/>
  <text x="265" y="146" font-size="11" fill="#cbd5e1">~17%</text>

  <text x="80" y="170" font-size="12" fill="#cbd5e1">GBP</text>
  <rect x="120" y="157" width="90" height="18" rx="3" fill="#60a5fa"/>
  <text x="220" y="171" font-size="11" fill="#cbd5e1">~13%</text>

  <text x="450" y="195" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">USD appears in ~89% of all trades — roughly 3x more often than EUR, the next most liquid.</text>

  <!-- Major pairs with nicknames -->
  <text x="450" y="230" text-anchor="middle" font-size="15" font-weight="bold" fill="#e2e8f0">Major Pairs — and Their Nicknames</text>

  <g font-size="11.5">
    <rect x="70" y="245" width="150" height="42" rx="6" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.2"/>
    <text x="145" y="263" text-anchor="middle" font-weight="bold" fill="#e2e8f0">EUR/USD</text>
    <text x="145" y="279" text-anchor="middle" fill="#94a3b8">"Fiber"</text>

    <rect x="235" y="245" width="150" height="42" rx="6" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.2"/>
    <text x="310" y="263" text-anchor="middle" font-weight="bold" fill="#e2e8f0">GBP/USD</text>
    <text x="310" y="279" text-anchor="middle" fill="#94a3b8">"Cable"</text>

    <rect x="400" y="245" width="150" height="42" rx="6" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.2"/>
    <text x="475" y="263" text-anchor="middle" font-weight="bold" fill="#e2e8f0">USD/JPY</text>
    <text x="475" y="279" text-anchor="middle" fill="#94a3b8">(no common nickname)</text>

    <rect x="565" y="245" width="150" height="42" rx="6" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.2"/>
    <text x="640" y="263" text-anchor="middle" font-weight="bold" fill="#e2e8f0">USD/CHF</text>
    <text x="640" y="279" text-anchor="middle" fill="#94a3b8">"Swissie"</text>

    <rect x="150" y="297" width="150" height="42" rx="6" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.2"/>
    <text x="225" y="315" text-anchor="middle" font-weight="bold" fill="#e2e8f0">USD/CAD</text>
    <text x="225" y="331" text-anchor="middle" fill="#94a3b8">"Loonie"</text>

    <rect x="315" y="297" width="150" height="42" rx="6" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.2"/>
    <text x="390" y="315" text-anchor="middle" font-weight="bold" fill="#e2e8f0">AUD/USD</text>
    <text x="390" y="331" text-anchor="middle" fill="#94a3b8">"Aussie"</text>

    <rect x="480" y="297" width="150" height="42" rx="6" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.2"/>
    <text x="555" y="315" text-anchor="middle" font-weight="bold" fill="#e2e8f0">NZD/USD</text>
    <text x="555" y="331" text-anchor="middle" fill="#94a3b8">"Kiwi"</text>
  </g>

  <!-- Minors and cross pairs -->
  <text x="450" y="380" text-anchor="middle" font-size="15" font-weight="bold" fill="#e2e8f0">Minor Currencies vs. Cross Pairs</text>

  <rect x="60" y="395" width="360" height="90" rx="10" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="1.5"/>
  <text x="240" y="418" text-anchor="middle" font-size="13" font-weight="bold" fill="#fde68a">Minor Currency (e.g. MXN)</text>
  <text x="240" y="440" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Not one of the majors — generally</text>
  <text x="240" y="457" text-anchor="middle" font-size="11.5" fill="#cbd5e1">quoted against USD, e.g. USD/MXN</text>
  <text x="240" y="474" text-anchor="middle" font-size="11.5" fill="#cbd5e1">— not against another minor.</text>

  <rect x="480" y="395" width="360" height="90" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="1.5"/>
  <text x="660" y="418" text-anchor="middle" font-size="13" font-weight="bold" fill="#22c55e">Cross Pair (e.g. CAD/JPY)</text>
  <text x="660" y="440" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Any pair that does NOT include</text>
  <text x="660" y="457" text-anchor="middle" font-size="11.5" fill="#cbd5e1">the US dollar at all — both sides</text>
  <text x="660" y="474" text-anchor="middle" font-size="11.5" fill="#cbd5e1">are major currencies, just not USD.</text>

  <text x="450" y="520" text-anchor="middle" font-size="12" fill="#cbd5e1">You won't find MXN/JPY quoted directly — thin liquidity means it isn't traded that way.</text>
  <text x="450" y="540" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">Source: Bank for International Settlements, Triennial Central Bank Survey, April 2025</text>
</svg>
`,
  'forex-ch1-order-types-snb-case-study': `
<svg viewBox="0 0 900 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="620" fill="#0f172a"/>
  <text x="450" y="38" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">Order Types &amp; the Limits of a Stop-Loss</text>

  <!-- Order type row -->
  <rect x="40" y="60" width="195" height="95" rx="10" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="2"/>
  <text x="137" y="85" text-anchor="middle" font-size="13" font-weight="bold" fill="#3b82f6">Market Order</text>
  <text x="137" y="106" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Guarantees execution,</text>
  <text x="137" y="122" text-anchor="middle" font-size="10.5" fill="#cbd5e1">not price</text>
  <text x="137" y="142" text-anchor="middle" font-size="10" font-style="italic" fill="#94a3b8">Fills now, at whatever</text>

  <rect x="245" y="60" width="195" height="95" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2"/>
  <text x="342" y="85" text-anchor="middle" font-size="13" font-weight="bold" fill="#22c55e">Limit Order</text>
  <text x="342" y="106" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Guarantees price,</text>
  <text x="342" y="122" text-anchor="middle" font-size="10.5" fill="#cbd5e1">not execution</text>
  <text x="342" y="142" text-anchor="middle" font-size="10" font-style="italic" fill="#94a3b8">May never fill</text>

  <rect x="450" y="60" width="195" height="95" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="2"/>
  <text x="547" y="85" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">Stop Order</text>
  <text x="547" y="106" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Becomes a market order</text>
  <text x="547" y="122" text-anchor="middle" font-size="10.5" fill="#cbd5e1">once triggered</text>
  <text x="547" y="142" text-anchor="middle" font-size="10" font-style="italic" fill="#94a3b8">Same guarantee as market</text>

  <rect x="655" y="60" width="205" height="95" rx="10" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="2"/>
  <text x="757" y="85" text-anchor="middle" font-size="13" font-weight="bold" fill="#fde68a">Stop-Limit / Trailing</text>
  <text x="757" y="106" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Refinements — price</text>
  <text x="757" y="122" text-anchor="middle" font-size="10.5" fill="#cbd5e1">control or dynamic exit</text>
  <text x="757" y="142" text-anchor="middle" font-size="10" font-style="italic" fill="#94a3b8">Still can fail to fill</text>

  <!-- Case study -->
  <text x="450" y="195" text-anchor="middle" font-size="16" font-weight="bold" fill="#e2e8f0">Case Study: When Stop-Losses Didn't Work</text>
  <text x="450" y="216" text-anchor="middle" font-size="12.5" fill="#cbd5e1">EUR/CHF, January 15, 2015 — the Swiss National Bank removes its 1.20 floor, without warning</text>

  <rect x="80" y="235" width="740" height="80" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="2"/>
  <text x="450" y="260" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">Price fell from 1.20 to as low as 0.85 — in minutes</text>
  <text x="450" y="282" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Stop-loss orders correctly triggered — then converted to market orders and searched</text>
  <text x="450" y="299" text-anchor="middle" font-size="11.5" fill="#cbd5e1">for a buyer. There wasn't one nearby. Orders filled far below where they were set.</text>

  <line x1="450" y1="320" x2="450" y2="345" stroke="#64748b" stroke-width="2" stroke-dasharray="4,3"/>

  <rect x="80" y="350" width="740" height="115" rx="10" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
  <text x="450" y="375" text-anchor="middle" font-size="13" font-weight="bold" fill="#e2e8f0">The Real Cost</text>
  <text x="450" y="398" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Alpari UK declared insolvency the same day. FXCM absorbed $225 million in client losses</text>
  <text x="450" y="416" text-anchor="middle" font-size="11.5" fill="#cbd5e1">and needed an emergency bailout to survive. Many individual traders owed their brokers</text>
  <text x="450" y="434" text-anchor="middle" font-size="11.5" fill="#cbd5e1">more than their entire account balance — a negative balance, from a single trade.</text>
  <text x="450" y="454" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">This is precisely why negative balance protection is now a regulatory requirement.</text>

  <!-- Balancing note -->
  <rect x="80" y="480" width="740" height="90" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="1.5"/>
  <text x="450" y="505" text-anchor="middle" font-size="13" font-weight="bold" fill="#22c55e">This Is the Exception, Not the Rule</text>
  <text x="450" y="528" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Academic research tracking real retail futures orders end-to-end found execution is</text>
  <text x="450" y="546" text-anchor="middle" font-size="11.5" fill="#cbd5e1">generally fast and not systematically biased against retail traders. Catastrophic gaps like</text>
  <text x="450" y="564" text-anchor="middle" font-size="11.5" fill="#cbd5e1">the SNB event are rare — but rare doesn't mean irrelevant to how you manage risk.</text>
</svg>
`,
  'forex-ch1-position-sizing': `
<svg viewBox="0 0 900 560" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="560" fill="#0f172a"/>
  <text x="450" y="38" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">The Position Sizing Formula</text>

  <!-- Formula flow -->
  <rect x="40" y="65" width="190" height="80" rx="10" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="2"/>
  <text x="135" y="92" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#3b82f6">Account Balance</text>
  <text x="135" y="112" text-anchor="middle" font-size="16" font-weight="bold" fill="#e2e8f0">$10,000</text>
  <text x="135" y="130" text-anchor="middle" font-size="10.5" fill="#94a3b8"> x  1% risk = $100</text>

  <text x="245" y="112" text-anchor="middle" font-size="22" fill="#64748b"> / </text>

  <rect x="270" y="65" width="190" height="80" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="2"/>
  <text x="365" y="92" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#ef4444">Stop-Loss Distance</text>
  <text x="365" y="112" text-anchor="middle" font-size="16" font-weight="bold" fill="#e2e8f0">50 pips</text>
  <text x="365" y="130" text-anchor="middle" font-size="10.5" fill="#94a3b8">from Chapter 2, Lesson 2</text>

  <text x="475" y="112" text-anchor="middle" font-size="22" fill="#64748b"> x </text>

  <rect x="500" y="65" width="190" height="80" rx="10" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="2"/>
  <text x="595" y="92" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#fde68a">Pip Value</text>
  <text x="595" y="112" text-anchor="middle" font-size="16" font-weight="bold" fill="#e2e8f0">$10 / lot</text>
  <text x="595" y="130" text-anchor="middle" font-size="10.5" fill="#94a3b8">from Chapter 1, Lesson 4</text>

  <text x="450" y="180" text-anchor="middle" font-size="14" fill="#cbd5e1">Lot Size = (Account Balance  x  Risk %)  /  (Stop-Loss Pips  x  Pip Value)</text>

  <line x1="450" y1="195" x2="450" y2="225" stroke="#22c55e" stroke-width="3" marker-end="url(#arrowDown2)"/>
  <defs>
    <marker id="arrowDown2" markerWidth="10" markerHeight="10" refX="3" refY="6" orient="auto">
      <path d="M0,0 L6,0 L3,6 z" fill="#22c55e"/>
    </marker>
  </defs>

  <rect x="280" y="235" width="340" height="80" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2.5"/>
  <text x="450" y="265" text-anchor="middle" font-size="14" font-weight="bold" fill="#22c55e">Result: 0.2 standard lots</text>
  <text x="450" y="285" text-anchor="middle" font-size="12" fill="#cbd5e1">(20,000 units — 2 mini lots)</text>
  <text x="450" y="303" text-anchor="middle" font-size="11" fill="#94a3b8">Max loss if stopped out: exactly $100 (1%)</text>

  <!-- Kelly section -->
  <line x1="450" y1="340" x2="450" y2="365" stroke="#64748b" stroke-width="2" stroke-dasharray="4,3"/>

  <rect x="80" y="370" width="740" height="165" rx="10" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
  <text x="450" y="398" text-anchor="middle" font-size="14.5" font-weight="bold" fill="#e2e8f0">Why a Fixed Percentage — Not the "Mathematically Optimal" Size?</text>
  <text x="450" y="422" text-anchor="middle" font-size="11.5" fill="#cbd5e1">The Kelly Criterion (Kelly, 1956, Bell System Technical Journal) calculates the</text>
  <text x="450" y="440" text-anchor="middle" font-size="11.5" fill="#cbd5e1">mathematically optimal bet size for long-term growth — but it requires precisely</text>
  <text x="450" y="458" text-anchor="middle" font-size="11.5" fill="#cbd5e1">knowing your real win rate and reward-to-risk ratio, which beginners never have.</text>
  <text x="450" y="480" text-anchor="middle" font-size="11.5" fill="#cbd5e1">"Full Kelly" is also known to produce 50–80% drawdowns even with a real edge.</text>
  <text x="450" y="504" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#fde68a">A small, fixed risk percentage is the practical, beginner-safe version of the same idea.</text>
  <text x="450" y="524" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">Even professionals typically use "fractional Kelly" — a quarter or half of the full formula.</text>
</svg>
`,
  'forex-ch2-central-banks-rates': `
<svg viewBox="0 0 900 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="620" fill="#0f172a"/>
  <text x="450" y="36" text-anchor="middle" font-size="20" font-weight="bold" fill="#e2e8f0">How Interest Rates Move a Currency - the Chain, and the Catch</text>

  <text x="450" y="70" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#3b82f6">The Standard Transmission Chain</text>

  <rect x="40" y="85" width="180" height="70" rx="9" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.8"/>
  <text x="130" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="#3b82f6">Central bank</text>
  <text x="130" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="#3b82f6">raises rates</text>
  <text x="130" y="146" text-anchor="middle" font-size="9.5" fill="#94a3b8">to cool inflation</text>

  <rect x="250" y="85" width="180" height="70" rx="9" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.8"/>
  <text x="340" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="#3b82f6">Higher return on</text>
  <text x="340" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="#3b82f6">that currency</text>
  <text x="340" y="146" text-anchor="middle" font-size="9.5" fill="#94a3b8">attracts capital</text>

  <rect x="460" y="85" width="180" height="70" rx="9" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.8"/>
  <text x="550" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="#3b82f6">Demand for the</text>
  <text x="550" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="#3b82f6">currency rises</text>
  <text x="550" y="146" text-anchor="middle" font-size="9.5" fill="#94a3b8">investors must buy it</text>

  <rect x="670" y="85" width="190" height="70" rx="9" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="1.8"/>
  <text x="765" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="#22c55e">Currency tends</text>
  <text x="765" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="#22c55e">to appreciate</text>
  <text x="765" y="146" text-anchor="middle" font-size="9.5" fill="#94a3b8">the textbook result</text>

  <line x1="220" y1="120" x2="248" y2="120" stroke="#64748b" stroke-width="2"/>
  <line x1="430" y1="120" x2="458" y2="120" stroke="#64748b" stroke-width="2"/>
  <line x1="640" y1="120" x2="668" y2="120" stroke="#64748b" stroke-width="2"/>

  <text x="450" y="195" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#e2e8f0">What Traders Watch: Expectations, Not Just the Rate</text>

  <rect x="70" y="210" width="360" height="90" rx="9" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="1.5"/>
  <text x="250" y="234" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#ef4444">Hawkish</text>
  <text x="250" y="256" text-anchor="middle" font-size="11" fill="#cbd5e1">Favours higher rates to fight inflation.</text>
  <text x="250" y="274" text-anchor="middle" font-size="11" fill="#cbd5e1">Hawkish surprise: currency often rises.</text>
  <text x="250" y="292" text-anchor="middle" font-size="9.5" font-style="italic" fill="#94a3b8">Hawks hunt inflation.</text>

  <rect x="470" y="210" width="360" height="90" rx="9" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="650" y="234" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#3b82f6">Dovish</text>
  <text x="650" y="256" text-anchor="middle" font-size="11" fill="#cbd5e1">Favours lower rates to boost growth.</text>
  <text x="650" y="274" text-anchor="middle" font-size="11" fill="#cbd5e1">Dovish surprise: currency often falls.</text>
  <text x="650" y="292" text-anchor="middle" font-size="9.5" font-style="italic" fill="#94a3b8">Doves want easy money.</text>

  <rect x="140" y="315" width="620" height="48" rx="8" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="1.4"/>
  <text x="450" y="337" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#fde68a">Key idea: an expected hike is priced in before it happens.</text>
  <text x="450" y="354" text-anchor="middle" font-size="11" fill="#fde68a">Big moves come from surprises: when the bank confounds what the market expected.</text>

  <rect x="70" y="385" width="760" height="205" rx="10" fill="#1e293b" stroke="#64748b" stroke-width="1.3"/>
  <text x="450" y="410" text-anchor="middle" font-size="14" font-weight="bold" fill="#e2e8f0">The Catch: The Real Evidence Is Messier Than the Chain</text>

  <text x="450" y="437" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Uncovered Interest Parity (UIP) predicts a high-rate currency should later DEPRECIATE by just enough</text>
  <text x="450" y="454" text-anchor="middle" font-size="11.5" fill="#cbd5e1">to cancel the interest advantage, so no free lunch. That is the clean theory.</text>

  <text x="450" y="480" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ef4444">But decades of data show the opposite short-term: high-rate currencies have often kept APPRECIATING.</text>
  <text x="450" y="497" text-anchor="middle" font-size="11" fill="#cbd5e1">This is the forward premium puzzle (Fama, 1984), one of the most robust anomalies in the field.</text>

  <text x="450" y="523" text-anchor="middle" font-size="11" fill="#cbd5e1">It is why the carry trade (buy high-rate, fund with low-rate) has historically paid, but the returns</text>
  <text x="450" y="540" text-anchor="middle" font-size="11" fill="#cbd5e1">behave like compensation for risk: they collapse in global volatility spikes (Menkhoff et al., 2012).</text>

  <text x="450" y="567" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#22c55e">Takeaway: higher rates = stronger currency is a useful instinct, not a reliable rule.</text>
  <text x="450" y="583" text-anchor="middle" font-size="10" font-style="italic" fill="#94a3b8">Direction, timing, and whether it is already priced in all matter more than the raw rate.</text>
</svg>
`,
  'forex-ch2-economic-calendar': `
<svg viewBox="0 0 900 640" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="640" fill="#0f172a"/>
  <text x="450" y="36" text-anchor="middle" font-size="20" font-weight="bold" fill="#e2e8f0">Reading an Economic Calendar Entry</text>

  <text x="450" y="66" text-anchor="middle" font-size="12.5" font-style="italic" fill="#94a3b8">Every entry answers four questions: which currency, when, how much it matters, and what was expected</text>

  <rect x="50" y="85" width="800" height="120" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>

  <line x1="50" y1="118" x2="850" y2="118" stroke="#334155" stroke-width="1.5"/>
  <text x="95" y="108" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#e2e8f0">TIME</text>
  <text x="185" y="108" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#e2e8f0">CURRENCY</text>
  <text x="290" y="108" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#e2e8f0">IMPACT</text>
  <text x="430" y="108" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#e2e8f0">EVENT</text>
  <text x="600" y="108" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#e2e8f0">ACTUAL</text>
  <text x="700" y="108" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#e2e8f0">FORECAST</text>
  <text x="800" y="108" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#e2e8f0">PREVIOUS</text>

  <text x="95" y="148" text-anchor="middle" font-size="11.5" fill="#cbd5e1">10:00am</text>
  <text x="185" y="148" text-anchor="middle" font-size="12" font-weight="bold" fill="#3b82f6">CAD</text>
  <rect x="255" y="136" width="70" height="17" rx="4" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="1.2"/>
  <text x="290" y="149" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#ef4444">HIGH</text>
  <text x="430" y="148" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Overnight Rate</text>
  <text x="600" y="148" text-anchor="middle" font-size="11.5" font-style="italic" fill="#64748b">pending</text>
  <text x="700" y="148" text-anchor="middle" font-size="11.5" fill="#cbd5e1">1.75%</text>
  <text x="800" y="148" text-anchor="middle" font-size="11.5" fill="#cbd5e1">1.75%</text>

  <text x="450" y="180" text-anchor="middle" font-size="11" fill="#94a3b8">Forecast equals previous, so no change is expected. If the actual arrives at 1.75%, reaction is usually muted.</text>
  <text x="450" y="196" text-anchor="middle" font-size="11" font-weight="bold" fill="#ef4444">The violent move comes if ACTUAL differs from FORECAST.</text>

  <text x="450" y="240" text-anchor="middle" font-size="14" font-weight="bold" fill="#e2e8f0">Impact Colour = How Much Room You Should Give It</text>

  <rect x="80" y="255" width="230" height="80" rx="9" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="1.5"/>
  <text x="195" y="278" text-anchor="middle" font-size="12" font-weight="bold" fill="#fde68a">LOW (yellow)</text>
  <text x="195" y="299" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Minor data. Rarely moves price</text>
  <text x="195" y="315" text-anchor="middle" font-size="10.5" fill="#cbd5e1">much on its own.</text>

  <rect x="335" y="255" width="230" height="80" rx="9" fill="rgba(239,68,68,0.12)" stroke="#eab308" stroke-width="1.5"/>
  <text x="450" y="278" text-anchor="middle" font-size="12" font-weight="bold" fill="#eab308">MEDIUM (orange)</text>
  <text x="450" y="299" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Can move price, especially if</text>
  <text x="450" y="315" text-anchor="middle" font-size="10.5" fill="#cbd5e1">it surprises.</text>

  <rect x="590" y="255" width="230" height="80" rx="9" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="2"/>
  <text x="705" y="278" text-anchor="middle" font-size="12" font-weight="bold" fill="#ef4444">HIGH (red)</text>
  <text x="705" y="299" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Rate decisions, CPI, jobs data.</text>
  <text x="705" y="315" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ef4444">Beginners: stay flat through these.</text>

  <rect x="60" y="360" width="780" height="115" rx="10" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="450" y="385" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#3b82f6">What the Research Actually Found</text>
  <text x="450" y="409" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Andersen, Bollerslev, Diebold and Vega (2003), American Economic Review, studied six years of</text>
  <text x="450" y="426" text-anchor="middle" font-size="11.5" fill="#cbd5e1">real-time FX quotes against forecasts and outcomes. Announcement SURPRISES produce immediate</text>
  <text x="450" y="443" text-anchor="middle" font-size="11.5" fill="#cbd5e1">jumps in exchange rates. The announcement alone does not - the gap versus expectation does.</text>
  <text x="450" y="464" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ef4444">They also found an asymmetry: bad news moves the market more than equally-sized good news.</text>

  <rect x="60" y="495" width="780" height="120" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="1.5"/>
  <text x="450" y="520" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#22c55e">The Beginner Workflow</text>
  <text x="450" y="544" text-anchor="middle" font-size="11.5" fill="#cbd5e1">1. Check the calendar before every session. 2. Find high-impact events for BOTH currencies in your pair.</text>
  <text x="450" y="561" text-anchor="middle" font-size="11.5" fill="#cbd5e1">3. Do not hold a position through them while learning. 4. Watch what happens instead: the surprise,</text>
  <text x="450" y="578" text-anchor="middle" font-size="11.5" fill="#cbd5e1">then price after 5 min, 1 hour, 1 day. 5. Build your own record of how each event type behaves.</text>
  <text x="450" y="601" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">Avoidance now is not permanent. It is how you earn the knowledge to trade these events later.</text>
</svg>
`,
  'forex-ch2-meanreversion-evidence': `
<svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="600" fill="#0f172a"/>
  <text x="450" y="36" text-anchor="middle" font-size="21" font-weight="bold" fill="#e2e8f0">Mean Reversion Tools — and What the Evidence Says</text>

  <!-- Bollinger panel -->
  <rect x="40" y="55" width="400" height="240" rx="10" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="240" y="80" text-anchor="middle" font-size="14" font-weight="bold" fill="#3b82f6">Bollinger Bands (20-SMA +/- 2 SD)</text>
  <path d="M 70 130 C 130 125, 200 135, 260 130 C 320 125, 380 130, 410 128" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="6,4"/>
  <path d="M 70 175 C 130 172, 200 178, 260 174 C 320 171, 380 175, 410 173" fill="none" stroke="#64748b" stroke-width="2"/>
  <path d="M 70 220 C 130 217, 200 223, 260 219 C 320 216, 380 220, 410 218" fill="none" stroke="#22c55e" stroke-width="2" stroke-dasharray="6,4"/>
  <polyline points="80,180 110,150 140,132 170,160 200,190 230,215 260,200 290,168 320,135 350,158 380,185" fill="none" stroke="#cbd5e1" stroke-width="2"/>
  <text x="425" y="132" font-size="9.5" fill="#ef4444">upper</text>
  <text x="425" y="177" font-size="9.5" fill="#64748b">20 SMA</text>
  <text x="425" y="222" font-size="9.5" fill="#22c55e">lower</text>
  <text x="240" y="252" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Normal distribution: ~68% within 1 SD, ~95% within 2 SD</text>
  <text x="240" y="272" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ef4444">But returns have FAT TAILS — extremes happen far</text>
  <text x="240" y="287" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ef4444">more often than the bell curve predicts (SNB 2015!)</text>

  <!-- RSI panel -->
  <rect x="460" y="55" width="400" height="240" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="1.5"/>
  <text x="660" y="80" text-anchor="middle" font-size="14" font-weight="bold" fill="#22c55e">RSI (14) — Overbought / Oversold</text>
  <line x1="490" y1="120" x2="830" y2="120" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="838" y="124" font-size="9.5" fill="#ef4444">70</text>
  <line x1="490" y1="230" x2="830" y2="230" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="838" y="234" font-size="9.5" fill="#22c55e">30</text>
  <polyline points="500,180 530,150 560,110 590,100 620,115 650,135 680,190 710,240 740,250 770,235 800,205" fill="none" stroke="#cbd5e1" stroke-width="2.5"/>
  <circle cx="620" cy="115" r="6" fill="#ef4444"/>
  <text x="620" y="103" text-anchor="middle" font-size="9" font-weight="bold" fill="#ef4444">exits zone -> short</text>
  <circle cx="770" cy="235" r="6" fill="#22c55e"/>
  <text x="770" y="262" text-anchor="middle" font-size="9" font-weight="bold" fill="#22c55e">exits zone -> buy</text>
  <text x="660" y="285" text-anchor="middle" font-size="10.5" font-style="italic" fill="#cbd5e1">Don't act on entering the zone — markets stay extreme for a long time. Wait for the exit.</text>

  <!-- Fibonacci evidence panel -->
  <text x="450" y="330" text-anchor="middle" font-size="15" font-weight="bold" fill="#e2e8f0">Fibonacci Retracement — the Claim vs. the Evidence</text>

  <rect x="60" y="345" width="380" height="150" rx="10" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="1.5"/>
  <text x="250" y="370" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#fde68a">The Claim</text>
  <text x="250" y="392" text-anchor="middle" font-size="10.5" fill="#fde68a">Prices retrace to "special" ratio levels derived</text>
  <text x="250" y="408" text-anchor="middle" font-size="10.5" fill="#fde68a">from the Fibonacci sequence: 23.6%, 38.2%,</text>
  <text x="250" y="424" text-anchor="middle" font-size="10.5" fill="#fde68a">50%*, 61.8%, 78.6%</text>
  <text x="250" y="448" text-anchor="middle" font-size="9.5" font-style="italic" fill="#fde68a">*50% isn't actually a Fibonacci ratio — added by convention</text>
  <text x="250" y="475" text-anchor="middle" font-size="10" fill="#fde68a">"What has been found is..." — even the lecturer</text>
  <text x="250" y="489" text-anchor="middle" font-size="10" fill="#fde68a">flags he didn't verify the research himself</text>

  <rect x="460" y="345" width="380" height="150" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="1.5"/>
  <text x="650" y="370" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#ef4444">The Peer-Reviewed Test</text>
  <text x="650" y="392" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Tsinaslanidis et al. (2022), Expert Systems with</text>
  <text x="650" y="408" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Applications — algorithmic test across Dow Jones,</text>
  <text x="650" y="424" text-anchor="middle" font-size="10.5" fill="#cbd5e1">NASDAQ &amp; DAX stocks:</text>
  <text x="650" y="450" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ef4444">Bounce probability at Fibonacci zones was</text>
  <text x="650" y="466" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ef4444">statistically indistinguishable from any other zone.</text>
  <text x="650" y="486" text-anchor="middle" font-size="9.5" font-style="italic" fill="#94a3b8">No support as a standalone rule.</text>

  <text x="450" y="530" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Honest takeaway: Fibonacci levels may still "work" as widely-watched zones (self-fulfilling attention),</text>
  <text x="450" y="548" text-anchor="middle" font-size="11.5" fill="#cbd5e1">but the ratios themselves carry no verified special power. Treat them as a map of where others look —</text>
  <text x="450" y="566" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#e2e8f0">never as a guarantee, and never as a substitute for a stop-loss.</text>
</svg>
`,
  'forex-ch2-multi-timeframe': `
<svg viewBox="0 0 900 660" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="660" fill="#0f172a"/>
  <text x="450" y="34" text-anchor="middle" font-size="20" font-weight="bold" fill="#e2e8f0">Multi-Timeframe Analysis: Top-Down</text>
  <text x="450" y="58" text-anchor="middle" font-size="12" font-style="italic" fill="#94a3b8">The same chart can look bullish and bearish at once. Sequence resolves the contradiction.</text>

  <rect x="60" y="78" width="780" height="86" rx="10" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="2"/>
  <text x="132" y="105" text-anchor="middle" font-size="13" font-weight="bold" fill="#3b82f6">1. LONG-TERM</text>
  <text x="132" y="123" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Weekly / Daily</text>
  <text x="450" y="105" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#e2e8f0">Establishes the DIRECTION you are allowed to trade</text>
  <text x="450" y="125" text-anchor="middle" font-size="11" fill="#cbd5e1">Filters out noise. Shows the dominant trend and major support/resistance.</text>
  <text x="450" y="145" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">Decide here FIRST, before looking at anything faster.</text>

  <text x="450" y="182" text-anchor="middle" font-size="16" fill="#64748b">|</text>

  <rect x="60" y="190" width="780" height="86" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2"/>
  <text x="132" y="217" text-anchor="middle" font-size="13" font-weight="bold" fill="#22c55e">2. MEDIUM-TERM</text>
  <text x="132" y="235" text-anchor="middle" font-size="10.5" fill="#cbd5e1">4-hour / 1-hour</text>
  <text x="450" y="217" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#e2e8f0">Finds the SETUP that agrees with that direction</text>
  <text x="450" y="237" text-anchor="middle" font-size="11" fill="#cbd5e1">Your main working chart. Matches how long you actually hold a trade.</text>
  <text x="450" y="257" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">If no setup agrees with the higher timeframe, there is no trade.</text>

  <text x="450" y="294" text-anchor="middle" font-size="16" fill="#64748b">|</text>

  <rect x="60" y="302" width="780" height="86" rx="10" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="2"/>
  <text x="132" y="329" text-anchor="middle" font-size="13" font-weight="bold" fill="#fde68a">3. SHORT-TERM</text>
  <text x="132" y="347" text-anchor="middle" font-size="10.5" fill="#cbd5e1">15-min / 5-min</text>
  <text x="450" y="329" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#e2e8f0">Times the ENTRY and places the stop</text>
  <text x="450" y="349" text-anchor="middle" font-size="11" fill="#cbd5e1">Sharper entry means a tighter stop, which means a smaller position risk.</text>
  <text x="450" y="369" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">Never used to pick direction. Only to refine execution.</text>

  <rect x="60" y="410" width="380" height="105" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="250" y="435" text-anchor="middle" font-size="13" font-weight="bold" fill="#3b82f6">The Rule of Four</text>
  <text x="250" y="458" text-anchor="middle" font-size="11" fill="#cbd5e1">Pick your MEDIUM timeframe first - it should</text>
  <text x="250" y="474" text-anchor="middle" font-size="11" fill="#cbd5e1">match your typical holding period.</text>
  <text x="250" y="494" text-anchor="middle" font-size="11" fill="#cbd5e1">Long = medium x4 or more. Short = medium / 4.</text>
  <text x="250" y="510" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">e.g. 15-min, 1-hour, 4-hour</text>

  <rect x="460" y="410" width="380" height="105" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="1.5"/>
  <text x="650" y="435" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">Why Exactly Three?</text>
  <text x="650" y="458" text-anchor="middle" font-size="11" fill="#cbd5e1">Fewer than three: you lose context and</text>
  <text x="650" y="474" text-anchor="middle" font-size="11" fill="#cbd5e1">trade against a trend you cannot see.</text>
  <text x="650" y="494" text-anchor="middle" font-size="11" fill="#cbd5e1">More than three: contradictory signals,</text>
  <text x="650" y="510" text-anchor="middle" font-size="11" fill="#cbd5e1">paralysis, and over-analysis.</text>

  <rect x="60" y="535" width="780" height="105" rx="10" fill="#1e293b" stroke="#64748b" stroke-width="1.3"/>
  <text x="450" y="559" text-anchor="middle" font-size="13" font-weight="bold" fill="#e2e8f0">The Honest Caution: Do Not Timeframe-Shop</text>
  <text x="450" y="582" text-anchor="middle" font-size="11" fill="#cbd5e1">Sullivan, Timmermann and White (1999, Journal of Finance) tested a huge universe of trading rules on</text>
  <text x="450" y="599" text-anchor="middle" font-size="11" fill="#cbd5e1">100 years of data. The best rule beat the benchmark in-sample - then failed in the following 10 years.</text>
  <text x="450" y="621" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ef4444">Searching timeframes until one confirms your bias is the same error, in miniature.</text>
</svg>
`,
  'forex-ch2-price-action': `
<svg viewBox="0 0 900 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="620" fill="#0f172a"/>
  <text x="450" y="34" text-anchor="middle" font-size="20" font-weight="bold" fill="#e2e8f0">Price Action: What the Chart Shows, and What the Evidence Supports</text>
  <text x="450" y="58" text-anchor="middle" font-size="12" font-style="italic" fill="#94a3b8">Read price directly (Lesson 1: an indicator only echoes price). Then weigh the evidence honestly.</text>

  <!-- ================= NAKED CHART PANEL ================= -->
  <rect x="40" y="78" width="820" height="300" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <text x="60" y="102" font-size="13" font-weight="bold" fill="#e2e8f0">The naked chart: candles and one drawn level, no indicators</text>

  <!-- Support line at a round number -->
  <line x1="70" y1="320" x2="720" y2="320" stroke="#22c55e" stroke-width="2.5" stroke-dasharray="8 5"/>
  <text x="726" y="316" font-size="11.5" font-weight="bold" fill="#22c55e">Support</text>
  <text x="726" y="331" font-size="11" fill="#22c55e">1.1000</text>
  <text x="726" y="345" font-size="9.5" font-style="italic" fill="#94a3b8">(round number)</text>

  <!-- Candlesticks: downtrend into support, then a reversal and bounce -->
  <!-- bearish = red #B23B2E, bullish = green #1E7A4C -->
  <!-- c1 --><line x1="110" y1="128" x2="110" y2="168" stroke="#ef4444" stroke-width="1.5"/><rect x="103" y="136" width="14" height="24" fill="#ef4444"/>
  <!-- c2 --><line x1="150" y1="150" x2="150" y2="190" stroke="#ef4444" stroke-width="1.5"/><rect x="143" y="158" width="14" height="26" fill="#ef4444"/>
  <!-- c3 --><line x1="190" y1="172" x2="190" y2="212" stroke="#ef4444" stroke-width="1.5"/><rect x="183" y="180" width="14" height="26" fill="#ef4444"/>
  <!-- c4 --><line x1="230" y1="196" x2="230" y2="238" stroke="#ef4444" stroke-width="1.5"/><rect x="223" y="204" width="14" height="28" fill="#ef4444"/>
  <!-- c5 --><line x1="270" y1="222" x2="270" y2="264" stroke="#ef4444" stroke-width="1.5"/><rect x="263" y="230" width="14" height="28" fill="#ef4444"/>
  <!-- c6 --><line x1="310" y1="250" x2="310" y2="292" stroke="#ef4444" stroke-width="1.5"/><rect x="303" y="258" width="14" height="28" fill="#ef4444"/>
  <!-- c7 reversal candle: small body, long lower wick piercing support --><line x1="350" y1="286" x2="350" y2="332" stroke="#eab308" stroke-width="1.5"/><rect x="343" y="300" width="14" height="12" fill="#eab308"/>
  <!-- c8 bullish --><line x1="390" y1="262" x2="390" y2="312" stroke="#22c55e" stroke-width="1.5"/><rect x="383" y="270" width="14" height="34" fill="#22c55e"/>
  <!-- c9 bullish --><line x1="430" y1="230" x2="430" y2="278" stroke="#22c55e" stroke-width="1.5"/><rect x="423" y="238" width="14" height="32" fill="#22c55e"/>
  <!-- c10 bullish --><line x1="470" y1="204" x2="470" y2="248" stroke="#22c55e" stroke-width="1.5"/><rect x="463" y="212" width="14" height="30" fill="#22c55e"/>

  <!-- reversal candle callout -->
  <line x1="350" y1="352" x2="350" y2="316" stroke="#fde68a" stroke-width="1.2"/>
  <text x="352" y="368" font-size="10.5" font-weight="bold" fill="#fde68a">reversal candle</text>
  <text x="352" y="382" font-size="9.5" font-style="italic" fill="#fde68a">a claim to test, not trust</text>

  <!-- order-flow mechanism annotation -->
  <text x="120" y="352" font-size="10.5" fill="#22c55e">Take-profit orders cluster at the level: price reverses.</text>
  <text x="120" y="368" font-size="10.5" fill="#ef4444">Stop-loss orders sit just below: a clean break would accelerate.</text>

  <!-- ================= EVIDENCE VERDICT STRIP ================= -->
  <text x="450" y="416" text-anchor="middle" font-size="14" font-weight="bold" fill="#e2e8f0">The honest verdict: the two halves of price action are not equally supported</text>

  <!-- Support/Resistance: strong -->
  <rect x="40" y="432" width="400" height="150" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2"/>
  <text x="60" y="458" font-size="14" font-weight="bold" fill="#22c55e">Support and Resistance</text>
  <text x="60" y="478" font-size="12" font-weight="bold" fill="#22c55e">Evidence: STRONG, and forex-specific</text>
  <text x="60" y="500" font-size="11" fill="#cbd5e1">Osler 2000 (NY Fed): published S/R levels helped</text>
  <text x="60" y="515" font-size="11" fill="#cbd5e1">predict intraday trend reversals, for at least 5 days.</text>
  <text x="60" y="536" font-size="11" fill="#cbd5e1">Osler 2003 (J. Finance): orders cluster at round</text>
  <text x="60" y="551" font-size="11" fill="#cbd5e1">numbers - the concrete mechanism behind the levels.</text>
  <text x="60" y="572" font-size="10.5" font-style="italic" fill="#22c55e">A tested effect with a known cause. Still a probability.</text>

  <!-- Candlestick patterns: contested -->
  <rect x="460" y="432" width="400" height="150" rx="10" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="2"/>
  <text x="480" y="458" font-size="14" font-weight="bold" fill="#fde68a">Candlestick Patterns</text>
  <text x="480" y="478" font-size="12" font-weight="bold" fill="#fde68a">Evidence: CONTESTED</text>
  <text x="480" y="500" font-size="11" fill="#cbd5e1">Caginalp and Laurent 1998: profitable on S&amp;P 500.</text>
  <text x="480" y="515" font-size="11" fill="#cbd5e1">Marshall, Young and Rose 2006: no value on the Dow.</text>
  <text x="480" y="536" font-size="11" fill="#cbd5e1">Same era, major US stocks, opposite conclusions -</text>
  <text x="480" y="551" font-size="11" fill="#cbd5e1">the result flips with the exit rule chosen.</text>
  <text x="480" y="572" font-size="10.5" font-style="italic" fill="#fde68a">Lesson 5's data-snooping warning, in a new place.</text>

  <text x="450" y="606" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">Weight each tool by the strength of its evidence - not by how confidently it is marketed.</text>
</svg>
`,
  'forex-ch2-sma-crossover': `
<svg viewBox="0 0 900 560" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="560" fill="#0f172a"/>
  <text x="450" y="38" text-anchor="middle" font-size="22" font-weight="bold" fill="#e2e8f0">Moving Averages &amp; the Crossover Signal</text>

  <!-- Rolling window worked example -->
  <text x="240" y="72" text-anchor="middle" font-size="14" font-weight="bold" fill="#e2e8f0">The Rolling Window (4-period SMA)</text>
  <rect x="45" y="85" width="390" height="150" rx="10" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.5"/>
  <g font-family="monospace" font-size="12.5">
    <text x="70" y="115" fill="#cbd5e1">Closes:  10   11   12   14   9</text>
    <rect x="118" y="100" width="150" height="20" rx="4" fill="none" stroke="#22c55e" stroke-width="2"/>
    <text x="70" y="145" fill="#22c55e">SMA day 5 = (10+11+12+14)/4 = 11.75</text>
    <rect x="155" y="152" width="150" height="20" rx="4" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,3"/>
    <text x="70" y="167" fill="#cbd5e1">Window slides ->   11   12   14   9</text>
    <text x="70" y="195" fill="#ef4444">SMA day 6 = (11+12+14+9)/4 = 11.50</text>
  </g>
  <text x="240" y="222" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">Oldest value drops out, newest enters — the average "moves"</text>

  <!-- Short vs long -->
  <text x="675" y="72" text-anchor="middle" font-size="14" font-weight="bold" fill="#e2e8f0">Short vs. Long Period</text>
  <rect x="490" y="85" width="370" height="150" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="1.5"/>
  <text x="675" y="112" text-anchor="middle" font-size="11.5" fill="#cbd5e1">20-period: each new candle = 1/20 of the data</text>
  <text x="675" y="130" text-anchor="middle" font-size="11.5" fill="#22c55e" font-weight="bold">-> reacts fast, follows price closely</text>
  <text x="675" y="158" text-anchor="middle" font-size="11.5" fill="#cbd5e1">50-period: each new candle = only 1/50 of the data</text>
  <text x="675" y="176" text-anchor="middle" font-size="11.5" fill="#3b82f6" font-weight="bold">-> smoother, slower, filters noise</text>
  <text x="675" y="205" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">Same math, different memory length</text>

  <!-- Crossover chart -->
  <text x="450" y="270" text-anchor="middle" font-size="15" font-weight="bold" fill="#e2e8f0">The 20/50 Crossover — Including the Losing Trades</text>
  <rect x="70" y="285" width="760" height="200" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>

  <!-- 50 SMA: slow smooth line -->
  <path d="M 100 340 C 200 335, 300 345, 400 370 C 500 395, 600 400, 700 385 C 750 377, 790 370, 810 365" fill="none" stroke="#3b82f6" stroke-width="3"/>
  <!-- 20 SMA: faster line crossing -->
  <path d="M 100 320 C 160 322, 220 350, 280 385 C 330 412, 380 420, 430 405 C 470 393, 490 370, 530 362 C 560 357, 580 370, 610 390 C 650 415, 700 430, 810 440" fill="none" stroke="#22c55e" stroke-width="3"/>

  <!-- Crossover markers -->
  <circle cx="262" cy="372" r="7" fill="#ef4444"/>
  <text x="262" y="360" text-anchor="middle" font-size="10" font-weight="bold" fill="#ef4444">SELL</text>
  <circle cx="512" cy="366" r="7" fill="#22c55e"/>
  <text x="512" y="354" text-anchor="middle" font-size="10" font-weight="bold" fill="#22c55e">BUY</text>
  <circle cx="596" cy="381" r="7" fill="#ef4444"/>
  <text x="596" y="404" text-anchor="middle" font-size="10" font-weight="bold" fill="#ef4444">SELL</text>

  <rect x="480" y="330" width="130" height="22" rx="4" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="1.2"/>
  <text x="545" y="345" text-anchor="middle" font-size="9.5" fill="#fde68a" font-weight="bold">whipsaw: quick loss</text>

  <text x="145" y="310" font-size="10.5" fill="#22c55e" font-weight="bold">20 SMA (fast)</text>
  <text x="145" y="470" font-size="10.5" fill="#3b82f6" font-weight="bold">50 SMA (slow)</text>

  <text x="450" y="510" text-anchor="middle" font-size="11.5" fill="#cbd5e1">Fast crossing below slow = recent prices weaker than older prices (sell signal); crossing above = buy signal.</text>
  <text x="450" y="530" text-anchor="middle" font-size="11.5" font-style="italic" fill="#fde68a">Sideways markets produce whipsaws — small losing trades are part of the system, not a malfunction.</text>
</svg>
`,
  'forex-ch3-margin-calls-leverage': `
<svg viewBox="0 0 900 610" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="610" fill="#0f172a"/>
  <text x="450" y="34" text-anchor="middle" font-size="20" font-weight="bold" fill="#e2e8f0">Margin Calls: What Actually Happens as a Trade Loses</text>
  <text x="450" y="58" text-anchor="middle" font-size="12" font-style="italic" fill="#94a3b8">Effective leverage -- how much of your account you commit -- sets your distance to a margin call.</text>

  <!-- Account anatomy -->
  <rect x="40" y="78" width="820" height="86" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <text x="60" y="102" font-size="13" font-weight="bold" fill="#e2e8f0">The account, live</text>
  <rect x="60" y="112" width="240" height="42" rx="6" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="1.5"/>
  <text x="180" y="131" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#22c55e">Equity</text>
  <text x="180" y="147" text-anchor="middle" font-size="10" fill="#cbd5e1">balance +/- floating P/L</text>
  <text x="312" y="139" font-size="15" fill="#64748b">=</text>
  <rect x="330" y="112" width="240" height="42" rx="6" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="1.5"/>
  <text x="450" y="131" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#fde68a">Used Margin</text>
  <text x="450" y="147" text-anchor="middle" font-size="10" fill="#cbd5e1">locked as collateral</text>
  <text x="582" y="139" font-size="15" fill="#64748b">+</text>
  <rect x="600" y="112" width="240" height="42" rx="6" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="720" y="131" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#3b82f6">Free Margin</text>
  <text x="720" y="147" text-anchor="middle" font-size="10" fill="#cbd5e1">the loss-absorbing cushion</text>

  <!-- Two thresholds -->
  <text x="450" y="192" text-anchor="middle" font-size="13" font-weight="bold" fill="#e2e8f0">Two thresholds as margin level falls (margin level = equity / used margin x 100)</text>
  <rect x="120" y="204" width="300" height="70" rx="10" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="2"/>
  <text x="270" y="228" text-anchor="middle" font-size="13" font-weight="bold" fill="#fde68a">Margin Call -- around 100%</text>
  <text x="270" y="248" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Warning: equity has fallen to equal</text>
  <text x="270" y="263" text-anchor="middle" font-size="10.5" fill="#cbd5e1">used margin. Add funds or reduce.</text>
  <rect x="480" y="204" width="300" height="70" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="2"/>
  <text x="630" y="228" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">Stop-Out -- around 50%</text>
  <text x="630" y="248" text-anchor="middle" font-size="10.5" fill="#cbd5e1">Forced: the broker closes positions</text>
  <text x="630" y="263" text-anchor="middle" font-size="10.5" fill="#cbd5e1">for you, biggest loser first.</text>
  <text x="450" y="290" text-anchor="middle" font-size="10" font-style="italic" fill="#94a3b8">Exact percentages vary by broker -- check yours before you trade.</text>

  <!-- Two scenarios: same position, different account -->
  <text x="450" y="322" text-anchor="middle" font-size="13" font-weight="bold" fill="#e2e8f0">Same 50,000 position at 50:1 broker leverage -- two accounts</text>

  <rect x="40" y="334" width="400" height="210" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="2"/>
  <text x="60" y="358" font-size="14" font-weight="bold" fill="#ef4444">2,000 account (over-committed)</text>
  <text x="60" y="384" font-size="11.5" fill="#cbd5e1">Used margin: 1,000   Free margin: 1,000</text>
  <text x="60" y="404" font-size="11.5" fill="#cbd5e1">Opening margin level: 200%</text>
  <text x="60" y="430" font-size="13" font-weight="bold" fill="#ef4444">Effective leverage = 50,000 / 2,000 = 25:1</text>
  <text x="60" y="456" font-size="11.5" fill="#cbd5e1">Margin call after a 1,000 loss:</text>
  <text x="60" y="474" font-size="12.5" font-weight="bold" fill="#ef4444">just a 2% move -- about 200 pips</text>
  <text x="60" y="500" font-size="11.5" fill="#cbd5e1">Stop-out at a 1,500 loss:</text>
  <text x="60" y="518" font-size="12.5" font-weight="bold" fill="#ef4444">a 3% move -- about 300 pips</text>

  <rect x="460" y="334" width="400" height="210" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2"/>
  <text x="480" y="358" font-size="14" font-weight="bold" fill="#22c55e">10,000 account (well-sized)</text>
  <text x="480" y="384" font-size="11.5" fill="#cbd5e1">Used margin: 1,000   Free margin: 9,000</text>
  <text x="480" y="404" font-size="11.5" fill="#cbd5e1">Opening margin level: 1,000%</text>
  <text x="480" y="430" font-size="13" font-weight="bold" fill="#22c55e">Effective leverage = 50,000 / 10,000 = 5:1</text>
  <text x="480" y="456" font-size="11.5" fill="#cbd5e1">Margin call after a 9,000 loss:</text>
  <text x="480" y="474" font-size="12.5" font-weight="bold" fill="#22c55e">an 18% move -- about 1,800 pips</text>
  <text x="480" y="500" font-size="11.5" fill="#cbd5e1">Same trade, same leverage cap --</text>
  <text x="480" y="518" font-size="12.5" font-weight="bold" fill="#22c55e">survives 9x the adverse move</text>

  <text x="450" y="576" text-anchor="middle" font-size="12" font-style="italic" fill="#e2e8f0">A margin call is almost always a position-sizing mistake showing up one step later.</text>
  <text x="450" y="596" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">The broker's headline leverage is a ceiling; your effective leverage is the risk you actually run.</text>
</svg>
`,
  'forex-ch3-position-sizing-pip-value': `
<svg viewBox="0 0 900 640" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="640" fill="#0f172a"/>
  <text x="450" y="34" text-anchor="middle" font-size="20" font-weight="bold" fill="#e2e8f0">Pip Value: Why "One Pip = $10" Is Only Sometimes True</text>
  <text x="450" y="58" text-anchor="middle" font-size="12" font-style="italic" fill="#94a3b8">Pip value is the one input in the sizing formula that changes with the pair and your account currency.</text>

  <!-- ===== TWO STEPS ===== -->
  <rect x="40" y="78" width="820" height="92" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <text x="60" y="102" font-size="13" font-weight="bold" fill="#e2e8f0">The calculation is always two steps</text>
  <rect x="60" y="112" width="380" height="46" rx="8" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="72" y="131" font-size="11.5" font-weight="bold" fill="#3b82f6">Step 1: pip value in the QUOTE currency</text>
  <text x="72" y="149" font-size="11" fill="#cbd5e1">pip size x units. Std lot: 0.0001 x 100,000 = 10 units</text>
  <rect x="460" y="112" width="380" height="46" rx="8" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="1.5"/>
  <text x="472" y="131" font-size="11.5" font-weight="bold" fill="#22c55e">Step 2: convert to your ACCOUNT currency</text>
  <text x="472" y="149" font-size="11" fill="#cbd5e1">using the current exchange rate (may do nothing)</text>

  <!-- ===== THREE CASES ===== -->
  <text x="450" y="196" text-anchor="middle" font-size="13" font-weight="bold" fill="#e2e8f0">Three cases for a US-dollar account (standard lot)</text>

  <!-- Case A -->
  <rect x="40" y="208" width="266" height="150" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2"/>
  <text x="60" y="232" font-size="13" font-weight="bold" fill="#22c55e">Case A: quote = account</text>
  <text x="60" y="252" font-size="11.5" fill="#cbd5e1">e.g. EUR/USD (quote is USD)</text>
  <text x="60" y="278" font-size="11" fill="#cbd5e1">Step 1: 10 USD per pip</text>
  <text x="60" y="296" font-size="11" fill="#cbd5e1">Step 2: no conversion needed</text>
  <text x="60" y="330" font-size="15" font-weight="bold" fill="#22c55e">Pip value = $10.00</text>
  <text x="60" y="349" font-size="10" font-style="italic" fill="#22c55e">the only exact case for "$10"</text>

  <!-- Case B -->
  <rect x="317" y="208" width="266" height="150" rx="10" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="2"/>
  <text x="337" y="232" font-size="13" font-weight="bold" fill="#3b82f6">Case B: base = account</text>
  <text x="337" y="252" font-size="11.5" fill="#cbd5e1">e.g. USD/JPY (base is USD)</text>
  <text x="337" y="278" font-size="11" fill="#cbd5e1">Step 1: 1,000 JPY per pip</text>
  <text x="337" y="296" font-size="11" fill="#cbd5e1">Step 2: 1,000 / 150.00</text>
  <text x="337" y="330" font-size="15" font-weight="bold" fill="#3b82f6">Pip value = $6.67</text>
  <text x="337" y="349" font-size="10" font-style="italic" fill="#3b82f6">about a third LESS than $10</text>

  <!-- Case C -->
  <rect x="594" y="208" width="266" height="150" rx="10" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="2"/>
  <text x="614" y="232" font-size="13" font-weight="bold" fill="#fde68a">Case C: cross pair</text>
  <text x="614" y="252" font-size="11.5" fill="#cbd5e1">e.g. EUR/GBP (no USD at all)</text>
  <text x="614" y="278" font-size="11" fill="#cbd5e1">Step 1: 10 GBP per pip</text>
  <text x="614" y="296" font-size="11" fill="#cbd5e1">Step 2: 10 x 1.27 (GBP/USD)</text>
  <text x="614" y="330" font-size="15" font-weight="bold" fill="#fde68a">Pip value = $12.70</text>
  <text x="614" y="349" font-size="10" font-style="italic" fill="#fde68a">about a quarter MORE than $10</text>

  <!-- ===== SIZING CONSEQUENCE ===== -->
  <text x="450" y="396" text-anchor="middle" font-size="13" font-weight="bold" fill="#e2e8f0">What the "$10" shortcut does to a $100 (1%) risk, 50-pip stop, $10,000 account</text>

  <rect x="40" y="410" width="820" height="150" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <text x="60" y="434" font-size="12" fill="#cbd5e1">Formula: Lot Size = (Account x Risk %) / (Stop pips x Pip Value)</text>

  <!-- USD/JPY row -->
  <rect x="60" y="446" width="380" height="98" rx="8" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="1.5"/>
  <text x="72" y="468" font-size="12" font-weight="bold" fill="#ef4444">USD/JPY (true pip value $6.67)</text>
  <text x="72" y="488" font-size="11" fill="#cbd5e1">Correct: 100 / (50 x 6.67) = 0.30 lots</text>
  <text x="72" y="506" font-size="11" fill="#cbd5e1">Using $10: 0.20 lots</text>
  <text x="72" y="528" font-size="11.5" font-weight="bold" fill="#ef4444">Real risk = $66.70 -- you UNDER-sized (only 0.67%)</text>

  <!-- EUR/GBP row -->
  <rect x="460" y="446" width="380" height="98" rx="8" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="1.5"/>
  <text x="472" y="468" font-size="12" font-weight="bold" fill="#ef4444">EUR/GBP (true pip value $12.70)</text>
  <text x="472" y="488" font-size="11" fill="#cbd5e1">Correct: 100 / (50 x 12.70) = 0.157 lots</text>
  <text x="472" y="506" font-size="11" fill="#cbd5e1">Using $10: 0.20 lots</text>
  <text x="472" y="528" font-size="11.5" font-weight="bold" fill="#ef4444">Real risk = $127 -- you OVER-sized (+27%)</text>

  <text x="450" y="592" text-anchor="middle" font-size="12" font-style="italic" fill="#e2e8f0">Correct pip value feeds correct position size -- and position size is the biggest lever on the risk of ruin.</text>
  <text x="450" y="614" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">Classical gambler's ruin; formalised for trading in Ralph Vince, The Mathematics of Money Management (Wiley, 1992).</text>
</svg>
`,
  'forex-ch3-risk-reward': `
<svg viewBox="0 0 900 610" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="610" fill="#0f172a"/>
  <text x="450" y="34" text-anchor="middle" font-size="20" font-weight="bold" fill="#e2e8f0">Risk-to-Reward: Why Being Right Is Not the Same as Trading Well</text>
  <text x="450" y="58" text-anchor="middle" font-size="12" font-style="italic" fill="#94a3b8">The ratio decides the win rate you need. Win rate on its own tells you only half the story.</text>

  <!-- R:R scale (left) -->
  <rect x="40" y="80" width="330" height="216" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <text x="60" y="104" font-size="13" font-weight="bold" fill="#e2e8f0">One trade, measured in R</text>
  <!-- target zone -->
  <rect x="150" y="118" width="180" height="56" rx="5" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="1.5"/>
  <text x="240" y="141" text-anchor="middle" font-size="12" font-weight="bold" fill="#22c55e">Target: +2R</text>
  <text x="240" y="159" text-anchor="middle" font-size="10.5" fill="#cbd5e1">60 pips (2x the stop)</text>
  <!-- entry line -->
  <line x1="70" y1="196" x2="340" y2="196" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="70" y="190" font-size="10.5" font-weight="bold" fill="#e2e8f0">Entry 1.1000</text>
  <!-- stop zone -->
  <rect x="150" y="212" width="180" height="42" rx="5" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="1.5"/>
  <text x="240" y="230" text-anchor="middle" font-size="12" font-weight="bold" fill="#ef4444">Stop: -1R</text>
  <text x="240" y="247" text-anchor="middle" font-size="10.5" fill="#cbd5e1">30 pips = your risk</text>
  <text x="60" y="278" font-size="10.5" font-style="italic" fill="#94a3b8">Risk = stop distance x pip value x size.</text>
  <text x="60" y="292" font-size="10.5" font-style="italic" fill="#94a3b8">That is 1R. Reward is measured against it.</text>

  <!-- Break-even table (right) -->
  <rect x="390" y="80" width="470" height="216" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <text x="410" y="104" font-size="13" font-weight="bold" fill="#e2e8f0">Break-even win rate = 1 / (1 + R)</text>
  <line x1="410" y1="116" x2="840" y2="116" stroke="#334155" stroke-width="1.5"/>
  <text x="430" y="140" font-size="12" fill="#cbd5e1">Reward : Risk</text>
  <text x="700" y="140" font-size="12" fill="#cbd5e1">You must win</text>
  <text x="430" y="168" font-size="12.5" font-weight="bold" fill="#ef4444">1 : 0.5  (reward smaller than risk)</text>
  <text x="700" y="168" font-size="12.5" font-weight="bold" fill="#ef4444">66.7%</text>
  <text x="430" y="196" font-size="12.5" font-weight="bold" fill="#fde68a">1 : 1</text>
  <text x="700" y="196" font-size="12.5" font-weight="bold" fill="#fde68a">50.0%</text>
  <text x="430" y="224" font-size="12.5" font-weight="bold" fill="#22c55e">1 : 2</text>
  <text x="700" y="224" font-size="12.5" font-weight="bold" fill="#22c55e">33.3%</text>
  <text x="430" y="252" font-size="12.5" font-weight="bold" fill="#22c55e">1 : 3</text>
  <text x="700" y="252" font-size="12.5" font-weight="bold" fill="#22c55e">25.0%</text>
  <text x="410" y="282" font-size="10.5" font-style="italic" fill="#94a3b8">A better ratio lowers the win rate you need; a worse one raises it fast.</text>

  <!-- Three traders -->
  <text x="450" y="326" text-anchor="middle" font-size="13" font-weight="bold" fill="#e2e8f0">Ten trades each -- the win rate alone hides who wins</text>

  <rect x="40" y="338" width="260" height="210" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2"/>
  <text x="170" y="362" text-anchor="middle" font-size="13" font-weight="bold" fill="#22c55e">Trader A</text>
  <text x="170" y="384" text-anchor="middle" font-size="12" fill="#cbd5e1">40% win rate, at 1:2</text>
  <text x="60" y="414" font-size="11.5" fill="#cbd5e1">4 wins x +2R = +8R</text>
  <text x="60" y="436" font-size="11.5" fill="#cbd5e1">6 losses x -1R = -6R</text>
  <line x1="60" y1="450" x2="280" y2="450" stroke="#22c55e" stroke-width="1"/>
  <text x="60" y="474" font-size="14" font-weight="bold" fill="#22c55e">Net = +2R (profit)</text>
  <text x="60" y="512" font-size="11" font-style="italic" fill="#22c55e">Wrong more often than right,</text>
  <text x="60" y="528" font-size="11" font-style="italic" fill="#22c55e">and still makes money.</text>

  <rect x="320" y="338" width="260" height="210" rx="10" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" stroke-width="2"/>
  <text x="450" y="362" text-anchor="middle" font-size="13" font-weight="bold" fill="#3b82f6">Trader B</text>
  <text x="450" y="384" text-anchor="middle" font-size="12" fill="#cbd5e1">60% win rate, at 1:1</text>
  <text x="340" y="414" font-size="11.5" fill="#cbd5e1">6 wins x +1R = +6R</text>
  <text x="340" y="436" font-size="11.5" fill="#cbd5e1">4 losses x -1R = -4R</text>
  <line x1="340" y1="450" x2="560" y2="450" stroke="#3b82f6" stroke-width="1"/>
  <text x="340" y="474" font-size="14" font-weight="bold" fill="#3b82f6">Net = +2R (profit)</text>
  <text x="340" y="512" font-size="11" font-style="italic" fill="#3b82f6">Same profit as A, from an</text>
  <text x="340" y="528" font-size="11" font-style="italic" fill="#3b82f6">opposite-looking record.</text>

  <rect x="600" y="338" width="260" height="210" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="2"/>
  <text x="730" y="362" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">Trader C</text>
  <text x="730" y="384" text-anchor="middle" font-size="12" fill="#cbd5e1">70% win rate, at 1:0.5</text>
  <text x="620" y="414" font-size="11.5" fill="#cbd5e1">7 wins x +0.5R = +3.5R</text>
  <text x="620" y="436" font-size="11.5" fill="#cbd5e1">3 losses x -1R = -3R</text>
  <line x1="620" y1="450" x2="840" y2="450" stroke="#ef4444" stroke-width="1"/>
  <text x="620" y="474" font-size="14" font-weight="bold" fill="#ef4444">Net = +0.5R (barely)</text>
  <text x="620" y="512" font-size="11" font-style="italic" fill="#ef4444">Right most often, trading</text>
  <text x="620" y="528" font-size="11" font-style="italic" fill="#ef4444">worst -- a quarter of A's gain.</text>

  <text x="450" y="580" text-anchor="middle" font-size="12" font-style="italic" fill="#e2e8f0">What makes money is win rate and the risk-to-reward ratio together -- never either one alone.</text>
  <text x="450" y="600" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">Set both prices from real levels before entry; never widen a stop or pull in a target to rescue a trade.</text>
</svg>
`,
  'forex-ch4-trading-psychology': `
<svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
  <rect width="900" height="600" fill="#0f172a"/>
  <text x="450" y="34" text-anchor="middle" font-size="20" font-weight="bold" fill="#e2e8f0">Trading Psychology: Two Engines That Drain Accounts -- and the Fix</text>
  <text x="450" y="58" text-anchor="middle" font-size="12" font-style="italic" fill="#94a3b8">The problem is rarely the analysis. It is good rules abandoned under fear and greed.</text>

  <!-- emotion chips -->
  <rect x="360" y="76" width="80" height="30" rx="15" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="1.5"/>
  <text x="400" y="96" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">FEAR</text>
  <rect x="460" y="76" width="80" height="30" rx="15" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="1.5"/>
  <text x="500" y="96" text-anchor="middle" font-size="13" font-weight="bold" fill="#fde68a">GREED</text>
  <line x1="400" y1="106" x2="250" y2="128" stroke="#64748b" stroke-width="1.5"/>
  <line x1="500" y1="106" x2="650" y2="128" stroke="#64748b" stroke-width="1.5"/>

  <!-- Disposition effect card -->
  <rect x="40" y="130" width="400" height="200" rx="10" fill="rgba(239,68,68,0.12)" stroke="#ef4444" stroke-width="2"/>
  <text x="60" y="156" font-size="15" font-weight="bold" fill="#ef4444">1. The Disposition Effect</text>
  <text x="60" y="178" font-size="12" fill="#cbd5e1">Sell winners too early (bank the sure gain);</text>
  <text x="60" y="195" font-size="12" fill="#cbd5e1">ride losers too long (hope they come back).</text>
  <text x="60" y="213" font-size="10.5" font-style="italic" fill="#94a3b8">Named by Shefrin and Statman (1985).</text>
  <rect x="60" y="226" width="360" height="86" rx="8" fill="#0f172a" stroke="#ef4444" stroke-width="1"/>
  <text x="72" y="248" font-size="11.5" font-weight="bold" fill="#ef4444">Evidence: Odean (1998), J. Finance</text>
  <text x="72" y="267" font-size="11" fill="#cbd5e1">10,000 accounts: 1.5 to 2x more likely to sell</text>
  <text x="72" y="284" font-size="11" fill="#cbd5e1">a winner than a loser -- and the winners sold</text>
  <text x="72" y="301" font-size="11" fill="#cbd5e1">went on to beat the losers kept. It cost them.</text>

  <!-- Overtrading card -->
  <rect x="460" y="130" width="400" height="200" rx="10" fill="rgba(234,179,8,0.12)" stroke="#eab308" stroke-width="2"/>
  <text x="480" y="156" font-size="15" font-weight="bold" fill="#fde68a">2. Overtrading</text>
  <text x="480" y="178" font-size="12" fill="#cbd5e1">Trade more often or bigger than the strategy</text>
  <text x="480" y="195" font-size="12" fill="#cbd5e1">justifies -- driven by overconfidence.</text>
  <text x="480" y="213" font-size="10.5" font-style="italic" fill="#94a3b8">Every trade also pays the spread (Ch1 L4).</text>
  <rect x="480" y="226" width="360" height="86" rx="8" fill="#0f172a" stroke="#eab308" stroke-width="1"/>
  <text x="492" y="248" font-size="11.5" font-weight="bold" fill="#fde68a">Evidence: Barber and Odean (2000), J. Finance</text>
  <text x="492" y="267" font-size="11" fill="#cbd5e1">66,465 households: the most active traders</text>
  <text x="492" y="284" font-size="13" font-weight="bold" fill="#ef4444">earned 11.4%/yr vs the market's 17.9%</text>
  <text x="492" y="301" font-size="11" fill="#cbd5e1">Same market, same years -- the gap was activity.</text>

  <!-- arrow down to fix -->
  <text x="450" y="356" text-anchor="middle" font-size="12" font-weight="bold" fill="#e2e8f0">Both are feelings you cannot reliably beat in the moment. So do not try to.</text>

  <!-- Discipline card -->
  <rect x="120" y="372" width="660" height="176" rx="10" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2"/>
  <text x="450" y="398" text-anchor="middle" font-size="15" font-weight="bold" fill="#22c55e">The Fix: Discipline = a pre-committed plan, not a feeling</text>
  <text x="450" y="422" text-anchor="middle" font-size="12" fill="#cbd5e1">Decide entry, stop, target, and size in advance -- while calm -- then remove the live decision.</text>
  <rect x="150" y="436" width="290" height="96" rx="8" fill="#0f172a" stroke="#22c55e" stroke-width="1"/>
  <text x="295" y="458" text-anchor="middle" font-size="12" font-weight="bold" fill="#22c55e">Beats the disposition effect</text>
  <text x="295" y="479" text-anchor="middle" font-size="11" fill="#cbd5e1">OCO order (Ch1 L7): stop and target</text>
  <text x="295" y="495" text-anchor="middle" font-size="11" fill="#cbd5e1">set before entry, execute on their own.</text>
  <text x="295" y="516" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">No live choice to fumble.</text>
  <rect x="460" y="436" width="290" height="96" rx="8" fill="#0f172a" stroke="#22c55e" stroke-width="1"/>
  <text x="605" y="458" text-anchor="middle" font-size="12" font-weight="bold" fill="#22c55e">Beats overtrading</text>
  <text x="605" y="479" text-anchor="middle" font-size="11" fill="#cbd5e1">Preset size (Ch3 L1) removes "go bigger";</text>
  <text x="605" y="495" text-anchor="middle" font-size="11" fill="#cbd5e1">rules define what counts as a setup.</text>
  <text x="605" y="516" text-anchor="middle" font-size="10.5" font-style="italic" fill="#94a3b8">Trade the plan, not the mood.</text>

  <text x="450" y="576" text-anchor="middle" font-size="11" font-style="italic" fill="#94a3b8">No one removes fear and greed -- professionals included. You build a process that makes them irrelevant to the decision.</text>
</svg>
`,
};
