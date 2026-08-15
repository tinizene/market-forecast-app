// Stocks & ETFs track — structured lessons.
//
// The track shipped as seven short cards inherited from the original app fork: 1,531
// words in total, against 43,119 for Crypto. This file is the rewrite, following
// course/Stocks_Track_Roadmap.md. Lessons land here in the same block format the
// Foundation, Crypto and Forex tracks use; the remaining legacy cards stay in
// learn-content.js until their replacement is written, and build-course-data.js merges
// the two so the track is never half-broken mid-rewrite.
//
// Three ids are load-bearing: investing-vs-gambling, expense-ratios and
// dollar-cost-averaging each have an interactive tool bound to them by id in learn.js.
// Do not rename them.
//
// Citations follow course/Forex_Course_Style_Guide.md §2.1 — every one verified live
// against two independent sources at drafting time, with the verification recorded in
// the commit rather than assumed.

window.SCERE_STOCKS_TRACK = {
  trackTitle: 'Stocks & ETFs',
  trackTagline: 'What a share actually is, what it costs to own, and what the evidence says about owning them well.',
};

window.SCERE_STOCKS_CONTENT = [
  // ============================================================
  {
    id: 'what-a-share-is',
    lessonNumber: 1,
    chapterNumber: 1,
    chapterTitle: 'What You Actually Own',
    title: 'What a Share Actually Is',
    keyIdea: 'A share is a residual claim on a business — last in line, unlimited on the upside, and capped at zero on the downside.',
    blocks: [
      { type: 'paragraph', text: 'People buy shares long before anyone tells them what a share is. The price moves, the app shows a green number, and the question of what was actually purchased never comes up. It is worth answering properly, because almost everything else in this track follows from it.' },
      { type: 'definition', term: 'Share', text: 'A unit of ownership in a company. Owning one makes you a part-owner of the business itself — not a lender to it, and not a customer of it.' },
      { type: 'paragraph', text: 'That ownership is real but limited. It does not entitle you to walk into the company and take a desk. It entitles you to two things: a vote on certain decisions, and a claim on whatever value is left over after everyone else has been paid.' },

      { type: 'paragraph', text: 'The phrase "left over" is doing the work in that sentence. A company pays its suppliers, its staff, its lenders and its tax bill first. Shareholders are last in the queue. What reaches them is the residual.' },
      { type: 'definition', term: 'Residual claim', text: 'A claim on what remains after all other obligations are met. Shareholders hold one; lenders do not.' },
      { type: 'example', text: 'A company earns 100 in revenue. Suppliers take 40, staff take 35, interest on debt takes 10, and tax takes 5. The residual is 10, and it belongs to the shareholders — either paid out or reinvested on their behalf. If revenue had been 90 instead, the first four claims would still take 90, and the residual would be zero.' },
      { type: 'paragraph', text: 'This is why share prices move so much more than a company\'s revenue does. The residual is the thin layer at the end of a stack, so a small change in the size of the stack is a large change in the layer. A 10% fall in revenue in that example does not reduce the shareholders\' claim by 10%. It removes it entirely.' },

      { type: 'paragraph', text: 'Being last in the queue sounds like a bad deal, and on the downside it is. The compensation sits on the other side: the residual has no ceiling. A lender who is owed 10 receives 10 whether the company earns 100 or 100,000. The shareholders receive everything above the obligations, however large that becomes.' },
      { type: 'paragraph', text: 'So a share is an asymmetric instrument. Bounded loss, unbounded gain. That asymmetry is the single most important structural fact about equities, and it is what makes them behave so differently from the currency pairs in the Forex track, where both sides of a position are open-ended.' },

      { type: 'paragraph', text: 'The lower bound comes from a legal arrangement most people never think about, and it is not a natural feature of ownership. If you own a corner shop outright and it fails owing money, the creditors can pursue you personally. If you own shares in a company that fails owing money, they cannot.' },
      { type: 'definition', term: 'Limited liability', text: 'The rule that a shareholder\'s loss is capped at what they paid for the shares. Creditors of the company have no claim on the shareholder\'s other assets.' },
      { type: 'warning', text: 'Limited liability caps what you can lose on one company. It does not cap what you can lose overall, and it does not apply if you borrow to buy the shares. Money borrowed on margin is still owed after the shares are worthless — the loss stops at zero for the share, not for you. Chapter 3 covers this properly.' },

      { type: 'paragraph', text: 'What the vote buys you is worth being realistic about. In theory shareholders elect the board and the board hires the management. In practice a holding of a few hundred shares in a company with billions outstanding is not a meaningful lever, and most private investors never vote at all.' },
      { type: 'paragraph', text: 'This matters for how you should think about a share you hold. You are not going to influence the business. You are making a judgment about whether the residual claim you bought is worth what you paid for it — and, in the next lesson, whether that judgment is the kind that has an edge behind it.' },

      { type: 'example', text: 'Two people put 1,000 into the same company on the same day. One buys shares. One lends the company 1,000 at 6% interest. Over five years the company does extremely well. The lender receives 60 a year and their 1,000 back — exactly what was agreed, and not a unit more. The shareholder receives whatever the residual has become, which may be far more, or nothing.' },

      { type: 'paragraph', text: 'One consequence is that the two positions are wrong in different ways. The lender is wrong when the company cannot pay, which is rare and severe. The shareholder is wrong far more often and usually less severely — but their claim can be wiped out while the company survives, because the residual can go to zero without the obligations going unpaid.' },
      { type: 'paragraph', text: 'Keep that distinction in view. "The company is fine" and "the shares are fine" are different statements, and Chapter 5 has case studies where they came apart badly.' },
    ],
    quiz: [{
      question: 'A company\'s revenue falls by 10%, and its obligations to suppliers, staff, lenders and tax are unchanged. What happens to the shareholders\' claim?',
      options: [
        'It falls by 10%, in proportion to revenue',
        'It falls by more than 10%, because the residual absorbs the whole shortfall',
        'It is unchanged, because shareholders are paid first',
        'It falls by 10% only if the company chooses to pay a smaller dividend',
      ],
      correctIndex: 1,
      feedbackCorrect: 'Correct. Shareholders hold the residual — what is left after fixed obligations. Because those obligations do not shrink with revenue, the whole shortfall lands on the residual, so the shareholders\' claim moves by much more than revenue does. This is why share prices are more volatile than the businesses underneath them.',
      feedbackWrong: 'Not quite. Shareholders are last in the queue, not first, and the obligations ahead of them do not fall just because revenue did. The entire shortfall comes out of the residual, so the shareholders\' claim falls by considerably more than 10%.',
    }],
    keyTerms: [
      { term: 'Share', def: 'A unit of ownership in a company — a part-owner, not a lender.' },
      { term: 'Residual claim', def: 'A claim on what is left after suppliers, staff, lenders and tax are paid. Shareholders hold one.' },
      { term: 'Limited liability', def: 'The rule capping a shareholder\'s loss at what they paid for the shares.' },
    ],
  },

  // ============================================================
  {
    id: 'investing-vs-gambling',
    lessonNumber: 2,
    chapterNumber: 1,
    chapterTitle: 'What You Actually Own',
    title: 'Investing vs Gambling',
    keyIdea: 'The difference is not how risky it feels. It is whether the activity is positive-sum before costs, and who is on the other side.',
    blocks: [
      { type: 'paragraph', text: 'The usual answer is that investing is sensible and gambling is reckless, or that investing is slow and gambling is fast. Neither survives contact with reality. Buying a single speculative company with your savings is investing by that definition, and it is plainly a gamble. A structured bet with a known edge is gambling by that definition, and it is plainly not reckless.' },
      { type: 'paragraph', text: 'The honest distinction is structural, and it has two parts: where the return comes from, and who is on the other side of you.' },

      { type: 'definition', term: 'Positive-sum', text: 'An activity where the total value held by all participants can grow, because value is being created outside the transactions themselves.' },
      { type: 'definition', term: 'Zero-sum', text: 'An activity where one participant\'s gain is exactly another\'s loss. Nothing is created; the pot is only redistributed.' },

      { type: 'paragraph', text: 'Owning shares in productive businesses is positive-sum. The companies employ people, sell things, and generate cash. That cash accrues to the residual claim you learned about in Lesson 1. If every shareholder in the world held their shares and did nothing, they could still collectively be better off in ten years, because the businesses underneath produced something.' },
      { type: 'paragraph', text: 'A roulette wheel is not like this. The wheel produces nothing. Every unit won by one player is a unit lost by another, minus the house edge — which makes it negative-sum for the players taken together.' },

      { type: 'warning', text: 'Short-term trading in shares is much closer to the roulette wheel than to ownership. Over a holding period of minutes or days, the businesses underneath have produced almost nothing. Nearly all of what you gain in that window comes from another trader, minus costs — so the activity is close to zero-sum before fees and negative-sum after them. The asset being productive does not make every activity involving it productive.' },

      { type: 'paragraph', text: 'This is where the second part matters: who is on the other side. Someone is taking the opposite side of every trade you place, and in a liquid market that someone is usually a firm whose entire business is being better at this than you are.' },
      { type: 'paragraph', text: 'It is worth knowing what actually happens to people who do this seriously, rather than guessing. The evidence here is unusually good, because Taiwan\'s stock exchange gave researchers a complete record of every trade and every trader for years at a time — something no other market has published at that granularity.' },

      { type: 'example', text: 'Barber, Lee, Liu and Odean studied the complete transaction records of the Taiwan Stock Exchange. In a typical six-month period, more than 80% of day traders lost money after costs. In the follow-up work published in the Review of Asset Pricing Studies (2020, volume 10, issue 1, pages 61 to 93), they found that profitable and unprofitable traders were almost equally likely to keep trading the following year — roughly 96% against 95%. Losing money did not, in practice, stop people.' },
      { type: 'paragraph', text: 'Two things in that finding deserve attention. The first is the loss rate itself. The second, and more useful one, is that the losses did not teach. If the experience of losing reliably corrected the behaviour, the population of day traders would improve over time. It largely did not.' },

      { type: 'warning', text: 'You will see the figure "90% of day traders lose money" repeated constantly, usually with no source attached. The carefully measured number from complete exchange records is "more than 80% in a typical six-month period" — which is a different and more precise claim. When a striking statistic circulates without a traceable source, treat the statistic itself as the thing to check first. That habit is worth more than the number.' },

      { type: 'paragraph', text: 'So the test is not whether an activity feels risky. It is a pair of questions you can ask about anything: is value being created outside the transaction, and do I have a reason to believe I am better informed than whoever is on the other side?' },
      { type: 'paragraph', text: 'Buying a diversified basket of productive companies and holding it for twenty years passes the first test comfortably and makes the second largely irrelevant, because you are not trying to beat anyone. Trading in and out of single companies on the strength of a news headline fails both.' },

      { type: 'example', text: 'Two people each put 5,000 into the market on the same morning. One buys a broad index fund and does not look at it again for a decade. The other trades it actively, in and out, forty times a year. Ignoring skill entirely, they face completely different structures: the first collects whatever the underlying businesses produced, minus a small fee. The second collects whatever the businesses produced, minus a small fee, minus forty rounds of spread and commission, plus or minus whatever they gained or lost against the other side of each trade.' },
      { type: 'paragraph', text: 'The second is not necessarily doomed. It is carrying a cost the first is not, and it needs a genuine edge just to break even against the first. Chapter 4 puts real numbers on what that costs over a lifetime.' },

      { type: 'paragraph', text: 'None of this makes shares safe. Foundations Chapter 2 made the point that being right often is not the same as trading well, and it holds here: the positive-sum nature of ownership is a statement about the long run and about diversified baskets, not a promise about any single company or any single year.' },
    ],
    quiz: [{
      question: 'What is the structural difference between long-term share ownership and a casino game?',
      options: [
        'Share ownership is less risky, because share prices cannot fall to zero',
        'Share ownership is positive-sum — the businesses underneath produce value — while the casino game only redistributes what players bring',
        'Share ownership is slower, and slower activities are safer',
        'There is no real difference; both are bets on an uncertain outcome',
      ],
      correctIndex: 1,
      feedbackCorrect: 'Correct. The return from owning productive businesses comes from value created outside the transactions themselves, so all holders can gain together. A casino game creates nothing, so one player\'s gain is another\'s loss minus the house edge. Note that this defence applies to long-term ownership — short-term trading in the same shares is close to zero-sum before costs.',
      feedbackWrong: 'Not quite. It is not about speed or about how risky it feels, and share prices certainly can fall to zero. The difference is that productive businesses create value outside the transactions, so ownership is positive-sum, whereas a casino game only redistributes what players bring, minus the house edge.',
    }],
    keyTerms: [
      { term: 'Positive-sum', def: 'An activity where all participants can gain together, because value is created outside the transactions.' },
      { term: 'Zero-sum', def: 'An activity where one participant\'s gain is exactly another\'s loss.' },
    ],
  },

  // ============================================================
  {
    id: 'how-shares-are-traded',
    lessonNumber: 3,
    chapterNumber: 1,
    chapterTitle: 'What You Actually Own',
    title: 'How Shares Are Priced and Traded',
    keyIdea: 'There is no single price. There is a highest bid, a lowest offer, and a gap between them that you pay every time you cross it.',
    blocks: [
      { type: 'paragraph', text: 'An app shows one number and calls it the price. That number is a summary of something more detailed, and the detail is where your costs live.' },
      { type: 'paragraph', text: 'Behind it is an order book: a live list of everyone currently willing to buy, with the price each will pay, and everyone currently willing to sell, with the price each will accept.' },

      { type: 'definition', term: 'Bid', text: 'The highest price anyone is currently willing to pay for the share.' },
      { type: 'definition', term: 'Ask', text: 'The lowest price anyone is currently willing to sell it for. Also called the offer.' },
      { type: 'definition', term: 'Spread', text: 'The gap between the bid and the ask. It is a real cost, paid at the moment of trading rather than billed separately.' },

      { type: 'example', text: 'A share shows a bid of 24.98 and an ask of 25.02. The quoted price is 25.00 — the midpoint, which is a number nobody is actually offering. Buy now and you pay 25.02. Sell immediately afterwards and you receive 24.98. You are down 0.04 per share, or 0.16%, without the price having moved at all.' },
      { type: 'paragraph', text: 'That 0.16% is the entry fee for a round trip. Pay it once a decade and it is irrelevant. Pay it forty times a year, as the active trader in the previous lesson did, and it becomes one of the largest costs you face — which is exactly why the arithmetic there was so unforgiving.' },
      { type: 'paragraph', text: 'Readers who took the Forex track have met this already, in Chapter 1 Lesson 4. The mechanism is identical; only the units differ. Currency traders count it in pips, share traders count it in cents, and both are paying the same thing.' },

      { type: 'paragraph', text: 'You control whether you pay it, through the type of order you place.' },
      { type: 'definition', term: 'Market order', text: 'An instruction to trade immediately at whatever price is currently available. Certain to execute, uncertain in price.' },
      { type: 'definition', term: 'Limit order', text: 'An instruction to trade only at a stated price or better. Certain in price, uncertain whether it executes at all.' },
      { type: 'paragraph', text: 'A market order crosses the spread on purpose: you take the best price on offer and accept the 0.04. A limit order sits in the book and waits for someone to come to you. If they do, you avoid the spread. If they do not, you simply do not trade — and if the price runs away in the meantime, not trading may have cost more than the spread would have.' },

      { type: 'warning', text: 'The spread is not fixed. It widens when few people are trading — early morning, late afternoon, holidays, and above all during the sharp moves when you are most likely to want out. Forex Chapter 5\'s case studies are the extreme version of this: in a genuine liquidity vacuum the book can empty, and a market order fills at a price far from the last one quoted. A market order is a promise to execute, never a promise about the price.' },

      { type: 'paragraph', text: 'Once the trade matches, ownership does not change hands instantly. There is a settlement period between agreeing the trade and the shares and money actually moving.' },
      { type: 'definition', term: 'Settlement', text: 'The process of actually exchanging shares for money after a trade is agreed. It happens a set number of business days after the trade date.' },
      { type: 'paragraph', text: 'In the United States that period is one business day. The Securities and Exchange Commission shortened it from two days to one under Exchange Act Rule 15c6-1(a), effective 28 May 2024. The convention is written as T+1 — trade date plus one business day.' },
      { type: 'paragraph', text: 'The stated purpose was to reduce the risk that builds up while a trade is agreed but not yet completed. A shorter window means less time for either side to fail, and less exposure to price movement in between.' },

      { type: 'example', text: 'You sell shares on a Monday under T+1. The trade is agreed on Monday at Monday\'s price, and the cash settles on Tuesday. If you sell on a Friday, settlement lands on the following Monday, because the count is in business days and the weekend does not count.' },
      { type: 'paragraph', text: 'Settlement looks like plumbing, and for a long-term holder it is. It becomes visible at exactly two moments: when you need the cash by a specific date, and when a market is under stress. Chapter 5 covers January 2021, when settlement mechanics stopped being invisible and became the story.' },

      { type: 'paragraph', text: 'The practical takeaway is small and worth keeping. There is no single price — there is a bid, an ask, and a gap you pay to cross. You choose whether to cross it. And the trade you agree today is not finished until it settles.' },
    ],
    quiz: [{
      question: 'A share is quoted with a bid of 40.90 and an ask of 41.10. You buy with a market order and sell again a minute later with another market order, and the book has not moved. What is the result?',
      options: [
        'You break even, because the price did not change',
        'You lose 0.20 per share — you bought at the ask and sold at the bid',
        'You gain 0.20 per share, because you captured the spread',
        'It depends on the commission only; the spread does not affect you',
      ],
      correctIndex: 1,
      feedbackCorrect: 'Correct. A market order crosses the spread, so you bought at 41.10 and sold at 40.90 — a loss of 0.20 per share, close to 0.5% of the value, on an unchanged market. Crossing the spread twice is what a round trip costs, before any commission at all.',
      feedbackWrong: 'Not quite. Market orders take whatever is available, so you buy at the ask (41.10) and sell at the bid (40.90). That is a loss of 0.20 per share even though the quoted price never moved. Only a resting limit order can avoid paying the spread — at the risk of not trading at all.',
    }],
    keyTerms: [
      { term: 'Bid', def: 'The highest price anyone is currently willing to pay.' },
      { term: 'Ask', def: 'The lowest price anyone is currently willing to sell for.' },
      { term: 'Spread', def: 'The gap between bid and ask — a real cost paid when you trade, not billed separately.' },
      { term: 'Market order', def: 'Trade immediately at the best available price. Certain to execute, uncertain in price.' },
      { term: 'Limit order', def: 'Trade only at a stated price or better. Certain in price, uncertain to execute.' },
      { term: 'Settlement', def: 'The exchange of shares for money after a trade is agreed — T+1 in the United States since 28 May 2024.' },
    ],
  },
  // ============================================================
  {
    id: 'what-is-an-index',
    lessonNumber: 4,
    chapterNumber: 1,
    chapterTitle: 'What You Actually Own',
    title: 'What Is an Index?',
    keyIdea: 'An index is a rule for combining chosen shares into one number. Change the rule and the same market tells a different story.',
    blocks: [
      { type: 'paragraph', text: 'News reports say "the market rose 1% today" as though the market were a single thing with a single price. It is not. What rose was an index, and an index is a construction: somebody chose which companies to include and how much weight to give each one.' },
      { type: 'definition', term: 'Index', text: 'A rule for combining the prices of a chosen set of shares into one number, so the group can be tracked over time.' },
      { type: 'paragraph', text: 'Two decisions define any index. Which companies are in it, and how the contribution of each is weighted. The second decision is the one almost nobody examines, and it changes the answer more than people expect.' },

      { type: 'paragraph', text: 'The most common method weights each company by its market value, so bigger companies move the index more.' },
      { type: 'definition', term: 'Market-capitalisation weighting', text: 'Weighting each company by its total market value, so a company worth twice as much has twice the influence on the index.' },
      { type: 'paragraph', text: 'The S&P 500 uses a refinement of this called float adjustment. It counts only the shares actually available for the public to buy, excluding blocks held by governments, founders and other companies. The reasoning is that shares nobody can purchase should not affect a measure of what the investable market is doing.' },
      { type: 'paragraph', text: 'The index level is then the total float-adjusted market value of the constituents, divided by a number called the divisor. The divisor exists so that mechanical events — a stock split, a company joining or leaving — do not make the index jump when nothing real has happened. S&P Dow Jones Indices publishes both the index-mathematics and float-adjustment methodologies openly, which is worth knowing: the rule is not a secret, and you can read it.' },

      { type: 'paragraph', text: 'The other main method is older and stranger.' },
      { type: 'definition', term: 'Price weighting', text: 'Weighting each company by its share price alone, regardless of the size of the company.' },
      { type: 'paragraph', text: 'The Dow Jones Industrial Average works this way. It adds the share prices of its 30 companies and divides by its own divisor. The consequence is that influence tracks the price per share and not the size of the business.' },
      { type: 'example', text: 'One company trades at 300 a share, another at 100. In a price-weighted index the first has three times the influence of the second — even if the second company is worth far more in total, because it has issued many more shares. A 1% move in the 300 share moves the index three times as much as a 1% move in the 100 share.' },
      { type: 'warning', text: 'Share price on its own says nothing about the size of a company. A company can halve its share price tomorrow by splitting its shares two-for-one, without anything about the business changing. In a price-weighted index that split permanently reduces the company\'s influence. This is why price weighting is generally regarded as a historical artefact rather than a good design — it was easy to compute in 1896, when the arithmetic was done by hand.' },

      { type: 'paragraph', text: 'So "the market" depends on which index you mean. A day when a few very large companies fall and most smaller ones rise can be a down day for a cap-weighted index and an up day for an equally-weighted one covering the same companies. Neither number is lying. They are answering different questions.' },
      { type: 'paragraph', text: 'This is worth carrying into the next lesson, because when you buy an index fund you are not buying "the market". You are buying a specific rule, and you should know which one.' },

      { type: 'example', text: 'A cap-weighted index of the same 500 companies concentrates: if the largest handful grow to a third of the total value, a third of your return depends on those few. An equal-weighted version of the identical list gives each company the same share, so it leans more on the smaller members. Same companies, same day, different number.' },

      { type: 'paragraph', text: 'Cap weighting has one consequence worth stating plainly, because it surprises people who believe an index fund is automatically diversified. The weights are not fixed. They move with price, so whatever has risen most owns the largest share of the index — and it owns that share precisely because it has already risen.' },
      { type: 'warning', text: 'This means a cap-weighted index concentrates on its own. Nobody decides to increase the weighting of the most expensive part of the market; the rule does it automatically as prices rise. An index of 500 companies can quietly become a bet on a handful of them. Chapter 5 looks at what that produced in 1999, and it is the strongest honest caveat against treating a broad index fund as risk-free diversification.' },
      { type: 'paragraph', text: 'That is a caveat, not an argument against index funds. The alternatives have their own weighting problems, and the fee arithmetic in Lesson 7 is a powerful counterweight. The point is only that you should know what the rule does when prices move, rather than assuming a large number of holdings guarantees spread.' },

      { type: 'paragraph', text: 'One last thing an index quietly omits. Most headline indices are price indices — they track share prices only, and ignore dividends paid along the way. Total return versions exist and are usually higher. Lesson 6 covers why that difference is larger than it sounds.' },
    ],
    quiz: [{
      question: 'Company A trades at 300 a share and is worth 10 billion in total. Company B trades at 50 a share and is worth 80 billion. Which has more influence on a price-weighted index like the Dow?',
      options: [
        'Company B, because it is the larger company',
        'Company A, because price weighting counts the share price and ignores company size',
        'They have equal influence, because indices treat members equally',
        'Company B, because it has more shares outstanding',
      ],
      correctIndex: 1,
      feedbackCorrect: 'Correct. Price weighting looks only at the price per share, so A has six times the influence of B despite being an eighth of the size. A cap-weighted index would do the opposite. This is exactly why it matters which rule an index uses before you read anything into its movement.',
      feedbackWrong: 'Not quite. A price-weighted index adds share prices and divides — it never looks at how large the company is. Company A at 300 a share has six times the influence of Company B at 50, even though B is eight times the business. Size only drives the weighting in a market-capitalisation index.',
    }],
    keyTerms: [
      { term: 'Index', def: 'A rule for combining chosen shares into a single trackable number.' },
      { term: 'Market-capitalisation weighting', def: 'Weighting each company by its market value; used by the S&P 500, float-adjusted.' },
      { term: 'Price weighting', def: 'Weighting by share price alone, regardless of company size; used by the Dow.' },
      { term: 'Divisor', def: 'A number an index is divided by so splits and membership changes do not create artificial jumps.' },
    ],
  },

  // ============================================================
  {
    id: 'what-is-an-etf',
    lessonNumber: 5,
    chapterNumber: 1,
    chapterTitle: 'What You Actually Own',
    title: 'What Is an ETF?',
    keyIdea: 'A fund that trades like a share. A creation and redemption mechanism is what stops its price drifting away from what it holds.',
    blocks: [
      { type: 'paragraph', text: 'An index is a rule. An exchange-traded fund is a way to own the thing the rule describes, in one purchase, on an exchange.' },
      { type: 'definition', term: 'Exchange-traded fund (ETF)', text: 'A fund holding a basket of assets, whose own shares trade on an exchange throughout the day like an ordinary share.' },
      { type: 'paragraph', text: 'Buy one share of a broad index ETF and you own a small slice of every company in that index, in the proportions the index rule specifies. That is the appeal: diversification in a single transaction, at a cost that Lesson 7 will put numbers to.' },

      { type: 'paragraph', text: 'This raises an obvious problem. The ETF\'s own share price is set by supply and demand on the exchange, minute by minute. The value of what it actually holds is a separate number. What stops the two drifting apart?' },
      { type: 'definition', term: 'Net asset value (NAV)', text: 'The value of everything the fund holds, divided by the number of fund shares outstanding — what one share is actually backed by.' },
      { type: 'paragraph', text: 'The answer is a mechanism most investors never see, run by a small set of large firms.' },
      { type: 'definition', term: 'Authorised participant', text: 'A large financial firm permitted to create new ETF shares or redeem existing ones by trading directly with the fund.' },

      { type: 'paragraph', text: 'An authorised participant can do something you cannot. It can deliver the underlying basket of shares to the fund and receive newly created ETF shares in return, or hand back a block of ETF shares and receive the underlying basket. The US Securities and Exchange Commission describes this creation and redemption process in its investor bulletin on ETFs, and it is the structural feature that makes the whole thing work.' },
      { type: 'paragraph', text: 'That ability turns any gap between the ETF price and its NAV into a profit opportunity, and pursuing the profit closes the gap.' },
      { type: 'example', text: 'An ETF is trading at 100.40 while the basket it holds is worth 100.00 a share. An authorised participant buys the underlying shares for 100.00, delivers them to the fund, receives new ETF shares, and sells them at 100.40. Doing this adds supply to the ETF and demand to the underlying, pushing the two prices together. The profit exists only while the gap does.' },
      { type: 'paragraph', text: 'The SEC\'s own framing is that the market price is generally kept close to NAV because of this arbitrage function inherent in the structure. Note the word generally. It is a mechanism, not a guarantee.' },

      { type: 'definition', term: 'Premium and discount', text: 'An ETF trading above its NAV is at a premium; below it, a discount.' },
      { type: 'warning', text: 'Premiums and discounts widen exactly when you would least want them to. If the underlying market is closed, illiquid or falling fast, an authorised participant cannot price or trade the basket reliably, and the arbitrage that normally closes the gap weakens. ETFs holding hard-to-trade assets — small foreign markets, corporate bonds — show this most. The mechanism is strongest in the calm conditions where you need it least.' },

      { type: 'paragraph', text: 'A second thing worth checking is how the fund actually obtains its exposure.' },
      { type: 'paragraph', text: 'Most funds hold the real securities, which is called physical replication. Some instead enter a contract with a bank that agrees to pay the index return, which is called synthetic replication. The synthetic version can track more closely and reach otherwise awkward markets — but it introduces a party who has to honour the contract.' },
      { type: 'warning', text: 'Synthetic replication adds counterparty risk: a risk that is not about the index at all, but about whether the bank on the other side of the swap can pay. Foundations Chapter 2 made the general point that risks you have not named are the ones that hurt. This is a concrete instance — the fund can track the index perfectly and still fail for a reason that has nothing to do with the index.' },

      { type: 'paragraph', text: 'Finally, no fund tracks its index exactly. Fees, trading costs, and the timing of dividends all cause small gaps.' },
      { type: 'definition', term: 'Tracking difference', text: 'The gap between a fund\'s return and its index\'s return over a period. Tracking error is the variability of that gap.' },
      { type: 'paragraph', text: 'A fund with a slightly higher fee but tighter tracking can leave you better off than a cheaper one that lags. The advertised fee is the headline; the tracking difference is the result. Both are worth checking, and the next lesson explains why even small differences matter so much over time.' },
    ],
    quiz: [{
      question: 'An ETF is trading at 50.30 while the basket of shares it holds is worth 50.00 per ETF share. What normally happens next?',
      options: [
        'Nothing — the ETF price is set independently by supply and demand',
        'An authorised participant buys the underlying basket, exchanges it for new ETF shares and sells them, which pushes the two prices together',
        'The fund manager manually resets the ETF price to 50.00',
        'The exchange halts trading until the prices match',
      ],
      correctIndex: 1,
      feedbackCorrect: 'Correct. The creation and redemption mechanism turns the gap into an arbitrage opportunity, and pursuing it adds ETF supply and underlying demand until the gap closes. Nobody sets the price by decree — the profit motive does the work. Note that this weakens when the underlying is hard to trade, which is when premiums and discounts widen.',
      feedbackWrong: 'Not quite. No one resets the price by hand and trading is not halted. An authorised participant can trade directly with the fund, so a gap between the ETF price and the value of its holdings becomes a profit opportunity — and acting on it is what pushes the two back together.',
    }],
    keyTerms: [
      { term: 'Exchange-traded fund (ETF)', def: 'A fund holding a basket of assets whose shares trade on an exchange like a share.' },
      { term: 'Net asset value (NAV)', def: 'The value of the fund\'s holdings per fund share.' },
      { term: 'Authorised participant', def: 'A firm allowed to create or redeem ETF shares directly with the fund.' },
      { term: 'Premium and discount', def: 'An ETF trading above or below its net asset value.' },
      { term: 'Tracking difference', def: 'The gap between a fund\'s return and its index\'s return.' },
    ],
  },

  // ============================================================
  {
    id: 'dividends-and-dividend-etfs',
    lessonNumber: 6,
    chapterNumber: 1,
    chapterTitle: 'What You Actually Own',
    title: 'Dividends and Total Return',
    keyIdea: 'A dividend is not free money. The share price drops by roughly the payment — what matters is total return, not the yield.',
    blocks: [
      { type: 'paragraph', text: 'Dividends attract a particular kind of enthusiasm. An income that arrives without selling anything feels like a different category of return from a rising price. Mechanically, it is not.' },
      { type: 'definition', term: 'Dividend', text: 'A cash payment made by a company to its shareholders out of the residual you met in Lesson 1.' },
      { type: 'paragraph', text: 'The important detail is what happens to the share price when the dividend is paid. The cash leaves the company. A company holding one unit less cash is worth one unit less, and the share price reflects that.' },
      { type: 'definition', term: 'Ex-dividend date', text: 'The first day a share trades without the right to the upcoming dividend. Buy on or after this date and the seller keeps the payment.' },

      { type: 'example', text: 'A share trades at 40.00 and pays a 1.00 dividend. On the ex-dividend date it opens at roughly 39.00. A holder who owned it through that date now has a share worth 39.00 and 1.00 in cash — the same 40.00 they had the day before. Nothing was created.' },
      { type: 'paragraph', text: 'That word roughly is carrying real weight, and the honest version of this is more interesting than the tidy one.' },
      { type: 'paragraph', text: 'Elton and Gruber studied this in 1970, in the Review of Economics and Statistics (volume 52, pages 68 to 74), using dividends paid between April 1966 and March 1967. They found the price drop was significantly less than the dividend, on average — and argued the gap reflected tax, since dividends were then taxed more heavily than capital gains, so a dividend was worth less than its face value to the marginal holder.' },
      { type: 'warning', text: 'That explanation is not settled, and the course would be misleading you to present it as though it were. More than a hundred papers have since argued about whether the shortfall is really about tax at all, or about market microstructure — the fact that prices historically moved in discrete tick sizes, so the drop could not land exactly on the dividend. The finding that the drop is less than the dividend is robust. Why has been contested for over fifty years.' },

      { type: 'paragraph', text: 'The deeper question is whether a company paying dividends is better for you than one that does not.' },
      { type: 'paragraph', text: 'Miller and Modigliani addressed this in 1961, in the Journal of Business (volume 34, pages 411 to 433). Under a set of idealised assumptions — no taxes, no transaction costs, and investment decisions held fixed — they showed that dividend policy does not affect the value of the firm. A shareholder wanting cash can sell a small part of their holding, and one not wanting cash can reinvest the dividend. The two are equivalent.' },
      { type: 'paragraph', text: 'The assumptions are obviously not the real world, and that is the point of the result rather than a flaw in it. It tells you where to look. If dividend policy matters in practice, it must matter because of one of the things the model assumed away: tax, costs, or what the payment reveals about management\'s intentions. It is not because cash paid out is inherently superior to value retained.' },

      { type: 'definition', term: 'Total return', text: 'The return from price change and dividends together, with dividends assumed reinvested. Price return counts only the price change.' },
      { type: 'paragraph', text: 'This is the number that actually describes what happened to your money, and it is why comparing two shares on dividend yield alone is a mistake. A high yield can mean a generous payment. It can equally mean a falling price, since yield is the dividend divided by the price — the denominator shrinking raises the yield just as reliably as the numerator growing.' },
      { type: 'warning', text: 'A yield that rises sharply without the dividend changing is a price signal, not an income opportunity. It usually means the market expects the payment to be cut. Screening for the highest yields, without asking why they are high, systematically selects for exactly the companies about to reduce them.' },

      { type: 'example', text: 'Two shares each yield 5%. One pays 2.50 on a 50.00 price after years of steady increases. The other paid 2.50 on a price that has fallen from 100.00 to 50.00 in eighteen months. The yield is identical and the situations have nothing in common. Only looking at the yield makes them look like the same investment.' },

      { type: 'paragraph', text: 'None of this makes dividend-paying shares bad, and dividend-focused funds are a legitimate holding. The point is narrower: judge a holding on total return and on why the company pays what it pays. Treat the yield as one input, not as the answer.' },
    ],
    quiz: [{
      question: 'A share you own at 60.00 pays a 2.00 dividend. On the ex-dividend date the price opens near 58.00. What has happened to your wealth?',
      options: [
        'It has fallen by 2.00 — the price dropped and the dividend does not compensate',
        'It is roughly unchanged — you hold a share worth 58.00 plus 2.00 in cash',
        'It has risen by 2.00 — the dividend is income on top of the share',
        'It depends entirely on whether you reinvest the dividend',
      ],
      correctIndex: 1,
      feedbackCorrect: 'Correct. The cash left the company, so the share is worth that much less, and you hold the cash instead. Roughly is the right word — the measured drop is reliably a little less than the dividend, and why that is has been argued about since Elton and Gruber in 1970. But the headline point stands: a dividend moves value from one pocket to another rather than creating it.',
      feedbackWrong: 'Not quite. The dividend is paid out of the company, so the company — and therefore the share — is worth less by about that amount. You have not gained 2.00 or lost 2.00; you now hold a share worth about 58.00 plus 2.00 in cash. This is why total return, not yield, is the number that describes what happened.',
    }],
    keyTerms: [
      { term: 'Dividend', def: 'A cash payment from a company to its shareholders.' },
      { term: 'Ex-dividend date', def: 'The first day a share trades without the right to the upcoming dividend.' },
      { term: 'Total return', def: 'Price change plus dividends reinvested — what actually happened to your money.' },
      { term: 'Dividend yield', def: 'The dividend divided by the share price. Rises when the price falls, which is often why it is high.' },
    ],
  },

  // ============================================================
  {
    id: 'expense-ratios',
    lessonNumber: 7,
    chapterNumber: 1,
    chapterTitle: 'What You Actually Own',
    title: 'What It Costs to Own',
    keyIdea: 'A fee is charged on the whole balance every year, so it compounds against you. 1.45% a year became a third of the final pot.',
    blocks: [
      { type: 'paragraph', text: 'Fees are quoted as small annual percentages, which makes them sound trivial. The arithmetic of compounding them over an investing lifetime is not trivial at all, and it is the most reliably ignored number in personal investing.' },
      { type: 'definition', term: 'Expense ratio', text: 'The annual fee a fund charges, as a percentage of the money you have invested with it. It is deducted from the fund\'s assets, so you never see a bill.' },
      { type: 'paragraph', text: 'That last part matters more than it should. A fee you are invoiced for gets noticed and questioned. A fee deducted quietly from the fund\'s value simply shows up as slightly worse performance, which is easy to attribute to markets rather than to costs.' },

      { type: 'paragraph', text: 'Here is what the difference actually does. The figures below assume 10,000 invested for 30 years with an underlying return of 7% a year, and they are computed rather than estimated.' },
      { type: 'example', text: 'With no fee at all, 10,000 becomes about 76,123. At an expense ratio of 0.05%, typical of a broad index ETF, it becomes about 75,063. At 0.75% it becomes about 61,641. At 1.50%, a level not unusual for an actively managed fund plus an adviser, it becomes about 49,840.' },
      { type: 'paragraph', text: 'Compare the two ends. The difference in fee is 1.45% a year. The difference in outcome is about 25,223 — the expensive option finishes with roughly 66% of what the cheap one produced. A 1.45% annual charge consumed about a third of the final pot.' },
      { type: 'paragraph', text: 'The reason the effect is so much larger than the headline number is that the fee is charged on the whole balance every year, including on the gains that previous years\' fees have already reduced. Compounding works on costs exactly as it works on returns, and in the same direction — away from you.' },

      { type: 'example', text: 'The same effect on a contribution schedule: 200 a month for 30 years at 7% gross is 72,000 of your own money paid in. At 0.05% it grows to about 241,601. At 1.50% it grows to about 182,722. The 58,879 difference is close to what you contributed over the first twenty-four years.' },

      { type: 'warning', text: 'A fee is one of the few things about investing you can control completely, and it is certain. The return is uncertain, the timing is uncertain, your own behaviour is uncertain. The expense ratio is a known number you can read before you buy and change by choosing a different fund. Spending effort on the certain, controllable input before the uncertain, uncontrollable one is simply the better use of attention.' },

      { type: 'paragraph', text: 'There is a structural argument here too, and it is unusually clean. William Sharpe set it out in 1991 in the Financial Analysts Journal (volume 47, issue 1, pages 7 to 9), in a paper called The Arithmetic of Active Management.' },
      { type: 'paragraph', text: 'The argument is arithmetic, not empirical, which is what makes it strong. All the shares in a market are held by someone. The passively managed money holds the market in proportion, so it earns the market return before costs. The remaining money is actively managed and, taken together, must therefore also hold the rest of the market in proportion — so it too earns the market return before costs. Active management as a whole cannot beat the market before costs, because in aggregate it is the market. After costs, and active costs are higher, it must on average do worse.' },
      { type: 'warning', text: 'Read what that claim is and is not. It does not say no active manager can beat the market — plainly some do. It says the average actively managed unit of currency must underperform the average passive one after costs, as a matter of arithmetic rather than evidence. Individual skill is a claim about the distribution around that average, not a repeal of it.' },

      { type: 'paragraph', text: 'The expense ratio is also not the whole cost. Lesson 3 covered the spread you pay each time you trade. Funds pay spreads too, inside the fund, when they buy and sell — so a fund that trades a lot carries costs beyond its published fee. Taxes are a third layer, and depend on your own circumstances.' },
      { type: 'paragraph', text: 'Chapter 4 returns to this with the full picture across a lifetime. For now the practical instruction is small: before buying any fund, find the expense ratio, and compare it to the alternatives that hold roughly the same thing. It is a two-minute check with a larger effect on your outcome than almost anything else you will do.' },
    ],
    quiz: [{
      question: 'Two funds hold nearly identical assets. One charges 0.05% a year, the other 1.50%. Over 30 years at a 7% underlying return, roughly what happens?',
      options: [
        'The expensive fund ends up about 1.45% behind, matching the fee difference',
        'The expensive fund ends up with about two thirds of what the cheap fund produced',
        'The difference is negligible, because 1.45% a year is a small number',
        'The expensive fund catches up, because higher fees usually buy better management',
      ],
      correctIndex: 1,
      feedbackCorrect: 'Correct. On 10,000 over 30 years the cheap fund produces about 75,063 and the expensive one about 49,840 — roughly 66% of it. The fee is charged on the entire balance every year, so it compounds, which is why a 1.45% annual difference turns into about a third of the final pot rather than 1.45% of it.',
      feedbackWrong: 'Not quite. The fee applies to your whole balance every year, not once, so it compounds against you. On 10,000 over 30 years at 7%, the difference between 0.05% and 1.50% is about 25,223 — the expensive fund finishes with roughly two thirds of what the cheap one produced.',
    }],
    keyTerms: [
      { term: 'Expense ratio', def: 'A fund\'s annual fee as a percentage of assets, deducted from the fund rather than billed.' },
      { term: 'Active management', def: 'Selecting holdings in an attempt to beat an index, rather than tracking it.' },
      { term: 'Passive management', def: 'Holding the market in proportion, tracking an index rather than trying to beat it.' },
    ],
  },
];
