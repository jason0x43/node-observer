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


exports.observe = function observe(dir) {
	var watchers = {},
		watched = {},
		observer = {
			watchers: watchers,
			watched: watched,
			emitter: new EventEmitter(),
			on: function () {
				return this.emitter.on.apply(this.emitter, arguments);
			},
			emit: function () {
				return this.emitter.emit.apply(this.emitter, arguments);
			},
			close: function () {
				for (var i in watchers) {
					this.watchers.i.close();
				}
				this.watchers = {};
				this.watched = {};
			}
		};

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
