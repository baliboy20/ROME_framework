# Crumb — a weekly microbakery order system (project brief)

*Prose-only client brief. Input for a requirements-authoring session using
`REQUIREMENTS-AUTHORING-GUIDE.md`. No structure has been imposed deliberately —
structuring it is that session's job.*

---

Rosa runs a one-woman sourdough microbakery called **Crumb** from her home
kitchen. She bakes once a week: everything goes in the oven on Friday, and
customers collect their orders from her front porch on Saturday morning between
nine and noon. Her regular range is four breads — a white sourdough, a seeded
rye, a cheese-and-onion loaf, and a fruit couronne — and most weeks she adds one
special that changes with the seasons. She can manage about forty loaves in a
week, though on a big week before Christmas she has pushed out fifty.

Right now the whole operation runs on Instagram direct messages and a paper
list. Customers message her what they want, she writes it down, and payment is a
mixture of bank transfers, cash in envelopes, and promises. It mostly works, but
every few weeks something goes wrong: she takes more orders than she can bake
and has to send embarrassing cancellation messages; someone swears they paid and
she can't prove otherwise; someone never collects, and a beautiful loaf sits on
the porch until she gives it to the neighbour. She spends most of Thursday
evening untangling the list instead of resting before her four-a.m. start.

What Rosa wants is a small, simple ordering site. Each week it should show what
she's baking — the regulars plus the special, each with its price and how many
she's willing to make of it. Customers pick their loaves, pay by card there and
then, and get a confirmation telling them their order is in and when to collect.
Orders close on Wednesday at midnight so she knows exactly what to bake before
she starts her Thursday prep, and once a bread sells out it should simply say so
— she never wants to owe bread she can't bake again. She already has a Stripe
account from a market stall she used to run, and she'd rather keep using it than
learn something new.

For herself, she wants the admin to work from her phone with flour on her hands.
Before the bake she needs one clear list: every loaf to bake, totalled by bread,
and every order with the customer's name and what they're collecting. On
Saturday morning she wants to tap an order as collected as people come and go.
If someone doesn't turn up by noon, the order is simply marked uncollected and
that's that — she donates those loaves and doesn't refund no-shows, and she'd
like the confirmation message to warn people about this politely. Occasionally —
maybe twice a year, when she's ill or the oven breaks — she has to call off a
whole week's bake, and when that happens everyone who ordered should get their
money back and a short apologetic message without her doing forty refunds by
hand.

There are two things she's dreamed about but isn't sure of. One is some kind of
loyalty thing — she says "every tenth loaf free, maybe," but she hasn't decided
whether it counts loaves or orders and doesn't want it to hold anything else up.
The other is a waiting list, so that when the seeded rye sells out, someone can
ask to be next in line if an order is cancelled. She's honest that she hasn't
thought either of these through.

She has strong feelings about how it should look — warm, floury, personal, not
like a supermarket — and she's happy to sketch the screens she has in her head
on paper and photograph them, if that's useful to whoever builds it.

Success, for Rosa, is a Thursday evening with nothing to untangle: the site took
the orders, the money is already in, the bake list prints itself, and nobody has
to be told their loaf doesn't exist. If the weekly admin takes her less than an
hour end to end, and her regulars say ordering was easier than DMing her, it
worked.
