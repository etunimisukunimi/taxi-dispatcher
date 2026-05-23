import { createRoot } from 'react-dom/client';
import App from './App';
import { FAVICON } from './config/uiAssets';
import './index.css';
import './styles/yandex-theme.css';

const faviconLink =
  document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
  document.createElement('link');
faviconLink.rel = 'icon';
faviconLink.type = 'image/png';
faviconLink.href = FAVICON;
if (!faviconLink.parentElement) {
  document.head.appendChild(faviconLink);
}

createRoot(document.getElementById('root')!).render(<App />);