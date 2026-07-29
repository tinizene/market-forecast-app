# Crypto — Chapter 3, Lesson 2: Custody & Security Risk

## Learning Objectives

By the end of this lesson, you will be able to:

- Separate security risk from price risk, and explain why position sizing protects against one and not the other
- Name the five places an attacker reaches you — the exchange, the phone number, the browser, the device, and the physical backup — and the specific mitigation for each
- Explain what a token approval is, why it survives after you stop using a site, and how to check and remove the ones you hold
- Explain why SMS-based two-factor authentication is the weakest common option, and what the measured evidence says about the alternatives

---

## 1. The Risk That Is Not Price Risk

Lesson 1 of this chapter gave you the arithmetic for price risk. You size a position so that a move against you costs a known, survivable amount. That machinery works. It also has one blind spot, and the blind spot is total.

You can be completely right about the market and still lose everything.

Position sizing assumes the asset stays yours while the price moves. Security risk breaks that assumption. A compromised key, a stolen exchange account, or a permission you granted eleven months ago does not reduce your position by 2%. It takes the position. The stop-loss is irrelevant, because the loss did not arrive through the price.

This lesson is about that second category. It is probably the lesson in this track most likely to save you actual money, because most of what it teaches is free to act on and takes an afternoon.

First, the boundary. Security risk means attacks aimed at your access: your keys, your accounts, your devices, your phone number. It is not the same thing as investment fraud — the fake project, the guaranteed-yield scheme, the rug pull. Those are attacks on your judgment rather than your access, and Chapter 4 Lesson 2 handles them as a separate skill. The two overlap at the edges, and both end with your money gone. But the defences are different, so the lessons are separate.

Now the scale, stated as carefully as the sources allow.

The blockchain-analytics firm Chainalysis publishes an annual Crypto Crime Report. Its 2026 edition, covering calendar year 2025, estimated that just over 3.4 billion dollars was stolen from crypto services and individuals in hacks during 2025. A single incident — the February 2025 breach of the exchange Bybit — accounted for roughly 1.5 billion dollars of that figure, the largest crypto theft recorded to date. The same report estimated that North Korea-linked actors were responsible for 2.02 billion dollars of the year's total.

Two honest caveats attach to that number. Chainalysis is a commercial firm selling blockchain-analytics products, not a peer-reviewed body, and its figures are estimates built from on-chain tracing. And other firms measuring the same year got different totals: CertiK reported roughly 3.35 billion dollars for 2025, while PeckShield, using a wider definition of what counts, reported roughly 4.04 billion. The disagreement is the useful part. Three serious measurement efforts land between 3.3 and 4.1 billion dollars for one year, which tells you the order of magnitude is real and the precision is not.

The figure that matters more to you personally is smaller and more specific. Within that 2025 total, Chainalysis counted around 158,000 separate compromises of personal wallets, affecting at least 80,000 distinct victims, for roughly 713 million dollars. Note what that arithmetic implies. The average personal loss was a few thousand dollars, not a headline. The people in that number were not exchanges with security teams. They were individuals, and the number of them rose sharply even as the dollar total fell.

:::warning
Every failure in this lesson ends the same way: an irreversible transfer. Chapter 1 Lesson 6 established when "gone" becomes true — once a transaction is buried under enough proof-of-work or finalized by proof-of-stake, no bank, no support ticket and no court order can rewrite the ledger. There is no chargeback in crypto. There is no fraud department to call. Card networks let you dispute a payment because a referee keeps the ledger, and this system removed the referee on purpose. Security in crypto is entirely preventive, because there is no cure.
:::

![Diagram of the five attack surfaces around a crypto holder — exchange account, phone number and SIM, browser and token approvals, device and clipboard, and physical seed phrase backup — each labelled with its attack and its mitigation, over a footer noting that every path ends in an irreversible transfer](../images/crypto-03-2-attack-surface.svg)

---

## 2. Where Your Coins Sit: the Exchange

Start with the place most beginners keep everything.

Chapter 1 Lesson 5 established what an exchange balance actually is. When you deposit, the coin moves to a wallet the exchange controls, and the blockchain now records the exchange as the owner. Your balance is a row in the exchange's internal database — the exchange's IOU to you. Every trade you make there is a database update, not a blockchain transaction.

That structure creates a risk that has nothing to do with price. If the exchange is hacked, becomes insolvent, or freezes withdrawals, the chain still shows the coins where they always were. What fails is your claim on them.

Mt. Gox collapsed in 2014 with roughly 850,000 bitcoin missing. FTX failed in November 2022 with an estimated 8 billion dollars of customer funds gone. One sentence each is all they get here, because Chapter 5 takes both apart properly.

The 2025 Bybit breach is worth slightly more space, because it teaches something the older cases do not.

:::example
On 21 February 2025, Bybit was moving funds from a cold multisignature wallet to a hot wallet — a routine operation, performed by professionals, using a well-regarded multisignature tool. Public analyses converged on the mechanism: a developer machine belonging to the wallet-software provider was compromised, and the interface shown to Bybit's signers was altered. The signers saw a normal internal transfer on their screens. What they actually authorized was a transaction handing control of the wallet to the attacker. Roughly 1.5 billion dollars left in a single operation.

Nobody guessed a private key. Nobody broke any cryptography. The signature was valid, and the ledger did exactly what a valid signature told it to do. The attack was on what the humans were shown.
:::

That example is the reason this lesson exists in a risk-management chapter rather than a technical one. Almost every large crypto loss runs through a person approving something, not through mathematics failing.

Practically, exchange custody is a decision about quantity and duration, not a yes-or-no. Chapter 1 Lesson 4 gave you the framework: match custody to the amount, the horizon, and your demonstrated competence. The security-specific version is narrower. Keep on an exchange only what you are actually trading in the near term, and treat everything above that as a balance you are lending to a company for no interest. Turn on two-factor authentication that is not SMS, covered in Section 4. Turn on a withdrawal address allowlist if the exchange offers one, so that a stolen session cannot send funds to a new address without a waiting period.

---

## 3. Phishing: the One Rule That Defeats Most of It

:::definition
**Phishing** — An attack that gets you to hand over a secret or authorize an action yourself, by impersonating something you trust: a wallet, an exchange, a support agent, a well-known project. The attacker does not break into anything. You open the door, believing you are dealing with someone legitimate.
:::

Phishing is the dominant way individuals lose crypto, and it works because it targets recognition rather than technology. The shapes it takes are worth naming, because recognising the shape is most of the defence.

A fake website is the oldest form. The address differs from the real one by a character or two, or it is a paid advertisement that sits above the genuine result in a search page. The page looks correct because it was copied from the real one.

A fake support agent is the most productive form. You post a problem in a public channel — a forum, a social platform, a project's chat group — and within minutes someone with a helpful name and a matching profile picture sends you a private message. They are attentive, patient and technically fluent. They eventually need you to "restore," "validate," "sync" or "verify" your wallet.

A malicious link is the fastest-growing form. An unexpected token appears in your wallet, or a message announces an airdrop, a refund, or a compensation claim from a project you recognise. The link leads to a site that asks you to connect your wallet and sign something.

Academic work has documented how industrialised this has become. Bowen He and co-authors presented a study of what they call Drainer-as-a-Service at the ACM Internet Measurement Conference in October 2025. The picture they describe is a division of labour: specialist operators build and maintain the theft toolkits, while separate affiliates run the phishing sites and split the proceeds through automated profit-sharing contracts. Their dataset covered thousands of affiliate accounts and tens of thousands of profit-sharing transactions. The finding worth carrying away is not any single number. It is that the person targeting you is very unlikely to be improvising.

:::definition
**Wallet Drainer** — A ready-made toolkit that produces the malicious page and the malicious transaction request used to empty a victim's wallet once they connect it and sign. Drainers are rented or licensed to affiliates in exchange for a share of the proceeds, which is why phishing pages across unrelated scams often behave identically.
:::

Chapter 1 Lesson 4 already gave you the rule. It is worth restating, because it is the single highest-value sentence in this track.

:::warning
Never type your seed phrase into anything. Not a website, not an app, not a form, not a chat, not a support ticket, not a spreadsheet, not a photo. No legitimate service will ever ask for it, because no legitimate technical operation requires it. There is no exception for an official-looking page, a padlock icon, an urgent security alert, or a person who has been helpful for an hour. The request itself is the proof of the attack. Your seed phrase is only ever typed into a wallet you are deliberately restoring, on a device you control, and never in response to anyone contacting you.
:::

Three habits do most of the remaining work.

Reach sites through your own bookmarks, typed manually the first time and saved. Never through a search advertisement, a message link, or a link in a social post.

Treat all inbound contact as hostile by default. Real support does not message you first. If you need help, you go to the support channel yourself, from your own bookmark.

Ignore unexpected tokens. A token you did not buy that appears in your wallet is not a gift, and the site it points you to is not a claim page. Leave it alone.

---

## 4. The SIM Swap and Why SMS Is the Weak Link

:::definition
**Two-Factor Authentication (2FA)** — A login that requires a second proof beyond the password: a code from an app, a tap on a registered device, or a physical security key. The point is that stealing the password alone should not be enough.
:::

Two-factor authentication is genuinely effective, and you should have it everywhere. But the different kinds are not equally strong, and crypto users get attacked specifically at the weakest one.

:::definition
**SIM Swap** — An attack in which your mobile phone number is transferred to a SIM card the attacker controls. From that point, calls and text messages intended for you arrive on their device. Any account that sends security codes or password resets by text message becomes reachable, without your password ever being guessed.
:::

The mechanics you need are only these: phone numbers are reassigned by carrier staff following a customer-service process, and that process can be defeated. The attacker convinces or bribes someone at a carrier to move the number. You need to know that this is possible and routine. You do not need the script, and this lesson will not provide one.

The evidence that it is routine is unusually good.

In January 2020, Kevin Lee, Benjamin Kaiser, Jonathan Mayer and Arvind Narayanan of Princeton University published an empirical study of carrier authentication for SIM swaps, later presented at the USENIX Symposium on Usable Privacy and Security in 2020. The researchers opened 50 prepaid accounts, 10 at each of five major United States carriers, and then called in to request a SIM swap on each. Roughly 80% of their attempts succeeded. They also surveyed websites that relied on phone-based recovery and identified 17 on which an account could be taken over by a SIM swap alone, with no password compromise at all.

The second piece of evidence is a case that needs no interpretation.

:::example
On 9 January 2024, a post appeared on the official X account of the United States Securities and Exchange Commission announcing approval of spot bitcoin exchange-traded funds. The announcement was false. Bitcoin jumped by more than 1,000 dollars, then fell back when the agency corrected the record.

The agency later confirmed the account had been taken over through a SIM swap of the phone number attached to it. It also disclosed that multi-factor authentication on the account had been disabled some months earlier, at staff request, after access problems.

In May 2025, Eric Council Jr. was sentenced to 14 months in prison for his role in the conspiracy, after pleading guilty in the United States District Court for the District of Columbia. Court filings put his earnings from SIM-swap work at around 50,000 dollars.
:::

Read that example for what it proves. The victim was a national securities regulator. The account was high-profile. The attack still worked, because the security of the account had been reduced to the security of a phone number.

The same mechanism has taken individual crypto holdings. In one of the most-litigated cases, investor Michael Terpin lost roughly 24 million dollars in tokens in 2018 after a SIM swap defeated the two-factor authentication protecting an account; a teenager and an accomplice obtained the swap through an employee at his carrier. Terpin's litigation against the carrier was still moving through the United States appeal courts years later. The relevant detail for you is not the lawsuit. It is that his second factor was a text message.

Standards bodies have caught up with this. The United States National Institute of Standards and Technology, in the fourth revision of its Digital Identity Guidelines (Special Publication 800-63B), classifies one-time passcodes delivered over the public telephone network as a restricted authenticator. The stated reasons include exactly this attack — the demonstrated ability of attackers to have telephone numbers reassigned to devices they control — alongside known weaknesses in telecom signalling that allow message interception.

Restricted does not mean useless, and the measured difference matters. A 2019 study by Google with New York University and the University of California San Diego tested login challenges against real attack traffic on Google accounts. An SMS code blocked 100% of automated bot attacks and 96% of bulk phishing, but only 76% of targeted attacks aimed at a specific person. A physical security key blocked 100% of all three categories in the same study.

:::warning
SMS two-factor authentication is much better than no two-factor authentication, and much worse than the alternatives. Its weakness is precise: it is strong against automated attacks and weak against someone who has chosen you. Crypto holders are, by definition, sometimes chosen. If a crypto account offers only SMS, use it — and treat that account as one you should not keep much value in.
:::

What to do instead, in order of strength:

Use an authenticator app that generates codes on your device. The code never travels over the phone network, so a SIM swap does not reach it. Save the backup codes offline when you set it up.

Use a hardware security key or a passkey where the service supports it. This is the option that scored 100% against targeted attacks in the Google study.

Remove your phone number as a recovery method on any account that lets you, especially email. Your email account is usually the master key to everything else, so it deserves the strongest factor you have.

Ask your mobile carrier for a port-out PIN or a number-lock on the account. It is a free phone call and it adds a step the attacker has to defeat.

---

## 5. Token Approvals: the Permission You Forgot You Gave

This is the section most beginners have never been taught, and it is the one that produces losses long after the mistake.

To trade on a decentralized exchange, or use most on-chain applications, you do not send your tokens to the application. You grant its smart contract permission to move a token out of your wallet on your behalf. That permission is a separate transaction, and it is recorded on the blockchain as its own standing fact.

:::definition
**Token Approval** — A permission recorded on-chain that authorizes a specific smart contract to move a specific token from your wallet, up to a stated limit. It is granted by its own transaction, it stays in force until you change or remove it, and it is completely independent of whether you are currently using the application.
:::

Three properties of that definition cause the damage.

The limit is frequently unlimited. Many interfaces default to the maximum possible amount, because it saves the user from re-approving on every future trade. You approved a 50 dollar swap. The permission covers every unit of that token your wallet will ever hold.

The permission persists. Closing the tab does nothing. Clicking "disconnect wallet" does nothing to it — disconnecting is a browser-session action, and the approval lives on the blockchain. Uninstalling the application does nothing. It remains until you send a transaction that revokes it.

The permission does not care who controls the contract later. If the contract you approved is exploited, upgraded maliciously, or was never honest, the holder of that permission can move your tokens without asking you for anything further. You already signed.

:::example
In March you use a new exchange application to swap 200 dollars of a stablecoin. The interface asks you to approve the token. You click through, because the swap will not proceed otherwise, and the default is an unlimited allowance.

You use the site twice more, then forget it exists.

By November your wallet holds 6,000 dollars of that same stablecoin, accumulated for entirely different reasons. That month the application's contract is exploited.

The attacker does not need your seed phrase, your password, or your device. The approval you granted in March authorizes the contract to move that token, in any amount, at any time. All 6,000 dollars leaves in one transaction. You are not online. You find out later.
:::

This is not hypothetical, and the largest documented case shows the mechanism cleanly.

In December 2021, users of the decentralized finance project BadgerDAO lost roughly 120 million dollars. The project's smart contracts were not broken. Instead, the project's website front end was compromised, and it silently inserted extra approval requests into transactions that users were already expecting to sign. Post-incident analyses found the malicious approvals had begun accumulating from around 20 November, and that hundreds of wallets granted them. The actual draining happened on 2 December — days or weeks after most victims had signed. Between signing and losing, nothing on their screens indicated anything was wrong.

:::warning
An approval you granted once can drain your wallet months later, without any further action from you and without any warning. This is the failure mode that catches careful people, because the harmful click and the loss are separated in time. If you have used any on-chain application, you almost certainly hold approvals you have forgotten. Assume you do, and go and look.
:::

The defences are concrete.

Review and revoke. Approval-checking tools exist for every major chain, including one built into most block explorers, and wallet software increasingly lists your permissions directly. Open the list, and remove every approval belonging to a site you are not actively using. Revoking costs a small network fee and is otherwise harmless — you can always re-approve later.

Set a limit rather than accepting unlimited. Most wallets let you edit the approval amount at the moment you grant it. Approving the amount you are actually trading turns a permanent exposure into a one-time one.

Separate your wallets. Keep one wallet for interacting with new applications, funded with only what you are willing to lose, and keep your main holdings in a wallet that never connects to a site at all. This single habit contains almost every failure in this section, because a permission can only reach the wallet that granted it.

Put the review on a schedule. Once a month, not "when you remember." Chapter 4 Lesson 3 will build this into a written custody plan.

---

## 6. Malware, Clipboards and Lookalike Addresses

You verified the address before sending. That is not quite the same as verifying that the address you verified is the one that got sent.

:::definition
**Clipboard Hijacking (Clipper Malware)** — Malicious software that watches your device's clipboard for anything shaped like a crypto address, and silently replaces it with the attacker's address at the moment you paste. You copy the correct address. Something else arrives in the field.
:::

Clipper malware is old, effective and quiet. Kaspersky researchers documented one campaign in 2023 that spread through modified installers of a popular privacy browser, distributed outside official channels. They identified more than 15,000 affected users across 52 countries and estimated roughly 400,000 dollars stolen. Their analysis makes the key operational point: this class of malware produces no network traffic and shows no symptoms. It can sit on a machine for years, doing nothing at all, until the day an address appears on the clipboard.

A related trick needs no malware on your machine at all.

:::definition
**Address Poisoning** — An attacker sends a tiny or zero-value transaction to your wallet from an address deliberately generated to match the first and last characters of an address you have used before. Their address now appears in your transaction history, looking familiar. The attack is complete when you later copy an address from your own history instead of from the source.
:::

The defences here are physical and boring, which is why people skip them.

Verify the address on your hardware wallet's own screen, not on the computer's. This is the entire reason the device has a screen. Malware can control what your computer displays; it cannot control what the signing device displays. If the two disagree, the device is right and you should stop.

Check the middle of the address, not only the ends. Checking the first and last four characters is exactly the check that address poisoning is built to pass.

Send a small test transaction first whenever the amount matters, and wait for it to confirm before sending the rest. Chapter 1 Lesson 6 explains what you are waiting for.

Never copy an address out of your own transaction history. Get it from the recipient, or from the exchange's deposit page, each time.

Read what you are signing. If your wallet shows you a transaction summary and you cannot tell what it does, that is a reason to reject it, not a reason to proceed. The Bybit signers in Section 2 lost 1.5 billion dollars by approving something whose real contents they could not see. The same discipline scales down to a 50 dollar swap.

---

## 7. Supply Chain: the Device Itself

The last surface is the one people assume is safe, because it is the one they bought specifically to be safe.

:::definition
**Supply Chain Attack** — An attack that compromises something you rely on before it reaches you: a device in transit, a software update, or a code library that a site you trust has built into itself. You are attacked through a component you never chose to evaluate.
:::

Two documented cases show both halves.

The hardware half. Kaspersky researchers examined a counterfeit hardware wallet bought by a victim from a seller on a classifieds site. The device was a convincing physical copy of a well-known model, sealed in packaging with the manufacturer's holographic labels, showing no external sign of tampering. Inside, the firmware had been replaced. The security checks that would normally reject unofficial firmware had been removed, and the recovery phrase the device produced was fixed in advance. The attacker knew the keys before the victim opened the box. There was nothing for the victim to notice and no moment at which the device behaved oddly.

The software half. On 14 December 2023, an attacker obtained access to the software-publishing account of the hardware-wallet manufacturer Ledger, through a phishing attack on a former employee, and published malicious versions of a widely used code library. Sites that included that library — several well-known decentralized exchanges and, with some irony, an approval-revoking tool — began serving a wallet drainer to their own users. The malicious file was live for around five hours. Reported losses were roughly 600,000 dollars, with early estimates varying as the incident was traced. The users affected had done nothing wrong. They visited sites they had used many times before.

:::warning
A hardware wallet that arrives with a recovery phrase already written down, printed on a card, or shown as "your phrase" during setup is not a wallet. It is a trap. A genuine device generates your phrase on the device itself, in front of you, the first time you set it up, and the manufacturer never knows it. Any phrase supplied to you is a phrase someone else already has.
:::

The rules that follow are short.

Buy hardware wallets directly from the manufacturer's own website, and from nowhere else. Not a marketplace listing, not a classifieds site, not a discounted third-party seller, and never secondhand.

Set the device up yourself and generate your own recovery phrase on it. Never accept a supplied one.

Update firmware only through the manufacturer's official application, which verifies the update's signature.

Accept that no device makes you immune to Section 5. The Ledger case and the Bybit case were both signed by hardware. A hardware wallet protects your key from being copied. It does not protect you from authorizing a transaction you did not understand.

---

## 8. The Checklist for This Week

Everything above reduces to a short list of actions. They are ordered by how much risk they remove per minute spent.

:::practice
Work through these in order. Most people can finish the first five in one evening.

1. Move your email account to app-based or hardware two-factor authentication, and remove your phone number as a recovery method if the provider allows it. Your email resets everything else, so it is the highest-value account you own. Save the backup codes offline.

2. Replace SMS two-factor authentication with an authenticator app on every exchange account you hold. Where the exchange supports a hardware security key or passkey, use that instead. Save the backup codes offline.

3. Call your mobile carrier and add a port-out PIN or number lock to your account. This takes about ten minutes and directly blocks Section 4.

4. Open a token-approval checker for each chain you have used, and revoke every approval belonging to a site you are not actively using this week. Do not skip chains you used once. Put a monthly reminder in your calendar to repeat this.

5. Decide what is on-exchange and write the number down. Keep on exchanges only what you are trading in the next few weeks. Move the rest out. Turn on a withdrawal address allowlist where one is offered.

6. Check where your seed phrase currently lives. If it exists as a photo, a screenshot, a note in your phone, a password manager entry, a cloud document, or an email to yourself, it is already exposed to anything that reads those. Write it on paper or metal, store it offline, and delete every digital copy.

7. Create a second wallet for connecting to new applications, and fund it only with what you are willing to lose. Stop connecting your main wallet to sites entirely.

8. Do the restore drill from Chapter 1 Lesson 4 if you have never done it. Send a small amount to a self-custody wallet, delete the wallet, and restore it from your written phrase on a different device. Until you have done that, your backup is a theory.

9. Bookmark every crypto site you use, and reach them only from bookmarks from now on. Never from a search result, an advertisement, or a link someone sent you.

10. Write one sentence and keep it where you will see it: nobody legitimate will ever ask for my seed phrase, and I will never type it into anything I did not open myself.
:::

---

## What to Look For

- Anyone asking for your seed phrase is attacking you. There is no exception, and "support agent" remains the most common costume. The request itself is the evidence.
- Anyone who contacts you first about a crypto problem is suspect by default, however helpful, patient or technically fluent they are.
- An unexpected token, airdrop notice, refund claim or compensation offer in your wallet is a lure, not a windfall. The link is the attack.
- When you connect a wallet to any site, look at what the approval actually asks for. If it is an unlimited allowance and you are trading a small amount, edit the limit before signing.
- When your wallet asks you to sign something you cannot read or explain, reject it. Not being able to tell what a transaction does is the warning, not an inconvenience.
- When an account offers only SMS two-factor authentication, treat it as an account that should not hold much value.
- When a hardware wallet arrives with a recovery phrase already provided, or was bought anywhere other than the manufacturer, do not use it. Return it.
- When a security figure is quoted at you, ask who published it, for which year, and by what method. The 2025 stolen-funds total ranged from roughly 3.35 billion to 4.04 billion dollars across three firms measuring the same thing.

---

## Practice / Quiz

1. In March you approve a new exchange application to spend a stablecoin, accepting the default unlimited allowance for a 200 dollar swap. You use it twice, then never return. In November your wallet holds 6,000 dollars of that token and the application's contract is exploited. What is your exposure?
   - A) 200 dollars, because that is the amount you actually traded
   - B) Nothing, because you stopped using the application and closed the tab months ago
   - C) The full 6,000 dollars, because the approval is unlimited, is recorded on-chain, and persists until revoked
   - D) Nothing, because the exploit is the application's problem and not yours

   **Correct: C.** A token approval authorizes a contract to move a token, not an amount you traded, and not for a period you were active. Disconnecting a wallet is a browser action; the approval lives on the blockchain and stays in force until a revoke transaction removes it. This is exactly the BadgerDAO pattern from December 2021, where approvals harvested from around 20 November were drained on 2 December, and roughly 120 million dollars left wallets whose owners had signed nothing that day.

2. Your exchange account is protected by a strong, unique password and by two-factor authentication delivered as a text message to your phone. An attacker has your password. Why is this still a serious problem?
   - A) It is not — the second factor means the password alone is useless
   - B) A SIM swap can move your phone number to the attacker's device, after which the codes and password resets arrive with them
   - C) Text messages are encrypted, so only the exchange can be at fault
   - D) The attacker would still need your seed phrase to log in

   **Correct: B.** A SIM swap transfers your number to a SIM the attacker controls, and everything sent to that number follows. The Princeton study presented at USENIX SOUPS in 2020 found roughly 80% of its 50 SIM-swap attempts across five carriers succeeded, and identified 17 sites that could be taken over by a SIM swap alone. The SEC's own X account was taken over this way in January 2024. NIST now classifies telephone-network one-time codes as a restricted authenticator. An authenticator app or a hardware security key removes the phone number from the attack path entirely. (D is wrong for a separate reason: an exchange account has no seed phrase, because the exchange holds the keys.)

3. You buy a hardware wallet at a discount from a marketplace seller. It arrives sealed, with holographic labels, and setup produces a recovery phrase on a printed card in the box. What should you conclude?
   - A) It is fine — the sealed packaging and holographic labels confirm it is genuine
   - B) It is fine — the printed card is a convenience so you do not have to write the phrase down
   - C) The device should not be used, because a supplied recovery phrase means someone else already knows your keys
   - D) It is fine as long as you change the device PIN immediately

   **Correct: C.** A genuine device generates the recovery phrase on the device, in front of you, at first setup, and nobody else ever sees it. A supplied phrase is a phrase the supplier holds, so the coins are spendable by them from the moment you fund it. Kaspersky documented exactly this: a counterfeit of a well-known model, with convincing packaging and holographic seals, whose replaced firmware produced a recovery phrase fixed in advance. Packaging is the part of a hardware wallet that is easiest to copy. Buy direct from the manufacturer, and generate your own phrase.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Phishing | An attack that impersonates something you trust to make you surrender a secret or authorize an action yourself. |
| Wallet Drainer | A ready-made toolkit that produces the malicious page and transaction request used to empty a wallet once the victim signs. |
| Two-Factor Authentication (2FA) | A login requiring a second proof beyond the password, so a stolen password alone is not enough. |
| SIM Swap | Transferring a victim's phone number to an attacker's SIM, so that calls, texts and reset codes arrive with the attacker. |
| Token Approval | An on-chain permission letting a specific contract move a specific token from your wallet, in force until revoked. |
| Clipboard Hijacking (Clipper Malware) | Malware that silently replaces a copied crypto address with the attacker's at the moment you paste. |
| Address Poisoning | Seeding your transaction history with a lookalike address so you later copy the attacker's address from your own records. |
| Supply Chain Attack | Compromising a device, update or code library before it reaches you, so you are attacked through a component you never evaluated. |

---

*Coming next: Lesson 3 — Leverage, Perpetuals & Funding: perps taught mechanically, and why liquidation, not being wrong, is how most leveraged crypto accounts die.*
