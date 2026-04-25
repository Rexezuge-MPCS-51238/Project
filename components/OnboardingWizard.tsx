'use client';

import { useState } from 'react';

interface OnboardingWizardProps {
  showMessage: (type: 'success' | 'error', text: string) => void;
}

const STEPS = ['Account', 'Credentials', 'Chain'] as const;

export default function OnboardingWizard({ showMessage }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [awsAccountId, setAwsAccountId] = useState('');
  const [nickname, setNickname] = useState('');
  const [principalArn, setPrincipalArn] = useState('');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [assumedBy, setAssumedBy] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const apiCall = async (url: string, method: string, body: Record<string, unknown>) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
  };

  const runStep = async (action: () => Promise<void>, success: string, nextStep?: number) => {
    setIsLoading(true);
    try {
      await action();
      showMessage('success', success);
      if (nextStep !== undefined) setStep(nextStep);
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAccount = () =>
    runStep(
      async () => {
        if (!/^[0-9]{12}$/.test(awsAccountId)) throw new Error('AWS Account ID must be exactly 12 digits.');
        if (nickname.trim()) {
          await apiCall('/api/admin/account/nickname', 'PUT', { awsAccountId, nickname: nickname.trim() });
        }
      },
      'Account configured.',
      1,
    );

  const saveCredentials = () =>
    runStep(
      async () => {
        await apiCall('/api/admin/credentials/validate', 'POST', {
          accessKeyId,
          secretAccessKey,
          sessionToken: sessionToken || undefined,
        });
        await apiCall('/api/admin/credentials', 'POST', {
          principalArn,
          accessKeyId,
          secretAccessKey,
          ...(sessionToken && { sessionToken }),
        });
      },
      'Credentials validated and stored.',
      2,
    );

  const saveChain = () =>
    runStep(async () => {
      await apiCall('/api/admin/credentials/relationship', 'POST', { principalArn, assumedBy });
      await apiCall('/api/admin/credentials/test-chain', 'POST', { principalArn });
    }, 'Credential chain configured and tested.');

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((label, index) => (
          <div key={label} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${index <= step ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              {index + 1}
            </div>
            <span className={`ml-2 text-sm ${index === step ? 'text-white' : 'text-gray-400'}`}>{label}</span>
            {index < STEPS.length - 1 && <div className={`mx-2 h-0.5 w-12 ${index < step ? 'bg-blue-600' : 'bg-gray-700'}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <StepCard title="Add AWS Account" description="Enter the account ID and an optional nickname for the first managed account.">
          <TextInput placeholder="AWS Account ID (12 digits)" value={awsAccountId} onChange={setAwsAccountId} />
          <TextInput placeholder="Nickname (optional)" value={nickname} onChange={setNickname} />
          <PrimaryButton onClick={saveAccount} disabled={isLoading || !/^[0-9]{12}$/.test(awsAccountId)}>
            Save Account
          </PrimaryButton>
        </StepCard>
      )}

      {step === 1 && (
        <StepCard
          title="Validate And Store Credentials"
          description="Validate long-lived IAM credentials, then store them encrypted in D1 using the Cloudflare secret key."
        >
          <TextInput placeholder="Principal ARN" value={principalArn} onChange={setPrincipalArn} />
          <TextInput placeholder="Access Key ID" value={accessKeyId} onChange={setAccessKeyId} />
          <TextInput placeholder="Secret Access Key" type="password" value={secretAccessKey} onChange={setSecretAccessKey} />
          <TextInput placeholder="Session Token (optional)" type="password" value={sessionToken} onChange={setSessionToken} />
          <div className="flex justify-between">
            <SecondaryButton onClick={() => setStep(0)}>Back</SecondaryButton>
            <PrimaryButton onClick={saveCredentials} disabled={isLoading || !principalArn || !accessKeyId || !secretAccessKey}>
              Validate And Store
            </PrimaryButton>
          </div>
        </StepCard>
      )}

      {step === 2 && (
        <StepCard
          title="Configure Credential Chain"
          description="Connect the stored principal to the IAM principal that is allowed to assume it, then test the chain."
        >
          <TextInput placeholder="Principal ARN" value={principalArn} onChange={setPrincipalArn} />
          <TextInput placeholder="Assumed By ARN" value={assumedBy} onChange={setAssumedBy} />
          <div className="flex justify-between">
            <SecondaryButton onClick={() => setStep(1)}>Back</SecondaryButton>
            <PrimaryButton onClick={saveChain} disabled={isLoading || !principalArn || !assumedBy}>
              Save And Test Chain
            </PrimaryButton>
          </div>
        </StepCard>
      )}
    </div>
  );
}

function StepCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded bg-gray-800 p-6">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
      {children}
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

function PrimaryButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">
      {children}
    </button>
  );
}
