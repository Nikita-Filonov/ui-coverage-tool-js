import { UICoverageTrackerStorage } from './storage';
import { ActionType } from '../tools/actions';
import { SelectorType } from '../tools/selector';
import { Settings } from '../config/models';
import { getSettings } from '../config/core';

type UICoverageTrackerProps = {
  app: string
  settings?: Settings
}

type TrackCoverageProps = {
  selector: string,
  actionType: ActionType,
  selectorType: SelectorType
}

export class UICoverageTracker {
  private app: string;
  private storage: UICoverageTrackerStorage;
  private settings: Settings;

  constructor({ app, settings }: UICoverageTrackerProps) {
    this.app = app;
    this.settings = settings || getSettings();
    this.storage = new UICoverageTrackerStorage({ settings: this.settings });
  }

  async trackCoverage({ selector, actionType, selectorType }: TrackCoverageProps): Promise<void> {
    await this.storage.save({ app: this.app, selector, actionType, selectorType });
  }
}
