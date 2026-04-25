'use client';

import { useState } from 'react';
import OnboardingWizard from './OnboardingWizard';

interface AdminPageProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

interface LoadingButtonProps {
  onClick: () => Promise<void> | void;
  disabled?: boolean;
  children: React.ReactNode;
  type?: 'button' | 'submit';
}

function LoadingButton({ onClick, disabled = false, children, type = 'button' }: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
    >
      {isLoading ? 'Working...' : children}
    </button>
  );
}

export default function AdminPage({ activeTab: activeTabProp, onTabChange }: AdminPageProps = {}) {
  const [activeTabState, setActiveTabState] = useState('wizard');
  const activeTab = activeTabProp || activeTabState;
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const selectTab = (tab: string) => {
    setActiveTabState(tab);
    onTabChange?.(tab);
  };

  const tabs = [
    { id: 'wizard', label: 'Setup Wizard' },
    { id: 'credentials', label: 'Credentials' },
    { id: 'accounts', label: 'Account Nicknames' },
  ];

  return (
    <div className="mx-auto max-w-5xl py-8">
      {message && (
        <div className={`fixed left-0 right-0 top-0 z-50 p-4 ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-4 text-white hover:text-gray-200">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex space-x-1 rounded bg-gray-800 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            className={`rounded px-4 py-2 transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'wizard' && <OnboardingWizard showMessage={showMessage} />}
      {activeTab === 'credentials' && <CredentialsTab showMessage={showMessage} />}
      {activeTab === 'accounts' && <AccountsTab showMessage={showMessage} />}
    </div>
  );
}

function CredentialsTab({ showMessage }: { showMessage: (type: 'success' | 'error', text: string) => void }) {
  const [credForm, setCredForm] = useState({
    principalArn: '',
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
  });
  const [relationForm, setRelationForm] = useState({
    principalArn: '',
    assumedBy: '',
  });

  const handleAddCredentials = async () => {
    const response = await fetch('/api/admin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principalArn: credForm.principalArn,
        accessKeyId: credForm.accessKeyId,
        secretAccessKey: credForm.secretAccessKey,
        ...(credForm.sessionToken && { sessionToken: credForm.sessionToken }),
      }),
    });
    showMessage(response.ok ? 'success' : 'error', response.ok ? 'Credentials stored successfully' : await response.text());
  };

  const handleAddRelation = async () => {
    const response = await fetch('/api/admin/credentials/relationship', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(relationForm),
    });
    showMessage(response.ok ? 'success' : 'error', response.ok ? 'Credential chain relationship saved' : await response.text());
  };

  return (
    <div className="space-y-8">
      <div className="rounded bg-gray-800 p-6">
        <h3 className="mb-4 text-xl font-semibold">Store AWS Credentials</h3>
        <div className="space-y-4">
          <TextInput
            placeholder="Principal ARN"
            value={credForm.principalArn}
            onChange={(principalArn) => setCredForm({ ...credForm, principalArn })}
          />
          <TextInput
            placeholder="Access Key ID"
            value={credForm.accessKeyId}
            onChange={(accessKeyId) => setCredForm({ ...credForm, accessKeyId })}
          />
          <TextInput
            placeholder="Secret Access Key"
            type="password"
            value={credForm.secretAccessKey}
            onChange={(secretAccessKey) => setCredForm({ ...credForm, secretAccessKey })}
          />
          <TextInput
            placeholder="Session Token (optional)"
            type="password"
            value={credForm.sessionToken}
            onChange={(sessionToken) => setCredForm({ ...credForm, sessionToken })}
          />
          <LoadingButton
            onClick={handleAddCredentials}
            disabled={!credForm.principalArn || !credForm.accessKeyId || !credForm.secretAccessKey}
          >
            Store Credentials
          </LoadingButton>
        </div>
      </div>

      <div className="rounded bg-gray-800 p-6">
        <h3 className="mb-4 text-xl font-semibold">Configure Credential Chain</h3>
        <div className="space-y-4">
          <TextInput
            placeholder="Principal ARN"
            value={relationForm.principalArn}
            onChange={(principalArn) => setRelationForm({ ...relationForm, principalArn })}
          />
          <TextInput
            placeholder="Assumed By ARN"
            value={relationForm.assumedBy}
            onChange={(assumedBy) => setRelationForm({ ...relationForm, assumedBy })}
          />
          <LoadingButton onClick={handleAddRelation} disabled={!relationForm.principalArn || !relationForm.assumedBy}>
            Save Chain
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}

function AccountsTab({ showMessage }: { showMessage: (type: 'success' | 'error', text: string) => void }) {
  const [form, setForm] = useState({ awsAccountId: '', nickname: '' });

  const handleSetNickname = async () => {
    const response = await fetch('/api/admin/account/nickname', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    showMessage(response.ok ? 'success' : 'error', response.ok ? 'Account nickname saved' : await response.text());
  };

  return (
    <div className="rounded bg-gray-800 p-6">
      <h3 className="mb-4 text-xl font-semibold">Account Nickname</h3>
      <div className="space-y-4">
        <TextInput placeholder="AWS Account ID" value={form.awsAccountId} onChange={(awsAccountId) => setForm({ ...form, awsAccountId })} />
        <TextInput placeholder="Nickname" value={form.nickname} onChange={(nickname) => setForm({ ...form, nickname })} />
        <LoadingButton onClick={handleSetNickname} disabled={!form.awsAccountId || !form.nickname}>
          Save Nickname
        </LoadingButton>
      </div>
    </div>
  );
}

function TextInput({
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-400 focus:outline-none"
    />
  );
}
