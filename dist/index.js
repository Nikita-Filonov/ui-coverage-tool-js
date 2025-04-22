#!/usr/bin/env node
import {
  ActionType,
  UICoverageTrackerStorage,
  getSettings
} from "./chunk-QS54SRUL.js";

// src/tools/selector.ts
var SelectorType = /* @__PURE__ */ ((SelectorType2) => {
  SelectorType2["CSS"] = "CSS";
  SelectorType2["XPath"] = "XPATH";
  return SelectorType2;
})(SelectorType || {});

// src/tracker/core.ts
var UICoverageTracker = class {
  constructor({ app, settings }) {
    this.app = app;
    this.settings = settings || getSettings();
    this.storage = new UICoverageTrackerStorage({ settings: this.settings });
  }
  async trackCoverage({ selector, actionType, selectorType }) {
    await this.storage.save({ app: this.app, selector, actionType, selectorType });
  }
};
export {
  ActionType,
  SelectorType,
  UICoverageTracker
};
//# sourceMappingURL=index.js.map