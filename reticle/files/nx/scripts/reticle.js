// TODO: google closure?  dojo?
var nx = nx || {};

// DEPENDS: common.js, svg.js

/**
 * Constructor for a nx.Reticle.
 * @param {number} surfaceElementId The id of the svg DOM element on which to
 *     render.
 * @constructor
 */
nx.Reticle = function(surfaceElementId) {
  this.elementId = surfaceElementId;
  this.surface = Snap(this.element());

  // Make a group for everything
  this.reticleGroup = this.surface.g();
  // Make a group for the cross
  this.cross = this.surface.g();
  // Make and add the shapes
  this.outerCircle = new nx.svg.Shape(this.surface, nx.svg.ShapeType.CIRCLE);
  this.outerCircle.addToGroup(this.reticleGroup);
  this.centerDot = new nx.svg.Shape(this.surface, nx.svg.ShapeType.CIRCLE);
  this.centerDot.addToGroup(this.reticleGroup);
  this.centerDot.addToGroup(this.reticleGroup);
  this.centerBox = new nx.svg.Shape(this.surface, nx.svg.ShapeType.RECTANGLE);
  this.centerBox.addToGroup(this.reticleGroup);
  this.centerBox.addToGroup(this.reticleGroup);
  // Cross group goes into the main group
  this.reticleGroup.add(this.cross);
  // Fill the cross group
  this.crossTop = new nx.svg.Shape(this.surface, nx.svg.ShapeType.RECTANGLE);
  this.crossTop.addToGroup(this.cross);
  this.crossBottom = new nx.svg.Shape(this.surface, nx.svg.ShapeType.RECTANGLE);
  this.crossBottom.addToGroup(this.cross);
  this.crossLeft = new nx.svg.Shape(this.surface, nx.svg.ShapeType.RECTANGLE);
  this.crossLeft.addToGroup(this.cross);
  this.crossRight = new nx.svg.Shape(this.surface, nx.svg.ShapeType.RECTANGLE);
  this.crossRight.addToGroup(this.cross);

  this.currentPeriod_ = 0;
};
/**
 * Returns the svg DOM element to which we are rendering.
 * @return {Element} The DOM element.
 */
nx.Reticle.prototype.element = function() {
  var element = document.getElementById(this.elementId);
  if (!element) {
    throw 'Could not find a SVG DOM Element with id of ' + this.elementId;
  }
  return element;
};
/**
 * Helper function to convert booleans to visibilty states.
 * @param {boolean} isVisible True if visible, false otherwise.
 * @return {string} The css visibility string 'visible' or 'hidden'.
 */
nx.Reticle.prototype.toVisibility = function(isVisible) {
  return isVisible ? 'visible' : 'hidden';
};
/**
 * Stops any current spinning animation applied to the reticle cross, setting
 * the degree of rotation to the one specified.
 * @param {number} degree How many degrees of rotation relative to 0.
 */
nx.Reticle.prototype.setRotation = function(degree) {
  degree = degree % 360;
  this.cross.stop().attr({transform: 'r' + degree + ',0,0'});
};
/**
 * Starts spinning the reticle cross, updating the center and speed as
 * needed.
 */
nx.Reticle.prototype.spin = function() {
  this.setRotation(0);
  // Animate the remainder of the rotation at the current period's speed.
  this.cross.animate(
      {transform: 'r360,0,0'},
      this.currentPeriod_,
      nx.bind(this, 'spin'));
};
/**
 * Renders the reticle using the provided settings.
 * @param {Object} data An object whose properties define the reticle settings.
 */
nx.Reticle.prototype.render = function(data) {
  // NOTE: SVG elements don't have a CSS layout box, so using them to get the
  // size of the canvas does not work correctly.  We use the parentNode
  // instead.  Needed this to make firefox happy.
  // see: https://bugzilla.mozilla.org/show_bug.cgi?id=874811
  var size = nx.elementSize(this.surface.node.parentNode);

  // Set the rendering mode.
  this.element().setAttribute('shape-rendering', data.shapeRendering);

  // Set opacity reticle-wide; avoids blend issues with overlapping shapes.
  // Set position here as well; avoids rotational animation bug when resizing,
  // but also simplifies the code in general.
  this.reticleGroup.attr({
    opacity: data.opacity,
    transform: 't' + [size.width / 2, size.height / 2]});

  this.outerCircle.attr({
      r: data.circleDiameter / 2.0,
      fill: 'none',
      stroke: data.circleColor,
      visibility: this.toVisibility(data.circleEnabled),
      strokeWidth: data.circleThickness});
  this.outerCircle.setOutline(data.circleStrokeColor, data.circleStrokeSize);


  var halfCenterDiameter = data.centerDiameter / 2.0;
  this.centerDot.attr({
      r: halfCenterDiameter,
      fill: data.centerColor,
      visibility: this.toVisibility(data.centerEnabled &&
          data.centerShape == 'circle')});
  this.centerDot.setOutline(data.centerStrokeColor, data.centerStrokeSize);
  this.centerBox.attr({
      width: data.centerDiameter,
      height: data.centerDiameter,
      fill: data.centerColor,
      visibility: this.toVisibility(data.centerEnabled &&
          data.centerShape == 'square'),
      transform: 't' + [-halfCenterDiameter, -halfCenterDiameter]});
  this.centerBox.setOutline(data.centerStrokeColor, data.centerStrokeSize);

  // Offset for left/top offsets to gap from the center
  var negativeOffset = -data.crossLength - data.crossSpread;
  var halfThickness = -(data.crossThickness / 2);
  var cross = {
      fill: data.crossColor,
      visibility: this.toVisibility(data.crossEnabled) };
  var topBottom = {width: data.crossThickness, height: data.crossLength};
  var leftRight = {width: data.crossLength, height: data.crossThickness};

  this.crossTop.attr(cross).attr(topBottom).attr({
      transform: 't' + [halfThickness, negativeOffset]});
  this.crossBottom.attr(cross).attr(topBottom).attr({
      transform: 't' + [halfThickness, data.crossSpread]});
  this.crossLeft.attr(cross).attr(leftRight).attr({
      transform: 't' + [negativeOffset, halfThickness]});
  this.crossRight.attr(cross).attr(leftRight).attr({
      transform: 't' + [data.crossSpread, halfThickness]});

  this.crossTop.setOutline(data.crossStrokeColor, data.crossStrokeSize);
  this.crossBottom.setOutline(data.crossStrokeColor, data.crossStrokeSize);
  this.crossLeft.setOutline(data.crossStrokeColor, data.crossStrokeSize);
  this.crossRight.setOutline(data.crossStrokeColor, data.crossStrokeSize);

  var period = parseInt(data.crossSpinPeriod);
  if (period != this.currentPeriod_) {
    if (period > 0) {
      this.currentPeriod_ = period;
      this.spin();
    } else {
      this.currentPeriod_ = 0;
      this.setRotation(data.crossRotation);
    }
  }
};
