goog.provide('overlay.settings');

goog.require('nx');
goog.require('nx.bug');
goog.require('overlay.common');

/**
 * The form containing all the settings.
 * @type {Element}
 */
overlay.settings.formList = null;
/**
 * The element into which we will import/export settings data.
 * @type {Element}
 */
overlay.settings.dataTransfer = null;
/**
 * The dropdown list of saved profile.
 * @type {Element}
 */
overlay.settings.profileName = null;
/**
 * Invoked when a form element's value changes.
 * @param {Element} element The element that changed.
 */
overlay.settings.onChange = function(element) {
  console.log('Changed: ' + element.id);
  var value = nx.getField(element);
  nx.storage.set(element.id, value);
};
/**
 * Hides the settings window.
 */
overlay.settings.hide = function() {
  if (window.overwolf) {
    overwolf.windows.getCurrentWindow(function(result) {
      if (result.status === 'success') {
        // TODO: close?
        overwolf.windows.minimize(result.window.id);
      }
    });
  }
};
/**
 * Triggered when stored data changes.
 * @param {Event} storageEvent The event information.
 */
overlay.settings.onStorageEvent = function(storageEvent) {
  var key = storageEvent.key;
  console.log('Got storage event: ' + key);
  var element = document.getElementById(key);
  nx.setField(element,
      /** @type {boolean|string} */ (JSON.parse(storageEvent.newValue)));
};
/**
 * Invokes a callback for each field in the settings form that has a id.
 * @param {function(...[*])} callback The callback to invoke.
 * @param {Object=} opt_this The object to use as 'this'.
 */
overlay.settings.forEachField = function(callback, opt_this) {
  var formCount = overlay.settings.formList.length;
  for (var j = 0; j < formCount; ++j) {
    var form = overlay.settings.formList[j];
    for (var i = 0, length = form.elements.length; i < length; ++i) {
      var element = form.elements[i];
      if (element.id) {
        callback.apply(opt_this, [element]);
      }
    }
  }
};
/**
 * Sets the specified field to its current stored value, first checking for a
 * new value in the optionally passed object.  Invokes the element's onchange
 * handler if present and a change was made.
 * @param {Element} element The form field.
 * @param {Object=} opt_data The optional new data.
 * @return {boolean} True if the field now has a new value, false otherwise.
 */
overlay.settings.setField = function(element, opt_data) {
  var changed = false;
  var key = element.id;
  opt_data = nx.default(opt_data, {});
  if (key) {
    var value = nx.default(opt_data[key], overlay.common.getSetting(key));
    if (value !== null) {
      changed = nx.setField(element, /** @type {boolean|string} */ (value));
      if (changed && element.onchange) {
        element.onchange();
      }
    }
  }
  return changed;
};
/**
 * Applies the settings of the provided object.
 * @param {?Object} data The object.
 */
overlay.settings.apply = function(data) {
  overlay.settings.forEachField(function(element) {
    overlay.settings.setField(element, this);
  }, data);
};

/**
 * Retrieves the current settings as an object.
 * @return {Object} The settings object.
 */
overlay.settings.retrieve = function() {
  var data = {};
  overlay.settings.forEachField(function(element) {
      this[element.id] = nx.getField(element);
  }, data);
  return data;
};
/**
 * The prefix to put on storage names for saved settings.
 * @type {string}
 */
overlay.settings.storagePrefix = 'saved_';
/**
 * Saves the current settings under the provided label.
 * @param {string} label The label.
 */
overlay.settings.saveData = function(label) {
  label = nx.default(label, '');
  if (label !== '') {
    var data = overlay.settings.retrieve();
    nx.storage.set(overlay.settings.storagePrefix + label, data);
  } else {
    alert('ERROR: invalid label - ' + label);
  }
};
/**
 * Loads settings stored under the provided label; if either no label or an
 * empty label is provided, the default settings are loaded.
 * @param {string=} label The label.
 */
overlay.settings.loadData = function(label) {
  label = nx.default(label, '');
  if (label !== '') {
    var data = nx.storage.get(overlay.settings.storagePrefix + label);
    if (data === null) {
      alert('ERROR: no data found under label - ' + label);
      return;
    }
    overlay.settings.apply(data);
  } else {
    alert('ERROR: invalid label - ' + label);
  }
};

/**
 * Exports the current settings as JSON for the user to share.
 */
overlay.settings.export = function() {
  nx.setField(overlay.settings.dataTransfer,
      JSON.stringify(overlay.settings.retrieve()));
  overlay.settings.dataTransfer.select();
};
/**
 * Imports JSON settings to be used.
 */
overlay.settings.import = function() {
  var data = null;
  try {
    data = JSON.parse(nx.getField(overlay.settings.dataTransfer));
  } catch (e) {
  }
  if (data instanceof Object) {
    overlay.settings.apply(data);
  } else {
    alert('ERROR: Provided data is not valid JSON for an Object.');
  }
};
/**
 * Saves the current settings to the label held by profileName.
 */
overlay.settings.save = function() {
  overlay.settings.saveData(nx.getField(overlay.settings.profileName));
};
/**
 * Loads the settings stored under profileName.
 */
overlay.settings.load = function() {
  overlay.settings.loadData(nx.getField(overlay.settings.profileName));
};
/**
 * Creates a new profile label with the current settings.
 */
overlay.settings.create = function() {
  var name = prompt('Enter a profile name.');
  if (name) {
    overlay.settings.saveData(name);
    overlay.settings.updateProfiles();
    nx.setField(overlay.settings.profileName, name);
  }
};
/**
 * Removes the selected profile.
 */
overlay.settings.remove = function() {
  var name = nx.getField(overlay.settings.profileName);
  if (name) {
    nx.storage.remove(overlay.settings.storagePrefix + name);
    overlay.settings.updateProfiles();
  }
};
/**
 * Resets the settings to default.
 */
overlay.settings.defaults = function() {
  overlay.settings.apply(overlay.common.defaultSettings);
  alert('Default settings restored.');
};
/**
 * Works around a bug where Overwolf doesn't apply CSS styles when it should.
 */
overlay.settings.installBugWorkaround = function() {
  var sections = document.querySelectorAll('.accordion > input');
  for (var i = 0, length = sections.length; i < length; ++i) {
    sections[i].onchange = function() { nx.bug.redrawStyle(this.parentNode); };
  }
};

/**
 * Updates the profile list.
 */
overlay.settings.updateProfiles = function() {
  var list = overlay.settings.profileName;
  var selected = list.value;
  // Clear the form
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  // Find stored profiles
  var profiles = [];
  for (var i = 0, length = nx.storage.length(); i < length; ++i) {
    var key = nx.storage.key(i);
    if (key.indexOf(overlay.settings.storagePrefix) == 0) {
      profiles.push(key.substr(overlay.settings.storagePrefix.length));
    }
  }
  // Sort them
  profiles.sort();

  // Add them to the list
  for (var i = 0, length = profiles.length; i < length; ++i) {
    var name = profiles[i];
    var option = document.createElement('option');
    option.text = name;
    option.value = name;
    list.appendChild(option);
  }
  // default to selecting the first child
  if (profiles.indexOf(selected) == -1) {
    if (profiles) {
      selected = profiles[0];
    } else {
      selected = '';
    }
  }
  nx.setField(list, selected);
};
/**
 * Initialization for the settings.
 */
overlay.settings.init = function() {
  if (!window.overwolf) {
    document.body.bgColor = 'black';
  } else {
    // Workaround stupid overwolf CSS bugs.
    overlay.settings.installBugWorkaround();
    // TODO: do this when the reticle window moves too.
    overwolf.windows.getCurrentWindow(function(result) {
      if (result.status === 'success') {
        overwolf.windows.changePosition(result.window.id, 0, 0);
      }
    });
  }
  // Settings are divided among multiple forms.
  overlay.settings.formList = document.querySelectorAll('form');
  overlay.settings.dataTransfer = document.getElementById('dataTransfer');
  overlay.settings.profileName = document.getElementById('profileName');

  nx.storage.addListener(overlay.settings.onStorageEvent);

  overlay.settings.forEachField(function(element) {
    overlay.settings.setField(element);
    element.onchange = function() { overlay.settings.onChange(this); };
  });
  overlay.settings.updateProfiles();
};

