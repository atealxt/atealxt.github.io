---
layout: default
title: An Apache Kafka Use Case
description: How we use Apache Kafka optimize a producer-consumer program.
keywords: Apache Kafka, Producer, Consumer, Event Bus
index: false
comments: disqus
---

# An Apache Kafka Use Case

<h3>
<a href="#producer-consumer" name="producer-consumer" class="anchor"><span class="octicon octicon-link"></span></a>
A Producer-Consumer Program
</h3>

We have a program receive messages from outside and dispatch to consumers to handle.

![File version Program](http://atealxt.github.io/images/20181206/producer_consumer-v1.png "File version Program")

The program is very clear and simple:
* Process A keep receiving message from outside, then write it to a binary file one by one.
* Process B detect and read new messages from the file once arrived, then dispatch it to consumers.
* The file is auto-rolled per day.

The design leaks some drawback, especially with grown of business:
# Performance. It is bounded to a single file write/read I/O speed.
# Durability. If the file/disk is broken, program will stop working, history data are lost.
# Scalability. The program is hard to scale out. 

The first one can be enhanced with technique like memory cache, disk flush buff, batch size etc. 
The other two could be solved in split one file to shards with replicates.

<h3>
<a href="#kafka-version-program" name="kafka-version-program" class="anchor"><span class="octicon octicon-link"></span></a>
Optimized in Apache Kafka
</h3>

After review several options, we decided to use [Apache Kafka](https://kafka.apache.org/) to replace the manual binary file write/read.
It can solve all our 3 problems, with only cost of not much memory.

![Kafka version Program](http://atealxt.github.io/images/20181206/producer_consumer-v2.png "Kafka version Program")

Benefits to use Kafka here:
* Kafka will maximally use page cache, which consumers can normally read directly from system memory instead of disk.
* Data in Kafka can be safety stored to mutiple disks via replication.
* It's possible to scale out Kafka services in multi broker/topic.
* Data can be easily reread, sharing between other services. Elimination strategy is flexible as well.

Problem solved, everything is damn good! Well..

<h3>
<a href="#things-learned" name="things-learned" class="anchor"><span class="octicon octicon-link"></span></a>
What we learned after
</h3>

After some days stability test and experimental running, we meet some new problems:
* A
* B
* C



