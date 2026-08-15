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
];
