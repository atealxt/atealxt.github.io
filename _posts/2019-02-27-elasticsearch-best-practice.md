---
layout: default
title: Elasticsearch Best Practice
description: Elasticsearch best practice. Checklist of performance, durability and security.
keywords: Elasticsearch, best practice, performance, durability, security
index: true
comments: disqus
---

# Elasticsearch Best Practice

Here is a checklist of Elasticsearch must-know things which I collect during the most recent year.

<h3>
<a href="#performance" name="performance" class="anchor"><span class="octicon octicon-link"></span></a>
Performance
</h3>

* Elasticsearch version <br>
More recent release version has better performance. We tested that indexing performance on 5.6.10 is ~20% increased compare with 5.1.1

* Memory per node <br>
Do not over 32GB, [31GB is likely safe](https://www.elastic.co/guide/en/elasticsearch/guide/current/heap-sizing.html).

* Number of nodes <br>
Two 16GB nodes are better than one 32GB, two 8GB are better than one 16GB, generally, but not always. Do your load test on scenarios you care.

* Number of shards <br>
More shards, faster query, slower agg. <br>
Try to avoid [very large shard](https://www.elastic.co/blog/how-many-shards-should-i-have-in-my-elasticsearch-cluster). 

* Index bulk size and thread count <br>
Load test with your expected data, start with 500-1000 bulk size in several threads.

* Refresh interval <br>
Lower interval, lower performance, sooner visible.

* Translog durability <br>
Use async with longer interval will increase index speed, with risk of losing data.

* Merge segments <br>
Fully merge your read only segments.

* Codec <br>
Choose proper codec, `best_compression` has best compress ratio with slowest speed.

* Query <br>
Split huge range query to small ones for saving memory/resp time, unless you need them all at the same time.

* Field type <br>
Use `text` if you need full-text search, otherwise `keyword` is generally good enough.

* RAID/SSD <br>
Use SSD in hot data zone if possible. <br>
RAID can also boost speed. We tested that a 10 disks RAID5 nodes cluster is 10-20% better compare with raw multi data path nodes which enabled replica.

* CPU bounds <br>
If Elasticsearch is not your only heavily CPU usage program on the same server, try to bind processes on specific CPUs via e.g. taskset.

<h3>
<a href="#durability" name="durability" class="anchor"><span class="octicon octicon-link"></span></a>
Durability
</h3>

* Garbage Collectors <br>
Comparison testing GC algorithms. We firstly use G1 then switch back to CMS, case of G1 node sometimes just crashed.

* Off-heap <br>
Limit off-heap usage by `-XX:MaxDirectMemorySize`.

* OS <br>
Disable or minimal [swapping](https://www.elastic.co/guide/en/elasticsearch/reference/current/setup-configuration-memory.html). <br>
Unlimit or turn up `memlock` and `nofile`. <br>
Enable coredump, but don't forget to clean up history data.

* Aggregation bucket size <br>
[Limit bucket size](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-terms-aggregation.html) especially in a multi nested agg, to avoid discrete explosion.

* Sniffing <br>
Enable sniffing indexing across cluster nodes.

* Connection <br>
Use long-lived connection, setup retry and rebuild strategy.

* Disk space <br>
Monitor disk space usage. Alarm when high, auto delete/stop storing when really high.

* Deadlock <br>
Cluster node may stuck in dead lock like `java.io.IOException: failed to read.+file:(.+).st`, this could happen on an accidentally lose power or disk corruption. Monitor the error log and delete the `st` file.

* IP <br>
Sometime host IP changed without inform Elasticsearch. Detect it and modify the setting.

* Index allocate status <br>
Shards may not success assigned, although it's rare. Monitor the UNASSIGNED shard and reassign/reroute it.

* Auto restart <br>
Auto restart is generally useful, customize your startup/cron script.

* Other monitor <br>
Throughput, latency, GC status, CPU, memory, disk and so on.

<h3>
<a href="#security" name="security" class="anchor"><span class="octicon octicon-link"></span></a>
Security
</h3>

* 920X/930X <br>
Protect your service from outside world, by firewall, x-pack, searchguard.

* Wildcards <br>
Disable wildcard/regex delete feature unless you are fully confident.
