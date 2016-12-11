---
layout: default
title: Redis Pattern - Rate limiter
description: Correct way to use rate limiter pattern with Redis.
keywords: Redis Pattern, Rate limiter, command INCR, Lua script
index: false
comments: disqus
---

# Redis Pattern - Rate limiter

<h3>
<a href="#pattern-problem" name="pattern-problem" class="anchor"><span class="octicon octicon-link"></span></a>
Rate limiter
</h3>

> [Redis](https://redis.io/) is an open source (BSD licensed), in-memory data structure store, used as a database, cache and message broker.

There is a Pattern called `Rate limiter` in the [command INCR page](https://redis.io/commands/incr#pattern-rate-limiter), what has ability to be a counter used to limit the rate at which an operation can be performed.

<pre><code>FUNCTION LIMIT_API_CALL(ip)
ts = CURRENT_UNIX_TIME()
keyname = ip+":"+ts
current = GET(keyname)
IF current != NULL AND current > 10 THEN
    ERROR "too many requests per second"
ELSE
    MULTI
        INCR(keyname,1)
        EXPIRE(keyname,10)
    EXEC
    PERFORM_API_CALL()
END
</code></pre>

It remember each IP's requests per second, and only able to hit 10 times.

However there is a case can make the limiter invalid. When the request count haven't over the quota, if huge of requests visit at the same time, most/many of those may cross the validation. The time window exists between after the checking and updating the counter.

![Concurrent Problem](http://atealxt.github.io/images/20161211/concurrent.png "Concurrent Problem")

<h3>
<a href="#lua-script" name="lua-script" class="anchor"><span class="octicon octicon-link"></span></a>
Lua Script
</h3>

TODO

<h3>
<a href="#advanced-problem" name="advanced-problem" class="anchor"><span class="octicon octicon-link"></span></a>
Advanced Problem
</h3>

TODO
