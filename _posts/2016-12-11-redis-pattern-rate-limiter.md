---
layout: default
title: Redis Pattern - Rate limiter
description: Correct way to use rate limiter pattern with Redis.
keywords: Redis Pattern, Rate limiter, command INCR, Lua script
index: true
comments: disqus
---

# Redis Pattern - Rate limiter

<h3>
<a href="#pattern-problem" name="pattern-problem" class="anchor"><span class="octicon octicon-link"></span></a>
Rate limiter
</h3>

> [Redis](https://redis.io/) is an open source (BSD licensed), in-memory data structure store, used as a database, cache and message broker.

There is a Pattern called `Rate limiter` in the [command INCR page](https://redis.io/commands/incr#pattern-rate-limiter), what is Redis ability to be a counter limit the rate an operation can be performed.

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

It remembers each IP's requests per second, only able to hit 10 times.<br />
It will work perfectly OK in general cases, however might be invalid on heavy traffic system/API or protected from attack. Think about when the request count haven't over the quota, if huge of requests visit now at the same time, most/many of those may cross the validation. The time window exists between after the checking and updating the counter.

![Concurrent Problem](http://atealxt.github.io/images/20161211/concurrent.png "Concurrent Problem")

Codes to simulate attacker with [Jedis](https://github.com/xetorthio/jedis) in Java, setup 5 requests per user per 10 seconds:

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

Redis transaction model defined Lua script can be executed inside sequentially, we can translate that function to a Lua script to run as a atomic [Database Procedure](https://en.wikipedia.org/wiki/Stored_procedure):

<pre><code>local current = tonumber(redis.call(\"get\", KEYS[1]))
if (current ~= nil and current >= tonumber(ARGV[1])) then
  error(\"too many requests\")
end
local result = redis.call(\"incr\", KEYS[1])
redis.call(\"expire\", KEYS[1], tonumber(ARGV[2]))
return result
</code></pre>

Test code to simulate attacker again:

<pre><code>static class Hack implements Runnable {
	@Override
	public void run() {
		try (Jedis jedis = new Jedis("localhost");) {
			String script = jedis.scriptLoad(SCRIPT_LIMIT_PER_PERIOD);
			Object result = jedis.evalsha(script, 1, "test", "5", "10");
			System.out.println("Request success " + result);
		} catch (Exception e) {
			System.err.println("Request failed. " + e.getMessage());
		}
		latch.countDown();
	}
}

static String SCRIPT_LIMIT_PER_PERIOD = ""
	+ "local current = tonumber(redis.call(\"get\", KEYS[1])) \n"
	+ "if (current ~= nil and current >= tonumber(ARGV[1])) then \n"
	+ "	error(\"too many requests\") \n"
	+ "end \n"
	+ "local result = redis.call(\"incr\", KEYS[1]) \n"
	+ "redis.call(\"expire\", KEYS[1], tonumber(ARGV[2])) \n"
	+ "return result";
</code></pre>

<pre><code>//Run result:
Request success 1
Request success 5
Request success 4
Request success 3
Request success 2
Request failed. ERR Error running script (call to f_0ba0c11227df85d84bb53510e37c9d1abceaaa08): @user_script:3: user_script:3: too many requests 
Request failed. ERR Error running script (call to f_0ba0c11227df85d84bb53510e37c9d1abceaaa08): @user_script:3: user_script:3: too many requests 
Request failed. ERR Error running script (call to f_0ba0c11227df85d84bb53510e37c9d1abceaaa08): @user_script:3: user_script:3: too many requests 
Request failed. ERR Error running script (call to f_0ba0c11227df85d84bb53510e37c9d1abceaaa08): @user_script:3: user_script:3: too many requests 
Request failed. ERR Error running script (call to f_0ba0c11227df85d84bb53510e37c9d1abceaaa08): @user_script:3: user_script:3: too many requests 
</code></pre>

The followed additional 5 requests are successful blocked.

<h3>
<a href="#advanced-script" name="advanced-script" class="anchor"><span class="octicon octicon-link"></span></a>
Advanced Script
</h3>

Above script still has 2 potential concern:
* Expire can be extends automatically if checked key doesn't contains timestamp.

Every time allowed a request will reset expire again, the whole timeout is not accurate.
To fix this, client must pass the timestamp within part of the key to avoid check duplicated key, for example:

<pre><code>//allow 5 times per hour
eval "${script}" 1 test_2016121102 5 3600</code></pre>

* If timeout is a large value, the expired key can be removed by Redis automatically at a very late time.

This maybe a concern for huge unique visitors system.

It is possible to edit the script a little bit to fix the 2 issues:

<pre><code>local notexists = redis.call(\"set\", KEYS[1], 1, \"NX\", \"EX\", tonumber(ARGV[2]))
if (notexists) then
  return 1
end
local current = tonumber(redis.call(\"get\", KEYS[1]))
if (current == nil) then
  local result = redis.call(\"incr\", KEYS[1])
  redis.call(\"expire\", KEYS[1], tonumber(ARGV[2]))
  return result
end
if (current >= tonumber(ARGV[1])) then
  error(\"too many requests\")
end
local result = redis.call(\"incr\", KEYS[1])
return result
</code></pre>

The advanced version firstly check and set the key only if not exists, this will fix the reset timeout issue.
Note that in the middle, it still have a check whether key is exist, which for key can be just expire at that time technically.


<h3>
<a href="#redis-module" name="redis-module" class="anchor"><span class="octicon octicon-link"></span></a>
Redis Module
</h3>

Redis 4.0 (currently in Beta) will introduce a new feature `Module`, is add-ons to extend write use cases in native scope.
Currently there is already have one for rate limiter implementation at [brandur/redis-cell](https://github.com/brandur/redis-cell), which you can keep eye on it.
