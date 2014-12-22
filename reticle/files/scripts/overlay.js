
// TODO: google closure?  dojo?
var overlay = overlay || {};

/**
 * The overlay's reticle object.
 * @public {nx.Reticle}
 */
overlay.reticle = null;
/**
 * The overlay's storage node for its settings.
 * @public {nx.StorageNode}
 */
overlay.settings = null;

/**
 * Renders the reticle.
 */
overlay.renderReticle = function() {
  console.log('Rendering reticle.');
  overlay.reticle.render(overlay.settings.data);
};
/**
 * Triggered then a hotkey is pressed.
 * @param {string} name The name of the hotkey that was triggered.
 */
overlay.onHotkeyPressed = function(name) {
  if (name == 'reticle_menu') {
    console.log('Reticle menu hotkey triggered.');
    overlay.settings.setVisible(true);
  }
};
/**
 * Invoked when the window is resized.
 */
overlay.onResize = function() {
  console.log('Window resized.');
  overlay.renderReticle();
};
/**
 * Invoked when the reticle settings have changed.
 */
overlay.onDataChanged = function() {
  console.log('Data changed.');
  overlay.renderReticle();
};
/**
 * Invoked when you enter/exit a game.
 */
overlay.onGameStateChanged = function() {
  console.log('Game state: ' + nx.ow.isInGame);
  // If it was visible outside the game, we would want to see settings.
  if (nx.ow.isInGame) {
    overlay.settings.setVisible(false);
  } else {
    overlay.settings.setVisible(true);
  }
};
/**
 * Hides the settings window if you're in a game.
 */
overlay.hideSettings = function() {
  if (nx.ow.isInGame) {
    overlay.settings.setVisible(false);
  }
};
/**
 * Initializes the reticle overlay.
 * @param {string} surfaceId The id of the SVG surface element.
 * @param {string} storageKey The storage key to store the settings under.
 * @param {string} nodeId The id of a parent node of the settings fields.
 */
overlay.init = function(surfaceId, storageKey, nodeId) {
  nx.ow.setFullScreen();
  overlay.reticle = new nx.Reticle(surfaceId);
  overlay.settings = new nx.StorageNode(storageKey, nodeId);
  overlay.settings.accessors().forEach(function(accessor) {
    if (accessor.fieldType() == nx.FieldType.COLOR) {
      var element = accessor.element();
      // If doing this before auto-binding, manual bind.
      if (!element.color) {
        element.color = new jscolor.color(element);
      }
      // Use our settings
      nx.copyProperties(element.color, {
        hash: true,
        pickerClosable: true,
        onImmediateChange: nx.bind(overlay.settings, 'onDataChanged')
      });
      // Force reprocessing.
      accessor.set(accessor.get());
    }
  });
  overlay.settings.load();
  overlay.settings.setOnChangeListener(overlay.onDataChanged);

  // Resize handler
  window.addEventListener('resize', overlay.onResize);

  // Register hotkey
  if (nx.ow.inOverwolf()) {
    overwolf.settings.registerHotKey('reticle_menu', function(result) {
        if (result.status == 'success') {
          overlay.onHotkeyPressed('reticle_menu');
        }
    });
  }
  // GameState handler
  nx.ow.setGameStateChangedCallback(overlay.onGameStateChanged);
  overlay.onGameStateChanged();

  // Initial render
  overlay.renderReticle();
};