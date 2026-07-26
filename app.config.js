const appJson = require('./app.json');

module.exports = () => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  return {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      eas: projectId ? { projectId } : undefined,
    },
  };
};
