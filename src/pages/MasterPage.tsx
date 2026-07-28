import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/common/Card';
import { DevSampleDataButton } from '../components/master/DevSampleDataButton';
import { getPickupLocations } from '../services/master/pickupLocationService';
import { getDestinations } from '../services/master/destinationService';
import { getFamilies } from '../services/master/familyService';
import { ChevronRightIcon, FlagIcon, HomeIcon, LoadingIndicator, MapPinIcon } from '../components/icons';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  count: number | null;
}

/**
 * マスタ管理画面（ハブ画面）。
 * 集合場所・目的地・家庭の各編集画面への入口となるメニューを表示する。
 * この画面自体には編集項目・保存操作を持たない。
 * ref: docs/04_画面設計.md#10 マスタ管理 10.1 マスタ管理（ハブ画面）
 */
export function MasterPage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<{
    pickupLocations: number;
    destinations: number;
    families: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    setCounts(null);
    Promise.all([getPickupLocations(), getDestinations(), getFamilies()])
      .then(([pickupLocations, destinations, families]) => {
        setCounts({
          pickupLocations: pickupLocations.length,
          destinations: destinations.length,
          families: families.length,
        });
      })
      .catch(() => setError('登録件数の取得に失敗しました'));
  }, [dataVersion]);

  const menuItems: MenuItem[] = [
    {
      path: '/master/pickup-locations',
      label: '集合場所',
      icon: <MapPinIcon size={18} />,
      count: counts?.pickupLocations ?? null,
    },
    {
      path: '/master/destinations',
      label: '目的地',
      icon: <FlagIcon size={18} />,
      count: counts?.destinations ?? null,
    },
    {
      path: '/master/families',
      label: '家庭',
      icon: <HomeIcon size={18} />,
      count: counts?.families ?? null,
    },
  ];

  return (
    <div
      id="master-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--panel-bg)',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <Header title="マスタ管理" backTo="/" />
      </div>

      <div
        id="master-menu"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {error && (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--negative)' }}>
            {error}
          </p>
        )}

        {menuItems.map((item) => (
          <Card key={item.path} style={{ padding: 0 }}>
            <button
              type="button"
              className="master-menu-row"
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '14px 16px',
                border: 'none',
                background: 'transparent',
                font: 'inherit',
                color: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                }}
              >
                {item.icon}
              </span>

              <span
                style={{
                  flex: 1,
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text-h)',
                }}
              >
                {item.label}
              </span>

              <span
                style={{
                  flexShrink: 0,
                  fontSize: '13px',
                  color: 'var(--text)',
                  minWidth: '32px',
                  textAlign: 'right',
                }}
              >
                {item.count === null ? <LoadingIndicator /> : `${item.count}件`}
              </span>

              <span
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  color: 'var(--text)',
                }}
              >
                <ChevronRightIcon size={18} />
              </span>
            </button>
          </Card>
        ))}
      </div>

      <hr
        style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }}
      />
      <DevSampleDataButton onSeeded={() => setDataVersion((v) => v + 1)} />
    </div>
  );
}
