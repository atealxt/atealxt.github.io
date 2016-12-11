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

There is a Pattern called `Rate limiter` in the [command INCR page](https://redis.io/commands/incr#pattern-rate-limiter), what is ability to be a counter limit the rate at which an operation can be performed.

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

It remembers each IP's requests per second, only able to hit 10 times.
It will work perfectly OK in general cases, however might be invalid on heavy traffic system/API or protected from attack. Think about when the request count haven't over the quota, if huge of requests visit now at the same time, most/many of those may cross the validation. The time window exists between after the checking and updating the counter.

![Concurrent Problem](http://atealxt.github.io/images/20161211/concurrent.png "Concurrent Problem")

Codes to simulate attacker with [Jedis](https://github.com/xetorthio/jedis) in Java translated, setup 5 requests per user per 10 seconds:

<pre><code>public class RateLimiter {

	static int testCount = 10;
	static CountDownLatch latch = new CountDownLatch(testCount);

	public static void main(String args[]) throws InterruptedException {
		for (int i = 0; i < testCount; i++) {
			new Thread(new Hack()).start();
		}
		latch.await();
	}

	static class Hack implements Runnable {
		@Override
		public void run() {
			try (Jedis jedis = new Jedis("localhost");) {
				String key = "1.2.3.4:rightnow";
				String value = jedis.get(key);
				if (value != null && Integer.parseInt(value) > 5) {
					throw new RuntimeException("too many requests per second");
				} else {
					Transaction tran = jedis.multi();
					tran.incr(key);
					tran.expire(key, 10);
					tran.exec();
					System.out.println("Request success");
				}
			} catch (Exception e) {
				System.err.println("Request failed. " + e.getMessage());
			}
			latch.countDown();
		}
	}
}
</code></pre>

<pre><code>//Run result:
Request success
Request success
Request success
Request success
Request success
Request success
Request success
Request success
Request success
Request success
</code></pre>

The case is similar to [Double-checked locking](https://en.wikipedia.org/wiki/Double-checked_locking) from [Singleton Design Pattern](https://en.wikipedia.org/wiki/Singleton_pattern), the difference is it requires distributed lock in our case here.

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
