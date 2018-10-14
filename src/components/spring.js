var CANNON = require('cannon');

module.exports = AFRAME.registerComponent("spring", {

  multiple: true,

  schema: {
    // Target (other) body for the constraint.
    target: {type: 'selector'},

    // Lenght of the spring, when no force acts upon it
    restLength: {default: 1, min: 0},

    // how much will the spring suppress the force
    stiffness: {default: 100, min: 0, max: 0},

    // the stretch factor of the spring
    damping: {default: 1, min: 0, max: 1},

    // offsets
    localAnchorA: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
    localAnchorB: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
  },

  init: function() {
    this.system = this.el.sceneEl.systems.physics
    this.world = this.system.driver.world
    this.spring = /* {CANNON.Spring} */ null
  },

  update: function(oldData, newData) {
    var el = this.el,
    data = this.data;

    if (!data.target) {
      console.warn("Spring: invalid target specified.");
      return; 
    }
    
    // wait until the CANNON bodies is created and attached
    if (!el.body || !data.target.body) {
      (el.body ? data.target : el).addEventListener('body-loaded', this.update.bind(this, {}));
      return;
    }

    // create the spring if necessary
    this.createSpring()
    // apply new data to the spring
    this.updateSpring(oldData)
  },

  updateSpring: function(oldData) {
    if (!this.spring) {
      console.warn("Spring: Component attempted to change spring before its created. No changes made.");
      return;
    } 
    var data = this.data,
    spring = this.spring

    // Cycle through the schema and check if an attribute has changed.
    // if so, apply it to the spring
    Object.keys(data).forEach(function(attr) {
      if (data[attr] !== oldData[attr]) {
        if (attr === "target") {
          // special case for the target selector
          spring.bodyB = data.target.body
          return
        }
        spring[attr] = data[attr]
      }
    })
  },

  createSpring: function() {
    if (this.spring) return // no need to create a new spring
    this.spring = new CANNON.Spring(this.el.body);
    // Compute the force after each step
    this.world.addEventListener("postStep", this.updateSpringForce.bind(this, {}));
  },

  // If the spring is valid, update the force each tick the physics are calculated
  updateSpringForce: function() {
    return this.spring ? this.spring.applyForce() : void 0
  },

  // resume updating the force when component upon calling play()
  play: function() {
    this.world.addEventListener("postStep", this.updateSpringForce.bind(this, {}));
  },

  // stop updating the force when component upon calling stop()
  pause: function() {
    this.world.removeEventListener("postStep", this.updateSpringForce.bind(this, {}));
  },

  //remove the event listener + delete the spring
  remove: function() {
    this.world.removeEventListener("postStep", this.updateSpringForce.bind(this, {}));
    if (this.spring)
      delete this.spring
      this.spring = null
  }
})