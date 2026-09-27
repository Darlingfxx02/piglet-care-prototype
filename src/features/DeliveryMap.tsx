import { useState } from 'react';
import { supportOrders } from '../domain/demo';
import { Modal } from '../shared/UI';

// Fixed coordinates for the presentation flow. No courier location service is connected.
const location = { longitude: 36.8597, latitude: 55.9143 };
const point = `${location.longitude},${location.latitude}`;
const mapUrl = `https://yandex.ru/map-widget/v1/?ll=${encodeURIComponent(point)}&z=12&pt=${encodeURIComponent(`${point},pm2blm`)}&lang=ru_RU`;
const externalUrl = `https://yandex.ru/maps/?ll=${encodeURIComponent(point)}&z=12&pt=${encodeURIComponent(`${point},pm2blm`)}`;

function MapFrame({ orderId }: { orderId: string }) {
  return <iframe src={mapUrl} title={`Карта доставки №${orderId}`} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />;
}

export function DeliveryMap({ orderId }: { orderId: string }) {
  const [expanded, setExpanded] = useState(false);
  const order = supportOrders.find(o => o.id === orderId);
  if (!order) return null;
  return <>
    <section className="delivery-map-card" aria-label={`Отслеживание заказа №${orderId}`}>
      <div className="delivery-map-heading"><strong>Доставка №{orderId}</strong><span>В пути</span></div>
      <button className="delivery-map-preview" onClick={() => setExpanded(true)} aria-label={`Развернуть карту доставки №${orderId}`}>
        <img src={`${import.meta.env.BASE_URL}assets/delivery-map-preview.png`} alt="Карта с местоположением доставки в районе Истры" width="1200" height="720" />
      </button>
      <button className="delivery-map-expand" onClick={() => setExpanded(true)}>Открыть карту</button>
    </section>
    {expanded && <Modal title={`Доставка №${orderId}`} onClose={() => setExpanded(false)} className="delivery-map-fullscreen">
      <div className="delivery-map-details"><span>{order.breed}</span><span>В пути</span></div>
      <div className="delivery-map-canvas"><MapFrame orderId={orderId} /></div>
      <a href={externalUrl} target="_blank" rel="noreferrer">Открыть в Яндекс Картах</a>
    </Modal>}
  </>;
}
