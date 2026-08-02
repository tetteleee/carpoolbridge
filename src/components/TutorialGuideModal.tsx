import { useState } from 'react';
import { Button } from './common/Button';
import {
  CalendarIcon,
  CarIcon,
  DragHandleIcon,
  EditIcon,
  SettingsIcon,
  ShareIcon,
} from './icons';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: TutorialStep[] = [
  {
    title: '集合場所・目的地・家庭を登録',
    description: '「登録情報」から、送迎に使う場所とご家庭の情報を先に用意します。',
    icon: <SettingsIcon size={28} />,
  },
  {
    title: 'イベントを選ぶ／作る',
    description: 'ホーム画面の一覧から練習や試合を選ぶか、新しく作りましょう。',
    icon: <CalendarIcon size={28} />,
  },
  {
    title: '家庭ごとに回答',
    description: '参加の有無・車出し・乗車できる人数を家庭ごとに入力します。',
    icon: <EditIcon size={28} />,
  },
  {
    title: '配車案を自動作成',
    description: '「自動配車」ボタンを押すと、車ごとの配車案が数秒で出てきます。',
    icon: <CarIcon size={28} />,
  },
  {
    title: '足りないところは手直し',
    description: '人のカードをドラッグすれば、車の間で自由に移動できます。',
    icon: <DragHandleIcon size={28} />,
  },
  {
    title: '画像にして共有',
    description: 'できあがった配車表を画像にして、LINEなどで共有できます。',
    icon: <ShareIcon size={28} />,
  },
];

interface TutorialGuideModalProps {
  /** モーダルの表示・非表示 */
  open: boolean;
  /** スキップ・最終ステップ完了時 */
  onClose: () => void;
}

/**
 * 初回利用ガイド（チュートリアル）。staffUsers登録済みユーザーがホーム画面を
 * 初めて開いたときに表示する、基本機能のみを紹介する簡易な案内モーダル。
 * 自動表示は一度閉じると以後行われない（useTutorialGuide参照）が、
 * ホーム画面の？ボタンから手動でいつでも再表示できる。
 * ref: docs/04_画面設計.md#5 ホーム（イベント一覧）
 */
export function TutorialGuideModal({ open, onClose }: TutorialGuideModalProps) {
  const [stepIndex, setStepIndex] = useState(0);

  if (!open) {
    return null;
  }

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      return;
    }
    setStepIndex((current) => current + 1);
  };

  const handleBack = () => {
    setStepIndex((current) => Math.max(0, current - 1));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="初回利用ガイド"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '16px',
        boxSizing: 'border-box',
        zIndex: 100,
      }}
    >
      <div
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          borderRadius: '16px',
          background: 'var(--bg)',
          boxSizing: 'border-box',
          padding: '20px 22px 22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              padding: '4px 2px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            スキップ
          </button>
        </div>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
          }}
        >
          {step.icon}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '17px', color: 'var(--text-h)' }}>{step.title}</h2>
          <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.7, color: 'var(--text)' }}>
            {step.description}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
          {STEPS.map((s, index) => (
            <span
              key={s.title}
              style={{
                width: index === stepIndex ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: index === stepIndex ? 'var(--accent)' : 'var(--border)',
                transition: 'width 0.2s, background 0.2s',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="secondary"
            onClick={handleBack}
            style={{ visibility: stepIndex > 0 ? 'visible' : 'hidden', border: 'none' }}
          >
            戻る
          </Button>
          <Button variant="primary" onClick={handleNext} style={{ flex: 1 }}>
            {isLastStep ? 'はじめる' : '次へ'}
          </Button>
        </div>
      </div>
    </div>
  );
}
