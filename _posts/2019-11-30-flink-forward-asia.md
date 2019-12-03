---
layout: default
title: FLINK FORWARD ASIA 2019 参会总结
description: FLINK FORWARD ASIA 2019 参会总结，Take Away.
keywords: Apache Flink, Flink Forward, FFA
index: true
comments: disqus
---

# FLINK FORWARD ASIA 2019 参会总结

感谢公司提供的门票及培训机会，以此文记录一天半的会议见闻。

<h3>
<a href="#day1-morning" name="day1-morning" class="anchor"><span class="octicon octicon-link"></span></a>
Day 1 上午的主会场
</h3>

* Stateful Functions: Building general-purpose Applications and Services on Apache Flink <br>
Flink创始人之一，主要介绍了2019 Flink的进展以及未来发展方向。着重推出Stateful Functions，从Serverless获得启发，意将流处理与FaaS的优点相结合，构造事件驱动的数据函数式编程。statefun.io 感兴趣的看

* Apache Flink Heading Towards A Unified Engine <br>
主要介绍Flink中国社区在2019及以后一段时间的发展情况。<br>
划重点：<br>
1. 批流一体。强调Flink的高性能，拿Hive对比，Benchmarking是它的7倍；
2. PyFlink。为了搞机器学习，Python一定要支持好。顺势强推Alink，阿里内部专门为Flink做的ML库，开源了出来，预计2020年回馈至Flink官方；
3. 云原生。介绍Flink已经可以跑在K8S上了，后续会持续支持和优化；
4. 最后算来个硬广，联合Ververica推出Flink企业服务。V家出Flink运维平台，跑在A家的云上；

* Reliable Streaming Infrastructure for the Enterprise <br>
主要介绍了Pravega这个流式存储。给出的数据：Pravega+Flink对比Kafka+Spark，存储仅需三分之一，Pipeline性能十倍、ML执行时间短一半。pravega.io 感兴趣的看

* Lyft基于Apache Flink的大规模准实时数据分析平台 <br>
这个议题与笔者比较贴近，应用都是准实时数据存储分析平台。Lyft用的AWS，实时流数据存Parquet，再用Presto/Hive做查询。存数据每攒3分钟为一个批次，checkpoint写Parquet。<br>
分享了一些实践经验：<br>
1. 解决小文件问题这个大坑的思路：使用subtask计算本地流速，配合全局计数器计算出权重，通过广播调整Hive partition策略；
2. ETL多级压缩和业务去重；
3. Parquet的优化方案：文件数据值大小范围统计信息 - Cardinality Stats & Min/Max Stats、文件系统统计信息 - Files Stats（Success File stats）、基于主键数据值的排序 - Clustering、以及二级索引；

<h3>
<a href="#day1-afternoon" name="day1-afternoon" class="anchor"><span class="octicon octicon-link"></span></a>
Day 1 下午参加的是Flink核心技术分论坛
</h3>

* Pluggable Shuffle Service and Unaligned Checkpoints <br>
介绍了2个Flink的优化实践：<br>
1. Pluggable Shuffle Service：Partition/Task/Task Executor生命周期和资源管理的不足，如非预期回收、作业重度重启、某些场景的集群资源浪费、架构扩展性不足等，并如何使用Shuffle Service插件化架构解决（FLIP-31）；
2. 优化原始基于Chandy-Lamport算法的checkpoint机制：把Barrier和部分快照信息持久化存储，加速尤其是存在部分数据计算任务/节点存在瓶颈造成反压或Failover的场景，代价就是引入的持久化存储可能带来的一系列问题，如I/O可能会飙上去；

* Bring Cross DC and Cross Data Source SQL Engine to Apache Flink <br>
通篇都在讲他家的迁移计算怎么支持多类型、版本数据源的复杂数据分布场景的查询，以及一些数据查询上面的优化，如CPU资源评估、数据join重排等。Flink在这里只是个查询工具的角色，没咋特别提。

* New Flink source API: Make it easy <br>
主要介绍了重构Source模块的工作。把原来各家数据接入Flink自写一套实现代码，改善成了在Flink新版Source里，公共代码/通用性的东西我Flink来写，抽象出来的一些方法你们再自己实现。以Kafka举例原来的大几千行代码可以缩短到不到一千行。

* Stateful Functions: Unlocking the next wave of applications with Stream Processing <br>
这个主要就是继续上午主会议Stephan对于Stateful Functions的更详细一点的介绍，基于Actor/Akka风格，如何定义function实例单位（Address），以消息传递的方式进行multiplexing FIFO消费。笔者感觉目前Stateful Functions还不是很成熟，最好等明年1.10/11出来之后看看再说。现场有不少同学互动，讨论了比如更新其中一个application需要重启整个拓扑之类的问题。

* Apache Flink新场景——OLAP引擎 <br>
最后这个议题说了Flink也在积极适配OLAP的场景，用以主要竞争Presto、Impala这类没有中间预计算和存储的ROLAP。这样团队有可能就用Flink一个技术栈全搞定了。给出的benchmark数据是性能和Presto在一个档次，优势是创建时间不长，还有很大的优化空间。

<h3>
<a href="#day2-morning" name="day2-morning" class="anchor"><span class="octicon octicon-link"></span></a>
Day 2 也是最后一个上午，转去听了企业实践专场
</h3>

* Apache Flink 在网易的实践 <br>
一大部分企业实践的分享是做大数据平台。对于国内环境，大互联网公司通常得有个自研的平台，比如网易。一方面为了贴合自己的庞大业务线，另一方面用别人的不一定撑得住，即使撑得住一般也用不起。现在大家基本都是基于已在线的Flink集群开发层管理平台，支持计算任务可视化管理、运维自动化、监控等。网易这个平台的特色是支持了多版本Flink混跑，还有Blink。

* Apache Flink 在中国农业银行的探索和实践 <br>
农行是传统企业参会的独一份。这分享也非常有传统企业的风格，铺垫了一大堆形势、概念，技术讲的不多，感觉剥开用了Flink的话，换个业务都能套进去。最后的反欺诈规则API的Benchmark还行，银行的流量在那摆着呢，百毫秒级别的响应，效果还比较理想。反过来说，像银行那些核心业务系统，追求的首先是稳定，连Oracle和大型机还没去掉呢，能积极尝鲜Flink很不错了。

* 基于Apache Flink的爱奇艺实时计算平台建设实践 <br>
感觉爱奇艺比网易平台化做的更深入一些，做了统一SQL引擎，流式数据中台，监控做到了Flink组件级别。基本风格是很早就开始用Flink，一些当时官方还没有或刚有的特性他们因为有需求就先搞起来了，像优化checkpoint提高重启/故障恢复速、Kafka join HBase给ML造数据等。

* 实时计算在贝壳的实践 <br>
贝壳这个感觉和之前的平台化分享没有太大差别，也是企业自己的一些基于Flink搭建平台的经历，除了用的大数据框架种类挺新比如Clickhouse，其它没给我留下太深的印象。

* 基于Flink构建CEP（Complex Event Process）引擎的挑战和实践 <br>
奇安信是参会的唯一一家安全公司，做的ToB场景和之前的大多数ToC不一样，主要分享了在中小规模有限硬件资源场景下，使用Flink做数据关联规则分析。讲的很硬核，从基于原生Flink 做CEP二次开发，构建全局DAG图、规则粒度监控、扩展算子等，到后面流式状态机、正则引擎性能优化，东西有点多。

<h3>
<a href="#conclusion" name="conclusion" class="anchor"><span class="octicon octicon-link"></span></a>
后记
</h3>

参会的大部分都是工程师，没什么大型会议那种上来先整一小时八股文、或厂家大肆宣传的环节，不水，听的比较带感。

比较汗的是没什么仪式，直接开始，也直接结束。第一天下午最后一个议题完了之后，主持人或许是看现场已经走了不少人，pass了收尾环节，直接把剩下坚持到最后的同学们无视了。。。

PS<br>
官方总结 https://mp.weixin.qq.com/s/JRWq17AQ0vU9YpoTkEGOSg <br>
PPT下载 https://ververica.cn/developers/flink-forward-asia-2019/

