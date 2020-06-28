---
layout: default
title: What I learned from migrate large Enterprise Microservices System to Kubernetes
description: Advises and experiences of migrate large Enterprise Microservices System to Kubernetes
keywords: Microservices, Kubernetes migration, K8s, Spring Cloud, SIEM
index: true
comments: disqus
---

# What I learned from migrate large Enterprise Microservices System to Kubernetes

There is one SIEM system we built. As one of our customer requirements, recently we developed and migrate it to Kubernetes (K8s). <br>
Here are some advice to share:

<h3>
<a href="#know-your-system" name="know-your-system" class="anchor"><span class="octicon octicon-link"></span></a>
1. Get to Know Your System Well
</h3>

Cloud Native is not simply move processes to docker. You need to fully understand your app, estimate works of migration and alteration, it may even involve new system/hardware plan.

* Internal Service Dependency <br>
  Does the service support multi-instances? E.g. some code have to run on primary. <br>
  Need to start one by one or concurrently? Require other services?
* External Service Dependency <br>
  You have no control of external service, what if only your services can be in container?
* OS Dependency <br>
  Any bash/shell commands, scripts, file r/w, cron jobs?
* Hardware Dependency <br>
  Serial port communication? NIC management?

<h3>
<a href="#step-by-step" name="step-by-step" class="anchor"><span class="octicon octicon-link"></span></a>
2. Step by Step
</h3>

Roman was not built in one day. Make a reasonable, secure plan.

* Phase I: try part of services, side business first
* Phase II: migrate core business online
* Phase III: migrate as much as possible, target is to get rid of old machines

<h3>
<a href="#resource-planning" name="resource-planning" class="anchor"><span class="octicon octicon-link"></span></a>
3. System Resource Planning
</h3>

Be aware of Cloud Native require more resources to run, especially when your system was well-designed base on the specific hardware.

* Storage <br>
  How much disk spaces need per each service? iops? does it require write or only read?
* CPU <br>
  Compute-intensive? Range? Minimum?
* Memory <br>
  Similar questions as CPU, be careful of [jvm args](https://srvaroa.github.io/jvm/kubernetes/memory/docker/oomkiller/2019/05/29/K8s-and-java.html) and oversold ([ref1](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/sizing.html#sthref22) [ref2](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/parallel.html#parallel_collector_gen_size) [ref3](https://stackoverflow.com/questions/30458195/does-gc-release-back-memory-to-os)) if your app is based on Java.
* Network <br>
  Every rule of reachability and performance between inside and outside should review and treat as unchanged.

<h3>
<a href="#app-changes" name="app-changes" class="anchor"><span class="octicon octicon-link"></span></a>
4. Application Changes
</h3>

The app was coupled design with OS/hardware, part of program may need remake or reconsideration.

* OS Monitor <br>
  It's not possible to talk to OS directly as usual before.
* Logging <br>
  The task of log message is no longer just write to local file.
* App Services Management <br>
  The way of control services is totally changed.
* Network Management <br>
  Forget it.
* Hardware communication <br>
  You don't want to keep old machines any longer, in generally.

<h3>
<a href="#our-practices" name="Our Practices" class="anchor"><span class="octicon octicon-link"></span></a>
Our Practices
</h3>

<h3>
<a href="#before-cloud-native" name="before-cloud-native" class="anchor"><span class="octicon octicon-link"></span></a>
Before Cloud Native
</h3>

A multi-nodes mixed style distributed system:
* Java APPs <br>
  About 50 services implemented with Spring Cloud. Some services are not well-supported run in multi-instances nor stateless, some are require others to run/start first.
* Nginx <br>
* Relational Database <br>
  PostgreSQL with pgpool.
* Redis <br>
* Big data platform <br>
  Hadoop, Hive, Spark, Kafka, Elasticsearch.
* 3rd Service API <br>
* Operation System (commands, bash/shell, file r/w, cron jobs) <br>
  Read hardware to generate things like license; Information Security related data; Implicitly resources such as "getClass().getClassLoader().getResource".
* Hardware <br>
  Serial port for extended SMS card.

<h3>
<a href="#after-cloud-native" name="after-cloud-native" class="anchor"><span class="octicon octicon-link"></span></a>
After Cloud Native
</h3>

* Four fifths of services are migrated to K8s (service and pod), half of them have small code changes
* System components are able to run on K8s: Nginx (Ingress); PostgreSQL; Redis
* Bigdata stack is remaining in traditional deplyment (VM)

<h3>
<a href="#lesson-learned" name="lesson-learned" class="anchor"><span class="octicon octicon-link"></span></a>
Lesson Learned
</h3>

At the beginning, we tried remove Eureka totally, which was a mistake. Eureka was basis of Microservices that every java service needs, delete it from one service require several config changes even code changes, and even worse, we realized some services are too hard to convert quickly, which mean Eureka cannot be removed for the moment. Two weeks are thus wasted.

Make one common docker image, move differences dynamically remotely. <br>
We tried build customized image for each service with openjdk-alpine, which lead to two critical problems:
1. Tons of images make up a huge install package, even though many of them are actually very similar.
2. openjdk-alpine is small indeed. However, it has critical debug problem ([ref4](https://github.com/docker-library/openjdk/issues/372#issuecomment-560900332) [ref5](https://news.ycombinator.com/item?id=21755871#21757483)). For use cases not require app elastic expanding often, one big common image is not an issue. BTW docker has one great image shrink tool called docker-slim, K8s [Ephemeral Containers](https://kubernetes.io/docs/concepts/workloads/pods/ephemeral-containers/) is still in alpha until today.

So we turn to build a common image for all services, move runtime (app jar, jdk, shared libs, python etc) to network storage. Use a global config-map to keep every environment value the same. <br>
We keep the logging in "local file" for now, by alter the file name format with hostname.

Network Changes has to be made. <br>
The direct way to get client IP is broken after the migration, as K8s service design. [An extra LB is required](https://stackoverflow.com/questions/59483886/how-to-get-the-client-ip-inside-the-pod-without-cloud-provider-or-lb) if you need it as we do. <br>
Client mode of Spark submit is not working in K8s pod, becaure of server can't reach back to pod. You need to change app to use cluster mode, and pass all the environments during startup (client codes to get environments on the fly will make no sense).

<h3>
<a href="#next" name="next" class="anchor"><span class="octicon octicon-link"></span></a>
NEXT
</h3>

<!--
The production deployment is paused due to COVID-19. Our customer will prepare a VMware private cloud for us, will see how things goes.
-->

* The rest of migration <br>
  Some system components are still in traditional deploy, or not well tested on K8s (Redis, PostgreSQL, Bigdata).
* Get rid of eureka <br>
  [spring-cloud-kubernetes-discovery](https://cloud.spring.io/spring-cloud-kubernetes/spring-cloud-kubernetes.html) is still a newborn, framework like Feign are not well supported in it.
* Service Mesh <br>
  Istio.
* Microservices Monitor <br>
  Monitor services in K8s, such as prometheus and grafana.
* A better K8s <br>
  HA: multi master; independent etcd cluster; a-z zone; pod scheduler policy; operator; <br>
  Chaos test: asobti/kube-monkey; chaosblade-io/chaosblade-operator
