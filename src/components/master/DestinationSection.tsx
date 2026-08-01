import { useEffect, useImperativeHandle, useState } from 'react';
import type { CSSProperties } from 'react';
import { AddRow } from '../common/AddRow';
import { Button } from '../common/Button';
import { CollapsibleListRow } from '../common/CollapsibleListRow';
import { FieldRow } from '../common/FieldRow';
import { FlagIcon, LoadingIndicator } from '../icons';
import { LocationDeleteDialog } from './LocationDeleteDialog';
import {
  createDestination,
  deleteDestination,
  getDestinations,
  updateDestination,
} from '../../services/master/destinationService';
import type { Destination } from '../../types/master';

type EditableField = 'name' | 'latitude' | 'longitude';

export interface DestinationSectionHandle {
  /** 下書き内容をまとめてFirestoreへ反映する */
  save: () => Promise<void>;
  /** 保存済み内容と比べて未保存の編集・追加があるか */
  hasChanges: () => boolean;
}

interface DestinationSectionProps {
  ref?: React.Ref<DestinationSectionHandle>;
}

const fieldInputStyle: CSSProperties = {
  width: '100%',
  padding: '7px 9px',
  borderRadius: '7px',
  border: '1px solid var(--border)',
  // iOSはinput/selectのfont-sizeが16px未満だとフォーカス時に自動でズームしてしまうため16px以上にする
  fontSize: '16px',
  fontFamily: 'var(--sans)',
  color: 'var(--text-h)',
  background: 'var(--panel-bg)',
  boxSizing: 'border-box',
};

/**
 * マスタ管理画面「目的地」セクション。
 * 登録済み目的地の一覧表示・下書き編集・新規追加を行う。
 * 各行は折りたたみ表示とし、タップした行だけ編集欄を展開する（04_画面設計.md#10.3）。
 * Firestoreへの反映は画面共通の保存ボタン押下時にまとめて行う。
 */
export function DestinationSection({ ref }: DestinationSectionProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [savedDestinations, setSavedDestinations] = useState<Destination[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getDestinations()
      .then((data) => {
        setDestinations(data);
        setSavedDestinations(data);
      })
      .catch(() => setError('目的地の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (
    id: string,
    field: EditableField,
    value: string
  ) => {
    setDestinations((prev) =>
      prev.map((destination) =>
        destination.id === id
          ? {
              ...destination,
              [field]: field === 'name' ? value : value === '' ? null : Number(value),
            }
          : destination
      )
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = () => {
    const id = crypto.randomUUID();
    setNewIds((prev) => new Set(prev).add(id));
    setExpandedIds((prev) => new Set(prev).add(id));
    setDestinations((prev) => [
      ...prev,
      { id, name: '', latitude: null, longitude: null },
    ]);
  };

  const handleDeleteConfirm = async () => {
    const id = deleteTargetId;
    if (!id) {
      return;
    }
    if (newIds.has(id)) {
      // 未保存の新規追加行はFirestoreに存在しないため、下書きから取り除くのみ
      setDestinations((prev) => prev.filter((destination) => destination.id !== id));
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeleteTargetId(null);
      return;
    }
    setDeleting(true);
    try {
      await deleteDestination(id);
      setDestinations((prev) => prev.filter((destination) => destination.id !== id));
      setSavedDestinations((prev) => prev.filter((destination) => destination.id !== id));
      setError(null);
      setDeleteTargetId(null);
    } catch {
      setError('目的地の削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    hasChanges: () =>
      newIds.size > 0 ||
      destinations.some((destination) => {
        const original = savedDestinations.find((d) => d.id === destination.id);
        return (
          original &&
          (original.name !== destination.name ||
            original.latitude !== destination.latitude ||
            original.longitude !== destination.longitude)
        );
      }),
    save: async () => {
      let failedLabel: string | null = null;
      try {
        for (const destination of destinations) {
          if (newIds.has(destination.id)) {
            failedLabel = destination.name || '（名称未設定）';
            const oldId = destination.id;
            const newId = await createDestination({
              name: destination.name,
              latitude: destination.latitude,
              longitude: destination.longitude,
            });
            // 作成成功分は即座に下書きへ反映する（失敗時に再保存しても重複作成されないようにするため）
            setDestinations((prev) =>
              prev.map((d) => (d.id === oldId ? { ...d, id: newId } : d))
            );
            setSavedDestinations((prev) => [...prev, { ...destination, id: newId }]);
            setNewIds((prev) => {
              const next = new Set(prev);
              next.delete(oldId);
              return next;
            });
            continue;
          }
          const original = savedDestinations.find(
            (d) => d.id === destination.id
          );
          if (
            original &&
            (original.name !== destination.name ||
              original.latitude !== destination.latitude ||
              original.longitude !== destination.longitude)
          ) {
            failedLabel = destination.name || '（名称未設定）';
            await updateDestination(destination.id, {
              name: destination.name,
              latitude: destination.latitude,
              longitude: destination.longitude,
            });
            setSavedDestinations((prev) =>
              prev.map((d) => (d.id === destination.id ? { ...destination } : d))
            );
          }
        }
        const refreshed = await getDestinations();
        setDestinations(refreshed);
        setSavedDestinations(refreshed);
        setNewIds(new Set());
        setError(null);
      } catch {
        setError(
          failedLabel
            ? `「${failedLabel}」の保存に失敗しました。それより前の変更は保存済みです。もう一度保存してください。`
            : '目的地の保存に失敗しました'
        );
        throw new Error('destination save failed');
      }
    },
  }));

  return (
    <section
      id="destination-section"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '12px',
        boxSizing: 'border-box',
      }}
    >
      {error && (
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--negative)' }}>
          {error}
        </p>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <LoadingIndicator />
        </div>
      ) : (
        <>
        <div
          id="destination-list"
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          {destinations.map((destination) => (
            <CollapsibleListRow
              key={destination.id}
              icon={<FlagIcon size={15} />}
              iconBg="var(--positive-bg)"
              iconColor="var(--positive)"
              title={destination.name || '（名称未設定）'}
              meta={`緯度 ${destination.latitude ?? '未設定'}・経度 ${destination.longitude ?? '未設定'}`}
              expanded={expandedIds.has(destination.id)}
              onToggle={() => toggleExpanded(destination.id)}
            >
              <FieldRow label="名称">
                <input
                  type="text"
                  value={destination.name}
                  onChange={(e) =>
                    handleFieldChange(destination.id, 'name', e.target.value)
                  }
                  style={fieldInputStyle}
                />
              </FieldRow>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FieldRow label="緯度" labelWidth={40}>
                    <input
                      type="number"
                      step="any"
                      value={destination.latitude ?? ''}
                      onChange={(e) =>
                        handleFieldChange(destination.id, 'latitude', e.target.value)
                      }
                      style={fieldInputStyle}
                    />
                  </FieldRow>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <FieldRow label="経度" labelWidth={40}>
                    <input
                      type="number"
                      step="any"
                      value={destination.longitude ?? ''}
                      onChange={(e) =>
                        handleFieldChange(destination.id, 'longitude', e.target.value)
                      }
                      style={fieldInputStyle}
                    />
                  </FieldRow>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteTargetId(destination.id)}
                >
                  削除
                </Button>
              </div>
            </CollapsibleListRow>
          ))}
        </div>
        <AddRow onClick={handleAdd}>+ 目的地を追加</AddRow>
        </>
      )}

      <LocationDeleteDialog
        open={deleteTargetId !== null}
        label="目的地"
        processing={deleting}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}
