import { Settings } from './models';
import { buildDefaultSettings, buildEnvSettings, buildJsonSettings, buildYamlSettings } from './builders';

export const getSettings = (): Settings => {
  const defaultSettings = buildDefaultSettings();

  return {
    ...defaultSettings,
    ...buildYamlSettings(),
    ...buildJsonSettings(),
    ...buildEnvSettings(),
    htmlReportTemplateFile: defaultSettings.htmlReportTemplateFile
  };
};
