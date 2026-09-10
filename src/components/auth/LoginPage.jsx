import React, { useState } from 'react';
import { PlaySquare, Phone, Key, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp, ADMIN_USER } from '../../context/AppContext';
import Button from '../ui/Button';

export default function LoginPage() {
  const { state, actions } = useApp();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Helper to normalize phone strings (stripping spaces, hyphens, and +91 prefix)
  const normalizePhone = (p = '') => {
    return p.replace(/[\s\-()+]/g, '').replace(/^91/, '');
  };

  const handleLogin = (e) => {
    e?.preventDefault();
    setErrorToast('');

    const inputPhoneClean = normalizePhone(phone.trim());
    const inputPass = password.trim();

    if (!inputPhoneClean || !inputPass) {
      setErrorToast('Please enter both your Phone Number and Password.');
      return;
    }

    // 1. Check Default Admin credentials (Phone: 9769369798, Pass: admin)
    const adminPhoneClean = normalizePhone(ADMIN_USER.phone);
    if (
      (inputPhoneClean === adminPhoneClean || inputPhoneClean === 'admin') &&
      inputPass === ADMIN_USER.password
    ) {
      actions.login(ADMIN_USER);
      return;
    }

    // 2. Lookup against central users / employees store (managed in Team & Users)
    const matchingEmployee = state.employees.find((emp) => {
      const empPhoneClean = normalizePhone(emp.phone);
      return empPhoneClean === inputPhoneClean;
    });

    if (matchingEmployee) {
      // Validate employee password and active status
      const validPass = matchingEmployee.password || 'password123';
      if (inputPass === validPass || (matchingEmployee.role === 'Admin' && inputPass === 'admin')) {
        if (!matchingEmployee.active) {
          setErrorToast('Account deactivated. Please contact your studio administrator.');
          return;
        }
        actions.login(matchingEmployee);
        return;
      }
    }

    // Display clear invalid toast notification
    setErrorToast('Invalid Phone Number or Password');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Invalid Credentials Toast Notification */}
      {errorToast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in max-w-sm w-full">
          <div className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-3 border border-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="text-xs font-bold">{errorToast}</p>
            </div>
            <button
              onClick={() => setErrorToast('')}
              className="text-white/80 hover:text-white text-base font-bold p-1 leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-6">
        {/* Brand logo & title */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-md">
            <PlaySquare size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            YT Production
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Studio Production & Workflow Operating System
          </p>
        </div>

        {/* Clean Centered Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-card space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Phone Number input */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errorToast) setErrorToast('');
                  }}
                  placeholder="Enter registered mobile number"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs font-mono"
                  autoFocus
                />
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorToast) setErrorToast('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs font-mono"
                />
                <Key size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center py-2.5 font-bold shadow-sm text-sm"
                icon={ArrowRight}
              >
                Sign In to Workspace
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
