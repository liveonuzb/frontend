import React from "react";
import ReactDom from "react-dom";
import { config } from "@/config.js";

const YANDEX_MAPS_SCRIPT_ID = "liveon-yandex-maps-v3";

const injectYMapsScript = () =>
  new Promise((resolve, reject) => {
    if (window.ymaps3) {
      resolve(window.ymaps3);
      return;
    }

    if (!config.yandexMapsApiKey) {
      reject(new Error("YANDEX_MAPS_API_KEY_MISSING"));
      return;
    }

    const existingScript = document.getElementById(YANDEX_MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.ymaps3));
      existingScript.addEventListener("error", () =>
        reject(new Error("API_KEY_403")),
      );
      return;
    }

    const script = document.createElement("script");
    script.id = YANDEX_MAPS_SCRIPT_ID;
    script.async = true;
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(config.yandexMapsApiKey)}&lang=ru_RU`;
    script.addEventListener("load", () => resolve(window.ymaps3));
    script.addEventListener("error", () => reject(new Error("API_KEY_403")));
    document.head.appendChild(script);
  });

const waitForYMaps = () =>
  new Promise((resolve, reject) => {
    let retries = 0;
    const poll = setInterval(() => {
      if (window.ymaps3) {
        clearInterval(poll);
        resolve(window.ymaps3);
      } else if (retries++ > 30) {
        // 3 seconds timeout
        clearInterval(poll);
        reject(new Error("API_KEY_403"));
      }
    }, 100);
  });

let cache = null;

export const loadYMaps = async () => {
  if (cache) return cache;

  await injectYMapsScript();
  const ymaps3Instance = await waitForYMaps();

  // Import only the core reactify module
  // Note: YMapDefaultSchemeLayer and YMapDefaultFeaturesLayer are part of the core ymaps3 package
  const [ymaps3React] = await Promise.all([
    ymaps3Instance.import("@yandex/ymaps3-reactify"),
    ymaps3Instance.ready,
  ]);

  const reactify = ymaps3React.reactify.bindTo(React, ReactDom);

  // Merge core components into the cache
  cache = {
    ...reactify.module(ymaps3Instance),
    reactify,
    ymaps3: ymaps3Instance,
  };

  return cache;
};
