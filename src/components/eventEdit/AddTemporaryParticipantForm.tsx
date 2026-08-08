import { useState, type CSSProperties } from 'react';
import type { PickupLocation } from '../../types/master';
import { Button } from '../common/Button';
import { CloseIcon } from '../icons';

interface AddTemporaryParticipantFormProps {
  /** 対象家庭ID（DOM要素のid付与に使用） */
  familyId: string;
  /** 集合場所の初期選択値（追加操作を行った家庭の集合場所） */
  defaultPickupLocationId: string;
  /** 集合場所の選択肢一覧 */
  pickupLocationList: PickupLocation[];
  /** 「追加する」押下時に呼び出す */
  onSubmit: (input: { name: string; pickupLocationId: string; registerToMaster: boolean }) => void;
  /** キャンセル（フォームを閉じる） */
  onCancel: () => void;
}

const frameStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '12px',
  borderRadius: '12px',
  border: '1.5px dashed var(--parent-border)',
  background: 'var(--parent-bg)',
};

const fieldLabelStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text)',
  fontWeight: 600,
};

const textInputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 9px',
  borderRadius: '7px',
  border: '1px solid var(--border)',
  // iOSはinput/selectのfont-sizeが16px未満だとフォーカス時に自動でズームしてしまうため16px以上にする
  fontSize: '16px',
  fontFamily: 'var(--sans)',
  color: 'var(--text-h)',
  background: 'var(--bg)',
  boxSizing: 'border-box',
};

const toggleTrackStyle: CSSProperties = {
  display: 'flex',
  gap: '6px',
  background: 'var(--border)',
  padding: '3px',
  borderRadius: '12px',
};

const toggleOptionBaseStyle: CSSProperties = {
  flex: 1,
  textAlign: 'center',
  padding: '9px 6px',
  borderRadius: '9px',
  fontSize: '12.5px',
  fontWeight: 600,
  color: 'var(--text)',
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--sans)',
  cursor: 'pointer',
};

const toggleOptionSelectedStyle: CSSProperties = {
  background: 'var(--bg)',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
  color: 'var(--parent-accent)',
  fontWeight: 700,
};

const hintStyle: CSSProperties = {
  margin: 0,
  fontSize: '11px',
  lineHeight: 1.5,
  color: 'var(--text)',
  background: 'var(--bg)',
  borderRadius: '8px',
  padding: '7px 9px',
};

/**
 * 一時参加者（今回だけ参加する人）の追加フォーム。
 * 家庭カード内の追加行（AddRow）タップで展開する（04_画面設計.md#7 一時参加者の追加）。
 * 「今回限り」「家族として登録して今後も使う」いずれの場合も、送信内容の確定（Response・
 * FamilyMemberへの反映）は呼び出し側（FamilyResponseCard）が行う。
 */
export function AddTemporaryParticipantForm({
  familyId,
  defaultPickupLocationId,
  pickupLocationList,
  onSubmit,
  onCancel,
}: AddTemporaryParticipantFormProps) {
  const [name, setName] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(defaultPickupLocationId);
  const [registerToMaster, setRegisterToMaster] = useState(false);

  const trimmedName = name.trim();

  const handleSubmit = () => {
    if (!trimmedName) {
      return;
    }
    onSubmit({ name: trimmedName, pickupLocationId, registerToMaster });
  };

  return (
    <div id={`add-temporary-participant-form-${familyId}`} style={frameStyle}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          aria-label="キャンセル"
          onClick={onCancel}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text)',
            opacity: 0.6,
            cursor: 'pointer',
            display: 'flex',
            padding: 0,
          }}
        >
          <CloseIcon size={16} />
        </button>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={fieldLabelStyle}>名前</span>
        <input
          id={`temporary-participant-name-${familyId}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：山田じいじ"
          style={textInputStyle}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={fieldLabelStyle}>集合場所</span>
        <select
          id={`temporary-participant-pickup-location-${familyId}`}
          value={pickupLocationId}
          onChange={(e) => setPickupLocationId(e.target.value)}
          style={textInputStyle}
        >
          {pickupLocationList.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={fieldLabelStyle}>今後の扱い</span>
        <div style={toggleTrackStyle}>
          <button
            type="button"
            id={`temporary-participant-once-${familyId}`}
            aria-pressed={!registerToMaster}
            onClick={() => setRegisterToMaster(false)}
            style={{
              ...toggleOptionBaseStyle,
              ...(!registerToMaster ? toggleOptionSelectedStyle : {}),
            }}
          >
            今回限り
          </button>
          <button
            type="button"
            id={`temporary-participant-register-${familyId}`}
            aria-pressed={registerToMaster}
            onClick={() => setRegisterToMaster(true)}
            style={{
              ...toggleOptionBaseStyle,
              ...(registerToMaster ? toggleOptionSelectedStyle : {}),
            }}
          >
            家族として登録して今後も使う
          </button>
        </div>
      </div>

      <p style={hintStyle}>
        {registerToMaster
          ? 'この家庭の「家族」として登録し、次回以降のイベントでも使えるようにします。'
          : '今回のイベントのみ配車対象になります。家族一覧には保存されません。'}
      </p>

      <Button
        variant="primary"
        size="sm"
        disabled={!trimmedName}
        onClick={handleSubmit}
        style={{ alignSelf: 'flex-end' }}
      >
        追加する
      </Button>
    </div>
  );
}
