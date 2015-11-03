---
layout: default
title: jQuery File Upload Progress Server Estimation
description: 
keywords: 
index: false
comments: disqus
---

# jQuery File Upload Progress Server Estimation

## blueimp/jQuery-File-Upload Plugin

[blueimp/jQuery-File-Upload](https://github.com/blueimp/jQuery-File-Upload) is a File Upload widget with multiple file selection, drag&drop support, progress bar, validation and preview images, audio and video for jQuery.
 -- per official project description

The plugin has a feature [Upload progress](https://github.com/blueimp/jQuery-File-Upload/wiki/Browser-support), you can create a progress bar indicating the upload progress status.

## Problem
The progress is based on [ProgressEvent](https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent), 
However any server-side processe like validation or persistence will not effect to the event.

01_no_server.gif
The progress is hanging on 100% and wait for server's response.

## Server progress
We can make the server process asynchronized and return to client instantly. It is the principle to design distribute system, although complicated.
But what if you just need a simple or temp solution/fix, there is another way which is estimate server consumed time and include into the whole progress - simulate the server progress.

Suppose server spend 30% of times:

```javascript
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
```

Parameter `progressServerRate`: estimated server progress percentage.
With it the progress bar will keep 30 percent spaces for server consume.

## Exponential decay

Well done? Hold on. 

It is necessary to use a math function specify the rate of change of the parameter over time. We don't want server progress finishes in constant time, because anyway there is no way to know the actual server consumed time, you can't really update the progress to 100% ever unless the server responsed. 
Obivlisly [Exponential Decay](https://en.wikipedia.org/wiki/Exponential_decay) is suitable here.

[pic](https://www.google.com/?gws_rd=ssl#q=y%3D1%2Fx^2)
y=1/x^2

For use the value update to progress percentage, inverse power function to exponential function:

[pic](https://www.google.com/?gws_rd=ssl#q=y%3Dx^2)
y=x^2

```javascript
// source code
var incr = Math.pow((1 - data.percent), data.progressServerDecayExp);
data.percent += incr;
```

```javascript
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
```

Parameter `progressServerDecayExp`: Server progress exponential decay
More detail about code please refer to XXX.

BTW [Easing functions](http://easings.net/) is a great easing cheat sheet visualization website.

## Estimate parameter value

There are several rules to help estimate parameter:
* server performance. In general, server is fast than user-end upload.
* larger file, slower

## firefox bug

When I develop the enhancement, I found a progress event bug in firefox didn't update progress after complete upload and wait server response, chrome do.
My enviroment:
Firefox 41.0.2
Windows 7
If you know something kindly let me know.
