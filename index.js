var fs = require('fs'),
	util = require('util'),
	format = util.format,
	error = util.error,
	log = util.log,
	EventEmitter = require('events').EventEmitter;


function createHandler(dir, observer) {
	if (!dir) {
		throw new TypeError('a valid directory is required');
	}

	return function (evt, path) {
		var eventType;

		path = dir + '/' + path;

		if (evt === 'rename') {
			fs.stat(path, function (err, stat) {
				if (err) {
					if (observer.watchers[path]) {
						observer.watchers[path].close();
						delete observer.watchers[path];
					}
					observer.emit('remove', path);
				} else {
					if (stat.isDirectory() && !observer.watchers[path]) {
						observer.watchers[path] = fs.watch(path, createHandler(path, observer));
					}
					observer.emit('add', path);
				}
			});
		} else {
			observer.emit('change', path);
		}
	};
}


function Observer() {
	this.watchers = {};
	this.watched = {};
}
util.inherits(Observer, EventEmitter);

Observer.prototype.emit = function emit(eventType, path) {
	Observer.super_.prototype.emit.call(this, eventType, path);
	Observer.super_.prototype.emit.call(this, 'event', eventType, path);
};

Observer.prototype.close = function close() {
	for (var i in this.watchers) {
		this.watchers[i].close();
	}
	this.watchers = {};
	this.watched = {};
};


exports.observe = function observe(dir) {
	var watchers = {},
		watched = {},
		observer = new Observer({
			watchers: watchers,
			watched: watched
		});

	watchers[dir] = fs.watch(dir, createHandler(dir, observer));

	fs.readdir(dir, function (err, list) {
		if (err) {
			error(format('Error reading "%s"', dir));
			return;
		}

		list.forEach(function (path) {
			path = dir + '/' + path;
			fs.stat(path, function (err, stat) {
				if (err) {
					error(format('Error accessing "%s"', path));
					return;
				}

				if (stat && stat.isDirectory()) {
					observe(path);
				}
			});
		});
	});

	return observer;
};
