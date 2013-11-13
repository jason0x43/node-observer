var fs = require('fs'),
	util = require('util'),
	path = require('path'),
	format = util.format,
	error = util.error,
	log = util.log,
	EventEmitter = require('events').EventEmitter;


function Observer(options) {
	this.watchers = {};
	this.watching = {};
	this.excludes = (options && options.excludes) || [];
}
util.inherits(Observer, EventEmitter);

Observer.prototype.observe = function (dir) {
	var self = this;

	if (this._isExcluded(dir)) {
		log('Skipping excluded dir ' + dir);
		return;
	}

	this.watchers[dir] = fs.watch(dir, this._createHandler(dir));
	this.watching[dir] = true;

	fs.readdir(dir, function (err, list) {
		if (err) {
			error('Error reading ' + dir);
			return;
		}

		list.forEach(function (name) {
			name = path.join(dir, name);
			fs.stat(name, function (err, stat) {
				if (err) {
					error('Error accessing ' + name);
					return;
				} else {
					if (stat.isDirectory()) {
						self.observe(name);
					} else {
						self.watching[name] = true;
					}
				}
			});
		});
	});

	return this;
};

Observer.prototype.emit = function emit(eventType, name) {
	Observer.super_.prototype.emit.call(this, eventType, name);
	Observer.super_.prototype.emit.call(this, 'change', eventType, name);
};

Observer.prototype.close = function close() {
	for (var i in this.watchers) {
		this.watchers[i].close();
	}
	this.watchers = {};
	this.watching = {};
};

Observer.prototype._isExcluded = function _isExcluded(name) {
	for (var i = 0; i < this.excludes.length; i++) {
		if (name.match(this.excludes[i])) {
			return true;
		}
	}
	return false;
};

Observer.prototype._createHandler = function _createHandler(dir) {
	var self = this;

	if (!dir) {
		throw new TypeError('a valid directory is required');
	}

	return function (evt, name) {
		var eventType;

		name = path.join(dir, name);

		if (self._isExcluded(name)) {
			return;
		}

		if (evt === 'change') {
			self.emit('modify', name);
		} else {
			fs.stat(name, function (err, stat) {
				if (err) {
					if (self.watchers[name]) {
						self.watchers[name].close();
						delete self.watchers[name];
					}
					delete self.watching[name];
					self.emit('remove', name);
				} else {
					if (stat.isDirectory() && !self.watchers[name]) {
						self.watchers[name] = fs.watch(name, self._createHandler(name));
					}
					if (self.watching[name]) {
						self.emit('modify', name);
					} else {
						self.watching[name] = true;
						self.emit('add', name);
					}
				}
			});
		}
	};
};


exports.Observer = Observer;

exports.observe = function observe(dir, options) {
	var observer = new Observer(options);
	return observer.observe(dir);
};
