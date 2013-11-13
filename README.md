Observer
========

A simple node.js filesystem observer

I wanted a simple filesystem observer that could watch entire directory trees
and was easy to hack on. This is a very simple wrapper around `fs.watch` that
emits events when filesystem events occur. Most importantly, since it uses
`fs.watch`, it's not polling.

### Usage

Usage is pretty straightforward:

    var obs = require('observer'),
        observer = obs.observe('.');

    observer.on('add', function (path) {
      console.log(path + ' was added');
    });
    observer.on('change', function (path) {
      console.log(path + ' was changed');
    });
    observer.on('remove', function (path) {
      console.log(path + ' was removed');
    });

### Limitations

* When trees are deleted, Observer will only emit an event for the root of the
  tree.
* Observer is based on `fs.watch`, which is technically an unstable API

### Known issues and workarounds

* On Macs, the maximum number of files that can be watched is rather low by
  default (256 files on Mavericks). To increase the limit, you can run the
  following command at a Terminal prompt:

      ulimit -n 10000

  That will let the current shell watch around 10,000 files. If you need to go
  beyond that, there are some great answers on StackOverflow.
