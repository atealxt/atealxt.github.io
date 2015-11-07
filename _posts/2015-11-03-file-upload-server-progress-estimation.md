---
layout: default
title: File Upload Server Progress Estimation
description: Enhance jQuery File Upload plugin progress event, estimate server side consume time and include in the total progress.
keywords: blueimp jQuery File Upload plugin, simulate server progress, progressServerRate, progressServerDecayExp
index: true
comments: disqus
---

# File Upload Server Progress Estimation

<h3>
<a href="#jquery-file-upload-plugin" name="jquery-file-upload-plugin" class="anchor"><span class="octicon octicon-link"></span></a>
jQuery File Upload Plugin
</h3>

> [blueimp/jQuery-File-Upload](https://github.com/blueimp/jQuery-File-Upload) is a File Upload widget with multiple file selection, drag&drop support, progress bar, validation and preview images, audio and video for jQuery.

The plugin has a feature [Upload progress](https://github.com/blueimp/jQuery-File-Upload/wiki/Basic-plugin#how-to-display-upload-progress-with-the-basic-plugin) support [most model browsers](https://github.com/blueimp/jQuery-File-Upload/wiki/Browser-support#upload-progress), you can create a progress bar indicating the upload progress status.

<h3>
<a href="#problem" name="problem" class="anchor"><span class="octicon octicon-link"></span></a>
Problem
</h3>

The progress is based on [ProgressEvent](https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent), however any server-side processes like validation or persistence will not effect to the event.

![No server-side progress](http://atealxt.github.io/images/20151103/01_no_server.gif "No server-side progress")

The progress is hanging on 100% and wait for server's response.

<h3>
<a href="#server-progress" name="server-progress" class="anchor"><span class="octicon octicon-link"></span></a>
Server Progress
</h3>

There are some methods to solve the problem with server-side changes: ajax pooling, web socket, or even redesign the server process totally asynchronized and return to client instantly (actually this is the principle to design distribute system, although complicated).

Any possibly simpler way? Yes, there is a solution only need to modify front-end code, which is estimate server consume time and include into the whole progress - simulate the server progress.

Suppose server will spend 30% of time:

<pre><code>// test code
$('#fileupload').fileupload({
    /* ... */
    progressall: function (e, data) {
        var progress = parseInt(data.percent * 100, 10);
        $('#progress .bar').css(
            'width',
            progress + '%'
        );
    },
    progressServerRate: 0.3
});
</code></pre>

Parameter `progressServerRate`: estimated server progress percentage.
With it the progress bar will keep part of spaces for server consuming.

<h3>
<a href="#exponential-decay" name="exponential-decay" class="anchor"><span class="octicon octicon-link"></span></a>
Exponential Decay
</h3>

It is necessary to use a math function specify the rate of change of the parameter over time. We don't want server progress finishes in constant time, because anyway there is no way to know the actual server consumed time, you can't really update the progress to 100% ever unless the server is responded. 

[Exponential Decay](https://en.wikipedia.org/wiki/Exponential_decay) is good at this thing.

![Exponential decay](http://atealxt.github.io/images/20151103/04_exponential_decay_3.png "Exponential decay")

<pre><code>// source code of calculate increase percentage
var incr = Math.pow((1 - data.percent), data.progressServerDecayExp);
data.percent += incr;
</code></pre>

Each time calling above codes the progress will increase a little bit, accelerated speed depends on the exponent parameter.

Parameter `progressServerDecayExp`: Server progress exponential decay (the exponent of equation).

<pre><code>// test code
$('#fileupload').fileupload({
    /* ... */
    progressall: function (e, data) {
        var progress = parseInt(data.percent * 100, 10);
        $('#progress .bar').css(
            'width',
            progress + '%'
        );
    },
    progressServerRate: 0.3,
    progressServerDecayExp: 2
});
</code></pre>

Examples:

progressServerRate: 0.4, progressServerDecayExp:2

![rate=0.4 and exp=2](http://atealxt.github.io/images/20151103/02_server_0p4_2.gif "rate=0.4 and exp=2")

progressServerRate: 0.5, progressServerDecayExp:3.5

![rate=0.5 and exp=3.5](http://atealxt.github.io/images/20151103/03_server_0p5_3p5.gif "rate=0.5 and exp=3.5")

Moreover, you can display a message of process is in either client or server progress at a moment.
More detail please refer to commit [1767bf7](https://github.com/atealxt/jQuery-File-Upload/commit/1767bf75f9c7bedcd393b4208cf55d6cfe671645).

BTW [Easing functions](http://easings.net/) is a cool website of easing cheat sheet visualization.

<h3>
<a href="#estimate-parameter-value" name="estimate-parameter-value" class="anchor"><span class="octicon octicon-link"></span></a>
Estimate Parameter Value
</h3>

Note the last anime above, the progress is a little far away 100% before done.
Sometimes you need to pick a suitble length for progress bar and parameter value. 

Here are several rules can help estimate parameter:
<ul>
  <li>Server performance. In general, server is fast than user-end upload.</li>
  <li>Larger file, slower server response.</li>
</ul>

<h3>
<a href="#firefox" name="firefox" class="anchor"><span class="octicon octicon-link"></span></a>
Firefox
</h3>

When I worked on the feature, I found a Firefox progress event bug, it didn't trigger progress event for the final small piece resource content loaded, until the finally response from server.

My environment:
<ul>
  <li>Firefox 41.0.2</li>
  <li>Windows 7</li>
</ul>

If you know something kindly let me know.
