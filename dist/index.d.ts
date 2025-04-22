declare enum ActionType {
    Fill = "FILL",
    Type = "TYPE",
    Select = "SELECT",
    Click = "CLICK",
    Hover = "HOVER",
    Text = "TEXT",
    Value = "VALUE",
    Hidden = "HIDDEN",
    Visible = "VISIBLE",
    Checked = "CHECKED",
    Enabled = "ENABLED",
    Disabled = "DISABLED",
    Unchecked = "UNCHECKED"
}

declare enum SelectorType {
    CSS = "CSS",
    XPath = "XPATH"
}

type AppConfig = {
    key: string;
    url: string;
    name: string;
    tags?: string[];
    repository?: string;
};
type Settings = {
    apps: AppConfig[];
    resultsDir: string;
    historyFile: string | null;
    historyRetentionLimit: number;
    htmlReportFile: string | null;
    jsonReportFile: string | null;
    htmlReportTemplateFile: string;
};

type UICoverageTrackerProps = {
    app: string;
    settings?: Settings;
};
type TrackCoverageProps = {
    selector: string;
    actionType: ActionType;
    selectorType: SelectorType;
};
declare class UICoverageTracker {
    private app;
    private storage;
    private settings;
    constructor({ app, settings }: UICoverageTrackerProps);
    trackCoverage({ selector, actionType, selectorType }: TrackCoverageProps): Promise<void>;
}

export { ActionType, SelectorType, UICoverageTracker };
