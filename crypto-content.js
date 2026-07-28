// Curriculum content for the Crypto track (paid) of the Scere Markets course.
// Compiled from the markdown lessons in course/crypto/*.en.md into the same typed-block
// model as foundation-content.js and forex-content.js (paragraph / definition / example /
// warning / practice / image blocks, plus interactive quiz and keyTerms). Rendered by
// renderCryptoTrack() in learn.js into #cryptoRoot. Diagrams resolve via
// window.SCERE_CRYPTO_SVGS (dark-theme variants, defined at the bottom of this file).
//
// Shown fully open with a "Paid track" badge; the Research Desk subscription gate is a
// separate system (see PAYMENTS.md) and does not currently gate course content.

window.SCERE_CRYPTO_TRACK = {
  trackTitle: 'Crypto',
  trackTagline: 'Paid track \u2014 how the machine actually works and how to survive it: blockchains, custody, exchanges, and the failure modes that cost people everything.',
};

window.SCERE_CRYPTO_CONTENT = [
  {
    "id": "crypto-what-is-a-cryptocurrency",
    "lessonNumber": 1,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: What a Blockchain Actually Is",
    "title": "What Is a Cryptocurrency?",
    "keyIdea": "Digital money always needed a referee to stop the same coin being spent twice — Bitcoin's 2008 proposal replaced the referee with a shared ledger and proof-of-work, and made tokens scarce; scarcity, though, is not the same thing as value.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "In \"The Foundation of Money and Trade,\" you saw money evolve from barter to coins to paper to fiat currency. Here is the final step that track left you at: today, most money is not paper at all. It is entries in databases."
      },
      {
        "type": "paragraph",
        "text": "Your bank balance is not a stack of notes in a vault with your name on it. It is a row in your bank's records. When you pay someone, no object moves. Your bank lowers one number and raises another."
      },
      {
        "type": "definition",
        "term": "Ledger",
        "text": "A record of who owns what, and of every transaction that changed it. Your bank account is an entry on your bank's ledger. Modern money mostly lives on ledgers, not in vaults."
      },
      {
        "type": "paragraph",
        "text": "This works because everyone involved trusts a referee. The bank keeps the ledger. The card network checks the ledger. If the ledger says you have 50 dollars, you cannot spend 100 — the referee refuses. So digital money is not new. Digital money without the referee is new. That is the entire subject of this lesson."
      },
      {
        "type": "paragraph",
        "text": "Why does digital money need a referee at all? Because of what computers do best: copy things."
      },
      {
        "type": "example",
        "text": "Email a photo to a friend. Your friend now has the photo — and so do you. Nothing left your possession. Send the same photo to ten more people, and now eleven identical copies exist. For photos, that is a feature. For money, it is fatal. If a digital coin were just a file, you could \"pay\" it to one person, keep a copy, and pay the same coin to someone else. Both payments would look real."
      },
      {
        "type": "definition",
        "term": "Double-Spend Problem",
        "text": "The risk that the same unit of digital money is spent more than once, because digital information can be copied perfectly at almost no cost. Physical cash does not have this problem: hand over a banknote and you no longer hold it."
      },
      {
        "type": "image",
        "svg": "crypto-01-1-double-spend",
        "alt": "Diagram contrasting the double-spend problem, where a digital coin file is copied and spent twice, with a shared ledger where every participant holds the same transaction record and the second spend is rejected",
        "caption": "A digital coin that is just a file can be copied and spent twice — a shared ledger, held by everyone, rejects the second spend."
      },
      {
        "type": "paragraph",
        "text": "Before 2008, there was exactly one working answer: put a trusted central party in charge of the ledger. The bank, the card network, or the payment company records every transaction and rejects any coin that has already been spent. The \"coin\" never really moves — the referee's ledger just updates. This answer works. It runs the entire modern banking system. Its cost is that you must trust the referee: to stay honest, to stay solvent, to not freeze your account, and to stay in business."
      },
      {
        "type": "paragraph",
        "text": "People tried to build digital cash within that model long before Bitcoin. The cryptographer David Chaum published the key idea — blind signatures, which let a bank validate digital coins without seeing who spends them — in a 1983 paper, \"Blind Signatures for Untraceable Payments.\" He founded a company, DigiCash, in 1989 to sell exactly this: private digital cash. It still needed the central bank-like issuer at the middle, and the company went bankrupt in 1998."
      },
      {
        "type": "warning",
        "text": "Keep this history in mind whenever someone tells you crypto invented digital money. Digital money existed for decades before Bitcoin. The unsolved problem was narrower and harder: how do you stop double-spending with no referee at all? That specific problem is what the 2008 paper attacked."
      },
      {
        "type": "paragraph",
        "text": "On 31 October 2008, someone using the name Satoshi Nakamoto — a pseudonym; the real identity is still unknown — posted a nine-page paper to a cryptography mailing list. Its exact title: \"Bitcoin: A Peer-to-Peer Electronic Cash System.\" The abstract states the goal in its first sentence: a purely peer-to-peer version of electronic cash would let online payments go directly from one party to another without going through a financial institution. And it names the obstacle directly: the paper says, \"We propose a solution to the double-spending problem using a peer-to-peer network.\""
      },
      {
        "type": "definition",
        "term": "Cryptocurrency",
        "text": "A digital currency whose ledger is maintained by a network of computers running shared software rules, secured by cryptography, instead of by a central institution. Bitcoin was the first working example."
      },
      {
        "type": "definition",
        "term": "Peer-to-Peer (P2P) Network",
        "text": "A network where participants connect directly to each other and share the work, instead of all connecting to one central server. In Bitcoin, thousands of computers each keep a full copy of the ledger."
      },
      {
        "type": "paragraph",
        "text": "The proposal replaces the one referee with two ingredients. First: everyone keeps the ledger. Instead of one bank holding the record, every full participant in the network holds a complete copy of every transaction. A coin that was already spent is visible to everyone, so a second spend of it is rejected by everyone. Second: proof-of-work orders the history. With thousands of copies, the network needs one agreed ordering of transactions — otherwise \"which spend came first?\" has no answer. Nakamoto's paper proposes timestamping transactions into an ongoing chain secured by computational work, \"forming a record that cannot be changed without redoing the proof-of-work.\""
      },
      {
        "type": "definition",
        "term": "Proof of Work",
        "text": "A mechanism that makes adding to the transaction history require real computational effort (and therefore real electricity and money). Rewriting old history would require redoing all that work faster than the honest network adds new work — economically brutal, though not physically impossible. Lesson 3 covers how this actually operates."
      },
      {
        "type": "paragraph",
        "text": "Notice the honest shape of that claim. The paper does not say the history cannot be rewritten. It says the system is secure \"as long as a majority of CPU power is controlled by nodes that are not cooperating to attack the network.\" That is a stated assumption, not a guarantee. If an attacker ever controlled most of the network's computing power, the protections weaken — Lesson 3 covers this as the 51% attack."
      },
      {
        "type": "example",
        "text": "Two things people confidently attribute to the 2008 paper are not in it. The word \"blockchain\" never appears — the paper describes a \"chain of blocks\" and calls the mechanism a timestamp server; the one-word name came later. And the famous 21 million limit is not in the paper either — it appears in the software rules, not the whitepaper. Reading the actual nine pages, rather than what people say about them, is this track's first exercise in verifying the claim."
      },
      {
        "type": "paragraph",
        "text": "Bitcoin's software rules started the reward for adding a block of transactions at 50 bitcoins and cut it in half every 210,000 blocks — roughly every four years. Add up that shrinking series and you get a hard ceiling of just under 21 million coins (20,999,999.98, to be precise), with new issuance ending around the year 2140. Every computer on the network enforces this: a block that tries to create extra coins is rejected as invalid."
      },
      {
        "type": "definition",
        "term": "Digital Scarcity",
        "text": "A verifiable, software-enforced limit on how many units of a digital asset can exist. Before Bitcoin, anything digital could be copied without limit; a working cap on digital units was genuinely new."
      },
      {
        "type": "paragraph",
        "text": "This is a real technical achievement. Now here is the part the hype leaves out, stated plainly: scarcity of the token is not value of the token. Scarcity limits supply. Value requires demand. Something can be perfectly, provably scarce and still be worth nothing — if you sign 21 copies of a napkin and burn the pen, you have created verifiable scarcity, not wealth. The 21 million cap tells you no one can inflate the supply. It tells you nothing about why anyone should want a bitcoin, or what one should cost. Supply and demand set prices — Foundations taught you that, and no software cap repeals it."
      },
      {
        "type": "warning",
        "text": "You will constantly hear \"Bitcoin fixes X\" and \"Bitcoin is digital gold, a store of value.\" Treat both as claims to verify, not facts to accept. The 2008 paper itself describes electronic cash — a payment system; the store-of-value framing came later. And the evidence on it is genuinely contested: Foundations Chapter 2 showed you that Bitcoin's volatility has repeatedly undermined its short-term inflation-hedge record (Lesson 3), and that two careful academic studies of whether Bitcoin protects a stock portfolio reached opposite conclusions (Lesson 4). A contested claim can still turn out true. But \"contested\" is the honest description today, and anyone presenting it as settled is selling something."
      },
      {
        "type": "practice",
        "text": "Find any article or video that says \"there will only ever be 21 million bitcoin, so the price must rise.\" Write down, in one sentence each: (1) what the supply cap actually guarantees, and (2) what extra assumption about demand the \"must rise\" part quietly adds. You now read crypto marketing differently than most participants do."
      },
      {
        "type": "practice",
        "text": "As you meet crypto claims this week, run four checks. When someone cites the 21 million cap, do they say anything about demand? When someone says Bitcoin's history \"cannot be changed,\" do they state the majority-honest assumption the paper itself states? When someone attributes a claim to \"the whitepaper,\" is it actually in the nine pages? And when someone says crypto invented digital money, remember Chaum's ecash — digital cash existed in 1989 and died in 1998. The invention was removing the referee, not going digital."
      }
    ],
    "quiz": [
      {
        "question": "Why does digital money have a double-spend problem that physical cash does not?",
        "options": [
          "Digital transactions are slower than cash transactions",
          "Digital information can be copied perfectly, so the same coin could be spent twice",
          "Digital money is not legal tender",
          "Banks charge fees on digital transactions"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — hand over a banknote and you no longer have it, but send a digital file and you still hold a perfect copy. Without a ledger to reject the second spend, one coin could pay two people.",
        "feedbackWrong": "Not quite — the issue is perfect copying. A digital coin that is just a file can be duplicated, so the same coin could be paid to two different people unless a ledger rejects the second spend."
      },
      {
        "question": "How was double-spending prevented before Bitcoin?",
        "options": [
          "It was impossible to prevent, so digital money did not exist",
          "Digital coins were designed to self-destruct after one use",
          "A trusted central party (a bank or payment network) kept the ledger and rejected already-spent money",
          "Governments made double-spending illegal, which stopped it"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — central ledgers run by banks, card networks, and even Chaum's DigiCash solved double-spending for decades. The cost was trusting the referee; Nakamoto's 2008 paper proposed a peer-to-peer network and proof-of-work instead.",
        "feedbackWrong": "Not quite — digital money existed for decades before Bitcoin. A trusted central party kept the ledger and rejected already-spent money. What was new in 2008 was removing that central party."
      },
      {
        "question": "Bitcoin's supply is capped at just under 21 million coins. What does this cap, by itself, guarantee?",
        "options": [
          "That the price of Bitcoin must rise over time",
          "That Bitcoin is a reliable store of value",
          "That no one can create extra bitcoins beyond the schedule — and nothing about what a bitcoin is worth",
          "That Bitcoin will replace fiat currency by 2140"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — the cap is a supply rule enforced by every computer on the network. Value needs demand as well as limited supply, and the store-of-value claim is contested in the academic evidence, not settled.",
        "feedbackWrong": "Not quite — the cap only limits supply. It says nothing about demand, price, or store-of-value reliability. A provably scarce token with no demand is worth nothing."
      }
    ],
    "keyTerms": [
      {
        "term": "Ledger",
        "def": "A record of who owns what and every transaction that changed it."
      },
      {
        "term": "Double-Spend Problem",
        "def": "The risk that the same unit of digital money is spent twice, because digital data copies perfectly."
      },
      {
        "term": "Cryptocurrency",
        "def": "A digital currency whose ledger is maintained by a network under shared software rules, not by a central institution."
      },
      {
        "term": "Peer-to-Peer (P2P) Network",
        "def": "A network where participants connect directly and share the work, with no central server."
      },
      {
        "term": "Proof of Work",
        "def": "A mechanism making additions to the transaction history cost real computation, so rewriting history is economically hard."
      },
      {
        "term": "Digital Scarcity",
        "def": "A verifiable, software-enforced limit on how many units of a digital asset can exist."
      }
    ]
  },
  {
    "id": "crypto-how-a-blockchain-works",
    "lessonNumber": 2,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: What a Blockchain Actually Is",
    "title": "How a Blockchain Works",
    "keyIdea": "A blockchain is batches of transactions chained together by hash fingerprints — editing any old block breaks every link after it, and hiding the break means redoing all that work while the honest chain keeps growing. \"Immutable\" is economics, not magic.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Lesson 1 ended with Nakamoto's 2008 proposal: replace the bank's referee with a shared ledger that thousands of computers keep in sync, so a double-spend is visible to everyone and rejected by everyone."
      },
      {
        "type": "paragraph",
        "text": "That raises an immediate practical question. Thousands of computers, all writing to the same record — how do you keep the record in one agreed order, and how do you stop anyone from quietly editing last month's page? The answer is the data structure this lesson covers. The ledger is not one long continuous file. It is a sequence of batches, added one at a time, with each batch cryptographically locked to the one before it."
      },
      {
        "type": "definition",
        "term": "Block",
        "text": "A batch of transactions bundled together and added to the ledger as one unit, roughly every ten minutes in Bitcoin. Besides its transactions, each block records a hash of the previous block, a timestamp, and a nonce."
      },
      {
        "type": "paragraph",
        "text": "Three items inside a block matter for this lesson. First, the transactions — the actual ledger entries, who paid whom and how much. This is the cargo. Second, the hash of the previous block — a compact fingerprint of the block that came before, the link in the chain that does all the security work. Third, the nonce — a number with no meaning of its own, which exists only to be changed. To understand the last two, you need one tool first."
      },
      {
        "type": "definition",
        "term": "Hash Function",
        "text": "A procedure that takes any digital input — a word, a file, a block of transactions — and produces a short, fixed-length output called a hash. The same input always produces the same hash, but even a tiny change to the input produces a completely different one."
      },
      {
        "type": "paragraph",
        "text": "Bitcoin uses a specific, public, heavily studied hash function called SHA-256. It was designed by the US National Security Agency and first published in 2001 in a draft US federal standard (FIPS 180-2, finalized in 2002), part of the SHA-2 family. Nothing about it is secret or crypto-specific — your bank and your web browser use the same family of functions every day. Whatever you feed it, SHA-256 outputs 256 bits, usually written as 64 hexadecimal characters."
      },
      {
        "type": "paragraph",
        "text": "Three properties make it useful here. Deterministic: the same input gives the same hash, every time, on every computer — if two people compute the same hash, they hold identical data. The avalanche effect: change the input by one character and the output does not change a little — it changes beyond recognition; there is no \"close\" in hashes. One-way: given a hash, there is no known practical way to work backwards to the input — the only way to find an input that hashes to something specific is to guess, over and over."
      },
      {
        "type": "example",
        "text": "Here is the avalanche effect on real SHA-256 output. Hash the sentence \"Alice pays Bob 10 coins\" and the result begins 489cdba1288d6741... Now change one single character — \"Alice pays Bob 70 coins\" — and the result begins 5309adf6517ce2c5... One character changed in the input; the two fingerprints share nothing. You can verify this yourself with any online SHA-256 calculator, and you should — this course keeps telling you to check claims, including ours."
      },
      {
        "type": "paragraph",
        "text": "Now the nonce makes sense. A block's hash is computed over everything in it — transactions, previous-block hash, timestamp, and the nonce. Because of the avalanche effect, changing the nonce by 1 gives the block a completely new hash. The nonce is a dial you can turn to re-roll the block's fingerprint as many times as you like."
      },
      {
        "type": "definition",
        "term": "Nonce",
        "text": "A number included in a block purely so it can be varied. Each new nonce value gives the block an entirely different hash. In proof-of-work mining, computers race through nonce values by the trillion, hunting for one that gives the block a hash below a target set by the network — that hunt is the \"work.\" Lesson 3 covers it fully."
      },
      {
        "type": "paragraph",
        "text": "Recall the Proof of Work definition from Lesson 1: adding to the history must cost real computation. The nonce is where that cost lives. A valid block requires a rare hash, a rare hash requires an enormous number of guesses, and guesses cost electricity and hardware. Finding a valid nonce is expensive; checking one is instant — anyone can hash the block once and confirm it."
      },
      {
        "type": "definition",
        "term": "Blockchain",
        "text": "A ledger built as a sequence of blocks in which each block contains the hash of the block before it. Any change to an old block changes its hash, which breaks the link stored in the next block — so tampering anywhere is detectable everywhere downstream."
      },
      {
        "type": "image",
        "svg": "crypto-01-2-chained-blocks",
        "alt": "Diagram of three blocks linked by previous-block hashes, and the same chain after block 2 is tampered with: block 2's hash changes, block 3's stored previous-hash no longer matches, and the chain visibly breaks",
        "caption": "Each block stores the previous block's hash. Edit one old transaction and that block's hash changes, so the next block's stored link visibly breaks."
      },
      {
        "type": "paragraph",
        "text": "Walk through what a would-be history editor faces. They edit an old transaction, so — avalanche effect — that block's hash is now completely different. The next block stored the old hash as its \"previous block\" link, so the chain is visibly broken, and every computer holding a copy can see it with a few instant hash checks. To hide the break, the attacker must redo the edited block's proof-of-work — which gives it a new hash, breaking the next link. So they must redo that block too. And the next. Every block after the edit, one by one. Meanwhile the honest network keeps adding new blocks roughly every ten minutes — the attacker is chasing a target that moves away at the full speed of the world's honest mining power."
      },
      {
        "type": "paragraph",
        "text": "This is the core argument of Nakamoto's 2008 paper, which you read honestly in Lesson 1: the chain forms \"a record that cannot be changed without redoing the proof-of-work,\" and an attacker rewriting history must outpace the entire honest network while doing it. The deeper the block, the more work sits on top of it, and the safer it is. This is why exchanges wait for \"confirmations\" — blocks stacked on top of your transaction — before treating a deposit as final. Lesson 6 returns to that."
      },
      {
        "type": "paragraph",
        "text": "Notice what the security actually rests on. Not secrecy — everything here is public. Not trust in any participant. It rests on arithmetic anyone can check in milliseconds, plus work that takes the whole world's mining power to produce. Cheap to verify, expensive to forge."
      },
      {
        "type": "example",
        "text": "One more honest-history note, in the Lesson 1 spirit of checking what people attribute to Bitcoin. The chained-hash idea is not from 2008. Stuart Haber and W. Scott Stornetta published \"How to Time-Stamp a Digital Document\" in the Journal of Cryptology in 1991 — seventeen years before Bitcoin — proposing linked cryptographic timestamps so that no record could be quietly back-dated. Nakamoto knew it and said so: the 2008 paper's reference list has eight entries, and three of them are Haber-Stornetta papers, including this one. Bitcoin's genuinely new contribution was not the chain of hashes. It was combining that older idea with proof-of-work and a peer-to-peer network so that no trusted timestamping company was needed at all — the same referee-removal move from Lesson 1."
      },
      {
        "type": "warning",
        "text": "A blockchain is not immutable the way a law of physics is immutable. It is expensive to rewrite — that is all, and the protection is economic, not magical. Nakamoto's own paper states the assumption plainly: the system holds as long as a majority of the network's computing power is honest. On Bitcoin, outspending the honest majority would cost billions, so the protection is very strong. On small networks it is not: rented mining power has repeatedly rewritten real chains. Ethereum Classic was successfully attacked three times in August 2020 — one attack reorganized thousands of blocks, about two days of history — and Bitcoin Gold lost roughly 18 million dollars to double-spends in a 2018 rewrite. Same design as Bitcoin. Much less honest work protecting it. When someone says \"the blockchain can't be changed,\" the honest translation is: \"changing it costs more than attackers are willing to spend — on this chain, today.\" How these 51% attacks actually work is Lesson 3's subject."
      },
      {
        "type": "paragraph",
        "text": "This is the same lesson shape you met in Lesson 1 with scarcity: a true technical property (\"the supply is capped,\" \"the history is hash-chained\") gets marketed as a stronger claim than the property actually delivers (\"the price must rise,\" \"the history can never change\"). The gap between the property and the marketing is where beginners get hurt. Train yourself to hear the difference."
      },
      {
        "type": "practice",
        "text": "Build a two-block toy chain by hand. Use this deliberately weak hash: convert letters to numbers (A=1, B=2, up to Z=26), count digits as themselves, ignore spaces, add everything up — including the previous block's hash — and keep only the last digit of the total. Block 1 contains \"PAY BOB 5\" (no earlier block, so use 0 as the previous hash): the letters sum to 61, plus 5, plus 0, gives 66 — hash 6. Block 2 contains \"PAY SUE 4\" plus the previous hash 6: compute it yourself — 87 plus 4 plus 6 gives 97, hash 7. Now tamper: change block 1 to \"PAY BOB 9\" and recompute. You get 70 — hash 0, but block 2 still says \"previous hash: 6.\" Broken, detectably. Fix block 2's link to 0 and its own hash changes from 7 to 1, which would break block 3 if there were one. You have just watched tamper-evidence propagate down a chain, with pencil and paper. Two honest caveats: this toy hash has no avalanche effect and is trivial to fake — which is exactly why real chains use SHA-256 — and re-hashing here costs you nothing, which is why real chains also attach proof-of-work."
      },
      {
        "type": "practice",
        "text": "Next time you see a blockchain called \"immutable,\" ask one question: how much honest computing power protects this particular chain? For Bitcoin the answer is enormous. For a small chain, the same word can be covering a network that rented hash power rewrote last year. And notice what hashing actually guarantees: that the record has not been altered since it entered the chain — a lie recorded on a blockchain is a tamper-evident lie. Garbage in, immutable garbage out."
      }
    ],
    "quiz": [
      {
        "question": "Each block in a blockchain contains a hash of the previous block. What does this achieve?",
        "options": [
          "It compresses the ledger so it takes less disk space",
          "It makes any edit to an old block detectable, because the edited block's hash no longer matches the link stored in the next block",
          "It encrypts the transactions so only the owner can read them",
          "It guarantees transactions are processed in under ten minutes"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — the stored hash is a fingerprint of the previous block. Edit anything in an old block and, by the avalanche effect, its hash changes completely, breaking the recorded link for everyone to see.",
        "feedbackWrong": "Not quite — the stored hash is a fingerprint of the previous block, so any edit to an old block changes its hash and breaks the recorded link. Hashing is not encryption, and it neither compresses the ledger nor speeds it up."
      },
      {
        "question": "You change one character in a file and hash it again with SHA-256. What happens to the hash?",
        "options": [
          "It changes by roughly one character",
          "It stays the same, because the file is basically identical",
          "It becomes completely different, with no resemblance to the original hash",
          "It gets slightly longer"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — this is the avalanche effect. \"Alice pays Bob 10 coins\" and \"Alice pays Bob 70 coins\" produce fingerprints that share nothing, and the output length never changes. That is what makes even the smallest tampering stand out.",
        "feedbackWrong": "Not quite — this is the avalanche effect: a one-character change produces a completely different hash of the same fixed length. There is no such thing as a \"close\" hash, which is what makes even tiny tampering stand out."
      },
      {
        "question": "Why is rewriting an old block on a large proof-of-work chain economically brutal, rather than impossible?",
        "options": [
          "The software refuses to accept any change to old blocks under any circumstances",
          "Old blocks are deleted from the network, so there is nothing left to change",
          "An attacker must redo the proof-of-work for the edited block and every block after it, faster than the honest network keeps extending the real chain",
          "Governments monitor blockchains and prosecute anyone who edits one"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — Nakamoto's paper never claims impossibility. It claims the honest chain outruns an attacker as long as most computing power is honest. On small chains that cost has actually been paid, and history was rewritten — Lesson 3 covers how.",
        "feedbackWrong": "Not quite — nothing physically forbids the edit. The attacker must redo the work for the edited block and every block above it while the honest chain keeps growing, which on a large chain costs more than it pays. On small chains it has actually happened — Lesson 3 covers how."
      }
    ],
    "keyTerms": [
      {
        "term": "Block",
        "def": "A batch of transactions added to the ledger as one unit, carrying the previous block's hash and a nonce."
      },
      {
        "term": "Hash Function",
        "def": "A procedure turning any input into a fixed-length fingerprint; same input, same hash — tiny change, totally different hash."
      },
      {
        "term": "Avalanche Effect",
        "def": "The property that a minimal change to a hash function's input produces a completely different output."
      },
      {
        "term": "Nonce",
        "def": "A number in a block that exists only to be varied, giving the block a new hash on every try."
      },
      {
        "term": "Blockchain",
        "def": "A ledger of blocks in which each block contains the previous block's hash, making any tampering detectable downstream."
      }
    ]
  },
  {
    "id": "crypto-proof-of-work-vs-proof-of-stake",
    "lessonNumber": 3,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: What a Blockchain Actually Is",
    "title": "Consensus: Proof of Work vs Proof of Stake",
    "keyIdea": "A decentralized ledger needs a way to agree on the next block, so both systems make writing history expensive — PoW with electricity, PoS with confiscatable capital — and both face the same 51% question.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Lesson 1 ended with a design: everyone keeps a full copy of the ledger, so a coin that was already spent is visible to all, and a second spend gets rejected. Lesson 2 showed why old history is hard to rewrite: each block's hash is locked into the next block, so changing anything old means redoing every block after it."
      },
      {
        "type": "paragraph",
        "text": "But both lessons quietly assumed something. They assumed the network agrees on which block comes next. That agreement is the hard part. Thousands of computers hold copies of the ledger, and new transactions arrive at each of them in a slightly different order. If every computer just wrote its own next block, the copies would split apart immediately — and \"which spend came first?\" would again have no answer. That is the double-spend problem sneaking back in through the side door."
      },
      {
        "type": "definition",
        "term": "Consensus",
        "text": "The mechanism by which a decentralized network agrees on a single next block, and therefore a single shared history, without a central referee. Every blockchain needs one; Proof of Work and Proof of Stake are the two dominant designs."
      },
      {
        "type": "paragraph",
        "text": "A bank solves this by decree: the bank's version is the version. A decentralized network cannot decree. So it does something stranger: it makes the right to write the next block expensive, and it pays the writer for doing it honestly. The two dominant systems differ only in what the expense is. Proof of Work makes it expensive in electricity and hardware. Proof of Stake makes it expensive in locked-up capital that can be destroyed. Everything else in this lesson is detail."
      },
      {
        "type": "definition",
        "term": "Mining",
        "text": "Competing to add the next block to a Proof of Work blockchain by finding a valid nonce first. The winner earns new coins plus the transaction fees in the block."
      },
      {
        "type": "paragraph",
        "text": "Lesson 2 introduced the nonce: a number in the block header that miners change over and over, rehashing each time, until the block's hash falls below the network's target. There is no shortcut and no skill involved in any single guess. It is a lottery where each hash is one ticket, and more computing power simply buys tickets faster. The winner broadcasts the finished block. Every other computer checks it in milliseconds — verifying is cheap, only finding is expensive — and, if it is valid, adds it to their copy and starts racing on the next one."
      },
      {
        "type": "definition",
        "term": "Block Subsidy",
        "text": "Newly created coins awarded to the miner of a valid block, on a fixed schedule. Bitcoin's subsidy started at 50 BTC and halves roughly every four years; since the April 2024 halving it stands at 3.125 BTC per block, on top of the block's transaction fees."
      },
      {
        "type": "definition",
        "term": "Difficulty Adjustment",
        "text": "An automatic recalibration of how hard the mining puzzle is, keeping block production near a target pace no matter how much computing power joins or leaves the network. Bitcoin retunes every 2,016 blocks — about two weeks — to hold its roughly 10-minute block pace."
      },
      {
        "type": "example",
        "text": "Notice what difficulty adjustment implies. More mining power does not produce more bitcoins — the schedule is fixed. It only raises the cost of producing the same bitcoins, and with it, the cost of attacking the history. The electricity is not an unfortunate inefficiency someone forgot to fix. Burning it is the security. Whether that price is worth paying is a fair question — but \"why not just use less energy?\" misunderstands the design: an attacker must outspend the honest network, so the honest network's spending is the wall."
      },
      {
        "type": "paragraph",
        "text": "Proof of Stake starts from a question: does the expense have to be electricity? What if, instead of burning money on power to earn the right to write blocks, participants posted money as a bond — and lost it for cheating?"
      },
      {
        "type": "definition",
        "term": "Proof of Stake",
        "text": "A consensus mechanism where the right to propose and confirm blocks goes to participants who have locked up the network's own token as collateral. Misbehavior is punished by destroying part of that collateral."
      },
      {
        "type": "definition",
        "term": "Staking",
        "text": "Locking tokens as collateral to participate in Proof of Stake consensus and earn rewards. On Ethereum, running your own validator requires exactly 32 ETH of stake."
      },
      {
        "type": "definition",
        "term": "Validator",
        "text": "A participant in a Proof of Stake network who has staked collateral and runs software that proposes new blocks and attests to (votes on) blocks proposed by others."
      },
      {
        "type": "paragraph",
        "text": "The mechanics, using Ethereum — the largest Proof of Stake network — as the example. First, you lock capital: a validator deposits 32 ETH into the protocol as collateral. Second, the protocol takes turns: for each slot it pseudo-randomly selects one validator to propose the block, and committees of other validators attest that the proposal is valid. No race, no puzzle — selection replaces competition, which is why the electricity bill collapses. Third, honesty is paid and provable cheating is punished: sign two conflicting blocks for the same slot, or two conflicting votes, and the protocol itself contains the proof of your dishonesty — any observer can submit those two signatures and trigger an automatic penalty."
      },
      {
        "type": "definition",
        "term": "Slashing",
        "text": "The automatic destruction of part of a misbehaving validator's stake, followed by ejection from the validator set. On Ethereum this is a real, live mechanism, not a threat on paper: in February 2021, one staking operator had around 75 validators slashed for double-signing, losing roughly $30,000 at the time."
      },
      {
        "type": "paragraph",
        "text": "The ejection process takes weeks, and the penalty scales up if many validators are slashed at once — that scaling targets exactly the coordinated, many-validator behavior an attack would require. The design in one sentence: in Proof of Work, attacking is expensive because you must buy the effort; in Proof of Stake, attacking is expensive because the protocol can confiscate your bond."
      },
      {
        "type": "image",
        "svg": "crypto-01-3-pow-vs-pos",
        "alt": "Side-by-side diagram of Proof of Work, where miners spend electricity racing to find a valid nonce and the winner earns the subsidy and fees, and Proof of Stake, where validators lock capital to be selected to propose blocks and face slashing for provable misbehavior",
        "caption": "Two ways to make the next block expensive: Proof of Work pays with electricity and hardware, Proof of Stake with locked capital that can be slashed — and both face the same majority-attack question."
      },
      {
        "type": "paragraph",
        "text": "Almost everything written about PoW versus PoS is written by a side. Exchanges selling staking products lean PoS. Bitcoin-adjacent media leans PoW. Here is the comparison with the marketing removed."
      },
      {
        "type": "paragraph",
        "text": "Energy. Proof of Work's consumption is real and large. The standard reference is the Cambridge Bitcoin Electricity Consumption Index; a 2025 Cambridge study built on industry survey data estimated Bitcoin mining at roughly 138 TWh per year — about 0.5% of global electricity consumption, in the range of a mid-sized country. (The index updates daily, so treat any single number as a snapshot, not a constant.) Proof of Stake removes almost all of this. When Ethereum switched from PoW to PoS on 15 September 2022 — the Merge — the Ethereum Foundation's estimate was that energy use fell by about 99.95%, and an independent assessment by the Crypto Carbon Ratings Institute measured the drop at over 99.98%. On energy, the difference is not close, and honest PoW advocates do not claim it is. The real dispute is whether the energy buys something PoS cannot replicate."
      },
      {
        "type": "paragraph",
        "text": "Security assumptions. Attacking PoW means assembling a majority of physical hashpower: hardware plus electricity, sustained for as long as the attack runs. Attacking PoS means acquiring and staking a dominant share of the token itself. Each side calls its own cost profile the strength. PoW advocates note that its cost is external and physical — you cannot print hashpower. PoS advocates note that acquiring a huge stake drives the token's price up against you, and that the attacker's own locked capital gets destroyed by slashing when the attack is detected. Neither argument fully settles it. Both systems have secured very large networks for years, and both rest on the same honest assumption Lesson 1 flagged in the 2008 paper itself: security holds while a majority of the deciding resource is honest."
      },
      {
        "type": "paragraph",
        "text": "Decentralization. Here both sides prefer to talk about the other. In Bitcoin mining, individual miners join mining pools to smooth their income, and pool concentration is persistent: through the mid-2020s, the two largest pools alone have repeatedly coordinated well over 40% of the network's total hashpower between them. In Ethereum staking, the mirror image: most holders stake through intermediaries, and the largest liquid-staking protocol, Lido, has held roughly a quarter of all staked ETH in recent years — peaking above 30% in 2023, high enough that prominent Ethereum researchers publicly argued for self-limiting. Concentration is not a PoW problem or a PoS problem. It is a gravity problem: economies of scale pull both systems toward fewer, bigger operators, and both communities actively worry about it."
      },
      {
        "type": "warning",
        "text": "\"PoS is strictly better — it does the same job without the energy\" and \"PoW is the only real security — PoS is a circular system securing itself with its own token\" are both partisan claims, and you will hear both stated as fact. Each contains a true observation and omits the counterargument. The honest position is that these are different trade-offs — external physical cost versus confiscatable internal capital — with different failure modes, and that anyone telling you the question is settled is usually holding the asset they are defending."
      },
      {
        "type": "definition",
        "term": "51% Attack",
        "text": "An attack in which one party controls a majority of a network's deciding resource (hashpower in PoW, stake in PoS) and uses it to override the honest network's version of recent history."
      },
      {
        "type": "paragraph",
        "text": "Precision matters here, because this attack is constantly exaggerated in both directions. A majority attacker can: censor (refuse to include chosen transactions), reorganize recent history (privately mine an alternative chain and release it, replacing recently confirmed blocks), and double-spend (deposit coins on an exchange, trade and withdraw, then release a rewritten chain in which the original deposit never happened). A majority attacker cannot: steal coins from arbitrary wallets (spending your coins requires your cryptographic key, which no amount of hashpower conjures), mint coins beyond the schedule (every node independently checks the supply rules, so a rule-breaking block is rejected even with enormous work behind it), or change the network's rules."
      },
      {
        "type": "example",
        "text": "This is not theoretical — on smaller chains it has happened repeatedly, because a small PoW chain can be attacked by renting hashpower by the hour. Ethereum Classic, a small PoW network, suffered three separate 51% attacks in August 2020 alone. In the second, over 5-6 August 2020, the attacker reorganized 4,236 blocks — over 15 hours of the chain's history — and double-spent about $1.7 million of ETC, using hashpower rented through a commercial marketplace. Bitcoin Gold, in May 2018, lost around $18 million to 51% double-spend attacks aimed at exchanges. Note the pattern in both cases: the victims were exchanges that credited deposits after too few confirmations — not ordinary wallet holders, whose coins the attackers had no way to touch."
      },
      {
        "type": "paragraph",
        "text": "The lesson inside the examples: majority attacks are a real, demonstrated risk — priced by the cost of the deciding resource. On the largest networks that cost is enormous and the attacks have not happened. On small chains the cost can be a few hours of rented hashpower, and the attacks happen with some regularity. \"Secured by a blockchain\" tells you nothing until you ask how expensive that particular chain's majority actually is."
      },
      {
        "type": "practice",
        "text": "Find any article comparing Proof of Work and Proof of Stake. Check which side's weakness it mentions. A comparison that names only one system's concentration problem — mining pools but not staking intermediaries, or the reverse — is an advertisement, not an analysis. Then check any energy number it cites: is it dated and sourced to something like the Cambridge index, or is it an undated shock number?"
      }
    ],
    "quiz": [
      {
        "question": "In Proof of Work, what does the difficulty adjustment actually do?",
        "options": [
          "It increases the block subsidy when more miners join",
          "It retunes the puzzle's hardness so blocks keep arriving at the target pace regardless of total mining power",
          "It makes hashes harder to verify, slowing down attackers",
          "It reduces the network's energy use over time"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — Bitcoin retunes difficulty every 2,016 blocks (about two weeks) to hold the roughly 10-minute pace. More mining power does not create more coins or faster blocks; it only raises the cost of producing, and attacking, the same chain.",
        "feedbackWrong": "Not quite — difficulty adjustment retunes how hard the puzzle is, every 2,016 blocks, so the block pace stays near 10 minutes no matter how much mining power joins. The coin schedule never changes; only the cost of winning it does."
      },
      {
        "question": "A group gains majority hashpower on a Proof of Work chain. Which of the following can they actually do?",
        "options": [
          "Spend coins out of any wallet on the network",
          "Create extra coins beyond the issuance schedule",
          "Rewrite recent blocks and double-spend their own coins",
          "Permanently change the network's rules"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — majority control allows censoring, reorganizing recent history, and double-spending, which is exactly what the Ethereum Classic attackers did in August 2020. It does not conjure other people's keys, and rule-breaking blocks are rejected by every honest node.",
        "feedbackWrong": "Not quite — a majority attacker can censor, reorganize recent blocks, and double-spend (as happened to Ethereum Classic in August 2020), but cannot steal from arbitrary wallets, mint extra coins, or change the rules — every honest node still checks those."
      },
      {
        "question": "What is the core difference in how PoW and PoS make dishonesty expensive?",
        "options": [
          "PoW uses cryptography and PoS does not",
          "PoW makes writing blocks cost external resources (hardware and electricity); PoS makes cheating cost internal collateral that the protocol can destroy",
          "PoS eliminates the 51% attack entirely",
          "PoW is decentralized and PoS is centralized"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — in PoW an attacker must out-spend the honest network in physical resources; in PoS provable cheating triggers slashing of the validator's own staked capital. Neither system eliminates majority attacks, and both have real concentration concerns.",
        "feedbackWrong": "Not quite — the real difference is the cost profile: PoW charges in external hardware and electricity, PoS in internal staked collateral that slashing can destroy. Both use cryptography, both face the 51% question, and both have concentration concerns — pools on one side, staking intermediaries on the other."
      }
    ],
    "keyTerms": [
      {
        "term": "Consensus",
        "def": "How a decentralized network agrees on one next block, and one shared history, without a referee."
      },
      {
        "term": "Mining",
        "def": "Competing to add the next Proof of Work block by finding a valid nonce first, for the subsidy plus fees."
      },
      {
        "term": "Block Subsidy",
        "def": "Newly created coins paid to the miner of a valid block on a fixed, halving schedule."
      },
      {
        "term": "Difficulty Adjustment",
        "def": "Automatic retuning of the mining puzzle to hold a target block pace as mining power changes."
      },
      {
        "term": "Proof of Stake",
        "def": "Consensus where block-writing rights go to holders of locked collateral, and cheating destroys that collateral."
      },
      {
        "term": "Staking",
        "def": "Locking tokens as collateral to participate in consensus and earn rewards."
      },
      {
        "term": "Validator",
        "def": "A staked participant who proposes blocks and attests to others' blocks."
      },
      {
        "term": "Slashing",
        "def": "Automatic destruction of part of a cheating validator's stake, plus ejection from the network."
      },
      {
        "term": "51% Attack",
        "def": "Using majority control of hashpower or stake to censor, reorganize recent history, and double-spend."
      }
    ]
  },
  {
    "id": "crypto-wallets-keys-and-custody",
    "lessonNumber": 4,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: What a Blockchain Actually Is",
    "title": "Wallets, Keys & Custody",
    "keyIdea": "A wallet holds keys, not coins — the coins live on the ledger. Whoever holds the keys (or the seed phrase that regenerates them) controls the money, and every custody option is a trade: exchange custody carries counterparty risk, self-custody carries irreversible-loss risk. You choose which risk, not whether.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Lesson 2 established where coins live: on the blockchain, the shared ledger that thousands of computers each keep a full copy of. Coins never leave that ledger. When someone \"sends you bitcoin,\" no coin file arrives on your phone. The ledger updates to say that a certain amount is now spendable by a certain address — and every copy of the ledger agrees. So if the coins stay on the ledger, what does a wallet actually hold?"
      },
      {
        "type": "definition",
        "term": "Wallet",
        "text": "Software or hardware that creates and stores your keys, and uses them to sign transactions. A wallet holds no coins. The coins are entries on the blockchain's ledger; the wallet holds the keys that control them."
      },
      {
        "type": "paragraph",
        "text": "Your banking app works the same way, and you already trust it. The app on your phone contains no money. Delete the app, and your balance still exists at the bank. Reinstall and log in, and access returns. A crypto wallet is the same — with one enormous difference. At the bank, the referee from Lesson 1 keeps the master record and can restore your access. On a blockchain, there is no referee. The keys are the only access there is."
      },
      {
        "type": "paragraph",
        "text": "That difference cuts both ways. Destroy your phone, and your coins are untouched on the ledger — restore your keys on a new device and you control them again. But lose the keys with no backup, and the coins are still untouched on the ledger. Visible. Forever. Spendable by no one. The network has no way to know the owner is gone."
      },
      {
        "type": "paragraph",
        "text": "Every address on the ledger comes with a pair of mathematically linked keys. The intuition is a mailbox."
      },
      {
        "type": "definition",
        "term": "Public Key / Address",
        "text": "The shareable half of the key pair. An address (derived from the public key) works like the slot on a mailbox: anyone who knows it can put money in, and nobody can take money out through it. Sharing your address is safe — it is how people pay you."
      },
      {
        "type": "definition",
        "term": "Private Key",
        "text": "The secret half of the key pair: a very large number that acts as the only signature the network accepts for spending from your address. Whoever knows the private key controls the money. There is no \"owner\" on a blockchain other than this."
      },
      {
        "type": "paragraph",
        "text": "Spending works like signing a check that everyone can verify. Your wallet uses the private key to produce a digital signature on the transaction. The network checks that the signature matches the address the money is leaving from. The mathematics lets everyone verify the signature without ever seeing the private key itself — which is why you can transact in public without giving your key away. Notice what the ledger checks and what it does not. It checks the signature. It does not check intent. It has no idea whether you meant this payment, mistyped the address, or were tricked."
      },
      {
        "type": "warning",
        "text": "Blockchain transactions do not reverse. There is no chargeback, no fraud department, no undo. Send coins to a mistyped address, and they are gone — the ledger did exactly what a valid signature told it to do. Send coins to a scammer, and the network cannot tell theft-by-trickery from a gift. Every protection you are used to from card payments lives in the referee — and the referee is the thing this system removed. Verify addresses before sending, every time."
      },
      {
        "type": "paragraph",
        "text": "Early wallets made users back up each private key separately — lose one, lose that money. Modern wallets fix this by generating every key you will ever need from a single master secret. A widely adopted standard called BIP-39 encodes that master secret as a short list of ordinary words — usually 12 or 24 — drawn from a fixed list of 2,048 words."
      },
      {
        "type": "definition",
        "term": "Seed Phrase",
        "text": "A sequence of words (commonly 12 or 24, from the BIP-39 standard's fixed word list) that encodes the master secret from which a wallet generates all of its private keys. Anyone who has the phrase can rebuild the entire wallet — every key, every coin — on any device, anywhere."
      },
      {
        "type": "paragraph",
        "text": "Read that definition again slowly, because it is the most practically important sentence in this chapter. The seed phrase is not a password to the money. It is the money. A password unlocks an account that a company controls, and the company can reset it. A seed phrase regenerates the keys themselves. There is no reset. There is no customer support line. If the phrase is lost, nobody on Earth can recover the keys. If the phrase is copied — photographed, typed into the wrong website, read off the note on your desk — the copier does not need your phone, your fingerprint, or your permission. They already have everything."
      },
      {
        "type": "example",
        "text": "This is why the standard advice is to write a seed phrase on paper or metal and store it offline, and why no serious wallet ever emails it to you or stores it \"in your account.\" A phrase kept only in your head can be forgotten. A phrase kept as a screenshot can be stolen by any app that reads your photos. The backup problem is real, physical, and yours."
      },
      {
        "type": "warning",
        "text": "No legitimate support agent, wallet company, exchange, or app will ever ask for your seed phrase. Ever. There is no technical task — \"validating,\" \"syncing,\" \"unlocking,\" \"verifying your wallet\" — that requires it. A person or website asking for your seed phrase is attempting to take your money, with a script polished on thousands of victims before you. This is currently one of the most common ways crypto is actually stolen: not by breaking the mathematics, but by asking politely."
      },
      {
        "type": "paragraph",
        "text": "You now know what the keys are. The next question is who holds them, and on what kind of device. That question has a name."
      },
      {
        "type": "definition",
        "term": "Custody",
        "text": "Who controls the keys to an asset. If a company holds the keys and owes you the balance, the asset is in their custody. If you hold the keys, you have taken custody yourself."
      },
      {
        "type": "definition",
        "term": "Self-Custody",
        "text": "Holding your own keys, so that no company stands between you and your coins. You gain independence from any custodian — and you inherit every job the custodian was doing: security, backups, and the consequences of mistakes."
      },
      {
        "type": "paragraph",
        "text": "Custody options sit on a spectrum, usually described in terms of temperature: how connected to the internet the keys are."
      },
      {
        "type": "definition",
        "term": "Hot Wallet",
        "text": "A wallet whose keys live on an internet-connected device: a mobile app, a browser extension, a desktop program. Convenient for frequent use; exposed, by that same connection, to malware and phishing."
      },
      {
        "type": "definition",
        "term": "Cold Storage",
        "text": "Keeping keys on something that never touches the internet — most commonly a hardware wallet, a small device that signs transactions internally so the keys never reach the connected computer. Strongest against remote theft; does nothing to protect you from losing the device and the seed phrase backup."
      },
      {
        "type": "image",
        "svg": "crypto-01-4-custody-spectrum",
        "alt": "Diagram of the custody spectrum from exchange custody on the hot end, through mobile and browser hot wallets, to hardware cold storage on the cold end, with counterparty risk labeled at the exchange end and irreversible-loss risk labeled at the cold end",
        "caption": "The custody spectrum runs from exchange custody (hot, counterparty risk) to hardware cold storage (cold, irreversible-loss risk) — moving along it swaps one risk for another."
      },
      {
        "type": "paragraph",
        "text": "Here is the honest version of the trade-off. Exchange custody: the exchange holds the keys, you carry counterparty risk — hacks, frozen withdrawals, insolvency — and in return you get password resets, customer support, and instant trading. Hot wallet: you hold the keys on a connected device, you carry phishing, malware, and mistyped-address risk, and in return you use the network directly with no one's permission. Cold storage: you hold the keys offline, you carry irreversible-loss risk — lost seed, destroyed device, your own errors — and in return you get the strongest protection against remote theft."
      },
      {
        "type": "paragraph",
        "text": "Notice that no option has an empty risk column. Moving along the spectrum does not remove risk — it swaps one kind for another. Exchange custody carries the risks of trusting a company. Self-custody carries the risks of being your own bank: nobody can freeze your money, and nobody can save it either."
      },
      {
        "type": "paragraph",
        "text": "You will hear this slogan constantly: \"not your keys, not your coins\" — coins on an exchange are not really yours, because the exchange holds the keys. Both halves of the honest version deserve a look."
      },
      {
        "type": "paragraph",
        "text": "The slogan is pointing at something real. An exchange balance is not coins on the ledger under your key — it is the exchange's promise to pay you, an IOU on the exchange's internal books, exactly like the bank ledger from Lesson 1. If the exchange fails, the promise fails with it. This has happened at scale. In February 2014, Mt. Gox — then the largest bitcoin exchange — collapsed with roughly 850,000 bitcoins missing, about 750,000 of them belonging to customers (around 200,000 were later found). In November 2022, the exchange FTX failed with an estimated 8 billion dollars of customer funds missing. One sentence each is all they get here, because Chapter 5 takes both apart as full case studies. For now, the point stands: counterparty risk in crypto custody is not hypothetical."
      },
      {
        "type": "paragraph",
        "text": "But the slogan is silent about the other side of the ledger, and the other side is also well documented. Self-custody has its own body count — measured in keys, not counterparties. The scale first, stated as carefully as the data allows. In a June 2020 analysis, the blockchain-data firm Chainalysis estimated that roughly 3.7 million bitcoin — about 20% of all coins in existence at the time — had not moved in five years or more, and were likely lost. Treat that number as an estimate, not a fact. Its method is dormancy: coins that have not moved for years are assumed lost, but the blockchain cannot distinguish a destroyed key from a patient holder, so the true figure is unknowable by nature. What the estimate honestly supports is the direction: the amount of crypto permanently stranded by lost keys is not an edge case. It is a meaningful share of everything ever created."
      },
      {
        "type": "example",
        "text": "James Howells, a British IT worker, mined roughly 8,000 bitcoin in 2009 and lost the hard drive holding his private keys when it was mistakenly thrown out in 2013 and buried in a landfill in Newport, Wales. He spent over a decade trying to excavate it. In January 2025, the UK High Court dismissed his claim against the city council, ruling the buried drive was legally the council's property; his appeal was rejected two months later. Note what that story actually teaches: the coins were never stolen. The ledger still shows them. No hacker, no fraud — just a backup that ended up in the ground, and a legal system that could not help. Programmer Stefan Thomas tells the same story in miniature: 7,002 bitcoin earned in 2011, keys locked on an encrypted IronKey drive whose password he lost, with a device that erases itself after 10 wrong guesses — eight of which he has already used."
      },
      {
        "type": "warning",
        "text": "Hold both failure lists in your head at once, because each one is regularly used to sell you something. \"Not your keys, not your coins\" is the sales pitch for hardware wallets; \"self-custody is too dangerous\" is the sales pitch for custodians. Both are half-arguments. Exchange failures prove custody risk is real. Lost-key stories prove self-custody is a skill — one that Howells and Thomas, both technically sophisticated, still failed at. Moving to self-custody does not make you safer by itself. It makes you responsible."
      },
      {
        "type": "paragraph",
        "text": "So the honest answer to \"should I hold my own keys?\" is not yes or no. It is: match the custody to the amount, the time horizon, and — this is the part people skip — your actually demonstrated competence, not your assumed competence."
      },
      {
        "type": "practice",
        "text": "The custody decision checklist. Answer these three questions in writing before deciding where any crypto should live. (1) Amount — if this money vanished tomorrow, is it an annoyance, a wound, or a catastrophe? An annoyance can live wherever is convenient. A catastrophe should never depend on a single point of failure — including a single company, and including a single piece of paper. (2) Horizon — will you touch this money weekly, or not for years? Frequent trading pulls toward hot custody; long holding pulls toward cold, because every extra month of exchange custody is another month of counterparty risk you are not being paid for. (3) Competence — have you proven, not assumed, that you can do this? The test: send a small amount to a self-custody wallet, delete the wallet, and restore it from your written seed phrase on a different device. If you have never done that drill, your cold storage is a theory. Do the drill with an amount you can afford to lose before trusting the setup with an amount you cannot."
      },
      {
        "type": "practice",
        "text": "What to look for from here on. Before sending any transaction, verify the address — check the first and last several characters at minimum, and send a small test amount first when the sum matters. Any person, site, or pop-up asking for your seed phrase is attempting theft — no exceptions, and \"support agent\" is the most common costume. When you see a balance on an exchange, name it correctly: it is the exchange's IOU to you, not coins under your key. And when either slogan appears — \"not your keys, not your coins\" or \"self-custody is too risky\" — ask what the speaker is selling. Each slogan is one true half of a two-sided trade-off."
      }
    ],
    "quiz": [
      {
        "question": "Your phone, with your only crypto wallet app on it, is destroyed. You have your seed phrase written on paper at home. What happened to your coins?",
        "options": [
          "They were destroyed with the phone and are gone",
          "Nothing — they are on the blockchain's ledger, and the seed phrase can regenerate the keys on a new device",
          "They automatically moved to the wallet company's servers for safekeeping",
          "They are frozen until you contact the wallet's customer support"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — the wallet never held the coins, only the keys. The coins are entries on the ledger, which thousands of computers still maintain, and the seed phrase rebuilds every key on any device.",
        "feedbackWrong": "Not quite — the wallet held keys, not coins. The coins are entries on the ledger, and the written seed phrase regenerates every key on a new device. (Without the written phrase, though, they would be visible on the ledger forever and spendable by no one.)"
      },
      {
        "question": "A \"support agent\" from your wallet's official-looking help chat says your wallet needs to be \"re-validated\" and asks you to enter your 12-word seed phrase on a verification page. What is the correct response?",
        "options": [
          "Enter it — support agents need the phrase to fix wallet problems",
          "Enter it, but only on a page showing the padlock icon for a secure connection",
          "Refuse and leave — no legitimate support ever needs a seed phrase, and anyone who has it has the money",
          "Give them half the words as a compromise"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — the seed phrase regenerates every private key, so whoever has it already controls the coins, and blockchain transactions do not reverse. The request itself is the proof of a scam.",
        "feedbackWrong": "Not quite — no real support process ever requires a seed phrase. Whoever has the phrase controls the money, transactions do not reverse, and a secure connection to a thief is still a thief."
      },
      {
        "question": "Moving your coins from an exchange into self-custody on a hardware wallet does what to your risk?",
        "options": [
          "Removes risk — self-custody is the safe option",
          "Adds risk — exchanges are professionally secured and safer for everyone",
          "Swaps counterparty risk (exchange hacks, freezes, insolvency) for operational risk (lost seed, user error, irreversible mistakes)",
          "Nothing — where coins are held makes no practical difference"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — Mt. Gox and FTX show counterparty risk on one end; millions of bitcoin stranded by lost keys show loss risk on the other. Self-custody transfers every custodial job to you, and whether that improves your position depends on amount, horizon, and demonstrated competence.",
        "feedbackWrong": "Not quite — self-custody removes the custodian (and their failure modes, like Mt. Gox or FTX) but transfers all operational risk to you: lost seeds, user error, irreversible mistakes. It is a swap, not a removal."
      }
    ],
    "keyTerms": [
      {
        "term": "Wallet",
        "def": "Software or hardware that stores keys and signs transactions; it holds no coins — those live on the ledger."
      },
      {
        "term": "Public Key / Address",
        "def": "The shareable half of a key pair; like a mailbox slot, anyone can pay into it and no one can take out."
      },
      {
        "term": "Private Key",
        "def": "The secret half of a key pair; the only signature the network accepts for spending. Whoever knows it controls the money."
      },
      {
        "term": "Seed Phrase",
        "def": "A word list (BIP-39; usually 12 or 24 words) encoding the master secret that regenerates all of a wallet's keys."
      },
      {
        "term": "Custody",
        "def": "Who controls the keys — a company on your behalf, or you directly."
      },
      {
        "term": "Self-Custody",
        "def": "Holding your own keys: no custodian between you and the coins, and no custodian doing security or backups for you."
      },
      {
        "term": "Hot Wallet",
        "def": "A wallet whose keys live on an internet-connected device; convenient, and exposed to malware and phishing."
      },
      {
        "term": "Cold Storage",
        "def": "Keys kept offline (typically a hardware wallet); strongest against remote theft, no protection against losing the backup."
      }
    ]
  },
  {
    "id": "crypto-exchanges-cex-vs-dex",
    "lessonNumber": 5,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: What a Blockchain Actually Is",
    "title": "Exchanges — CEX vs DEX",
    "keyIdea": "A centralized exchange holds your coins and trades IOUs inside its own database; a decentralized exchange lets your own wallet trade on-chain against a formula-priced liquidity pool — opposite ends of Lesson 4's custody trade-off.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Lesson 4 left you with a clean question to ask about any crypto arrangement: who holds the keys? This lesson applies that question to the place where most people first touch crypto — an exchange."
      },
      {
        "type": "paragraph",
        "text": "The word \"exchange\" covers two completely different machines. One is a company with a database. The other is a program running on a blockchain. They price trades differently, they hold your money differently, and they fail differently. Almost every confusing headline in crypto gets clearer once you know which machine was involved."
      },
      {
        "type": "definition",
        "term": "Centralized Exchange (CEX)",
        "text": "A company that holds customer deposits in wallets it controls and matches buy and sell orders inside its own internal systems. Coinbase, Binance, and Kraken are examples. In forex terms, it is broker, trading venue, and custodian rolled into one firm."
      },
      {
        "type": "definition",
        "term": "Decentralized Exchange (DEX)",
        "text": "A set of smart contracts on a blockchain that lets users trade directly from their own wallets, with no company holding the funds. Uniswap is the best-known example."
      },
      {
        "type": "paragraph",
        "text": "Here is the step nobody explains at signup. When you deposit one bitcoin to a centralized exchange, the bitcoin moves on-chain to a wallet whose private keys the exchange controls. From that moment, the blockchain says the exchange owns that coin. What you own is a promise: a balance in the company's internal records that says the exchange owes you one bitcoin."
      },
      {
        "type": "paragraph",
        "text": "Every trade you then make on the exchange happens inside that internal database. Sell your bitcoin for dollars, buy it back, trade it fifty times — nothing touches the blockchain. The exchange lowers one number in its ledger and raises another, exactly like the bank ledgers in Lesson 1. The blockchain only gets involved again when you withdraw, and the exchange sends coins from its wallet to yours."
      },
      {
        "type": "paragraph",
        "text": "In Lesson 4's terms: an exchange account is custody. You have moved from \"your keys\" to \"their keys,\" and taken on the referee-risk this track keeps returning to. The exchange can be hacked, can freeze withdrawals, can go bankrupt, or can quietly spend customer deposits. If it fails, the blockchain is no help — the blockchain correctly shows the exchange owning the coins. Your claim is against a company, not against the chain. That is precisely what customers of Mt. Gox learned in 2014 and customers of FTX learned in November 2022 — both are full case studies in Chapter 5."
      },
      {
        "type": "definition",
        "term": "Order Book",
        "text": "The live list of resting buy orders (bids) and sell orders (asks) for an asset at each price. The gap between the best bid and best ask is the spread. Trades happen when an incoming order matches a resting one."
      },
      {
        "type": "paragraph",
        "text": "If you have taken the Forex track, you already know this machine: bid, ask, and spread are Forex Chapter 1, Lesson 4; market orders, limit orders, and slippage are Forex Chapter 1, Lesson 7. A crypto CEX works the same way — the only twist is that the \"coins\" being matched are entries in the company's own ledger. How deep those books really are, and why reported volume can mislead, is Chapter 2, Lesson 1."
      },
      {
        "type": "warning",
        "text": "Since the FTX collapse, exchanges publish \"proof of reserves\" reports to show they hold customer assets. Read these skeptically. A proof-of-reserves snapshot shows assets, not liabilities — it can show the exchange holds 10,000 BTC without showing it owes customers 15,000 BTC, and it cannot show whether the assets were borrowed for the snapshot. In March 2023, the U.S. audit regulator's investor advocate (the PCAOB) warned investors directly that these reports are not audits and \"do not provide any meaningful assurance.\" The accounting firm Mazars had already suspended its crypto proof-of-reserves work in December 2022 — days after producing one for Binance — citing concerns about how the public understood the reports. A real audit examines assets and liabilities. A reserves snapshot is half a balance sheet."
      },
      {
        "type": "paragraph",
        "text": "A decentralized exchange removes the deposit step entirely. You never send coins to the venue. You connect your own wallet, sign a transaction, and the trade settles on-chain: the blockchain records your tokens going into a smart contract and the tokens you bought coming out, all in one transaction. Custody never changes hands. Lesson 4's trade-off applies in reverse — you keep the keys, so you also keep every risk that comes with being your own bank."
      },
      {
        "type": "paragraph",
        "text": "But there is a puzzle. An order book needs market makers constantly posting and updating quotes, which is impractical to run on-chain — every price update would be a transaction with a fee. Most DEXes solved this by throwing the order book away entirely."
      },
      {
        "type": "definition",
        "term": "Automated Market Maker (AMM)",
        "text": "A smart contract that prices trades with a formula instead of an order book. Anyone can trade against it at any time; the price is computed from what the contract holds."
      },
      {
        "type": "definition",
        "term": "Liquidity Pool",
        "text": "The pair of token reserves an AMM holds and trades against — for example, a pot of ETH and USDC locked in one contract. The tokens are supplied by users called liquidity providers, who earn a share of the pool's trading fees in return."
      },
      {
        "type": "image",
        "svg": "crypto-01-5-cex-vs-dex",
        "alt": "Diagram comparing money flow on a centralized exchange, where deposited coins move to an exchange-controlled wallet and trades update an internal IOU ledger, with a decentralized exchange, where the user's own wallet swaps tokens against an on-chain liquidity pool priced by the constant-product formula",
        "caption": "On a CEX your coins move to their wallet and you trade IOUs in their database; on a DEX your own wallet swaps against an on-chain pool priced by x × y = k."
      },
      {
        "type": "paragraph",
        "text": "The canonical AMM design comes from Uniswap, and its pricing rule fits in one line. Take the two reserves in the pool — call them x and y — and multiply them. Every trade must leave that product, k, unchanged. This is the constant-product formula, described in the Uniswap v2 whitepaper (Adams, Zinsmeister and Robinson, March 2020) and analysed formally in a 2019 paper by Angeris, Kao, Chiang, Noyes and Chitra, which showed that under ordinary conditions arbitrage traders keep the pool's price tracking the wider market."
      },
      {
        "type": "paragraph",
        "text": "That last point answers the obvious question — how does a formula \"know\" the market price? It doesn't. If the pool's price drifts away from other venues, anyone can profit by trading against the pool until the prices line up again. Arbitrage, not the formula, keeps the price honest."
      },
      {
        "type": "example",
        "text": "A pool holds 10 ETH and 20,000 USDC, so k = 10 × 20,000 = 200,000, and the pool's price is 20,000 ÷ 10 = 2,000 USDC per ETH. You swap in 5,000 USDC. The pool's USDC side rises to 25,000 — so to keep k at 200,000, the ETH side must fall to 200,000 ÷ 25,000 = 8 ETH. The pool pays out the difference: 10 − 8 = 2 ETH. You paid 5,000 USDC for 2 ETH — an effective price of 2,500 USDC per ETH, which is 25% worse than the 2,000 the pool quoted before you traded. A smaller trade hurts less: swapping in 1,000 USDC returns about 0.476 ETH, an effective price of about 2,100 — 5% worse than the quote. (Real pools also charge a small fee on each swap, 0.3% in the classic Uniswap design, which goes to the liquidity providers; we left it out to keep the arithmetic clean.)"
      },
      {
        "type": "paragraph",
        "text": "Notice what the example shows: on an AMM, your own trade moves the price, and it moves it more the larger your trade is relative to the pool. This price impact is the AMM version of a familiar idea — slippage, the gap between the price you expected and the price you got, which the forex track defines in Chapter 1, Lesson 7. On a DEX the interface shows you the estimated impact before you sign, and lets you set a maximum slippage you will tolerate. Look at that number every single time. Against a small pool, a trade that looks routine can cost you double-digit percentages."
      },
      {
        "type": "definition",
        "term": "Impermanent Loss",
        "text": "The loss a liquidity provider can suffer, relative to simply holding the two tokens, when their prices move apart after depositing into a pool. We name it here because you will meet the term; supplying liquidity is a business with real risks, and this course does not teach it."
      },
      {
        "type": "paragraph",
        "text": "Neither machine is simply better. They occupy opposite ends of the trade-off Lesson 4 taught. CEX: easy on-ramps from bank cards and transfers, deep liquidity on major pairs, KYC identity checks — and custodial counterparty risk, because mid-trade your coins are their keys and your IOU. DEX: self-custody and permissionless access with no account or ID — and user-error risk with no support desk or undo, a network gas fee on every trade (Lesson 6), pool-dependent liquidity, and exposure to fake tokens."
      },
      {
        "type": "definition",
        "term": "KYC (Know Your Customer)",
        "text": "Identity checks (documents, proof of address) that regulated financial firms must run on their customers. Centralized exchanges require them; a DEX smart contract has no operator to run them."
      },
      {
        "type": "warning",
        "text": "On a DEX, listing requires no review, no application, and no permission — anyone can create a token and a pool for it in minutes, including a fake token named after a real one. This is not a rare edge case. A 2021 measurement study of Uniswap (Xia and co-authors, published in the ACM's measurement journal) flagged over 10,000 scam tokens — roughly half of all tokens examined — most built for \"rug pulls,\" where the creator drains the pool after buyers pile in; the scams they traced netted at least 16 million dollars from nearly 40,000 victims. Permissionless listing is a real feature and a real attack surface at the same time. Never trade a token from a search box; verify its contract address from the project's official source first."
      },
      {
        "type": "practice",
        "text": "Before your next interaction with any exchange, run the checklist: Who holds the keys? If an exchange advertises \"proof of reserves,\" does the report say anything about liabilities? On a DEX, what price impact does the interface show for your trade size, and does the token's contract address match the project's official source? Keep only what you are actively trading on an exchange — Lesson 4's custody plan starts from that rule."
      }
    ],
    "quiz": [
      {
        "question": "You deposit 1 BTC to a centralized exchange and your account shows \"1 BTC.\" Where is the bitcoin?",
        "options": [
          "In your account on the blockchain, tagged with your name",
          "In a wallet the exchange controls; your balance is an entry in the company's internal ledger",
          "Split across the wallets of the exchange's other customers",
          "Nowhere — deposited bitcoin is destroyed and recreated at withdrawal"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — the coin moved to an exchange-controlled wallet, and the blockchain now shows the exchange owning it. Your \"1 BTC\" is an IOU in their database, which is why an exchange failure hits your claim, not the chain.",
        "feedbackWrong": "Not quite — the coin moved to a wallet the exchange controls, and the blockchain shows the exchange owning it. Your balance is an IOU in the company's internal ledger, so every trade there is a database entry and an exchange failure hits your claim, not the chain."
      },
      {
        "question": "A liquidity pool holds 10 ETH and 20,000 USDC (k = 200,000). Ignoring fees, how much ETH does a trader receive for swapping in 5,000 USDC?",
        "options": [
          "2.5 ETH, because the quoted price is 2,000 USDC per ETH",
          "2 ETH, because the pool must keep x × y = 200,000",
          "5 ETH, because the pool always pays half the USDC amount",
          "It depends on which market maker takes the order"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — the USDC side rises to 25,000, so the ETH side must fall to 200,000 ÷ 25,000 = 8, and the trader receives 10 − 8 = 2 ETH. The effective price of 2,500 is 25% worse than the quote: your own trade moved the price.",
        "feedbackWrong": "Not quite — the USDC side rises to 25,000, so keeping x × y = 200,000 forces the ETH side down to 8, and the trader receives 10 − 8 = 2 ETH at an effective price of 2,500. Your own trade moves an AMM's price; no market maker is involved."
      },
      {
        "question": "An exchange publishes a \"proof of reserves\" report showing it holds 10,000 BTC. What does this establish?",
        "options": [
          "That the exchange is solvent and customer funds are safe",
          "That the exchange has passed an audit",
          "That the exchange controlled those assets at a point in time — and nothing about what it owes",
          "That the exchange cannot be hacked"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — reserves are assets, but solvency is assets versus liabilities, and these reports typically say nothing about liabilities or whether the assets were borrowed for the snapshot. The U.S. audit regulator's 2023 advisory said plainly they are not audits.",
        "feedbackWrong": "Not quite — a reserves snapshot shows assets at a point in time and typically nothing about liabilities, so it cannot establish solvency. The U.S. audit regulator warned in 2023 that such reports are not audits and provide no meaningful assurance."
      }
    ],
    "keyTerms": [
      {
        "term": "Centralized Exchange (CEX)",
        "def": "A company holding customer deposits and matching trades inside its own internal ledger."
      },
      {
        "term": "Decentralized Exchange (DEX)",
        "def": "Smart contracts letting users trade on-chain directly from their own wallets."
      },
      {
        "term": "Order Book",
        "def": "The live list of resting bids and asks for an asset at each price."
      },
      {
        "term": "Automated Market Maker (AMM)",
        "def": "A smart contract that prices trades with a formula instead of an order book."
      },
      {
        "term": "Liquidity Pool",
        "def": "The token reserves an AMM holds and trades against, supplied by fee-earning users."
      },
      {
        "term": "Impermanent Loss",
        "def": "A liquidity provider's loss versus simply holding, when pooled token prices move apart."
      },
      {
        "term": "KYC (Know Your Customer)",
        "def": "Mandatory identity checks at regulated financial firms, including centralized exchanges."
      }
    ]
  },
  {
    "id": "crypto-transactions-fees-and-finality",
    "lessonNumber": 6,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: What a Blockchain Actually Is",
    "title": "Transactions, Fees & Finality",
    "keyIdea": "A transaction is signed, broadcast, waits in the mempool, gets selected into a block, and is buried under confirmations — fees are an auction for scarce block space, and \"sent\" is not \"settled\" until the transaction is buried (proof-of-work) or finalized (proof-of-stake).",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Lesson 4 gave you keys. Lesson 5 gave you venues. This lesson answers the question that sits between them: when you press \"send,\" what actually happens?"
      },
      {
        "type": "definition",
        "term": "Transaction",
        "text": "A signed instruction to update the blockchain's ledger: \"move this amount from my address to that address, and here is my signature to prove I authorized it.\" A transaction is data, not a coin moving — the ledger entries change, nothing travels."
      },
      {
        "type": "paragraph",
        "text": "A transaction lives through five stages. First, signed: your wallet builds the instruction and signs it with your private key (Lesson 4) — change one character and the signature no longer matches. Second, broadcast: your wallet hands the signed transaction to the peer-to-peer network, and nodes pass it to each other until, within seconds, most of the network has seen it. Third, waiting in the mempool: the transaction is now visible but not in the ledger."
      },
      {
        "type": "definition",
        "term": "Mempool",
        "text": "Each node's pool of valid transactions that have been broadcast but not yet included in a block. Think of it as the queue outside the ledger. A transaction in the mempool has been seen; it has not been recorded."
      },
      {
        "type": "paragraph",
        "text": "Fourth, selected into a block: a miner (Lesson 3, proof-of-work) or validator (Lesson 3, proof-of-stake) picks transactions from the mempool, packs them into a candidate block, and adds that block to the chain (Lesson 2). Fifth, buried: every new block built on top pushes your transaction deeper into history. Depth is what makes it hard to reverse."
      },
      {
        "type": "image",
        "svg": "crypto-01-6-transaction-lifecycle",
        "alt": "Diagram of the transaction lifecycle in five stages: signed with a private key, broadcast to the peer-to-peer network, waiting in the mempool where transactions bid fees for scarce block space, included in a block, then buried under N confirmations as new blocks are added",
        "caption": "Five stages from pressing send to settled — the fee auction happens at the mempool, and nothing is hard to reverse until the transaction is buried under confirmations."
      },
      {
        "type": "warning",
        "text": "\"Sent\" is not \"settled.\" A transaction sitting in the mempool can still fail, be replaced by another transaction from the same sender, or simply never confirm if its fee is too low. Wallets and payment screens often say \"sent\" the moment the transaction is broadcast — stage 2 of 5. Nothing is settled until the transaction is in a block, and nothing is hard to reverse until that block is buried. Treat \"sent\" as \"submitted an application,\" not \"done.\""
      },
      {
        "type": "paragraph",
        "text": "Why do transactions pay fees at all? Because block space is scarce. Lesson 2 showed you that each block holds a limited amount of data, and blocks arrive on a roughly fixed schedule — about every 10 minutes on Bitcoin, about every 12 seconds on Ethereum. The network can only record so many transactions per hour, no matter how many people want in. When more transactions wait in the mempool than the next blocks can hold, someone must decide which ones get in. The mechanism is simple and brutal: transactions offer fees, and block producers — who keep the fees — pick the best-paying ones first. It is an auction, and you are bidding against every other user on the network at that moment. Quiet network: fees are small. Busy network: everyone raises their bid to jump the queue, and the price of block space can multiply within hours."
      },
      {
        "type": "example",
        "text": "This is not a theoretical risk. In December 2017, a single game — CryptoKitties, which let users breed digital cats — grew until it accounted for roughly 12 percent of all Ethereum transactions; the backlog of pending transactions reached about 30,000, and fees rose for every user on the network. In April 2021, Bitcoin's average fee crossed roughly 60 dollars per transaction — a record at the time, beating the previous bull-market peak of around 50 dollars from late 2017. And in May 2021, Ethereum's average fee peaked somewhere between about 50 and 70 dollars, depending on which data provider you check — sources genuinely disagree on the exact figure, which is itself a lesson in checking data before repeating it."
      },
      {
        "type": "warning",
        "text": "Two fee mistakes cost beginners real money. First: sending with too low a fee. The network does not reject your transaction — it just never selects it, and your payment can sit in limbo for hours or days. Second: ignoring the fee-to-amount ratio. Fees price the size and complexity of the transaction, not its value — moving 20 dollars can cost exactly the same fee as moving 1 million dollars. During a fee spike, paying 50 dollars of fees to move 20 dollars of coins is not a rounding error; it is a 250 percent cost. Always check the fee against the amount before confirming."
      },
      {
        "type": "paragraph",
        "text": "Bitcoin prices block space by data size. Ethereum needs something more, because Ethereum transactions can run programs — and a program that runs longer does more work. Ethereum's answer is gas."
      },
      {
        "type": "definition",
        "term": "Gas",
        "text": "Ethereum's unit for measuring computational work. Every operation costs a fixed number of gas units: a simple transfer of ETH from one address to another always costs 21,000 gas, while interacting with a complex program can cost many times more. Your fee is the gas your transaction used multiplied by the price per unit of gas."
      },
      {
        "type": "paragraph",
        "text": "Gas prices are quoted in gwei — one gwei is one billionth of an ETH. Since August 2021, the price per unit has two parts, introduced by an upgrade called EIP-1559 (part of the \"London\" upgrade of 5 August 2021). The base fee is set automatically by the protocol, rising when blocks are full and falling when they are not — and here is the strange part: the base fee is not paid to anyone. It is burned — destroyed, removed from the ETH supply entirely. The priority fee, or tip, is an extra amount you add on top, paid to the validator, to encourage them to include your transaction sooner. When the network is quiet, a small tip is enough. When it is busy, the tip is where the auction lives on."
      },
      {
        "type": "example",
        "text": "A worked example, so the units stop being abstract. You send a simple ETH transfer: 21,000 gas. The base fee is 18 gwei and you add a 2 gwei tip, so you pay 20 gwei per gas unit. Total: 21,000 times 20 = 420,000 gwei, which is 0.00042 ETH. At an illustrative price of 2,500 dollars per ETH — a made-up round number for arithmetic, not a price forecast — that is about 1.05 dollars. Of that, 0.000378 ETH (the base-fee part) is burned and 0.000042 ETH (the tip) goes to the validator. Now rerun it during congestion at 200 gwei total: the same transfer costs 0.0042 ETH, about 10.50 dollars — ten times the fee for the identical transaction, because the auction got crowded. And notice what gas does not depend on: the amount you send."
      },
      {
        "type": "paragraph",
        "text": "Your transaction is in a block. Is it settled now? On most chains, the honest answer is: increasingly, but never absolutely."
      },
      {
        "type": "definition",
        "term": "Confirmation",
        "text": "One block added to the chain at or after the block containing your transaction. A transaction \"with 3 confirmations\" is in a block that has two more blocks built on top of it. Each confirmation buries the transaction deeper."
      },
      {
        "type": "paragraph",
        "text": "On proof-of-work chains like Bitcoin, settlement is probabilistic. Lesson 2 gave you the reason: rewriting history means redoing the proof-of-work for the rewritten block and every block after it, faster than the honest network extends the chain. Each confirmation adds another block's worth of work an attacker would have to redo. The transaction is never mathematically final — it just becomes exponentially more expensive to reverse."
      },
      {
        "type": "paragraph",
        "text": "This is where the famous \"wait for 6 confirmations\" rule comes from — and it is a convention, not a law. The 2008 Bitcoin paper worked through the attacker math: against an attacker holding 10 percent of the network's computing power, a transaction buried six blocks deep faces reversal odds below one in a thousand. Early services adopted six — roughly an hour of Bitcoin blocks — and the habit stuck. But nothing magic happens at six. Exchanges (Lesson 5) choose their own thresholds for crediting deposits, and many now credit after 2 or 3 confirmations; a stronger attacker than the paper's 10 percent example would need more. The number is a risk judgment, not a threshold in the software."
      },
      {
        "type": "definition",
        "term": "Finality",
        "text": "The point at which a transaction can no longer be reversed. Proof-of-work offers probabilistic finality: reversal becomes rapidly more expensive with depth but never impossible. Some proof-of-stake systems add explicit finality: a point after which reversal would require breaking the protocol's economic rules at massive, visible cost."
      },
      {
        "type": "paragraph",
        "text": "Proof-of-stake Ethereum works differently. Validators vote on checkpoints, and once a checkpoint gathers votes from two-thirds of all staked ETH across two voting rounds, every block behind it is marked finalized — this takes about two epochs, roughly 13 minutes. Reversing a finalized block is not just expensive to attempt; the protocol is designed so that it cannot happen unless at least one-third of all staked ETH — billions of dollars of validators' own money — breaks the rules simultaneously, and slashing (Lesson 3) destroys that stake as the penalty. Not impossible in principle. But the cost is explicit, enormous, and borne by identifiable stakers."
      },
      {
        "type": "warning",
        "text": "Finality is the reason crypto has no undo button. In Lesson 4 you saw that a payment sent to a wrong address is gone — now you know precisely when \"gone\" becomes true: once the transaction is buried (proof-of-work) or finalized (proof-of-stake), no bank, no support ticket, and no court order can rewrite the ledger entry. Banks reverse mistaken transfers because a referee keeps their ledger. This track began, in Lesson 1, with the removal of that referee. Irreversibility is not a bug in that design — it is the design. Check the address, check the amount, check the fee, then send."
      },
      {
        "type": "definition",
        "term": "Block Explorer",
        "text": "A website or tool that lets anyone look up any transaction, address, or block on a public blockchain and see its status, confirmations, and fees. Every major chain has several independent explorers; no account is needed."
      },
      {
        "type": "paragraph",
        "text": "A typical explorer transaction page shows, whatever the chain: status — pending (still in the mempool), success (in a block), or failed (and failed transactions on Ethereum still pay gas, because the network did the work of running them); confirmations — how deep the transaction is buried, often shown as a live count; fee — what was actually paid, and on Ethereum, how it split between burned base fee and tip; and the from address, to address, and amount — the ledger entry itself."
      },
      {
        "type": "practice",
        "text": "Take any confirmed transaction — one of your own if you have made one, or any recent transaction listed on a public explorer's front page. Find three things: (1) its status, (2) its number of confirmations right now, then refresh after a few minutes and watch the number grow, and (3) its fee — then compute the fee as a percentage of the amount moved. Would you have accepted that percentage knowingly? You have just done, for free, the settlement check that most crypto users never do."
      },
      {
        "type": "practice",
        "text": "This week, apply four checks. When a wallet or person says a payment was \"sent,\" ask: broadcast, in a block, or buried? Before sending during a busy period, check the current fee level — the same transaction can cost 10 times more during congestion, and fees never price the amount moved. When an exchange says \"credited after N confirmations,\" read N as that exchange's risk judgment, not a law of the protocol. And when someone quotes an exact historical fee record, check it against at least two data sources — reputable providers disagreed by some 20 dollars on Ethereum's May 2021 peak."
      }
    ],
    "quiz": [
      {
        "question": "Your wallet shows a payment as \"sent,\" and you can see the transaction in the mempool. What is the honest description of its status?",
        "options": [
          "Settled — the network has seen it, so it cannot be reversed",
          "Broadcast but unconfirmed — it can still fail, be replaced, or never confirm at all",
          "Finalized, because the signature is valid",
          "Complete after a standard 10-minute waiting period"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — the mempool is the waiting room, not the ledger. A transaction there has been seen by the network but not selected into a block; if the fee is too low it can wait indefinitely, and the sender can broadcast a replacement. \"Sent\" means submitted, nothing more.",
        "feedbackWrong": "Not quite — a transaction in the mempool has been broadcast but not recorded. It can still fail, be replaced by the sender, or never confirm if its fee is too low. \"Sent\" means submitted, not settled."
      },
      {
        "question": "On Ethereum after EIP-1559, what happens to the base-fee portion of every transaction fee?",
        "options": [
          "It is paid to the validator who includes the transaction",
          "It is refunded to the sender once the transaction is buried",
          "It is burned — destroyed and removed from the ETH supply",
          "It is pooled and shared among all stakers"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — since the London upgrade of August 2021, the protocol-set base fee is burned, and only the optional priority fee (the tip) goes to the validator. The tip is where the fee auction now operates when blocks are contested.",
        "feedbackWrong": "Not quite — since the London upgrade of August 2021, the base fee is burned: destroyed and removed from the ETH supply. Only the optional priority fee (the tip) is paid to the validator."
      },
      {
        "question": "Why do exchanges wait for several confirmations before crediting a Bitcoin deposit?",
        "options": [
          "Because the Bitcoin software forbids spending coins with fewer than 6 confirmations",
          "Because each confirmation buries the transaction under more proof-of-work, making reversal exponentially more expensive — and the exchange picks a depth where that risk is acceptably small",
          "Because confirmations verify the sender's identity",
          "Because miners refund fees on transactions reversed before 6 confirmations"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — proof-of-work finality is probabilistic: reversal is never impossible, only increasingly uneconomic with depth. Six confirmations is a convention traceable to the 2008 paper's attacker math, not a rule in the software — which is why different exchanges choose different thresholds.",
        "feedbackWrong": "Not quite — nothing in the software forbids spending earlier. Each confirmation adds proof-of-work an attacker would have to redo, so reversal gets exponentially more expensive with depth. The exchange's N is a risk judgment, and different platforms pick different numbers."
      }
    ],
    "keyTerms": [
      {
        "term": "Transaction",
        "def": "A signed instruction to update the blockchain's ledger; data recording a transfer, not a coin that travels."
      },
      {
        "term": "Mempool",
        "def": "The pool of broadcast, valid transactions waiting to be included in a block — seen, but not yet recorded."
      },
      {
        "term": "Gas",
        "def": "Ethereum's unit of computational work; the fee is gas used multiplied by the price per gas unit."
      },
      {
        "term": "Confirmation",
        "def": "One block added at or after the block containing a transaction; each one buries the transaction deeper."
      },
      {
        "term": "Finality",
        "def": "The point at which a transaction can no longer be reversed — probabilistic on proof-of-work, checkpoint-based on proof-of-stake Ethereum."
      },
      {
        "term": "Block Explorer",
        "def": "A public tool for looking up any transaction, address, or block and checking status, confirmations, and fees."
      }
    ]
  },
  {
    "id": "crypto-stablecoins",
    "lessonNumber": 7,
    "chapterNumber": 1,
    "chapterTitle": "Chapter 1: What a Blockchain Actually Is",
    "title": "Stablecoins",
    "keyIdea": "A stablecoin is a peg in miniature — a promise to hold $1 with a mechanism behind it — and the mechanism (redeemable reserves, overcollateralized crypto, or an algorithmic loop) is exactly what you must verify before relying on the promise.",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Everything in this chapter so far — wallets and keys (Lesson 4), exchanges (Lesson 5), transactions and finality (Lesson 6) — moves coins whose price swings hard. That volatility is the last practical gap in the picture. If you sell bitcoin because you expect it to fall, what do you hold instead? Moving back to actual dollars means a bank, business hours, and days of settlement. Crypto markets run 24/7 and settle in minutes."
      },
      {
        "type": "definition",
        "term": "Stablecoin",
        "text": "A crypto token designed to hold a fixed value, almost always 1 US dollar. It moves like any other token — wallet to wallet, exchange to exchange, confirmed on a blockchain — but its target price never changes."
      },
      {
        "type": "paragraph",
        "text": "Three real uses explain why stablecoins now settle more value than most people expect. First, trading pairs: on most exchanges (Lesson 5), coins are priced against a stablecoin, not against bank dollars, so selling into one lets a trader step out of volatility without leaving crypto rails. Second, moving value between venues: a stablecoin transfer settles like any transaction from Lesson 6 — minutes, any hour, any day. Third, dollar access where banking is hard: in countries with high inflation or restricted dollar accounts, a dollar-denominated token that only needs a phone and a private key is genuinely useful. This course is written for underserved investors, so we say this plainly — and just as plainly: the token is only as good as the promise behind it, which is the entire rest of this lesson."
      },
      {
        "type": "paragraph",
        "text": "You met pegs in \"The Foundation of Money and Trade\": under Bretton Woods, whole currencies were pegged to the dollar, and the pegs eventually broke. A stablecoin is a peg in miniature. The only question that matters is: what mechanism holds the peg? There are three answers."
      },
      {
        "type": "image",
        "svg": "crypto-01-7-stablecoin-models",
        "alt": "Diagram comparing the three stablecoin models side by side: fiat-backed coins redeemable against issuer-held reserves, crypto-collateralized coins minted against excess locked collateral with automatic liquidation, and algorithmic coins held up only by an arbitrage loop with a sister token, flagged as the fragile design",
        "caption": "Three mechanisms for the same $1 target: a redeemable reserve, an overcollateralized buffer, or an algorithmic loop — the loop is the fragile design."
      },
      {
        "type": "paragraph",
        "text": "Model one: fiat-backed. The simplest design: a company issues 1 token for every 1 dollar it holds in reserve, and promises to redeem tokens for dollars. Tether (USDT) and USD Coin (USDC) — the two largest stablecoins — both work this way."
      },
      {
        "type": "definition",
        "term": "Reserve",
        "text": "The pool of real-world assets an issuer holds to back its tokens. \"Fully backed\" means the reserve's value at least equals the tokens in circulation. Whether that is true, and what the reserve actually contains, is a claim to verify — not a fact to assume."
      },
      {
        "type": "paragraph",
        "text": "If the reserve is real, liquid, and redeemable, the peg holds by simple arbitrage: nobody sells a redeemable-for-$1 token much below $1 for long. So three questions decide everything. One: what is actually in the reserve? \"Backed by dollars\" can mean cash in a bank, short-term US government debt, or riskier things — loans, other cryptocurrencies, IOUs from affiliated companies. Two: who checks, and is it an attestation or an audit? Three: can you actually redeem? Issuers can set minimum redemption sizes, fees, waiting periods, and the right to refuse."
      },
      {
        "type": "definition",
        "term": "Attestation",
        "text": "A report in which an accounting firm confirms that the issuer's stated reserves existed at one moment in time. It is a snapshot, not an examination of the business. A full audit goes much deeper: controls, ongoing operations, what happens between snapshots."
      },
      {
        "type": "warning",
        "text": "Attestation is not audit. As of this writing, no major stablecoin issuer publishes a full financial audit. Circle (USDC) publishes monthly reserve attestations by Deloitte; Tether publishes quarterly attestations by BDO. An attestation is real evidence — but it tells you the reserves existed on the report date, not that they exist today, and not that the business around them is sound. When marketing says \"audited,\" check which of the two it actually is. Usually it is not an audit."
      },
      {
        "type": "paragraph",
        "text": "The record shows why these questions are not paranoia. Two regulatory actions against Tether are established fact, stated here neutrally. In February 2021, Tether and its affiliated exchange Bitfinex settled with the New York Attorney General for 18.5 million dollars and were barred from doing business with New York residents; the investigation concerned an unreported loss of about 850 million dollars in commingled funds and statements that every tether was backed 1-to-1 by dollars. The companies admitted no wrongdoing. In October 2021, the US Commodity Futures Trading Commission fined Tether 41 million dollars over its \"fully backed\" claims — the CFTC's order found that during a 26-month sample period from 2016 to 2018, Tether actually held sufficient fiat reserves for only 27.6 percent of the days."
      },
      {
        "type": "paragraph",
        "text": "Tether has since published quarterly attestations showing reserves held mostly in short-term US Treasury debt, and its tokens have kept their peg through several market crises. Both parts of that sentence are true. The lesson is not \"Tether is doomed\" or \"Tether is fine\" — it is that the \"backed\" claim had to be forced into the open by regulators, and that you should read reserve reports yourself rather than trust the word \"backed.\" None of this is new in monetary history: economists Gary Gorton and Jeffery Zhang, in a widely cited 2021 paper, \"Taming Wildcat Stablecoins,\" compare stablecoins to the private banknotes of the 19th-century US Free Banking Era — privately issued money that did not always trade at face value and was periodically hit by runs. A stablecoin run is the bank run you met in Foundations, on faster rails."
      },
      {
        "type": "paragraph",
        "text": "Model two: crypto-collateralized. The second design removes the company and the bank account. DAI, run by the MakerDAO protocol, is the canonical example: the reserve is cryptocurrency locked in smart contracts, visible on-chain by anyone. But if 1 dollar of DAI were backed by 1 dollar of ETH, a 10 percent drop in ETH would leave every DAI under-backed. The fix is to demand more collateral than the debt."
      },
      {
        "type": "definition",
        "term": "Overcollateralization",
        "text": "Backing each token with collateral worth more than the token's face value, so the backing survives a fall in the collateral's price. DAI positions typically require roughly 150 percent collateral or more, depending on the asset."
      },
      {
        "type": "example",
        "text": "Suppose the required ratio is 150 percent. You lock 300 dollars of ETH and mint 200 DAI — exactly 150 percent. ETH then falls 20 percent, so your collateral is worth 240 dollars and your ratio is 120 percent — below the requirement. The protocol liquidates you automatically: your ETH is auctioned to buy back and retire the 200 DAI, plus a liquidation penalty (around 13 percent on many collateral types, so roughly 226 dollars of your collateral is consumed), and the small remainder is returned to you. No court, no phone call — code."
      },
      {
        "type": "paragraph",
        "text": "That liquidation machinery is the whole trick: the buffer absorbs ordinary volatility, and forced liquidations rebuild the buffer when it thins. The honest cost is capital inefficiency — 1.50 dollars locked up to create 1 dollar — and the honest risk is a crash so fast that liquidations cannot keep up. DAI has held its peg through several such stress events, with visible wobbles. Its reserves are the most transparent of the three models: you can check them on a block explorer (Lesson 6) right now, which is more than any fiat-backed issuer offers."
      },
      {
        "type": "paragraph",
        "text": "Model three: algorithmic. The third design backs the token with nothing external at all. No bank account, no locked collateral. The peg is held by an arbitrage loop between the stablecoin and a second, free-floating \"sister\" token issued by the same system."
      },
      {
        "type": "definition",
        "term": "Algorithmic Stablecoin",
        "text": "A stablecoin with no reserve, whose peg depends on a software rule letting holders swap the stablecoin for a fixed dollar amount of a sister token, and back. The peg holds only while the sister token has value and buyers."
      },
      {
        "type": "example",
        "text": "The largest example that ever existed: TerraUSD (UST) and its sister token LUNA. The rule: the system always lets you burn 1 UST to mint 1 dollar's worth of newly created LUNA, and burn 1 dollar's worth of LUNA to mint 1 UST. UST slips to 0.98 dollars on an exchange. An arbitrageur buys 1 UST for 0.98, burns it for 1.00 dollar of freshly minted LUNA, sells the LUNA, and pockets 0.02. That buying pressure pushes UST back toward 1 dollar. Above the peg, the loop runs in reverse. In calm markets, it works — UST held near 1 dollar for years and grew to tens of billions."
      },
      {
        "type": "paragraph",
        "text": "Now run the loop under stress. Every UST redeemed mints new LUNA — supply that someone must buy. If many holders redeem at once, LUNA's supply explodes and its price falls. But LUNA's price is the only thing backing UST. So a falling LUNA makes UST holders more scared, which causes more redemptions, which mints more LUNA, which falls further. The mechanism designed to restore the peg becomes the engine that destroys it. This is a reflexive design: it converts fear into more of the thing that caused the fear. In May 2022, exactly this happened — UST lost its peg, the loop went into a death spiral, and roughly 40 billion dollars of value in UST and LUNA was destroyed within about a week. Chapter 5, Lesson 2 dissects the Terra collapse step by step; what you take from this lesson is only the mechanism, so that when you meet the case study, the failure will look inevitable rather than surprising."
      },
      {
        "type": "warning",
        "text": "\"Stable\" describes the target, not a guarantee. A stablecoin's name, marketing, and years of trading at 1 dollar are all statements about intent and history — not about what happens under stress. The only thing that holds any peg is its mechanism, and mechanisms differ enormously: a redeemable reserve, an overcollateralized buffer, or a loop of pure confidence. Price charts of all three look identical right up until they don't."
      },
      {
        "type": "paragraph",
        "text": "This course does not ask you to take peg fragility on faith — it showed you, with a central bank, in the Forex track's first case study (Forex Chapter 5, Lesson 1)."
      },
      {
        "type": "example",
        "text": "From 2011 the Swiss National Bank — a money-printing central bank, the strongest peg-defender that can exist — held a floor under the euro against the Swiss franc and promised to defend it with \"the utmost determination.\" Traders treated the floor as a law of nature. On 15 January 2015 the SNB abandoned it without warning, and the franc moved roughly 30 percent in minutes. Accounts were wiped out not because traders mispriced the odds, but because they had stopped treating the peg as a promise at all."
      },
      {
        "type": "paragraph",
        "text": "A stablecoin peg deserves strictly more skepticism than that, not less: the issuer is not a central bank, the promise is contractual rather than sovereign, and in the algorithmic case the promise is only a loop. The transferable habit is the same one this course keeps teaching — a peg is a promise with a mechanism, and the mechanism is exactly what you must verify before you rely on it."
      },
      {
        "type": "definition",
        "term": "Depeg",
        "text": "An episode in which a stablecoin trades meaningfully away from its target price. Depegs range from brief and recoverable to terminal, and the difference is decided by the mechanism and the reserve — not by the coin's size or reputation."
      },
      {
        "type": "warning",
        "text": "Depegs happen even to the biggest, best-run coins. In March 2023, Circle disclosed that 3.3 billion dollars of USDC's reserves — about 8 percent — were stuck in the just-collapsed Silicon Valley Bank. USDC, the transparency leader among fiat-backed coins, traded down to roughly 0.87-0.88 dollars that weekend. It recovered its peg within days, after US regulators guaranteed SVB's deposits. Read that carefully: the peg was restored by the reserve being made whole — the mechanism working — not by faith. Holders who panic-sold at 0.88 took a real loss on a coin that was, in fact, money-good. Knowing the mechanism is what tells you which depegs are survivable."
      },
      {
        "type": "practice",
        "text": "Pick the stablecoin you are most likely to actually use. Find its most recent reserve report and answer three questions in writing: (1) What are the reserves — cash and short-term government debt, or something riskier? (2) Is the report an attestation or a full audit, and who signed it? (3) What are the redemption terms — minimums, fees, who is eligible? If you cannot answer all three in 20 minutes, that is itself information."
      }
    ],
    "quiz": [
      {
        "question": "Circle publishes monthly attestation reports for USDC signed by a major accounting firm. What does an attestation actually establish?",
        "options": [
          "That USDC can never lose its peg",
          "That the stated reserves existed at the moment covered by the report — a snapshot, not a full audit of the business",
          "That the issuer's entire business, controls, and operations have been examined and approved",
          "That the US government guarantees the reserves"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — an attestation confirms the reserves existed on the report date. A full audit, which no major stablecoin issuer currently publishes, examines much more. And no report of either kind prevents a depeg — USDC held monthly attestations and still traded near 0.88 dollars in March 2023.",
        "feedbackWrong": "Not quite — an attestation is a snapshot: it confirms the stated reserves existed on the report date, nothing more. It is not a full audit, not a guarantee, and it did not stop USDC trading near 0.88 dollars in March 2023."
      },
      {
        "question": "You lock 300 dollars of ETH in a DAI vault with a 150 percent minimum collateral ratio and mint 200 DAI. ETH falls 20 percent. What happens?",
        "options": [
          "Nothing — DAI is a stablecoin, so your position is stable too",
          "Your collateral is now worth 240 dollars, your ratio is 120 percent, and the protocol automatically liquidates your ETH to retire the debt plus a penalty",
          "MakerDAO sends you an invoice for the missing 60 dollars",
          "Your DAI is automatically converted back to ETH"
        ],
        "correctIndex": 1,
        "feedbackCorrect": "Correct — 240 dollars of collateral against 200 DAI of debt is a 120 percent ratio, below the 150 percent requirement, so the smart contract liquidates the position automatically. That machinery is what keeps every circulating DAI overbacked.",
        "feedbackWrong": "Not quite — the collateral is now worth 240 dollars against 200 DAI of debt, a 120 percent ratio. That is below the 150 percent requirement, so the smart contract automatically auctions the ETH to retire the debt plus a penalty. Code, not a phone call."
      },
      {
        "question": "Why did TerraUSD's peg mechanism fail in May 2022 when many holders redeemed at once?",
        "options": [
          "Hackers broke the smart contract",
          "The US government banned algorithmic stablecoins",
          "Every UST redeemed minted new LUNA, crashing LUNA's price — and since LUNA's value was the only backing, each redemption made the next holder more likely to run",
          "The reserves at Silicon Valley Bank were frozen"
        ],
        "correctIndex": 2,
        "feedbackCorrect": "Correct — UST had no external reserve, only the swap loop with LUNA. Mass redemptions flooded the market with new LUNA, LUNA's price collapsed, and the falling backing triggered more redemptions: a reflexive death spiral, with roughly 40 billion dollars destroyed. Chapter 5 dissects it fully.",
        "feedbackWrong": "Not quite — UST's only backing was the swap loop with its sister token LUNA. Mass redemptions minted huge LUNA supply, LUNA's price collapsed, and the shrinking backing caused more redemptions — a reflexive death spiral. The Silicon Valley Bank option describes USDC's March 2023 depeg, a reserve coin that recovered."
      }
    ],
    "keyTerms": [
      {
        "term": "Stablecoin",
        "def": "A crypto token designed to hold a fixed value, almost always 1 US dollar."
      },
      {
        "term": "Reserve",
        "def": "The pool of real-world assets an issuer holds to back its tokens."
      },
      {
        "term": "Attestation",
        "def": "An accountant's confirmation that stated reserves existed at one moment — a snapshot, not a full audit."
      },
      {
        "term": "Overcollateralization",
        "def": "Backing each token with collateral worth more than its face value, to survive collateral price falls."
      },
      {
        "term": "Algorithmic Stablecoin",
        "def": "A stablecoin with no reserve, whose peg depends on a swap loop with a sister token."
      },
      {
        "term": "Depeg",
        "def": "An episode in which a stablecoin trades meaningfully away from its target price."
      }
    ]
  }
];

window.SCERE_CRYPTO_SVGS = {
  "crypto-01-1-double-spend": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 900 560\" font-family=\"Arial, Helvetica, sans-serif\">\n  <rect x=\"0\" y=\"0\" width=\"900\" height=\"560\" fill=\"#0f172a\"/>\n  <text x=\"450\" y=\"36\" text-anchor=\"middle\" font-size=\"22\" font-weight=\"bold\" fill=\"#e2e8f0\">The Double-Spend Problem vs a Shared Ledger</text>\n\n  <!-- ===== LEFT PANEL: the problem ===== -->\n  <rect x=\"30\" y=\"60\" width=\"410\" height=\"470\" rx=\"10\" fill=\"#0f172a\" stroke=\"#ef4444\" stroke-width=\"2\"/>\n  <text x=\"235\" y=\"92\" text-anchor=\"middle\" font-size=\"17\" font-weight=\"bold\" fill=\"#ef4444\">Digital coin as a plain file</text>\n  <text x=\"235\" y=\"112\" text-anchor=\"middle\" font-size=\"13\" fill=\"#e2e8f0\">Files copy perfectly. So does the \"coin\".</text>\n\n  <!-- Alice -->\n  <circle cx=\"235\" cy=\"170\" r=\"30\" fill=\"#3b82f6\"/>\n  <text x=\"235\" y=\"176\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">Alice</text>\n  <!-- coin file at Alice -->\n  <rect x=\"205\" y=\"212\" width=\"60\" height=\"34\" rx=\"6\" fill=\"#eab308\"/>\n  <text x=\"235\" y=\"233\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">coin.dat</text>\n\n  <!-- arrow to Bob -->\n  <line x1=\"200\" y1=\"255\" x2=\"125\" y2=\"330\" stroke=\"#e2e8f0\" stroke-width=\"2.5\"/>\n  <polygon points=\"125,330 141,323 132,314\" fill=\"#e2e8f0\"/>\n  <text x=\"120\" y=\"290\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">sends file</text>\n\n  <!-- arrow to Carol -->\n  <line x1=\"270\" y1=\"255\" x2=\"345\" y2=\"330\" stroke=\"#ef4444\" stroke-width=\"2.5\" stroke-dasharray=\"7,5\"/>\n  <polygon points=\"345,330 338,314 329,323\" fill=\"#ef4444\"/>\n  <text x=\"352\" y=\"290\" text-anchor=\"middle\" font-size=\"12\" fill=\"#ef4444\">sends a copy</text>\n\n  <!-- Bob -->\n  <circle cx=\"115\" cy=\"365\" r=\"28\" fill=\"#22c55e\"/>\n  <text x=\"115\" y=\"371\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">Bob</text>\n  <rect x=\"85\" y=\"404\" width=\"60\" height=\"30\" rx=\"6\" fill=\"#eab308\"/>\n  <text x=\"115\" y=\"424\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">coin.dat</text>\n\n  <!-- Carol -->\n  <circle cx=\"355\" cy=\"365\" r=\"28\" fill=\"#22c55e\"/>\n  <text x=\"355\" y=\"371\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">Carol</text>\n  <rect x=\"325\" y=\"404\" width=\"60\" height=\"30\" rx=\"6\" fill=\"#eab308\"/>\n  <text x=\"355\" y=\"424\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">coin.dat</text>\n\n  <rect x=\"55\" y=\"455\" width=\"360\" height=\"56\" rx=\"8\" fill=\"#ef4444\"/>\n  <text x=\"235\" y=\"479\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">Same coin spent twice.</text>\n  <text x=\"235\" y=\"499\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">Both payments look real. Money fails.</text>\n\n  <!-- ===== RIGHT PANEL: the shared ledger ===== -->\n  <rect x=\"460\" y=\"60\" width=\"410\" height=\"470\" rx=\"10\" fill=\"#0f172a\" stroke=\"#22c55e\" stroke-width=\"2\"/>\n  <text x=\"665\" y=\"92\" text-anchor=\"middle\" font-size=\"17\" font-weight=\"bold\" fill=\"#22c55e\">One shared ledger, many copies</text>\n  <text x=\"665\" y=\"112\" text-anchor=\"middle\" font-size=\"13\" fill=\"#e2e8f0\">Every participant records the transaction.</text>\n\n  <!-- central ledger -->\n  <rect x=\"580\" y=\"140\" width=\"170\" height=\"96\" rx=\"8\" fill=\"#e2e8f0\"/>\n  <text x=\"665\" y=\"164\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">SHARED LEDGER</text>\n  <line x1=\"596\" y1=\"176\" x2=\"734\" y2=\"176\" stroke=\"#0f172a\" stroke-width=\"1\"/>\n  <text x=\"665\" y=\"196\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">Alice pays Bob: 1 coin</text>\n  <text x=\"665\" y=\"218\" text-anchor=\"middle\" font-size=\"12\" fill=\"#eab308\">Coin marked as spent</text>\n\n  <!-- network nodes each holding a copy -->\n  <line x1=\"580\" y1=\"240\" x2=\"530\" y2=\"300\" stroke=\"#3b82f6\" stroke-width=\"2\"/>\n  <line x1=\"665\" y1=\"240\" x2=\"665\" y2=\"300\" stroke=\"#3b82f6\" stroke-width=\"2\"/>\n  <line x1=\"750\" y1=\"240\" x2=\"800\" y2=\"300\" stroke=\"#3b82f6\" stroke-width=\"2\"/>\n\n  <g>\n    <rect x=\"495\" y=\"302\" width=\"70\" height=\"46\" rx=\"6\" fill=\"#3b82f6\"/>\n    <text x=\"530\" y=\"321\" text-anchor=\"middle\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Node 1</text>\n    <text x=\"530\" y=\"338\" text-anchor=\"middle\" font-size=\"10\" fill=\"#0f172a\">full copy</text>\n  </g>\n  <g>\n    <rect x=\"630\" y=\"302\" width=\"70\" height=\"46\" rx=\"6\" fill=\"#3b82f6\"/>\n    <text x=\"665\" y=\"321\" text-anchor=\"middle\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Node 2</text>\n    <text x=\"665\" y=\"338\" text-anchor=\"middle\" font-size=\"10\" fill=\"#0f172a\">full copy</text>\n  </g>\n  <g>\n    <rect x=\"765\" y=\"302\" width=\"70\" height=\"46\" rx=\"6\" fill=\"#3b82f6\"/>\n    <text x=\"800\" y=\"321\" text-anchor=\"middle\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Node 3</text>\n    <text x=\"800\" y=\"338\" text-anchor=\"middle\" font-size=\"10\" fill=\"#0f172a\">full copy</text>\n  </g>\n\n  <!-- attempted second spend -->\n  <rect x=\"510\" y=\"378\" width=\"310\" height=\"40\" rx=\"8\" fill=\"#0f172a\" stroke=\"#ef4444\" stroke-width=\"2\"/>\n  <text x=\"665\" y=\"403\" text-anchor=\"middle\" font-size=\"13\" fill=\"#ef4444\">Alice tries: pay the same coin to Carol</text>\n\n  <line x1=\"665\" y1=\"418\" x2=\"665\" y2=\"448\" stroke=\"#ef4444\" stroke-width=\"2.5\"/>\n  <polygon points=\"665,448 658,433 672,433\" fill=\"#ef4444\"/>\n\n  <rect x=\"510\" y=\"452\" width=\"310\" height=\"60\" rx=\"8\" fill=\"#22c55e\"/>\n  <text x=\"665\" y=\"477\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">REJECTED by every node</text>\n  <text x=\"665\" y=\"497\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">The ledger already shows that coin as spent.</text>\n\n  <!-- footer -->\n  <text x=\"450\" y=\"550\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">Before Bitcoin, one trusted referee kept this ledger. Nakamoto (2008): let a peer-to-peer network keep it instead.</text>\n</svg>\n",
  "crypto-01-2-chained-blocks": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 900 620\" font-family=\"Arial, Helvetica, sans-serif\">\n  <rect x=\"0\" y=\"0\" width=\"900\" height=\"620\" fill=\"#0f172a\"/>\n  <text x=\"450\" y=\"34\" text-anchor=\"middle\" font-size=\"22\" font-weight=\"bold\" fill=\"#e2e8f0\">Chained Blocks: Why Editing Old History Shows</text>\n\n  <!-- ===== TOP PANEL: healthy chain ===== -->\n  <rect x=\"30\" y=\"58\" width=\"840\" height=\"230\" rx=\"10\" fill=\"#0f172a\" stroke=\"#22c55e\" stroke-width=\"2\"/>\n  <text x=\"450\" y=\"86\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"bold\" fill=\"#22c55e\">Healthy chain: each block stores the previous block's hash</text>\n\n  <!-- Block 1 -->\n  <rect x=\"60\" y=\"104\" width=\"200\" height=\"150\" rx=\"8\" fill=\"#0f172a\" stroke=\"#e2e8f0\" stroke-width=\"2\"/>\n  <rect x=\"60\" y=\"104\" width=\"200\" height=\"30\" rx=\"8\" fill=\"#e2e8f0\"/>\n  <text x=\"160\" y=\"125\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">BLOCK 1</text>\n  <text x=\"72\" y=\"156\" font-size=\"12\" fill=\"#3b82f6\">Prev hash: (none)</text>\n  <text x=\"72\" y=\"178\" font-size=\"12\" fill=\"#e2e8f0\">Txs: Ana pays Ben 2</text>\n  <text x=\"72\" y=\"200\" font-size=\"12\" fill=\"#e2e8f0\">Nonce: 91772</text>\n  <rect x=\"60\" y=\"216\" width=\"200\" height=\"38\" rx=\"6\" fill=\"#eab308\"/>\n  <text x=\"160\" y=\"240\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Hash: 8f3c...</text>\n\n  <!-- link 1 to 2 -->\n  <line x1=\"260\" y1=\"235\" x2=\"310\" y2=\"235\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <line x1=\"310\" y1=\"235\" x2=\"310\" y2=\"150\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <line x1=\"310\" y1=\"150\" x2=\"332\" y2=\"150\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <polygon points=\"340,150 326,143 326,157\" fill=\"#22c55e\"/>\n\n  <!-- Block 2 -->\n  <rect x=\"340\" y=\"104\" width=\"200\" height=\"150\" rx=\"8\" fill=\"#0f172a\" stroke=\"#e2e8f0\" stroke-width=\"2\"/>\n  <rect x=\"340\" y=\"104\" width=\"200\" height=\"30\" rx=\"8\" fill=\"#e2e8f0\"/>\n  <text x=\"440\" y=\"125\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">BLOCK 2</text>\n  <text x=\"352\" y=\"156\" font-size=\"12\" fill=\"#3b82f6\">Prev hash: 8f3c...</text>\n  <text x=\"352\" y=\"178\" font-size=\"12\" fill=\"#e2e8f0\">Txs: Ben pays Cara 1</text>\n  <text x=\"352\" y=\"200\" font-size=\"12\" fill=\"#e2e8f0\">Nonce: 40118</text>\n  <rect x=\"340\" y=\"216\" width=\"200\" height=\"38\" rx=\"6\" fill=\"#eab308\"/>\n  <text x=\"440\" y=\"240\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Hash: 2b71...</text>\n\n  <!-- link 2 to 3 -->\n  <line x1=\"540\" y1=\"235\" x2=\"590\" y2=\"235\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <line x1=\"590\" y1=\"235\" x2=\"590\" y2=\"150\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <line x1=\"590\" y1=\"150\" x2=\"612\" y2=\"150\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <polygon points=\"620,150 606,143 606,157\" fill=\"#22c55e\"/>\n\n  <!-- Block 3 -->\n  <rect x=\"620\" y=\"104\" width=\"200\" height=\"150\" rx=\"8\" fill=\"#0f172a\" stroke=\"#e2e8f0\" stroke-width=\"2\"/>\n  <rect x=\"620\" y=\"104\" width=\"200\" height=\"30\" rx=\"8\" fill=\"#e2e8f0\"/>\n  <text x=\"720\" y=\"125\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">BLOCK 3</text>\n  <text x=\"632\" y=\"156\" font-size=\"12\" fill=\"#3b82f6\">Prev hash: 2b71...</text>\n  <text x=\"632\" y=\"178\" font-size=\"12\" fill=\"#e2e8f0\">Txs: Cara pays Dan 3</text>\n  <text x=\"632\" y=\"200\" font-size=\"12\" fill=\"#e2e8f0\">Nonce: 65530</text>\n  <rect x=\"620\" y=\"216\" width=\"200\" height=\"38\" rx=\"6\" fill=\"#eab308\"/>\n  <text x=\"720\" y=\"240\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Hash: 77aa...</text>\n\n  <text x=\"450\" y=\"276\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">Each hash is copied into the next block. Every link checks out. (Hashes shortened for display.)</text>\n\n  <!-- ===== BOTTOM PANEL: tampered chain ===== -->\n  <rect x=\"30\" y=\"304\" width=\"840\" height=\"248\" rx=\"10\" fill=\"#0f172a\" stroke=\"#ef4444\" stroke-width=\"2\"/>\n  <text x=\"450\" y=\"332\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"bold\" fill=\"#ef4444\">Tampered: one old transaction is edited in Block 2</text>\n\n  <!-- Block 1 (unchanged) -->\n  <rect x=\"60\" y=\"350\" width=\"200\" height=\"150\" rx=\"8\" fill=\"#0f172a\" stroke=\"#e2e8f0\" stroke-width=\"2\"/>\n  <rect x=\"60\" y=\"350\" width=\"200\" height=\"30\" rx=\"8\" fill=\"#e2e8f0\"/>\n  <text x=\"160\" y=\"371\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">BLOCK 1</text>\n  <text x=\"72\" y=\"402\" font-size=\"12\" fill=\"#3b82f6\">Prev hash: (none)</text>\n  <text x=\"72\" y=\"424\" font-size=\"12\" fill=\"#e2e8f0\">Txs: Ana pays Ben 2</text>\n  <text x=\"72\" y=\"446\" font-size=\"12\" fill=\"#e2e8f0\">Nonce: 91772</text>\n  <rect x=\"60\" y=\"462\" width=\"200\" height=\"38\" rx=\"6\" fill=\"#eab308\"/>\n  <text x=\"160\" y=\"486\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Hash: 8f3c...</text>\n\n  <!-- link 1 to 2 still fine -->\n  <line x1=\"260\" y1=\"481\" x2=\"310\" y2=\"481\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <line x1=\"310\" y1=\"481\" x2=\"310\" y2=\"396\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <line x1=\"310\" y1=\"396\" x2=\"332\" y2=\"396\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <polygon points=\"340,396 326,389 326,403\" fill=\"#22c55e\"/>\n\n  <!-- Block 2 (edited) -->\n  <rect x=\"340\" y=\"350\" width=\"200\" height=\"150\" rx=\"8\" fill=\"#0f172a\" stroke=\"#ef4444\" stroke-width=\"3\"/>\n  <rect x=\"340\" y=\"350\" width=\"200\" height=\"30\" rx=\"8\" fill=\"#ef4444\"/>\n  <text x=\"440\" y=\"371\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">BLOCK 2 (edited)</text>\n  <text x=\"352\" y=\"402\" font-size=\"12\" fill=\"#3b82f6\">Prev hash: 8f3c...</text>\n  <text x=\"352\" y=\"424\" font-size=\"12\" font-weight=\"bold\" fill=\"#ef4444\">Txs: Ben pays Cara 900</text>\n  <text x=\"352\" y=\"446\" font-size=\"12\" fill=\"#e2e8f0\">Nonce: 40118</text>\n  <rect x=\"340\" y=\"462\" width=\"200\" height=\"38\" rx=\"6\" fill=\"#ef4444\"/>\n  <text x=\"440\" y=\"486\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">New hash: e04d...</text>\n\n  <!-- broken link 2 to 3 -->\n  <line x1=\"540\" y1=\"481\" x2=\"590\" y2=\"481\" stroke=\"#ef4444\" stroke-width=\"2.5\" stroke-dasharray=\"7,5\"/>\n  <line x1=\"590\" y1=\"481\" x2=\"590\" y2=\"396\" stroke=\"#ef4444\" stroke-width=\"2.5\" stroke-dasharray=\"7,5\"/>\n  <line x1=\"590\" y1=\"396\" x2=\"612\" y2=\"396\" stroke=\"#ef4444\" stroke-width=\"2.5\" stroke-dasharray=\"7,5\"/>\n  <line x1=\"596\" y1=\"430\" x2=\"620\" y2=\"454\" stroke=\"#ef4444\" stroke-width=\"4\"/>\n  <line x1=\"620\" y1=\"430\" x2=\"596\" y2=\"454\" stroke=\"#ef4444\" stroke-width=\"4\"/>\n\n  <!-- Block 3 (link now wrong) -->\n  <rect x=\"620\" y=\"350\" width=\"200\" height=\"150\" rx=\"8\" fill=\"#0f172a\" stroke=\"#e2e8f0\" stroke-width=\"2\"/>\n  <rect x=\"620\" y=\"350\" width=\"200\" height=\"30\" rx=\"8\" fill=\"#e2e8f0\"/>\n  <text x=\"720\" y=\"371\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">BLOCK 3</text>\n  <text x=\"632\" y=\"402\" font-size=\"12\" font-weight=\"bold\" fill=\"#ef4444\">Prev hash: 2b71... ?!</text>\n  <text x=\"632\" y=\"424\" font-size=\"12\" fill=\"#e2e8f0\">Txs: Cara pays Dan 3</text>\n  <text x=\"632\" y=\"446\" font-size=\"12\" fill=\"#e2e8f0\">Nonce: 65530</text>\n  <rect x=\"620\" y=\"462\" width=\"200\" height=\"38\" rx=\"6\" fill=\"#eab308\"/>\n  <text x=\"720\" y=\"486\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Hash: 77aa...</text>\n\n  <text x=\"450\" y=\"524\" text-anchor=\"middle\" font-size=\"12\" fill=\"#ef4444\">Block 2's hash changed (avalanche effect) -> Block 3's stored link no longer matches. Every node can see the break.</text>\n  <text x=\"450\" y=\"542\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">Hiding it means redoing the proof-of-work for Block 2 AND every block after it.</text>\n\n  <!-- footer -->\n  <text x=\"450\" y=\"584\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#e2e8f0\">Meanwhile the honest chain keeps growing, about every 10 minutes. The attacker chases a moving target.</text>\n  <text x=\"450\" y=\"604\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">Nakamoto (2008): the chain forms \"a record that cannot be changed without redoing the proof-of-work.\"</text>\n</svg>\n",
  "crypto-01-3-pow-vs-pos": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 900 600\" font-family=\"Arial, Helvetica, sans-serif\">\n  <rect x=\"0\" y=\"0\" width=\"900\" height=\"600\" fill=\"#0f172a\"/>\n\n  <text x=\"450\" y=\"34\" font-size=\"20\" font-weight=\"bold\" fill=\"#e2e8f0\" text-anchor=\"middle\">Two Ways to Make the Next Block Expensive</text>\n  <text x=\"450\" y=\"56\" font-size=\"13\" fill=\"#3b82f6\" text-anchor=\"middle\">Consensus: who gets to write history, and what it costs them</text>\n\n  <!-- Panel frames -->\n  <rect x=\"30\" y=\"80\" width=\"410\" height=\"420\" rx=\"10\" fill=\"none\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <rect x=\"460\" y=\"80\" width=\"410\" height=\"420\" rx=\"10\" fill=\"none\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n\n  <text x=\"235\" y=\"108\" font-size=\"16\" font-weight=\"bold\" fill=\"#e2e8f0\" text-anchor=\"middle\">PROOF OF WORK</text>\n  <text x=\"235\" y=\"126\" font-size=\"12\" fill=\"#ef4444\" text-anchor=\"middle\">pays with electricity</text>\n  <text x=\"665\" y=\"108\" font-size=\"16\" font-weight=\"bold\" fill=\"#e2e8f0\" text-anchor=\"middle\">PROOF OF STAKE</text>\n  <text x=\"665\" y=\"126\" font-size=\"12\" fill=\"#ef4444\" text-anchor=\"middle\">pays with locked capital</text>\n\n  <!-- PoW: input box -->\n  <rect x=\"70\" y=\"145\" width=\"330\" height=\"58\" rx=\"8\" fill=\"#eab308\" fill-opacity=\"0.15\" stroke=\"#eab308\" stroke-width=\"1.5\"/>\n  <text x=\"235\" y=\"169\" font-size=\"13\" font-weight=\"bold\" fill=\"#e2e8f0\" text-anchor=\"middle\">HARDWARE + ELECTRICITY</text>\n  <text x=\"235\" y=\"188\" font-size=\"11.5\" fill=\"#e2e8f0\" text-anchor=\"middle\">miners burn real resources on hash guesses</text>\n\n  <!-- arrow down -->\n  <line x1=\"235\" y1=\"203\" x2=\"235\" y2=\"233\" stroke=\"#3b82f6\" stroke-width=\"2\"/>\n  <polygon points=\"235,241 229,229 241,229\" fill=\"#3b82f6\"/>\n\n  <!-- PoW: race box -->\n  <rect x=\"70\" y=\"243\" width=\"330\" height=\"72\" rx=\"8\" fill=\"#3b82f6\" fill-opacity=\"0.10\" stroke=\"#3b82f6\" stroke-width=\"1.5\"/>\n  <text x=\"235\" y=\"266\" font-size=\"13\" font-weight=\"bold\" fill=\"#e2e8f0\" text-anchor=\"middle\">THE NONCE RACE</text>\n  <text x=\"235\" y=\"284\" font-size=\"11.5\" fill=\"#e2e8f0\" text-anchor=\"middle\">every hash is a lottery ticket; first valid</text>\n  <text x=\"235\" y=\"300\" font-size=\"11.5\" fill=\"#e2e8f0\" text-anchor=\"middle\">nonce wins the right to propose the block</text>\n\n  <line x1=\"235\" y1=\"315\" x2=\"235\" y2=\"345\" stroke=\"#3b82f6\" stroke-width=\"2\"/>\n  <polygon points=\"235,353 229,341 241,341\" fill=\"#3b82f6\"/>\n\n  <!-- PoW: block -->\n  <rect x=\"100\" y=\"355\" width=\"270\" height=\"52\" rx=\"8\" fill=\"#e2e8f0\"/>\n  <text x=\"235\" y=\"377\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\" text-anchor=\"middle\">NEW BLOCK</text>\n  <text x=\"235\" y=\"395\" font-size=\"11.5\" fill=\"#0f172a\" text-anchor=\"middle\">winner earns subsidy + fees</text>\n\n  <!-- PoW: reward note -->\n  <rect x=\"70\" y=\"425\" width=\"330\" height=\"55\" rx=\"8\" fill=\"#22c55e\" fill-opacity=\"0.12\" stroke=\"#22c55e\" stroke-width=\"1.5\"/>\n  <text x=\"235\" y=\"447\" font-size=\"11.5\" fill=\"#22c55e\" font-weight=\"bold\" text-anchor=\"middle\">SELF-REGULATING: difficulty retunes every</text>\n  <text x=\"235\" y=\"464\" font-size=\"11.5\" fill=\"#22c55e\" text-anchor=\"middle\">2,016 blocks to hold the target block pace</text>\n\n  <!-- PoS: input box -->\n  <rect x=\"500\" y=\"145\" width=\"330\" height=\"58\" rx=\"8\" fill=\"#3b82f6\" fill-opacity=\"0.15\" stroke=\"#3b82f6\" stroke-width=\"1.5\"/>\n  <text x=\"665\" y=\"169\" font-size=\"13\" font-weight=\"bold\" fill=\"#e2e8f0\" text-anchor=\"middle\">STAKED CAPITAL</text>\n  <text x=\"665\" y=\"188\" font-size=\"11.5\" fill=\"#e2e8f0\" text-anchor=\"middle\">validators lock tokens as a bond (32 ETH each)</text>\n\n  <line x1=\"665\" y1=\"203\" x2=\"665\" y2=\"233\" stroke=\"#3b82f6\" stroke-width=\"2\"/>\n  <polygon points=\"665,241 659,229 671,229\" fill=\"#3b82f6\"/>\n\n  <!-- PoS: selection box -->\n  <rect x=\"500\" y=\"243\" width=\"330\" height=\"72\" rx=\"8\" fill=\"#3b82f6\" fill-opacity=\"0.10\" stroke=\"#3b82f6\" stroke-width=\"1.5\"/>\n  <text x=\"665\" y=\"266\" font-size=\"13\" font-weight=\"bold\" fill=\"#e2e8f0\" text-anchor=\"middle\">SELECTION, NOT RACE</text>\n  <text x=\"665\" y=\"284\" font-size=\"11.5\" fill=\"#e2e8f0\" text-anchor=\"middle\">protocol picks one validator to propose;</text>\n  <text x=\"665\" y=\"300\" font-size=\"11.5\" fill=\"#e2e8f0\" text-anchor=\"middle\">committees of others attest to the block</text>\n\n  <line x1=\"665\" y1=\"315\" x2=\"665\" y2=\"345\" stroke=\"#3b82f6\" stroke-width=\"2\"/>\n  <polygon points=\"665,353 659,341 671,341\" fill=\"#3b82f6\"/>\n\n  <!-- PoS: block -->\n  <rect x=\"530\" y=\"355\" width=\"270\" height=\"52\" rx=\"8\" fill=\"#e2e8f0\"/>\n  <text x=\"665\" y=\"377\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\" text-anchor=\"middle\">NEW BLOCK</text>\n  <text x=\"665\" y=\"395\" font-size=\"11.5\" fill=\"#0f172a\" text-anchor=\"middle\">honest work earns staking rewards</text>\n\n  <!-- PoS: slashing note -->\n  <rect x=\"500\" y=\"425\" width=\"330\" height=\"55\" rx=\"8\" fill=\"#ef4444\" fill-opacity=\"0.12\" stroke=\"#ef4444\" stroke-width=\"1.5\"/>\n  <text x=\"665\" y=\"447\" font-size=\"11.5\" fill=\"#ef4444\" font-weight=\"bold\" text-anchor=\"middle\">SLASHING RISK: sign two conflicting blocks or</text>\n  <text x=\"665\" y=\"464\" font-size=\"11.5\" fill=\"#ef4444\" text-anchor=\"middle\">votes and the protocol destroys part of your stake</text>\n\n  <!-- Bottom shared bar -->\n  <rect x=\"30\" y=\"520\" width=\"840\" height=\"58\" rx=\"10\" fill=\"#eab308\" fill-opacity=\"0.15\" stroke=\"#eab308\" stroke-width=\"1.5\"/>\n  <text x=\"450\" y=\"544\" font-size=\"13\" font-weight=\"bold\" fill=\"#e2e8f0\" text-anchor=\"middle\">SAME ASSUMPTION ON BOTH SIDES</text>\n  <text x=\"450\" y=\"563\" font-size=\"12\" fill=\"#e2e8f0\" text-anchor=\"middle\">Attack cost = a majority of the deciding resource: hashpower (PoW) or stake (PoS). Neither side escapes the 51% question.</text>\n</svg>\n",
  "crypto-01-4-custody-spectrum": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 940 560\" font-family=\"Arial, Helvetica, sans-serif\">\n  <rect x=\"0\" y=\"0\" width=\"940\" height=\"560\" fill=\"#0f172a\"/>\n\n  <!-- Title -->\n  <text x=\"470\" y=\"42\" text-anchor=\"middle\" font-size=\"24\" font-weight=\"bold\" fill=\"#e2e8f0\">The Custody Spectrum: Who Holds the Keys?</text>\n  <text x=\"470\" y=\"68\" text-anchor=\"middle\" font-size=\"14\" fill=\"#3b82f6\">Every option trades one risk for another - the choice is which risk, not whether</text>\n\n  <!-- Temperature axis -->\n  <rect x=\"80\" y=\"100\" width=\"780\" height=\"14\" rx=\"7\" fill=\"#EAE6DD\"/>\n  <rect x=\"80\" y=\"100\" width=\"260\" height=\"14\" rx=\"7\" fill=\"#eab308\"/>\n  <rect x=\"600\" y=\"100\" width=\"260\" height=\"14\" rx=\"7\" fill=\"#3b82f6\"/>\n  <text x=\"80\" y=\"140\" font-size=\"15\" font-weight=\"bold\" fill=\"#eab308\">HOT</text>\n  <text x=\"80\" y=\"158\" font-size=\"12\" fill=\"#e2e8f0\">keys touch the internet</text>\n  <text x=\"860\" y=\"140\" text-anchor=\"end\" font-size=\"15\" font-weight=\"bold\" fill=\"#3b82f6\">COLD</text>\n  <text x=\"860\" y=\"158\" text-anchor=\"end\" font-size=\"12\" fill=\"#e2e8f0\">keys stay offline</text>\n\n  <!-- Station 1: Exchange custody -->\n  <rect x=\"80\" y=\"185\" width=\"230\" height=\"150\" rx=\"10\" fill=\"#0f172a\" stroke=\"#eab308\" stroke-width=\"2.5\"/>\n  <text x=\"195\" y=\"215\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"bold\" fill=\"#e2e8f0\">EXCHANGE CUSTODY</text>\n  <line x1=\"100\" y1=\"228\" x2=\"290\" y2=\"228\" stroke=\"#EAE6DD\" stroke-width=\"1.5\"/>\n  <text x=\"195\" y=\"252\" text-anchor=\"middle\" font-size=\"13\" fill=\"#e2e8f0\">The exchange holds the keys.</text>\n  <text x=\"195\" y=\"272\" text-anchor=\"middle\" font-size=\"13\" fill=\"#e2e8f0\">Your balance is their IOU.</text>\n  <text x=\"195\" y=\"300\" text-anchor=\"middle\" font-size=\"12\" fill=\"#22c55e\">Password resets, support,</text>\n  <text x=\"195\" y=\"317\" text-anchor=\"middle\" font-size=\"12\" fill=\"#22c55e\">instant trading</text>\n\n  <!-- Station 2: Hot wallet -->\n  <rect x=\"355\" y=\"185\" width=\"230\" height=\"150\" rx=\"10\" fill=\"#0f172a\" stroke=\"#3b82f6\" stroke-width=\"2.5\"/>\n  <text x=\"470\" y=\"215\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"bold\" fill=\"#e2e8f0\">HOT WALLET</text>\n  <line x1=\"375\" y1=\"228\" x2=\"565\" y2=\"228\" stroke=\"#EAE6DD\" stroke-width=\"1.5\"/>\n  <text x=\"470\" y=\"252\" text-anchor=\"middle\" font-size=\"13\" fill=\"#e2e8f0\">You hold the keys, on a</text>\n  <text x=\"470\" y=\"272\" text-anchor=\"middle\" font-size=\"13\" fill=\"#e2e8f0\">connected phone or browser.</text>\n  <text x=\"470\" y=\"300\" text-anchor=\"middle\" font-size=\"12\" fill=\"#22c55e\">Direct use of the network,</text>\n  <text x=\"470\" y=\"317\" text-anchor=\"middle\" font-size=\"12\" fill=\"#22c55e\">no permission needed</text>\n\n  <!-- Station 3: Cold storage -->\n  <rect x=\"630\" y=\"185\" width=\"230\" height=\"150\" rx=\"10\" fill=\"#0f172a\" stroke=\"#e2e8f0\" stroke-width=\"2.5\"/>\n  <text x=\"745\" y=\"215\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"bold\" fill=\"#e2e8f0\">COLD STORAGE</text>\n  <line x1=\"650\" y1=\"228\" x2=\"840\" y2=\"228\" stroke=\"#EAE6DD\" stroke-width=\"1.5\"/>\n  <text x=\"745\" y=\"252\" text-anchor=\"middle\" font-size=\"13\" fill=\"#e2e8f0\">You hold the keys, on a</text>\n  <text x=\"745\" y=\"272\" text-anchor=\"middle\" font-size=\"13\" fill=\"#e2e8f0\">hardware device kept offline.</text>\n  <text x=\"745\" y=\"300\" text-anchor=\"middle\" font-size=\"12\" fill=\"#22c55e\">Strongest protection</text>\n  <text x=\"745\" y=\"317\" text-anchor=\"middle\" font-size=\"12\" fill=\"#22c55e\">against remote theft</text>\n\n  <!-- Connectors -->\n  <line x1=\"310\" y1=\"260\" x2=\"355\" y2=\"260\" stroke=\"#e2e8f0\" stroke-width=\"2\"/>\n  <line x1=\"585\" y1=\"260\" x2=\"630\" y2=\"260\" stroke=\"#e2e8f0\" stroke-width=\"2\"/>\n\n  <!-- Risk label: left end -->\n  <rect x=\"80\" y=\"370\" width=\"360\" height=\"110\" rx=\"10\" fill=\"#0f172a\" stroke=\"#ef4444\" stroke-width=\"2.5\"/>\n  <text x=\"100\" y=\"398\" font-size=\"14\" font-weight=\"bold\" fill=\"#ef4444\">RISK AT THIS END: COUNTERPARTY</text>\n  <text x=\"100\" y=\"422\" font-size=\"13\" fill=\"#e2e8f0\">The company can be hacked, freeze</text>\n  <text x=\"100\" y=\"441\" font-size=\"13\" fill=\"#e2e8f0\">withdrawals, or go broke with your funds.</text>\n  <text x=\"100\" y=\"465\" font-size=\"12\" fill=\"#ef4444\">Mt. Gox (2014), FTX (2022) - see Chapter 5</text>\n\n  <!-- Risk label: right end -->\n  <rect x=\"500\" y=\"370\" width=\"360\" height=\"110\" rx=\"10\" fill=\"#0f172a\" stroke=\"#ef4444\" stroke-width=\"2.5\"/>\n  <text x=\"520\" y=\"398\" font-size=\"14\" font-weight=\"bold\" fill=\"#ef4444\">RISK AT THIS END: IRREVERSIBLE LOSS</text>\n  <text x=\"520\" y=\"422\" font-size=\"13\" fill=\"#e2e8f0\">Lost seed phrase, mistyped address, or</text>\n  <text x=\"520\" y=\"441\" font-size=\"13\" fill=\"#e2e8f0\">your own error - and no support line exists.</text>\n  <text x=\"520\" y=\"465\" font-size=\"12\" fill=\"#ef4444\">Nobody can freeze you. Nobody can save you.</text>\n\n  <!-- Bottom takeaway -->\n  <text x=\"470\" y=\"520\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#22c55e\">Match custody to amount, time horizon, and demonstrated competence -</text>\n  <text x=\"470\" y=\"540\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#22c55e\">not to a slogan from either end of the spectrum.</text>\n</svg>\n",
  "crypto-01-5-cex-vs-dex": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 900 560\" font-family=\"Arial, Helvetica, sans-serif\">\n  <rect x=\"0\" y=\"0\" width=\"900\" height=\"560\" fill=\"#0f172a\"/>\n  <text x=\"450\" y=\"36\" text-anchor=\"middle\" font-size=\"22\" font-weight=\"bold\" fill=\"#e2e8f0\">Where Your Money Actually Goes: CEX vs DEX</text>\n\n  <!-- ===== LEFT PANEL: CEX ===== -->\n  <rect x=\"30\" y=\"60\" width=\"410\" height=\"440\" rx=\"10\" fill=\"#0f172a\" stroke=\"#eab308\" stroke-width=\"2\"/>\n  <text x=\"235\" y=\"92\" text-anchor=\"middle\" font-size=\"17\" font-weight=\"bold\" fill=\"#eab308\">Centralized exchange (CEX)</text>\n  <text x=\"235\" y=\"112\" text-anchor=\"middle\" font-size=\"13\" fill=\"#e2e8f0\">You deposit. They custody. You trade IOUs.</text>\n\n  <!-- You -->\n  <circle cx=\"120\" cy=\"170\" r=\"32\" fill=\"#3b82f6\"/>\n  <text x=\"120\" y=\"167\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">You</text>\n  <text x=\"120\" y=\"184\" text-anchor=\"middle\" font-size=\"10\" fill=\"#0f172a\">1 BTC</text>\n\n  <!-- deposit arrow -->\n  <line x1=\"158\" y1=\"160\" x2=\"270\" y2=\"160\" stroke=\"#e2e8f0\" stroke-width=\"2.5\"/>\n  <polygon points=\"270,160 254,153 254,167\" fill=\"#e2e8f0\"/>\n  <text x=\"214\" y=\"148\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">deposit (on-chain)</text>\n\n  <!-- exchange wallet -->\n  <rect x=\"275\" y=\"132\" width=\"140\" height=\"60\" rx=\"8\" fill=\"#eab308\"/>\n  <text x=\"345\" y=\"156\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">EXCHANGE WALLET</text>\n  <text x=\"345\" y=\"176\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">THEIR keys hold it</text>\n\n  <!-- arrow down to ledger -->\n  <line x1=\"345\" y1=\"192\" x2=\"345\" y2=\"228\" stroke=\"#eab308\" stroke-width=\"2.5\"/>\n  <polygon points=\"345,228 338,213 352,213\" fill=\"#eab308\"/>\n\n  <!-- internal ledger -->\n  <rect x=\"90\" y=\"232\" width=\"330\" height=\"130\" rx=\"8\" fill=\"#e2e8f0\"/>\n  <text x=\"255\" y=\"258\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">INTERNAL LEDGER (company database)</text>\n  <line x1=\"110\" y1=\"270\" x2=\"400\" y2=\"270\" stroke=\"#0f172a\" stroke-width=\"1\"/>\n  <text x=\"255\" y=\"292\" text-anchor=\"middle\" font-size=\"12\" fill=\"#eab308\">Your balance: 1 BTC -- an IOU to you</text>\n  <text x=\"255\" y=\"314\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">Every trade edits rows in this database.</text>\n  <text x=\"255\" y=\"336\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">The blockchain sees none of it.</text>\n\n  <!-- withdrawal arrow -->\n  <line x1=\"120\" y1=\"366\" x2=\"120\" y2=\"404\" stroke=\"#e2e8f0\" stroke-width=\"2.5\" stroke-dasharray=\"6,4\"/>\n  <polygon points=\"120,404 113,389 127,389\" fill=\"#e2e8f0\"/>\n  <text x=\"196\" y=\"390\" text-anchor=\"middle\" font-size=\"11\" fill=\"#e2e8f0\">withdrawal: on-chain again</text>\n\n  <rect x=\"55\" y=\"410\" width=\"360\" height=\"72\" rx=\"8\" fill=\"#ef4444\"/>\n  <text x=\"235\" y=\"436\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Counterparty risk: hack, freeze, insolvency</text>\n  <text x=\"235\" y=\"456\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">If the company fails, your claim fails with it.</text>\n  <text x=\"235\" y=\"472\" text-anchor=\"middle\" font-size=\"11\" fill=\"#0f172a\">Proof of reserves shows assets, not liabilities.</text>\n\n  <!-- ===== RIGHT PANEL: DEX ===== -->\n  <rect x=\"460\" y=\"60\" width=\"410\" height=\"440\" rx=\"10\" fill=\"#0f172a\" stroke=\"#22c55e\" stroke-width=\"2\"/>\n  <text x=\"665\" y=\"92\" text-anchor=\"middle\" font-size=\"17\" font-weight=\"bold\" fill=\"#22c55e\">Decentralized exchange (DEX)</text>\n  <text x=\"665\" y=\"112\" text-anchor=\"middle\" font-size=\"13\" fill=\"#e2e8f0\">No deposit. Your wallet trades with a pool.</text>\n\n  <!-- your wallet -->\n  <rect x=\"545\" y=\"136\" width=\"240\" height=\"60\" rx=\"8\" fill=\"#3b82f6\"/>\n  <text x=\"665\" y=\"160\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">YOUR WALLET</text>\n  <text x=\"665\" y=\"180\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">YOUR keys, before and after the trade</text>\n\n  <!-- two-way arrows -->\n  <line x1=\"610\" y1=\"196\" x2=\"610\" y2=\"260\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <polygon points=\"610,260 603,245 617,245\" fill=\"#22c55e\"/>\n  <text x=\"560\" y=\"232\" text-anchor=\"middle\" font-size=\"11\" fill=\"#22c55e\">USDC in</text>\n\n  <line x1=\"720\" y1=\"260\" x2=\"720\" y2=\"196\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <polygon points=\"720,196 713,211 727,211\" fill=\"#22c55e\"/>\n  <text x=\"772\" y=\"232\" text-anchor=\"middle\" font-size=\"11\" fill=\"#22c55e\">ETH out</text>\n\n  <!-- liquidity pool -->\n  <rect x=\"520\" y=\"264\" width=\"290\" height=\"130\" rx=\"8\" fill=\"#22c55e\"/>\n  <text x=\"665\" y=\"290\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">LIQUIDITY POOL (smart contract)</text>\n  <line x1=\"540\" y1=\"302\" x2=\"790\" y2=\"302\" stroke=\"#0f172a\" stroke-width=\"1\"/>\n  <text x=\"665\" y=\"324\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">Reserves: 10 ETH and 20,000 USDC</text>\n  <text x=\"665\" y=\"346\" text-anchor=\"middle\" font-size=\"12\" fill=\"#eab308\">Price rule: x * y = k (stays 200,000)</text>\n  <text x=\"665\" y=\"368\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">Big trade vs small pool = big price impact</text>\n\n  <!-- settlement note -->\n  <rect x=\"485\" y=\"410\" width=\"360\" height=\"72\" rx=\"8\" fill=\"#3b82f6\"/>\n  <text x=\"665\" y=\"436\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Trade settles on-chain, in one transaction</text>\n  <text x=\"665\" y=\"456\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">No custodian -- and no support desk, no undo.</text>\n  <text x=\"665\" y=\"472\" text-anchor=\"middle\" font-size=\"11\" fill=\"#0f172a\">Anyone can list any token. Verify the contract.</text>\n\n  <!-- footer -->\n  <text x=\"450\" y=\"530\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">Same question from Lesson 4 decides which risks you carry: who holds the keys?</text>\n  <text x=\"450\" y=\"548\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">CEX: their keys, your IOU. DEX: your keys, your mistakes.</text>\n</svg>\n",
  "crypto-01-6-transaction-lifecycle": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 960 475\" font-family=\"Arial, Helvetica, sans-serif\">\n  <rect x=\"0\" y=\"0\" width=\"960\" height=\"475\" fill=\"#0f172a\"/>\n\n  <text x=\"480\" y=\"40\" text-anchor=\"middle\" font-size=\"25\" font-weight=\"bold\" fill=\"#e2e8f0\">The Life of a Transaction</text>\n  <text x=\"480\" y=\"64\" text-anchor=\"middle\" font-size=\"13.5\" fill=\"#3b82f6\">Five stages from pressing send to settled - and where the fee auction happens</text>\n\n  <!-- zone brackets -->\n  <text x=\"298\" y=\"96\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"bold\" fill=\"#ef4444\">SENT is not SETTLED: can still fail, be replaced, or never confirm</text>\n  <line x1=\"37\" y1=\"106\" x2=\"559\" y2=\"106\" stroke=\"#ef4444\" stroke-width=\"2\"/>\n  <line x1=\"37\" y1=\"106\" x2=\"37\" y2=\"114\" stroke=\"#ef4444\" stroke-width=\"2\"/>\n  <line x1=\"559\" y1=\"106\" x2=\"559\" y2=\"114\" stroke=\"#ef4444\" stroke-width=\"2\"/>\n\n  <text x=\"753\" y=\"96\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"bold\" fill=\"#22c55e\">SETTLING: deeper = harder to reverse</text>\n  <line x1=\"583\" y1=\"106\" x2=\"923\" y2=\"106\" stroke=\"#22c55e\" stroke-width=\"2\"/>\n  <line x1=\"583\" y1=\"106\" x2=\"583\" y2=\"114\" stroke=\"#22c55e\" stroke-width=\"2\"/>\n  <line x1=\"923\" y1=\"106\" x2=\"923\" y2=\"114\" stroke=\"#22c55e\" stroke-width=\"2\"/>\n\n  <!-- stage 1 -->\n  <rect x=\"37\" y=\"130\" width=\"158\" height=\"115\" rx=\"10\" fill=\"#e2e8f0\"/>\n  <text x=\"116\" y=\"155\" text-anchor=\"middle\" font-size=\"14.5\" font-weight=\"bold\" fill=\"#0f172a\">1. SIGNED</text>\n  <text x=\"116\" y=\"180\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">Your wallet signs the</text>\n  <text x=\"116\" y=\"196\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">instruction with your</text>\n  <text x=\"116\" y=\"212\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">private key (Lesson 4)</text>\n\n  <line x1=\"195\" y1=\"187\" x2=\"207\" y2=\"187\" stroke=\"#e2e8f0\" stroke-width=\"3\"/>\n  <polygon points=\"207,180 219,187 207,194\" fill=\"#e2e8f0\"/>\n\n  <!-- stage 2 -->\n  <rect x=\"219\" y=\"130\" width=\"158\" height=\"115\" rx=\"10\" fill=\"#3b82f6\"/>\n  <text x=\"298\" y=\"155\" text-anchor=\"middle\" font-size=\"14.5\" font-weight=\"bold\" fill=\"#0f172a\">2. BROADCAST</text>\n  <text x=\"298\" y=\"180\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">Nodes pass it across</text>\n  <text x=\"298\" y=\"196\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">the peer-to-peer</text>\n  <text x=\"298\" y=\"212\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">network in seconds</text>\n\n  <line x1=\"377\" y1=\"187\" x2=\"389\" y2=\"187\" stroke=\"#e2e8f0\" stroke-width=\"3\"/>\n  <polygon points=\"389,180 401,187 389,194\" fill=\"#e2e8f0\"/>\n\n  <!-- stage 3 -->\n  <rect x=\"401\" y=\"130\" width=\"158\" height=\"115\" rx=\"10\" fill=\"#eab308\"/>\n  <text x=\"480\" y=\"155\" text-anchor=\"middle\" font-size=\"14.5\" font-weight=\"bold\" fill=\"#0f172a\">3. MEMPOOL</text>\n  <text x=\"480\" y=\"180\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">The waiting room:</text>\n  <text x=\"480\" y=\"196\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">seen by the network,</text>\n  <text x=\"480\" y=\"212\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">not yet recorded</text>\n\n  <line x1=\"559\" y1=\"187\" x2=\"571\" y2=\"187\" stroke=\"#e2e8f0\" stroke-width=\"3\"/>\n  <polygon points=\"571,180 583,187 571,194\" fill=\"#e2e8f0\"/>\n\n  <!-- stage 4 -->\n  <rect x=\"583\" y=\"130\" width=\"158\" height=\"115\" rx=\"10\" fill=\"#3b82f6\"/>\n  <text x=\"662\" y=\"155\" text-anchor=\"middle\" font-size=\"14.5\" font-weight=\"bold\" fill=\"#0f172a\">4. IN A BLOCK</text>\n  <text x=\"662\" y=\"180\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">A miner or validator</text>\n  <text x=\"662\" y=\"196\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">selects it into the next</text>\n  <text x=\"662\" y=\"212\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">block (Lessons 2, 3)</text>\n\n  <line x1=\"741\" y1=\"187\" x2=\"753\" y2=\"187\" stroke=\"#e2e8f0\" stroke-width=\"3\"/>\n  <polygon points=\"753,180 765,187 753,194\" fill=\"#e2e8f0\"/>\n\n  <!-- stage 5 -->\n  <rect x=\"765\" y=\"130\" width=\"158\" height=\"115\" rx=\"10\" fill=\"#22c55e\"/>\n  <text x=\"844\" y=\"155\" text-anchor=\"middle\" font-size=\"14.5\" font-weight=\"bold\" fill=\"#0f172a\">5. BURIED</text>\n  <text x=\"844\" y=\"180\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">Each new block adds</text>\n  <text x=\"844\" y=\"196\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">one confirmation</text>\n  <text x=\"844\" y=\"212\" text-anchor=\"middle\" font-size=\"11.5\" fill=\"#0f172a\">and more depth</text>\n\n  <!-- fee auction annotation -->\n  <line x1=\"480\" y1=\"245\" x2=\"330\" y2=\"292\" stroke=\"#eab308\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/>\n  <rect x=\"60\" y=\"292\" width=\"520\" height=\"118\" rx=\"10\" fill=\"#0f172a\" stroke=\"#eab308\" stroke-width=\"2.5\" stroke-dasharray=\"7,5\"/>\n  <text x=\"80\" y=\"318\" font-size=\"13.5\" font-weight=\"bold\" fill=\"#eab308\">THE FEE AUCTION (happens here)</text>\n  <text x=\"80\" y=\"340\" font-size=\"12\" fill=\"#e2e8f0\">- Block space is scarce: only so many transactions fit in each block</text>\n  <text x=\"80\" y=\"359\" font-size=\"12\" fill=\"#e2e8f0\">- Users bid fees; block producers pick the highest-paying first</text>\n  <text x=\"80\" y=\"378\" font-size=\"12\" fill=\"#e2e8f0\">- When demand spikes, fees spike; a too-low bid can wait for days</text>\n  <text x=\"80\" y=\"397\" font-size=\"12\" fill=\"#e2e8f0\">- Fees price size and computation, never the amount you move</text>\n\n  <!-- confirmations annotation -->\n  <line x1=\"844\" y1=\"245\" x2=\"775\" y2=\"292\" stroke=\"#22c55e\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/>\n  <rect x=\"620\" y=\"292\" width=\"310\" height=\"118\" rx=\"10\" fill=\"#0f172a\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <text x=\"640\" y=\"318\" font-size=\"13.5\" font-weight=\"bold\" fill=\"#22c55e\">N CONFIRMATIONS</text>\n  <rect x=\"640\" y=\"330\" width=\"44\" height=\"26\" rx=\"4\" fill=\"#22c55e\"/>\n  <text x=\"662\" y=\"347\" text-anchor=\"middle\" font-size=\"11.5\" font-weight=\"bold\" fill=\"#0f172a\">+1</text>\n  <line x1=\"684\" y1=\"343\" x2=\"696\" y2=\"343\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <rect x=\"696\" y=\"330\" width=\"44\" height=\"26\" rx=\"4\" fill=\"#22c55e\"/>\n  <text x=\"718\" y=\"347\" text-anchor=\"middle\" font-size=\"11.5\" font-weight=\"bold\" fill=\"#0f172a\">+2</text>\n  <line x1=\"740\" y1=\"343\" x2=\"752\" y2=\"343\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <rect x=\"752\" y=\"330\" width=\"44\" height=\"26\" rx=\"4\" fill=\"#22c55e\"/>\n  <text x=\"774\" y=\"347\" text-anchor=\"middle\" font-size=\"11.5\" font-weight=\"bold\" fill=\"#0f172a\">+3</text>\n  <line x1=\"796\" y1=\"343\" x2=\"808\" y2=\"343\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <text x=\"822\" y=\"347\" font-size=\"11.5\" font-weight=\"bold\" fill=\"#22c55e\">...</text>\n  <text x=\"640\" y=\"380\" font-size=\"12\" fill=\"#e2e8f0\">Reversing means redoing the work</text>\n  <text x=\"640\" y=\"398\" font-size=\"12\" fill=\"#e2e8f0\">for every block on top (Lesson 2)</text>\n\n  <text x=\"480\" y=\"446\" text-anchor=\"middle\" font-size=\"12.5\" font-weight=\"bold\" fill=\"#ef4444\">Check any transaction yourself on a block explorer: status, confirmations, fee.</text>\n</svg>\n",
  "crypto-01-7-stablecoin-models": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 980 620\" font-family=\"Arial, Helvetica, sans-serif\">\n  <rect x=\"0\" y=\"0\" width=\"980\" height=\"620\" fill=\"#0f172a\"/>\n  <text x=\"490\" y=\"34\" text-anchor=\"middle\" font-size=\"22\" font-weight=\"bold\" fill=\"#e2e8f0\">Three Ways to Hold a $1 Peg</text>\n  <text x=\"490\" y=\"56\" text-anchor=\"middle\" font-size=\"13\" fill=\"#e2e8f0\">Same target price. Very different mechanisms.</text>\n\n  <!-- ===== PANEL 1: FIAT-BACKED ===== -->\n  <rect x=\"20\" y=\"78\" width=\"300\" height=\"440\" rx=\"10\" fill=\"#0f172a\" stroke=\"#3b82f6\" stroke-width=\"2\"/>\n  <text x=\"170\" y=\"106\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"bold\" fill=\"#3b82f6\">1. Fiat-Backed</text>\n  <text x=\"170\" y=\"126\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">USDT, USDC</text>\n\n  <!-- token -->\n  <circle cx=\"170\" cy=\"176\" r=\"30\" fill=\"#3b82f6\"/>\n  <text x=\"170\" y=\"172\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">1 token</text>\n  <text x=\"170\" y=\"188\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">= $1</text>\n\n  <!-- redeem arrows -->\n  <line x1=\"150\" y1=\"212\" x2=\"150\" y2=\"268\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <polygon points=\"150,268 144,256 156,256\" fill=\"#22c55e\"/>\n  <line x1=\"190\" y1=\"268\" x2=\"190\" y2=\"212\" stroke=\"#22c55e\" stroke-width=\"2.5\"/>\n  <polygon points=\"190,212 184,224 196,224\" fill=\"#22c55e\"/>\n  <text x=\"170\" y=\"244\" text-anchor=\"middle\" font-size=\"11\" fill=\"#22c55e\">redeem / issue</text>\n\n  <!-- reserve vault -->\n  <rect x=\"55\" y=\"272\" width=\"230\" height=\"96\" rx=\"8\" fill=\"#22c55e\"/>\n  <text x=\"170\" y=\"298\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">Issuer's reserve</text>\n  <text x=\"170\" y=\"320\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">cash, Treasury bills...</text>\n  <text x=\"170\" y=\"340\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">held off-chain by a company</text>\n  <text x=\"170\" y=\"358\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">you must trust and verify</text>\n\n  <text x=\"170\" y=\"398\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">Peg holds if the reserve is real,</text>\n  <text x=\"170\" y=\"415\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">liquid, and redeemable.</text>\n\n  <rect x=\"40\" y=\"432\" width=\"260\" height=\"70\" rx=\"8\" fill=\"#eab308\"/>\n  <text x=\"170\" y=\"456\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Verify: what IS the reserve?</text>\n  <text x=\"170\" y=\"474\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">Attested or audited?</text>\n  <text x=\"170\" y=\"492\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">Can YOU redeem?</text>\n\n  <!-- ===== PANEL 2: CRYPTO-COLLATERALIZED ===== -->\n  <rect x=\"340\" y=\"78\" width=\"300\" height=\"440\" rx=\"10\" fill=\"#0f172a\" stroke=\"#22c55e\" stroke-width=\"2\"/>\n  <text x=\"490\" y=\"106\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"bold\" fill=\"#22c55e\">2. Crypto-Collateralized</text>\n  <text x=\"490\" y=\"126\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">DAI (MakerDAO)</text>\n\n  <!-- collateral block -->\n  <rect x=\"375\" y=\"146\" width=\"230\" height=\"80\" rx=\"8\" fill=\"#22c55e\"/>\n  <text x=\"490\" y=\"172\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"bold\" fill=\"#0f172a\">$150 of ETH locked</text>\n  <text x=\"490\" y=\"192\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">in a smart contract,</text>\n  <text x=\"490\" y=\"210\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">visible on-chain</text>\n\n  <!-- mint arrow -->\n  <line x1=\"490\" y1=\"232\" x2=\"490\" y2=\"280\" stroke=\"#e2e8f0\" stroke-width=\"2.5\"/>\n  <polygon points=\"490,280 484,268 496,268\" fill=\"#e2e8f0\"/>\n  <text x=\"545\" y=\"260\" text-anchor=\"middle\" font-size=\"11\" fill=\"#e2e8f0\">mints</text>\n\n  <!-- minted stablecoin -->\n  <circle cx=\"490\" cy=\"316\" r=\"32\" fill=\"#3b82f6\"/>\n  <text x=\"490\" y=\"312\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">$100</text>\n  <text x=\"490\" y=\"328\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">of DAI</text>\n\n  <text x=\"490\" y=\"378\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">The extra $50 is a buffer that</text>\n  <text x=\"490\" y=\"395\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">absorbs falls in ETH's price.</text>\n\n  <rect x=\"360\" y=\"432\" width=\"260\" height=\"70\" rx=\"8\" fill=\"#eab308\"/>\n  <text x=\"490\" y=\"456\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">If the buffer thins, code</text>\n  <text x=\"490\" y=\"474\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">auto-liquidates the collateral.</text>\n  <text x=\"490\" y=\"492\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">Cost: capital locked up.</text>\n\n  <!-- ===== PANEL 3: ALGORITHMIC (fragile) ===== -->\n  <rect x=\"660\" y=\"78\" width=\"300\" height=\"440\" rx=\"10\" fill=\"#0f172a\" stroke=\"#ef4444\" stroke-width=\"3\" stroke-dasharray=\"9,6\"/>\n  <text x=\"810\" y=\"106\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"bold\" fill=\"#ef4444\">3. Algorithmic</text>\n  <text x=\"810\" y=\"126\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">TerraUSD (UST) + LUNA</text>\n\n  <text x=\"810\" y=\"152\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"bold\" fill=\"#ef4444\">No reserve. Only a swap loop.</text>\n\n  <!-- loop: stablecoin -->\n  <circle cx=\"735\" cy=\"230\" r=\"34\" fill=\"#3b82f6\"/>\n  <text x=\"735\" y=\"226\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">1 UST</text>\n  <text x=\"735\" y=\"242\" text-anchor=\"middle\" font-size=\"11\" fill=\"#0f172a\">target $1</text>\n\n  <!-- loop: sister token -->\n  <circle cx=\"885\" cy=\"230\" r=\"34\" fill=\"#ef4444\"/>\n  <text x=\"885\" y=\"226\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">$1 worth</text>\n  <text x=\"885\" y=\"242\" text-anchor=\"middle\" font-size=\"12\" fill=\"#0f172a\">of LUNA</text>\n\n  <!-- loop arrows -->\n  <line x1=\"772\" y1=\"214\" x2=\"848\" y2=\"214\" stroke=\"#e2e8f0\" stroke-width=\"2.5\"/>\n  <polygon points=\"848,214 836,208 836,220\" fill=\"#e2e8f0\"/>\n  <line x1=\"848\" y1=\"248\" x2=\"772\" y2=\"248\" stroke=\"#e2e8f0\" stroke-width=\"2.5\"/>\n  <polygon points=\"772,248 784,242 784,254\" fill=\"#e2e8f0\"/>\n  <text x=\"810\" y=\"204\" text-anchor=\"middle\" font-size=\"10\" fill=\"#e2e8f0\">burn, mint</text>\n  <text x=\"810\" y=\"266\" text-anchor=\"middle\" font-size=\"10\" fill=\"#e2e8f0\">mint, burn</text>\n\n  <text x=\"810\" y=\"300\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">Arbitrage on the loop nudges</text>\n  <text x=\"810\" y=\"317\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">the price back to $1 -- while</text>\n  <text x=\"810\" y=\"334\" text-anchor=\"middle\" font-size=\"12\" fill=\"#e2e8f0\">LUNA has value and buyers.</text>\n\n  <!-- death spiral -->\n  <rect x=\"680\" y=\"352\" width=\"260\" height=\"72\" rx=\"8\" fill=\"#ef4444\"/>\n  <text x=\"810\" y=\"374\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Under stress the loop reverses:</text>\n  <text x=\"810\" y=\"392\" text-anchor=\"middle\" font-size=\"11\" fill=\"#0f172a\">redemptions mint LUNA, LUNA falls,</text>\n  <text x=\"810\" y=\"409\" text-anchor=\"middle\" font-size=\"11\" fill=\"#0f172a\">fear grows, more redemptions...</text>\n\n  <rect x=\"680\" y=\"432\" width=\"260\" height=\"70\" rx=\"8\" fill=\"#ef4444\"/>\n  <text x=\"810\" y=\"454\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">FRAGILE BY DESIGN</text>\n  <text x=\"810\" y=\"472\" text-anchor=\"middle\" font-size=\"11\" fill=\"#0f172a\">May 2022: UST death spiral,</text>\n  <text x=\"810\" y=\"489\" text-anchor=\"middle\" font-size=\"11\" fill=\"#0f172a\">~$40B destroyed (Chapter 5, L2)</text>\n\n  <!-- ===== BOTTOM BAND ===== -->\n  <rect x=\"20\" y=\"538\" width=\"940\" height=\"58\" rx=\"10\" fill=\"#e2e8f0\"/>\n  <text x=\"490\" y=\"562\" text-anchor=\"middle\" font-size=\"15\" font-weight=\"bold\" fill=\"#0f172a\">A peg is a promise with a mechanism.</text>\n  <text x=\"490\" y=\"583\" text-anchor=\"middle\" font-size=\"13\" fill=\"#0f172a\">Before you rely on the promise, verify the mechanism -- this course has already shown you a \"guaranteed\" peg break (SNB 2015).</text>\n</svg>\n"
};
