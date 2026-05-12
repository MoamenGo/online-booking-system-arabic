'use client';

import { formatDuration, formatPrice } from '@/lib/utils';
import type { Service } from '@/types';

interface ServiceSelectorProps {
  services: Service[];
  loading: boolean;
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

// ===== مكون اختيار الخدمة =====
export default function ServiceSelector({
  services,
  loading,
  selectedService,
  onSelect,
}: ServiceSelectorProps) {
  return (
    <div className="flex flex-col gap-unit-md">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold">
          1
        </div>
        <h2 className="text-title-lg font-semibold text-on-surface">اختر الخدمة</h2>
      </div>

      {loading ? (
        /* حالة التحميل - Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-unit-md">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="border border-outline-variant rounded-lg p-unit-md animate-pulse bg-surface-container-low h-24"
            />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-2 block">medical_services</span>
          <p className="text-body-md">لا توجد خدمات متاحة حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-unit-md">
          {services.map((service) => {
            const isSelected = selectedService?.id === service.id;
            return (
              <div
                key={service.id}
                onClick={() => onSelect(service)}
                className={`service-card ${isSelected ? 'selected' : ''}`}
              >
                {/* شريط اللون */}
                <div
                  className="h-1 rounded-full mb-3"
                  style={{ backgroundColor: service.color || '#2170e4' }}
                />

                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-body-md font-semibold text-on-surface">{service.name}</span>
                    {service.description && (
                      <span className="text-caption text-on-surface-variant">{service.description}</span>
                    )}
                    <span className="text-label-md text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {formatDuration(service.duration)}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-title-lg font-bold text-primary">
                      {formatPrice(service.price, service.currency)}
                    </span>
                    {isSelected ? (
                      <span className="material-symbols-outlined text-primary text-[22px] filled">check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-outline-variant text-[22px]">radio_button_unchecked</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
