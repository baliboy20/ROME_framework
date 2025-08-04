---
title: "The Moment I Realized I Was Using AI All Wrong (And How I Fixed It)"
url: "https://medium.com/@maryashoukataly/the-moment-i-realized-i-was-using-ai-all-wrong-and-how-i-fixed-it-734b4d110e4f?source=email-d5592a49c1da-1753754259689-digest.reader-78d064101951-734b4d110e4f----0-1------------------d905e451_9291_442f_9c6a_564e3b54d84c-31"
author: "Maria Ali"
published: "Jul 23, 2025"
scraped: "2025-07-31T08:25:33.378Z"
category: "mobile"
word_count: 943
reading_time: "5 min read"
keywords: ["bloc", "ios", "row", "stack", "api"]
---Member-only story

# The Moment I Realized I Was Using AI All Wrong (And How I Fixed It)

## I Thought I Was “Automating” — Until I Saw What Real Automation Could Look Like

[

![Maria Ali](https://miro.medium.com/v2/resize:fill:32:32/1*ufc3Mj8Rzsz3rz_gf8po-g.jpeg)





](https://medium.com/@maryashoukataly?source=post_page---byline--734b4d110e4f---------------------------------------)

[Maria Ali](https://medium.com/@maryashoukataly?source=post_page---byline--734b4d110e4f---------------------------------------)

Follow

5 min read

·

Jul 23, 2025

[

](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Fvote%2Fai-in-plain-english%2F734b4d110e4f&operation=register&redirect=https%3A%2F%2Fai.plainenglish.io%2Fthe-moment-i-realized-i-was-using-ai-all-wrong-and-how-i-fixed-it-734b4d110e4f&user=Maria+Ali&userId=65729568c28f&source=---header_actions--734b4d110e4f---------------------clap_footer------------------)

159

[](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Fbookmark%2Fp%2F734b4d110e4f&operation=register&redirect=https%3A%2F%2Fai.plainenglish.io%2Fthe-moment-i-realized-i-was-using-ai-all-wrong-and-how-i-fixed-it-734b4d110e4f&source=---header_actions--734b4d110e4f---------------------bookmark_footer------------------)

[

Listen









](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2Fplans%3Fdimension%3Dpost_audio_button%26postId%3D734b4d110e4f&operation=register&redirect=https%3A%2F%2Fai.plainenglish.io%2Fthe-moment-i-realized-i-was-using-ai-all-wrong-and-how-i-fixed-it-734b4d110e4f&source=---header_actions--734b4d110e4f---------------------post_audio_button------------------)

Share

Zoom image will be displayed

![](https://miro.medium.com/v2/resize:fit:700/0*X8G2y05p0QlC4r7l)

Photo by [Andrew Neel](https://unsplash.com/@andrewtneel?utm_source=medium&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=medium&utm_medium=referral)

If you had asked me last year whether I was using AI effectively, I would’ve said yes, with _way_ too much confidence. After all, I was building bots, using AI to generate text, even hooking up APIs here and there. That _had_ to be the future, right?

Except it wasn’t.

The truth hit me one random Tuesday when I found myself doing the same mind-numbing task for the third time that week ,manually updating data across 20 files, copy-pasting similar blocks of code, and checking (again) if I’d missed a trailing comma. That’s when it hit me

> _I wasn’t automating.  
> I was_ outsourcing _small chores to AI but I was still stuck doing the thinking, coordinating, and fixing._

That’s when I decided to rebuild how I used AI from the ground up.

In this article, I’ll show you how I transitioned from “using ChatGPT like a smart calculator” to _actually_ building intelligent automation systems that think and work like a digital team. No fluff. Just the raw steps, what broke, and what finally worked all using libraries that go beyond the usual suspects.

# Step 1: Stop Talking to AI Like It’s a Toy

Most people (myself included) treat ChatGPT like a slightly overqualified intern. You throw it a problem, it throws back some decent-enough code, and you either paste it or fix it. That’s fine for small stuff.

But when you’re building actual automations, things that run on their own, handle edge cases, and react to real-world data, prompts won’t cut it. You need systems.

**Here’s the mindset shift that helped me:**

> _Stop prompting. Start planning workflows._

Instead of asking “Can AI do X?”, ask:

-   What _sequence_ of tasks do I want to automate?
-   Where do decisions happen?
-   What tools already solve 90% of this — and where can AI fill the gaps?

# Step 2: Automate the Repetitive and the Reactive

Let me give you a concrete example.

I had a messy folder full of interview recordings , audio files named like `finalfinal2.mp3` and `interview-hr-pending.wav`. My goal was to:

1.  Transcribe them.
2.  Summarize them.
3.  Categorize them by department and save them in structured folders.

At first, I just ran one-off scripts using OpenAI’s Whisper and GPT. But when a new audio file dropped in? I had to restart the whole thing.

Here’s the upgraded version , fully automated using `**scandir**`**,** `**whisperx**`**,** `**nltk**`**, and** `**jinja2**` for report generation.

import os  
import whisperx  
import nltk  
from jinja2 import Template  
  
def transcribe\_audio(file\_path):  
    model = whisperx.load\_model("base")  
    audio = whisperx.load\_audio(file\_path)  
    result = model.transcribe(audio)  
    return result\["text"\]  
  
def summarize\_text(text):  
    sentences = nltk.sent\_tokenize(text)  
    return ' '.join(sentences\[:3\])  \# crude but fast summary  
  
def generate\_report(summary, filename):  
    template = Template("""  
    <h1>Interview Summary</h1>  
    <p><strong>File:</strong> {{ name }}</p>  
    <p>{{ summary }}</p>  
    """)  
    return template.render(name=filename, summary=summary)  
  
def auto\_process(folder\_path):  
    for entry in os.scandir(folder\_path):  
        if entry.name.endswith(".mp3") or entry.name.endswith(".wav"):  
            print(f"Processing: {entry.name}")  
            transcript = transcribe\_audio(entry.path)  
            summary = summarize\_text(transcript)  
            report = generate\_report(summary, entry.name)  
            with open(f"{entry.name}.html", "w") as f:  
                f.write(report)  
  
auto\_process("interviews/")

## **What changed:**

I stopped prompting and started architecting. This pipeline handles:

-   **Input detection**
-   **AI-powered transcription**
-   **Basic NLP summarization**
-   **Dynamic HTML report generation**

And it runs _without me touching a thing._

# Step 3: Use AI to Automate Decisions — Not Just Actions

The next level of automation is when AI doesn’t just do stuff , it _decides_ what to do.

I had a directory full of client requests each one a short `.txt` file describing a feature, bug, or question. Some needed urgent fixes, others were just suggestions. Instead of manually triaging them, I built a decision engine.

Here’s a simplified version using `**llama-index**`**,** `**email-validator**`**, and** `**polars**` for high-performance data filtering.

from llama\_index.llms import LlamaCPP  
from email\_validator import validate\_email  
import polars as pl  
  
def categorize\_request(text):  
    \# assume you’ve set up Llama locally  
    llm = LlamaCPP(model\_path="./models/llama.gguf")  
    prompt = f"Classify this request as Bug, Feature, or Question:\\n{text}"  
    return llm.complete(prompt).strip()  
  
def validate\_sender(email):  
    try:  
        return validate\_email(email).email  
    except:  
        return None  
  
def build\_table(data\_dir):  
    rows = \[\]  
    for file in os.listdir(data\_dir):  
        with open(os.path.join(data\_dir, file)) as f:  
            content = f.read()  
            category = categorize\_request(content)  
            sender\_email = content.split("\\n")\[0\]  \# assume first line = email  
            valid\_email = validate\_sender(sender\_email)  
            rows.append((file, category, valid\_email))  
  
    df = pl.DataFrame(rows, schema=\["File", "Category", "Sender"\])  
    print(df.filter(pl.col("Category") == "Bug"))  
  
build\_table("client\_requests/")

**This is where AI shines** — when it becomes the brain that:

-   Parses unstructured data
-   Makes nuanced decisions
-   Organizes and validates inputs
-   Outputs clean, actionable formats

And all without me needing to read 50 files manually.

# Step 4: Let AI Trigger Events Based on Context

Imagine this: It’s Friday night. A client sends a critical message to your project inbox. You don’t see it. The deadline passes. You’re toast.

I built a small daemon that:

-   Checks a shared inbox every 10 minutes
-   Uses AI to read emails
-   If it detects urgency, it _calls me via Twilio_

Sounds overkill? It’s saved me twice.

Here’s a core piece using `**imap_tools**`**,** `**twilio**`**, and** `**re**` — a completely different stack from the usual.

from imap\_tools import MailBox  
from twilio.rest import Client  
import re  
  
def is\_urgent(subject, body):  
    urgent\_keywords = \["ASAP", "urgent", "immediate", "deadline"\]  
    content = f"{subject} {body}".lower()  
    return any(word in content for word in urgent\_keywords)  
  
def check\_mail():  
    with MailBox("imap.gmail.com").login("you@example.com", "app\_password") as mailbox:  
        for msg in mailbox.fetch(limit=10, reverse=True):  
            if is\_urgent(msg.subject, msg.text):  
                notify\_me(msg.subject)  
  
def notify\_me(message):  
    client = Client("twilio\_sid", "twilio\_token")  
    call = client.calls.create(  
        twiml=f"<Response><Say>{message}</Say></Response>",  
        to="+1234567890",  
        from\_="+10987654321"  
    )  
    print("Alert triggered!")  
  
check\_mail()

No dashboard. No prompt. Just automation with real consequences.

# Final Thoughts

Once I stopped treating AI like a novelty and started using it as infrastructure, everything changed. Projects went from “prompt + copy-paste” to “pipeline + decision engine.”

Here’s what I learned:

-   **If it’s repeatable, it’s automatable.**
-   **If it requires judgment, AI can usually handle it better than you think.**
-   **Don’t build tools. Build systems.**

# Thank you for being a part of the community

_Before you go:_

-   Be sure to **clap** and **follow** the writer ️👏️**️**
-   Follow us: [**X**](https://x.com/inPlainEngHQ) | [**LinkedIn**](https://www.linkedin.com/company/inplainenglish/) | [**YouTube**](https://www.youtube.com/@InPlainEnglish) | [**Newsletter**](https://newsletter.plainenglish.io/) | [**Podcast**](https://open.spotify.com/show/7qxylRWKhvZwMz2WuEoua0) | [**Twitch**](https://twitch.tv/inplainenglish)
-   [**Start your own free AI-powered blog on Differ**](https://differ.blog/) 🚀
-   [**Join our content creators community on Discord**](https://discord.gg/in-plain-english-709094664682340443) 🧑🏻‍💻
-   For more content, visit [**plainenglish.io**](https://plainenglish.io/) + [**stackademic.com**](https://stackademic.com/)