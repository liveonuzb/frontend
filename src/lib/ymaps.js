import React from 'react';
import ReactDom from 'react-dom';

const waitForYMaps = () => new Promise((resolve, reject) => {
  let retries = 0;
  const poll = setInterval(() => {
    if (window.ymaps3) {
      clearInterval(poll);
      resolve(window.ymaps3);
    } else if (retries++ > 30) { // 3 seconds timeout
      clearInterval(poll);
      reject(new Error("API_KEY_403"));
    }
  }, 100);
});

let cache = null;

export const loadYMaps = async () => {
  if (cache) return cache;

  try {
    const ymaps3Instance = await waitForYMaps();

    // Import only the core reactify module
    // Note: YMapDefaultSchemeLayer and YMapDefaultFeaturesLayer are part of the core ymaps3 package
    const [ymaps3React] = await Promise.all([
      ymaps3Instance.import('@yandex/ymaps3-reactify'),
      ymaps3Instance.ready
    ]);

    const reactify = ymaps3React.reactify.bindTo(React, ReactDom);

    // Merge core components into the cache
    cache = {
      ...reactify.module(ymaps3Instance),
      reactify,
      ymaps3: ymaps3Instance
    };

    return cache;
  } catch (error) {
    throw error;
  }
};
