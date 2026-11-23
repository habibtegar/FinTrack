import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Target, Check, PiggyBank } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const ProfileSettings: React.FC = () => {
  const { userProfile, updateUserProfile, addToast } = useFinance();

  const [budgetStr, setBudgetStr] = useState(
    userProfile.monthlyBudget > 0 ? userProfile.monthlyBudget.toString() : ''
  );
  const [savingsGoalName, setSavingsGoalName] = useState(
    userProfile.savingsGoalName || 'Dana Darurat & Investasi'
  );
  const [savingsGoalAmountStr, setSavingsGoalAmountStr] = useState(
    userProfile.savingsGoalAmount && userProfile.savingsGoalAmount > 0
      ? userProfile.savingsGoalAmount.toString()
      : '35000000'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budget = Math.max(0, parseFloat(budgetStr) || 0);
    const savingsAmount = Math.max(0, parseFloat(savingsGoalAmountStr) || 0);

    updateUserProfile({
      monthlyBudget: budget,
      savingsGoalName: savingsGoalName.trim() || 'Dana Darurat & Investasi',
      savingsGoalAmount: savingsAmount,
    });

    addToast(
      'Target Finansial Disimpan',
      'Batas anggaran bulanan dan target tabungan Anda telah berhasil disimpan.'
    );
  };

  const budgetNum = parseFloat(budgetStr) || 0;
  const savingsNum = parseFloat(savingsGoalAmountStr) || 0;

  return (
    <Card
      title="Target Anggaran & Sasaran Tabungan"
      subtitle="Atur batas anggaran bulanan dan sasaran tabungan untuk memantau performa finansial Anda"
      className="ft-settings-card"
    >
      <form onSubmit={handleSubmit} className="ft-form">
        <div className="ft-form-row">
          <div className="ft-form-group">
            <label htmlFor="user-budget" className="ft-label">
              Batas Anggaran Bulanan (Target)
            </label>
            <div className="ft-input-with-icon-wrap">
              <Target size={16} className="ft-input-icon" />
              <input
                id="user-budget"
                type="number"
                min="0"
                step="any"
                placeholder="Contoh: 5000000"
                className="ft-input ft-input-icon-pad"
                value={budgetStr}
                onChange={(e) => setBudgetStr(e.target.value)}
              />
            </div>
            <span className="ft-amount-preview">
              Format: {formatCurrency(budgetNum, userProfile.currencySymbol)}
            </span>
          </div>

          <div className="ft-form-group">
            <label htmlFor="user-savings-name" className="ft-label">
              Nama Sasaran Target Tabungan
            </label>
            <div className="ft-input-with-icon-wrap">
              <PiggyBank size={16} className="ft-input-icon" />
              <input
                id="user-savings-name"
                type="text"
                className="ft-input ft-input-icon-pad"
                value={savingsGoalName}
                onChange={(e) => setSavingsGoalName(e.target.value)}
                placeholder="Contoh: Dana Darurat & Investasi"
              />
            </div>
          </div>
        </div>

        <div className="ft-form-row">
          <div className="ft-form-group">
            <label htmlFor="user-savings-amount" className="ft-label">
              Target Sasaran Tabungan (Nominal)
            </label>
            <div className="ft-input-with-icon-wrap">
              <Target size={16} className="ft-input-icon" />
              <input
                id="user-savings-amount"
                type="number"
                min="0"
                step="any"
                placeholder="Contoh: 35000000"
                className="ft-input ft-input-icon-pad"
                value={savingsGoalAmountStr}
                onChange={(e) => setSavingsGoalAmountStr(e.target.value)}
              />
            </div>
            <span className="ft-amount-preview">
              Format: {formatCurrency(savingsNum, userProfile.currencySymbol)}
            </span>
          </div>
        </div>

        <div className="ft-settings-btn-wrap">
          <Button variant="primary" type="submit" leftIcon={<Check size={16} />}>
            Simpan Target Finansial
          </Button>
        </div>
      </form>
    </Card>
  );
};
