import React, { useState } from 'react';
import { Target, TrendingUp, Edit3, Check, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';

export const SavingsGoalWidget: React.FC = () => {
  const { userProfile, totals, updateUserProfile } = useFinance();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const hasGoal = Boolean(userProfile.savingsGoalAmount && userProfile.savingsGoalAmount > 0);
  const goalName = userProfile.savingsGoalName || 'Target Tabungan';
  const targetAmount = userProfile.savingsGoalAmount || 0;

  // Real connected data: accumulated net balance
  const currentSaved = Math.max(0, totals.balance);
  const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((currentSaved / targetAmount) * 100)) : 0;
  const remaining = Math.max(0, targetAmount - currentSaved);

  // Form states for modal
  const [tempName, setTempName] = useState(userProfile.savingsGoalName || '');
  const [tempAmount, setTempAmount] = useState(
    userProfile.savingsGoalAmount && userProfile.savingsGoalAmount > 0
      ? userProfile.savingsGoalAmount.toString()
      : ''
  );

  const handleOpenEdit = () => {
    setTempName(userProfile.savingsGoalName || '');
    setTempAmount(
      userProfile.savingsGoalAmount && userProfile.savingsGoalAmount > 0
        ? userProfile.savingsGoalAmount.toString()
        : ''
    );
    setIsEditModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.max(100000, parseFloat(tempAmount) || 0);
    updateUserProfile({
      savingsGoalName: tempName.trim() || 'Target Tabungan',
      savingsGoalAmount: parsedAmount,
    });
    setIsEditModalOpen(false);
  };

  return (
    <>
      <Card
        title="Target Tabungan"
        subtitle={hasGoal ? "Progres pencapaian akumulasi saldo impian" : "Belum ada target tabungan aktif"}
        action={
          <button
            type="button"
            className="ft-savings-edit-btn"
            onClick={handleOpenEdit}
            title={hasGoal ? "Ubah Target Tabungan" : "Atur Target Tabungan"}
            aria-label={hasGoal ? "Ubah Target Tabungan" : "Atur Target Tabungan"}
          >
            {hasGoal ? <Edit3 size={14} /> : <Plus size={14} />}
            <span>{hasGoal ? 'Ubah' : 'Atur'}</span>
          </button>
        }
        className="ft-savings-goal-card"
      >
        {!hasGoal ? (
          <div className="ft-savings-empty-box">
            <div className="ft-savings-empty-icon-wrap">
              <Target size={26} className="ft-savings-empty-icon" />
            </div>
            <div className="ft-savings-empty-texts">
              <h4 className="ft-savings-empty-title">Target Tabungan Kosong</h4>
              <p className="ft-savings-empty-desc">
                Tentukan target impian finansial Anda untuk memantau akumulasi tabungan secara otomatis.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={handleOpenEdit}
            >
              Buat Target Tabungan
            </Button>
          </div>
        ) : (
          <div className="ft-savings-widget-body">
            {/* Goal Header */}
            <div className="ft-savings-title-row">
              <div className="ft-savings-icon-wrap">
                <Target size={20} className="ft-savings-target-icon" />
              </div>
              <div className="ft-savings-info">
                <h4 className="ft-savings-goal-name">{goalName}</h4>
                <span className="ft-savings-goal-sub">Target Akumulasi Saldo</span>
              </div>
              <div className="ft-savings-pct-badge">
                <span>{progressPercent}%</span>
              </div>
            </div>

            {/* Amount Numbers Display */}
            <div className="ft-savings-amounts-row">
              <div className="ft-savings-amt-col">
                <span className="ft-savings-amt-label">Terkumpul Saat Ini:</span>
                <span className="ft-savings-amt-val ft-savings-collected">
                  {formatCurrency(currentSaved, userProfile.currencySymbol)}
                </span>
              </div>
              <div className="ft-savings-amt-col ft-savings-amt-right">
                <span className="ft-savings-amt-label">Target Sasaran:</span>
                <span className="ft-savings-amt-val ft-savings-target">
                  {formatCurrency(targetAmount, userProfile.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="ft-savings-progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="ft-savings-progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Footer note */}
            <div className="ft-savings-footer">
              <div className="ft-savings-footer-left">
                <TrendingUp size={14} className="ft-savings-trend-icon" />
                <span>
                  {remaining > 0
                    ? `Sisa ${formatCurrency(remaining, userProfile.currencySymbol)} lagi untuk mencapai target.`
                    : 'Selamat! Target tabungan Anda telah terpenuhi sepenuhnya! 🎉'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Savings Target Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Sesuaikan Target Tabungan"
        subtitle="Atur nama tujuan finansial dan jumlah nominal tabungan yang ingin dicapai."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveGoal} className="ft-form">
          <div className="ft-form-group">
            <label htmlFor="goal-name-input" className="ft-label">
              Nama Sasaran Target <span className="ft-required">*</span>
            </label>
            <input
              id="goal-name-input"
              type="text"
              className="ft-input"
              placeholder="Contoh: Dana Darurat, DP Rumah, Liburan"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              required
            />
          </div>

          <div className="ft-form-group">
            <label htmlFor="goal-amount-input" className="ft-label">
              Target Nominal (Rupiah) <span className="ft-required">*</span>
            </label>
            <div className="ft-input-prefix-wrapper">
              <span className="ft-input-prefix">{userProfile.currencySymbol}</span>
              <input
                id="goal-amount-input"
                type="number"
                min="100000"
                step="500000"
                className="ft-input ft-input-with-prefix"
                value={tempAmount}
                onChange={(e) => setTempAmount(e.target.value)}
                required
              />
            </div>
            <span className="ft-amount-preview">
              Format: {formatCurrency(parseFloat(tempAmount) || 0, userProfile.currencySymbol)}
            </span>
          </div>

          <div className="ft-modal-footer">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" leftIcon={<Check size={16} />}>
              Simpan Sasaran
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
