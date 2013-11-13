node-observer
=============

A simple node.js filesystem observer

I wanted a simple filesystem observer that could watch entire directory trees
and was easy to hack on. This is a very simple wrapper around `fs.watch` that
emits events when filesystem events occur. Most importantly, since it uses
`fs.watch`, it's not polling.
