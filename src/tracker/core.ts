import { UICoverageTrackerStorage } from './storage';
import { ActionType } from '../tools/actions';
import { SelectorType } from '../tools/selector';
import { Settings } from '../config/models';
import { getSettings } from '../config/core';


type TrackCoverageProps = {
  selector: string,
  actionType: ActionType,
  selectorType: SelectorType
}

export class UICoverageTracker {
  private app: string;
  private storage: UICoverageTrackerStorage;
  private settings: Settings;

  constructor(app: string, settings?: Settings) {
    this.app = app;
    this.settings = settings || getSettings();
    console.log(this.settings);
    this.storage = new UICoverageTrackerStorage(this.settings);
  }

  trackCoverage({ selector, actionType, selectorType }: TrackCoverageProps): void {
    this.storage.save({ app: this.app, selector, actionType, selectorType });
  }
}
