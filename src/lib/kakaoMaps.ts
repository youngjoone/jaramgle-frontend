export type KakaoLatLng = object;
export type KakaoSize = object;
export type KakaoPoint = object;
export type KakaoMarkerImage = object;

export interface KakaoMap {
  setCenter(position: KakaoLatLng): void;
  setLevel(level: number): void;
  setBounds(bounds: KakaoLatLngBounds): void;
  panTo(position: KakaoLatLng): void;
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
  setImage(image: KakaoMarkerImage | undefined): void;
  setZIndex(zIndex: number): void;
  getPosition(): KakaoLatLng;
}

export interface KakaoInfoWindow {
  setContent(content: string): void;
  open(map: KakaoMap | null, marker: KakaoMarker): void;
  close(): void;
}

export interface KakaoLatLngBounds {
  extend(position: KakaoLatLng): void;
  isEmpty(): boolean;
}

export interface KakaoMapsSdk {
  maps: {
    load(callback: () => void): void;
    Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
    LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
    InfoWindow: new (options: { zIndex: number }) => KakaoInfoWindow;
    MarkerImage: new (
      source: string,
      size: KakaoSize,
      options: { offset: KakaoPoint },
    ) => KakaoMarkerImage;
    Size: new (width: number, height: number) => KakaoSize;
    Point: new (x: number, y: number) => KakaoPoint;
    LatLngBounds: new () => KakaoLatLngBounds;
    Marker: new (options: {
      map: KakaoMap | null;
      position: KakaoLatLng;
      title: string;
      image?: KakaoMarkerImage;
      zIndex?: number;
    }) => KakaoMarker;
    event: {
      addListener(target: KakaoMarker, eventName: string, callback: () => void): void;
    };
  };
}

declare global {
  interface Window {
    kakao?: KakaoMapsSdk;
  }
}

const SDK_SCRIPT_ID = 'kakao-map-sdk';
const SDK_LOAD_TIMEOUT_MS = 12_000;

let kakaoSdkPromise: Promise<KakaoMapsSdk> | null = null;

function isKakaoLoaderReady(): boolean {
  return typeof window.kakao?.maps?.load === 'function';
}

function initializeKakaoMaps(resolve: (value: KakaoMapsSdk) => void, reject: (reason?: unknown) => void) {
  const kakao = window.kakao;
  if (!kakao || typeof kakao.maps?.load !== 'function') {
    reject(new Error('카카오맵 SDK 초기화 함수를 찾지 못했습니다.'));
    return;
  }

  kakao.maps.load(() => {
    if (typeof kakao.maps.Map !== 'function') {
      reject(new Error('카카오맵 SDK 핵심 모듈을 불러오지 못했습니다.'));
      return;
    }
    resolve(kakao);
  });
}

function waitForExistingSdk(
  script: HTMLScriptElement,
  resolve: (value: KakaoMapsSdk) => void,
  reject: (reason?: unknown) => void,
) {
  const startedAt = Date.now();
  const intervalId = window.setInterval(() => {
    if (isKakaoLoaderReady()) {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      initializeKakaoMaps(resolve, reject);
      return;
    }

    if (Date.now() - startedAt >= SDK_LOAD_TIMEOUT_MS) {
      window.clearInterval(intervalId);
    }
  }, 100);

  const timeoutId = window.setTimeout(() => {
    window.clearInterval(intervalId);
    script.remove();
    reject(new Error(`카카오맵 SDK 응답 시간이 초과되었습니다. 현재 주소: ${window.location.origin}`));
  }, SDK_LOAD_TIMEOUT_MS);

  script.addEventListener(
    'error',
    () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      script.remove();
      reject(new Error(`카카오맵 SDK 요청이 거부되었습니다. 현재 주소: ${window.location.origin}`));
    },
    { once: true },
  );
}

function createKakaoMapsLoad(appKey: string): Promise<KakaoMapsSdk> {
  return new Promise<KakaoMapsSdk>((resolve, reject) => {
    let existing = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const existingKey = existing.dataset.appKey
        || new URL(existing.src, window.location.href).searchParams.get('appkey');
      if (existingKey && existingKey !== appKey) {
        existing.remove();
        existing = null;
      } else {
        waitForExistingSdk(existing, resolve, reject);
        return;
      }
    }

    const script = document.createElement('script');
    script.id = SDK_SCRIPT_ID;
    script.async = true;
    script.dataset.appKey = appKey;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;

    script.addEventListener('load', () => initializeKakaoMaps(resolve, reject), { once: true });
    script.addEventListener(
      'error',
      () => {
        script.remove();
        reject(new Error(`카카오맵 SDK 요청이 거부되었습니다. 현재 주소: ${window.location.origin}`));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });
}

export function loadKakaoMapsSdk(appKey: string): Promise<KakaoMapsSdk> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경에서만 카카오맵을 불러올 수 있습니다.'));
  }

  if (isKakaoLoaderReady()) {
    return new Promise(initializeKakaoMaps);
  }

  if (kakaoSdkPromise) {
    return kakaoSdkPromise;
  }

  kakaoSdkPromise = createKakaoMapsLoad(appKey)
    .catch(async () => {
      document.getElementById(SDK_SCRIPT_ID)?.remove();
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      return createKakaoMapsLoad(appKey);
    })
    .catch((error) => {
      kakaoSdkPromise = null;
      throw error;
    });

  return kakaoSdkPromise;
}

export function getKakaoMapsErrorMessage(error: unknown): string {
  const detail = error instanceof Error ? error.message : '카카오맵 SDK를 불러오지 못했습니다.';
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const domainGuide = origin
    ? ` 카카오 개발자 콘솔의 Web 플랫폼 도메인에 ${origin}이 등록되어 있는지 확인해 주세요.`
    : '';
  return `${detail}${domainGuide}`;
}
