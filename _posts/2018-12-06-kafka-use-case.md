---
layout: default
title: An Apache Kafka Use Case
description: How we use Apache Kafka optimize a producer-consumer program.
keywords: Apache Kafka, Producer, Consumer, Event Bus
index: true
comments: disqus
---

# An Apache Kafka Use Case

<h3>
<a href="#producer-consumer" name="producer-consumer" class="anchor"><span class="octicon octicon-link"></span></a>
Producer-Consumer Program
</h3>

We have a program receive messages from outside and dispatch to consumers to handle.

![File version Program](http://atealxt.github.io/images/20181206/producer_consumer-v1.png "File version Program")

The program is very clear and simple:
* Process A keep receiving messages from outside, then write them to a binary file one by one.
* Process B detect and read new messages from the file once arrived, then dispatch them to consumers.
* The file is auto-rolled every day.

The design leaks some drawback, especially with grown of business:
1. Performance. It is bounded to a single file write/read I/O speed.
2. Durability. If the file/disk is broken, program will stop working, history data are lost.
3. Scalability. The program is hard to scale out. 

The first one can be enhanced with technique like memory cache, disk flush buff, batch size etc. 
The other two could be solved in split one file to shards with replicates.

<h3>
<a href="#kafka-version-program" name="kafka-version-program" class="anchor"><span class="octicon octicon-link"></span></a>
Optimized in Apache Kafka
</h3>

After review several options, we decided to use [Apache Kafka](https://kafka.apache.org/) to replace the manual binary file write/read.
It can solve all our 3 problems, with only cost of not much more memory.

![Kafka version Program](http://atealxt.github.io/images/20181206/producer_consumer-v2.png "Kafka version Program")

Benefits to use Kafka here:
* Kafka will maximally use page cache, which consumers can normally read directly from system memory instead of disk.
* Data in Kafka can be safety stored to multiple disks via replication.
* It's possible to scale out Kafka services in multi broker/topic.
* Data can be easily reread, sharing between other services. Elimination strategy is flexible as well.

Problem solved, perfect!

<h3>
<a href="#things-learned" name="things-learned" class="anchor"><span class="octicon octicon-link"></span></a>
What We Learned After
</h3>

During load test, we surprisingly found use several producers are notable faster than a single one which official API recommended: The producer is sharing a single producer instance across threads will generally be faster than having multiple instances. I didn't write down the detail but it was about 10%~20%, the Kafka version we use was 0.10.

For decoupling the message receive and send, we created a pool batched cache the messages, producer threads read messages from pool then send them to Kafka server.

After several weeks running, we monitored sometimes Kafka is stuck in full GC or even OOM, same thing in the program (Process A). It is likely happens when system is being heavily visit, for example huge or large messages are received.<br>
To fix the issue, a current limiter is setup to protect the memory.
On the server side, limit produce rate on Kafka config `producer_byte_rate`:
<pre><code>sh kafka-configs.sh --zookeeper localhost:2181 --alter --add-config 'producer_byte_rate=YOUR_NUMBER_HERE' --entity-type clients --entity-default
</code></pre>
On the client side (Process A), a JVM monitor thread is also created to check whether used heap is over threshold. Once Kafka message producing is slower than receiving, the protect is triggered, program will firstly try call `system.gc()` explicitly, then double check the memory usage, if heap is still almost full, the receiver will stop accept messages for a short time.

The Process A now looks like this:

![Optimized Program](http://atealxt.github.io/images/20181206/producer_consumer-v2-2.png "Optimized Program")

Today the optimized program has running on production for over 6 months, gc is normally in 5-10ms per seconds. And whatever how much messages are coming at the same time, the program will keep running as designed.

PS:<br>
Now Kafka has released 2.1.0, far from 0.10.
The design contains 5 part threads in the process, which looks not simple, not cool. I know it.
Next time I will review the simplify version again, but now let it be.

