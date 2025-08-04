---
title: "Garbage Collection Was A Mistake"
url: "https://medium.com/@impure/garbage-collection-was-a-mistake-c4909a2f5f10?source=email-d5592a49c1da-1753754259689-digest.reader--c4909a2f5f10----4-98------------------d905e451_9291_442f_9c6a_564e3b54d84c-1"
author: "Andrew Zuo"
published: "Jul 19, 2025"
scraped: "2025-07-31T00:11:15.750Z"
category: "flutter"
word_count: 1332
reading_time: "7 min read"
keywords: ["flutter", "row", "stack"]
---1

1

1

Zoom image will be displayed

![Glowing nodes in a graph surrounded by garbage](https://miro.medium.com/v2/resize:fit:700/1*HXi5NbLTvnCfXxYH5RKclg.jpeg)

Member-only story

# Garbage Collection Was A Mistake

[

![Andrew Zuo](https://miro.medium.com/v2/resize:fill:32:32/1*FZEG_DxaZ4g-w10VST7WGg.jpeg)





](/?source=post_page---byline--c4909a2f5f10---------------------------------------)

[Andrew Zuo](/?source=post_page---byline--c4909a2f5f10---------------------------------------)

Follow

6 min read

·

Jul 19, 2025

[

](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Fvote%2Fp%2Fc4909a2f5f10&operation=register&redirect=https%3A%2F%2Fandrewzuo.com%2Fgarbage-collection-was-a-mistake-c4909a2f5f10&user=Andrew+Zuo&userId=426137a1abbf&source=---header_actions--c4909a2f5f10---------------------clap_footer------------------)

405

38

[](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Fbookmark%2Fp%2Fc4909a2f5f10&operation=register&redirect=https%3A%2F%2Fandrewzuo.com%2Fgarbage-collection-was-a-mistake-c4909a2f5f10&source=---header_actions--c4909a2f5f10---------------------bookmark_footer------------------)

[

Listen









](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2Fplans%3Fdimension%3Dpost_audio_button%26postId%3Dc4909a2f5f10&operation=register&redirect=https%3A%2F%2Fandrewzuo.com%2Fgarbage-collection-was-a-mistake-c4909a2f5f10&source=---header_actions--c4909a2f5f10---------------------post_audio_button------------------)

Share

Apple’s recent migration exposes an uncomfortable truth about garbage collection. For all the decades of intricate engineering poured into it, this cornerstone of modern programming still struggles under pressure. Was it, in fact, a mistake all along?

Apple has a new blog post about how they migrated their [Password Management Service](https://www.swift.org/blog/swift-at-apple-migrating-the-password-monitoring-service-from-java/) from Java to Swift. Obviously they experienced extremely good results because Java.

However there was one piece of the blog post I found particularly interesting.

> Prior to seeking a replacement language, we sought ways of tuning the JVM to achieve the performance required. Java’s G1 Garbage Collector (GC) mitigated some limitations of earlier collectors by introducing features like predictable pause times, region-based collection, and concurrent processing. However, even with these advancements, managing garbage collection at scale remains a challenge due to issues like prolonged GC pauses under high loads, increased performance overhead, and the complexity of fine-tuning for diverse workloads.

Ah, garbage collection, my old friend. I hate garbage collection because in my Flutter app if the garbage collector decides to run while you’re scrolling, \*boom\* dropped frame.

However garbage collection on the server is not something I’ve really considered. Because if you think about it every time you make a request to the server you incur a 20ms overhead just from network latency, significantly more if you’re far away from the server. Garbage collection shouldn’t be a big deal here. But Apple says it is.

I guess it’s just because of Apple’s scale. Apple’s password manager likely has millions of users. Once you have that many users and that many allocations garbage collection becomes a big problem.

OK, let’s first discuss how garbage collection worked originally. It uses a graph colouring algorithm. That is every once in a while the garbage collection stops your entire program and marks every object as reachable or unreachable. The unreachable objects, the garbage, are then cleared from memory.

Obviously this approach where you stop the entire program is not ideal and the source of noticeable frame drops. So over time people have come up with ways to improve it. Apple mentions Java’s G1 garbage collector. This works by creating multiple regions. So instead of having one giant region of memory that has to be checked all at once we create many smaller regions.

What a beautifully… over-engineered solution that doesn’t even solve the core underlying problem. You still have GC pauses, you can just scale them to be shorter. In fact in some cases (like on the server) it’s even worse now because this splitting of memory into regions incurs additional overhead.

So obviously Apple still ran into problems with this. So they needed a solution. You’d think Swift would be the obvious choice but surprisingly not.

> We evaluated our options, and found only a few languages that could help us achieve our goals \[…\] you might expect that Apple would automatically choose Swift

Eventually though they did settle on Swift, probably due to it being one of the only high-level languages that does not use a garbage collector. Instead they use automatic reference counting (ARC). ARC works by keeping track of how many references each object has. Then when it has no more references the object can safely be deleted.

It works great. One problem though: circular references. What happens if you have object A that references object B which then references object A? The number of references would never go to 0 despite the objects being unreachable. Swift’s solution is weak references. These are references that don’t contribute to the reference count.

So Swift’s approach isn’t idiot-proof. Although technically traditional garbage collection isn’t either because you can get a memory leak if you keep on adding to a list and never remove from it. But Swift’s approach is more involved. Is it worth it? I think yes. If the benefit is significantly fewer dropped frames then I think it’s well worth the cost. And now Apple is saying that this benefit also extends to the server.

So why did we ever decide to use traditional garbage collection? Honestly, I don’t know and why I titled this post ‘Garbage Collection Was A Mistake’. I can tell you what problem Garbage Collection was trying to solve though.

==Back in the day, and still in languages like C++, you had to manage memory manually. This meant every time you wanted memory you would have to call== ==`malloc()`== ==and every time you wanted to dispose of memory you had to call== ==`free()`====. This is an error-prone process that frequently results in memory leaks and security problems.== So we needed some way to automatically `malloc()` and `free()` memory. That’s what garbage collection is.

But garbage collection isn’t the only way to solve this problem. It’s not the fastest, as seen with Swift. It’s definitely not the simplest. The only thing good about it is it’s easier for the developer. And just marginally.

You know how I’d solve this problem if I were designing my own language? I would use something similar to automatic reference counting but you’re only allowed one hard reference to each object in the heap which would make it as idiot-proof as traditional garbage collection.

But say you don’t like this method. Say you don’t like reference counting in general. Then we have to fall back to garbage collection right? No, there’s also ownership (which Rust does), you can use a combination of reference counting and garbage collection, Ada had this crazy method which is like reference counting but you can only point to ‘deeper’ objects in the heap which gets around the circular reference problem, true regions which are sets of objects only a single object has access to so you can clear them all at once easily, stack arenas where you can allocate as many objects as you want but they’re all deleted at some point (usually at the end of a frame, I think Jonathon Blow’s Jai does this).

I got all the above examples from [this post](https://verdagon.dev/grimoire/grimoire). Pretty good post, you should read it. I didn’t even list half of the methods in that post. Yeah, there are a lot.

So if there are so many ways to manage memory how is it that we picked the least efficient, most complex way of doing it? ¯\\\_(ツ)\_/¯

I think it’s marketing. “Look, it’s just like C but you don’t have to worry about memory.” And if you look at Java’s market share it looks like that pitch has worked. I mean, Apple was using it.

But garbage collection has huge performance problems. It is, in the words of a [Hacker News comment](https://news.ycombinator.com/item?id=19864830) I found while researching this post:

> ==the epitome of sunk cost fallacy. Thirty years of good research thrown at a bad idea. The reality is we as developers choose not to give languages enough context to accurately infer the lifetime of objects. Instead of doing so we develop borderline self-aware programs to guess when we’re done with objects. It wastes time, it wastes space, it wastes energy. If we’d spent that time developing smarter languages and compilers (Rust is a start, but not an end) we’d be better off as developers and as people. Garbage collection is just plain bad. I for one am glad we’re finally ready to consider moving on.==
> 
> Think about it, instead of finding a way of expressing when we’re done with instances, we have a giant for loop that iterates over all of memory over and over and over to guess when we’re done with things. ==What a mess! If your co-worker proposed this as a solution you’d probably slap them.==

Couldn’t agree more. The G1 Garbage Collector, all of the improvements to garbage collecting that were made over the years, are just bandages on this terrible algorithm that some Sun Exec probably thought of to sell Java licenses. It is slow, it is inefficient, and it is a mistake.

Tired of email overload? Zenith is your personal AI assistant, providing accurate summaries, smart bundling, and a unified inbox for all your accounts. Get it now: [zenithmail.app/download](https://zenithmail.app/download)