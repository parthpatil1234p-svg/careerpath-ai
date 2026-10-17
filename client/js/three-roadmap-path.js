/**
 * three-roadmap-path.js — Deprecated 3D Canvas shim
 * Replaced by roadmap-route-map.js (Student-Explainable Interactive Route Map).
 * This shim ensures 100% backward compatibility with any legacy callers.
 */

(function () {
  'use strict';
  if (typeof window.renderStudentRouteMap === 'function') {
    window.initRoadmapPath = window.renderStudentRouteMap;
  }
})();
