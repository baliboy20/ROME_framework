'use strict';
// service — implements the fleet-api contract. Depends on ../schema.

const { isNonEmptyString, makeBike, Store } = require('../schema/index.js');

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

// Allowed state transitions (REQ-002).
const TRANSITIONS = {
  InService: 'OutOfService',
  OutOfService: 'Maintenance',
  Maintenance: 'InService',
};

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}

function toDate(now) {
  if (now instanceof Date) return now;
  if (typeof now === 'string') return parseDate(now);
  return new Date();
}

// Evaluate compliance for one bike. Returns {renewalDue, nonCompliant}.
function evaluate(bike, nowDate) {
  const ins = parseDate(bike.insuranceExpiry);
  const svc = parseDate(bike.serviceDue);
  if (!ins && !svc) {
    throw new Error('Compliance dates are not set for this bike');
  }
  const dueThreshold = nowDate.getTime() + WINDOW_DAYS * DAY_MS;
  const isDue = (d) => d && d.getTime() <= dueThreshold;
  const isPast = (d) => d && d.getTime() < nowDate.getTime();
  return {
    renewalDue: !!(isDue(ins) || isDue(svc)),
    nonCompliant: !!(isPast(ins) || isPast(svc)),
  };
}

function createService(store) {
  const db = store || new Store();

  // REQ-001
  function onboardBike(input) {
    input = input || {};
    if (!isNonEmptyString(input.make) || !isNonEmptyString(input.model)) {
      throw new Error('Make and model are required');
    }
    if (!isNonEmptyString(input.assetId)) {
      throw new Error('A valid asset identifier is required');
    }
    if (db.has(input.assetId)) {
      throw new Error('A bike with this identifier already exists');
    }
    const bike = makeBike({
      assetId: input.assetId,
      make: input.make,
      model: input.model,
      purchaseDate: input.purchaseDate,
      state: 'InService',
      insuranceExpiry: input.insuranceExpiry,
      serviceDue: input.serviceDue,
    });
    return db.add(bike);
  }

  // REQ-002
  function transitionBike(assetId, toState, now) {
    const bike = db.get(assetId);
    if (!bike) {
      throw new Error('That state change is not allowed');
    }
    if (TRANSITIONS[bike.state] !== toState) {
      throw new Error('That state change is not allowed');
    }
    if (bike.state === 'Maintenance' && toState === 'InService') {
      // Guard: block return to service while non-compliant.
      let comp;
      try {
        comp = evaluate(bike, toDate(now));
      } catch (e) {
        comp = { nonCompliant: false };
      }
      if (comp.nonCompliant) {
        throw new Error('Bike cannot return to service while non-compliant');
      }
    }
    return db.update(assetId, { state: toState });
  }

  // REQ-003
  function complianceReport(now) {
    const nowDate = toDate(now);
    const bikes = db.snapshot().map((bike) => {
      const flags = evaluate(bike, nowDate);
      return {
        assetId: bike.assetId,
        make: bike.make,
        model: bike.model,
        state: bike.state,
        insuranceExpiry: bike.insuranceExpiry,
        serviceDue: bike.serviceDue,
        renewalDue: flags.renewalDue,
        nonCompliant: flags.nonCompliant,
      };
    });
    return { generatedAt: nowDate.toISOString(), bikes };
  }

  return { store: db, onboardBike, transitionBike, complianceReport };
}

module.exports = { createService, evaluate, TRANSITIONS };
