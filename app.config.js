export default ({ config }) => {
  return {
    ...config,
    ios: {
      ...config.ios,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },
    android: {
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },
    extra: {
      eas: {
        projectId: "44ee60ad-525f-4d9d-a176-af9e869675a2",
      },
    },
  };
};
