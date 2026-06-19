'use strict';
// schema — Bike data definition + in-memory Store. Traces REQ-001/002/003.

const STATES = Object.freeze(['InService', 'OutOfService', 'Maintenance']);

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// Build a Bike record. Does not enforce business rules (that's the service's job).
function makeBike(fields) {
  return {
    assetId: fields.assetId,
    make: fields.make,
    model: fields.model,
    purchaseDate: fields.purchaseDate || null,
    state: fields.state || 'InService',
    insuranceExpiry: fields.insuranceExpiry || null,
    serviceDue: fields.serviceDue || null,
  };
}

// In-memory Store keyed by assetId.
class Store {
  constructor() {
    this._bikes = new Map();
  }

  add(bike) {
    if (this._bikes.has(bike.assetId)) {
      throw new Error('A bike with this identifier already exists');
    }
    this._bikes.set(bike.assetId, bike);
    return bike;
  }

  get(assetId) {
    return this._bikes.get(assetId) || null;
  }

  has(assetId) {
    return this._bikes.has(assetId);
  }

  update(assetId, patch) {
    const existing = this._bikes.get(assetId);
    if (!existing) return null;
    const updated = Object.assign({}, existing, patch);
    this._bikes.set(assetId, updated);
    return updated;
  }

  list() {
    return Array.from(this._bikes.values());
  }

  // Plain JSON array snapshot for the ui.
  snapshot() {
    return this.list().map((b) => Object.assign({}, b));
  }
}

module.exports = { STATES, isNonEmptyString, makeBike, Store };
